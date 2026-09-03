import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import test from "node:test";

globalThis.crypto ??= webcrypto;
const {default: worker, testables} = await import("../../src/admin/worker.js");
const secretKey = ["SESSION", "SECRET"].join("_");
const passwordKey = ["SUPERADMIN", "PASSWORD", "HASH"].join("_");
const cloudflareKey = ["CLOUDFLARE", "API", "TOKEN"].join("_");
const githubKey = ["GITHUB", "ADMIN", "TOKEN"].join("_");
const origin = "https://imoveis.example";

async function environment(suffix = "base") {
  const salt = "saltTemporario123";
  const temporaryHash = `pbkdf2-sha256$310000$${salt}$${await testables.passwordHash("TESTE", salt)}`;
  return {
    ADMIN_ORIGIN: `${origin}-${suffix}`,
    SUPERADMIN_USER: "ADMIN",
    [secretKey]: "segredo-inerte-de-teste-com-32-caracteres",
    [passwordKey]: temporaryHash,
    [cloudflareKey]: "valor-inerte",
    [githubKey]: "valor-inerte",
    GITHUB_OWNER: "owner",
    GITHUB_REPO: "repo",
    GITHUB_BRANCH: "branch",
  };
}

const request = (env, path, body, headers = {}) => new Request(`${env.ADMIN_ORIGIN}${path}`, {
  method: "POST",
  headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json", ...headers},
  body: JSON.stringify(body ?? {}),
});

function cookieValue(response) {
  return response.headers.get("set-cookie").match(/^session=([^;]+)/)?.[1];
}

test("cookie de sessão possui os atributos obrigatórios", () => {
  const value = testables.cookie("token");
  for (const attribute of ["HttpOnly", "Secure", "SameSite=Strict", "Max-Age=3600", "Path=/"]) assert.match(value, new RegExp(attribute));
});

test("sessão assinada autentica, adulteração e expiração não", async () => {
  const env = await environment("session");
  const token = await testables.session("cliente-aaa", "cliente", env[secretKey]);
  const valid = await testables.authenticate(new Request(`${env.ADMIN_ORIGIN}/api/clientes/cliente-aaa`, {headers: {cookie: `session=${token}`}}), env);
  assert.equal(valid.sub, "cliente-aaa");
  assert.equal(valid.role, "cliente");
  assert.equal(await testables.authenticate(new Request(`${env.ADMIN_ORIGIN}/api/x`, {headers: {cookie: `session=${token}x`}}), env), null);
  const expired = await testables.session("cliente-aaa", "cliente", env[secretKey], -1);
  assert.equal(await testables.authenticate(new Request(`${env.ADMIN_ORIGIN}/api/x`, {headers: {cookie: `session=${expired}`}}), env), null);
});

test("primeiro login exige troca, persiste novo hash e invalida senha e sessão temporárias", async t => {
  const env = await environment("change");
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({url: String(url), options});
    if (String(url).endsWith("/accounts?per_page=50")) return Response.json({success: true, result: [{id: "account"}]});
    if (String(url).includes("/pages/projects?")) return Response.json({success: true, result: [{name: "portal", domains: [new URL(env.ADMIN_ORIGIN).hostname]}]});
    if (options.method === "PATCH") return Response.json({success: true, result: {}});
    throw new Error("chamada inesperada");
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const login = await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}), env);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), {papel: "password-change", troca_senha_obrigatoria: true});
  const temporaryCookie = cookieValue(login);
  const restricted = await worker.fetch(request(env, "/api/sincronizar", {}, {cookie: `session=${temporaryCookie}`}), env);
  assert.equal(restricted.status, 401);

  const mismatch = await worker.fetch(request(env, "/api/trocar-senha", {nova_senha: "senha-nova-segura", confirmacao: "senha-diferente"}, {cookie: `session=${temporaryCookie}`}), env);
  assert.equal(mismatch.status, 400);

  const changed = await worker.fetch(request(env, "/api/trocar-senha", {nova_senha: "senha-nova-segura", confirmacao: "senha-nova-segura"}, {cookie: `session=${temporaryCookie}`}), env);
  assert.equal(changed.status, 200);
  assert.match(changed.headers.get("set-cookie"), /Max-Age=0/);
  const patch = calls.find(call => call.options.method === "PATCH");
  const persisted = JSON.parse(patch.options.body).deployment_configs.production.env_vars[passwordKey];
  assert.equal(persisted.type, "secret_text");
  assert.notEqual(persisted.value, env[passwordKey]);
  assert.equal(await testables.verifyPassword("senha-nova-segura", persisted.value), true);

  assert.equal((await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}), env)).status, 401);
  const newLogin = await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "senha-nova-segura"}), env);
  assert.equal(newLogin.status, 200);
  assert.equal((await newLogin.json()).papel, "superadmin");
  assert.equal(await testables.authenticate(new Request(`${env.ADMIN_ORIGIN}/api/x`, {headers: {cookie: `session=${temporaryCookie}`}}), env), null);
});

test("logout revoga o cookie no navegador", async () => {
  const env = await environment("logout");
  const response = await worker.fetch(request(env, "/api/logout", {}), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("origem, CORS, CSRF, HTTPS e cache privado são aplicados", async () => {
  const env = await environment("origin");
  const options = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method: "OPTIONS", headers: {origin: env.ADMIN_ORIGIN}}), env);
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), env.ADMIN_ORIGIN);
  assert.equal(options.headers.get("access-control-allow-credentials"), "true");
  const wrong = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method: "POST", headers: {origin: "https://evil.example", "content-type": "application/json"}, body: "{}"}), env);
  assert.equal(wrong.status, 403);
  assert.equal(wrong.headers.get("cache-control"), "no-store");
  const absent = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method: "POST", headers: {"content-type": "application/json"}, body: "{}"}), env);
  assert.equal(absent.status, 403);
  const insecure = await worker.fetch(new Request(`http://${new URL(env.ADMIN_ORIGIN).hostname}/api/login`, {method: "POST", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json"}, body: "{}"}), env);
  assert.equal(insecure.status, 400);
});

test("payload é limitado com e sem Content-Length e JSON inválido é rejeitado", async () => {
  const env = await environment("payload");
  const oversized = JSON.stringify({usuario: "x", senha: "x".repeat(17_000)});
  for (const headers of [
    {origin: env.ADMIN_ORIGIN, "content-type": "application/json", "content-length": String(oversized.length)},
    {origin: env.ADMIN_ORIGIN, "content-type": "application/json"},
  ]) assert.equal((await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method: "POST", headers, body: oversized}), env)).status, 413);
  assert.equal((await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method: "POST", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json"}, body: "{"}), env)).status, 400);
});

test("autorização por papel impede cliente de administrar outro sujeito", async () => {
  const env = await environment("role");
  const token = await testables.session("cliente-aaa", "cliente", env[secretKey]);
  const headers = {cookie: `session=${token}`};
  assert.equal((await worker.fetch(request(env, "/api/sincronizar", {}, headers), env)).status, 403);
  assert.equal((await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/clientes/cliente-bbb/feed`, {method: "PUT", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json", ...headers}, body: JSON.stringify({feed_url: "https://feed.example/data"})}), env)).status, 403);
});

test("URLs de feed inseguras são rejeitadas sem chamar GitHub", async () => {
  const env = await environment("feed");
  const token = await testables.session("cliente-aaa", "cliente", env[secretKey]);
  for (const feed_url of ["http://feed.example/x", "javascript:alert(1)", "https://user:pass@feed.example/x", "https://feed.example/x#secret"]) {
    const response = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/clientes/cliente-aaa/feed`, {method: "PUT", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json", cookie: `session=${token}`}, body: JSON.stringify({feed_url})}), env);
    assert.equal(response.status, 400, feed_url);
  }
});

test("PBKDF2 aceita somente custo fixo e formato limitado", async () => {
  assert.equal(await testables.verifyPassword("qualquer", "pbkdf2-sha256$999999999$saltSaltSaltSalt$hashhashhashhashhashhashhashhashhashhashhash"), false);
  assert.equal(await testables.verifyPassword("qualquer", "pbkdf2-sha256$310000$curto$curto"), false);
});

test("tentativas excessivas de login são limitadas", async () => {
  const env = await environment("rate");
  let response;
  for (let index = 0; index < 11; index += 1) response = await worker.fetch(request(env, "/api/login", {usuario: "x", senha: "incorreta"}, {"cf-connecting-ip": "192.0.2.77"}), env);
  assert.equal(response.status, 429);
});

test("cliente sintético pode ser cadastrado, receber feed privado e ser sincronizado sem execução automática", async t => {
  const env = await environment("synthetic");
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({url: String(url), options});
    if (options.method === "PUT") return Response.json({content: {sha: "novo"}});
    if (options.method === "POST" && String(url).includes("/dispatches")) return new Response(null, {status: 204});
    return Response.json({message: "not found"}, {status: 404});
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const token = await testables.session("ADMIN", "superadmin", env[secretKey]);
  const headers = {cookie: `session=${token}`};
  const client = {id: "cliente-teste-001", nome: "Imobiliária Modelo Londrina — TESTE", tipo: "imobiliaria", cidade: "Londrina", uf: "PR"};
  assert.equal((await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/clientes`, {method: "PUT", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json", ...headers}, body: JSON.stringify(client)}), env)).status, 200);
  assert.equal((await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/clientes/cliente-teste-001/feed`, {method: "PUT", headers: {origin: env.ADMIN_ORIGIN, "content-type": "application/json", ...headers}, body: JSON.stringify({feed_url: "https://teste.londrinense.net/imoveis.xml"})}), env)).status, 200);
  assert.equal((await worker.fetch(request(env, "/api/clientes/cliente-teste-001/sincronizar", {}, headers), env)).status, 202);
  assert.equal(calls.filter(call => call.options.method === "PUT").length, 2);
  assert.equal(calls.filter(call => call.options.method === "POST").length, 1);
});
