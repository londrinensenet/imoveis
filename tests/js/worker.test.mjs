import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

globalThis.crypto ??= webcrypto;
const {default: worker, testables} = await import("../../src/admin/worker.js");
const {onRequest} = await import("../../functions/api/[[path]].js");
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

test("ADMIN / TESTE acessa diretamente a homologação sem hash ou APIs externas", async t => {
  const env = await environment("homologation");
  delete env[passwordKey];
  const originalFetch = globalThis.fetch;
  let externalCalls = 0;
  globalThis.fetch = async () => { externalCalls += 1; throw new Error("chamada inesperada"); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const login = await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}), env);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), {papel: "superadmin", troca_senha_obrigatoria: false});
  const token = cookieValue(login);
  assert.ok(token);
  assert.equal((await testables.authenticate(new Request(`${env.ADMIN_ORIGIN}/api/x`, {headers: {cookie: `session=${token}`}}), env)).role, "superadmin");
  assert.equal(externalCalls, 0);
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

test("GET de sessão reproduz a semântica de Origin do navegador", async () => {
  const env = await environment("browser-origin");
  const withoutCookie = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/sessao`), env);
  assert.equal(withoutCookie.status, 401);

  const token = await testables.session("ADMIN", "superadmin", env[secretKey]);
  const withCookie = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/sessao`, {
    headers: {cookie: `session=${token}`},
  }), env);
  assert.equal(withCookie.status, 200);
  assert.deepEqual(await withCookie.json(), {
    usuario: "ADMIN",
    nome: "ADMIN",
    papel: "superadmin",
    permissoes: ["administracao_total"],
  });

  const externalOrigin = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/sessao`, {
    headers: {origin: "https://externo.example", cookie: `session=${token}`},
  }), env);
  assert.equal(externalOrigin.status, 403);
});

test("métodos mutáveis nunca aceitam Origin ausente ou diferente", async () => {
  const env = await environment("mutable-origin");
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    for (const headers of [
      {"content-type": "application/json"},
      {origin: "https://externo.example", "content-type": "application/json"},
    ]) {
      const response = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/login`, {method, headers, body: "{}"}), env);
      assert.equal(response.status, 403, `${method} com ${headers.origin || "Origin ausente"}`);
    }
  }
});

test("login completo emite cookie e a sessão seguinte abre o painel como SUPERADMIN", async () => {
  const env = await environment("complete-login");
  const login = await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}), env);
  assert.equal(login.status, 200);
  const token = cookieValue(login);
  assert.ok(token);

  const session = await worker.fetch(new Request(`${env.ADMIN_ORIGIN}/api/sessao`, {
    headers: {cookie: `session=${token}`},
  }), env);
  assert.equal(session.status, 200);
  const identity = await session.json();
  assert.equal(identity.papel, "superadmin");

  const panelSource = await readFile(new URL("../../public/painel/painel.js", import.meta.url), "utf8");
  assert.match(panelSource, /login\.hidden=true;app\.hidden=false/);
  assert.match(panelSource, /session\.papel\.toUpperCase\(\)/);
  assert.doesNotMatch(panelSource, /[?&](?:usuario|senha)=/i);
});

test("submit captura o formulário antes do await e usa essa referência no reset", async () => {
  const source = await readFile(new URL("../../public/painel/painel.js", import.meta.url), "utf8");
  const listener = source.slice(source.indexOf('addEventListener("submit"'), source.indexOf('document.querySelector("#sair")'));
  assert.ok(listener, "listener de login encontrado");
  assert.ok(listener.indexOf("const form=event.currentTarget") < listener.indexOf("await api"));
  assert.match(listener, /new FormData\(form\)/);
  assert.match(listener, /form\.reset\(\);await boot\(\)/);
  assert.doesNotMatch(listener.slice(listener.indexOf("await api")), /event\.currentTarget/);
  assert.match(listener, /catch\(error\)\{status\.textContent=error\.message\}/);

  let reset = false;
  const form = {reset() { reset = true; }};
  const event = {currentTarget: form};
  const captured = event.currentTarget;
  await Promise.resolve().then(() => { event.currentTarget = null; });
  captured.reset();
  assert.equal(reset, true);
});

test("painel invalida a versão anterior e aplica cache administrativo restrito", async () => {
  const html = await readFile(new URL("../../public/painel/index.html", import.meta.url), "utf8");
  const headers = await readFile(new URL("../../public/_headers", import.meta.url), "utf8");
  assert.match(html, /painel\.css\?v=20260903-login-origin/);
  assert.match(html, /painel\.js\?v=20260903-login-origin/);
  assert.match(headers, /\/painel\/index\.html\n  Cache-Control: no-store/);
  assert.match(headers, /\/painel\/\*\.js\n  Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(headers, /\/painel\/modulos\/\*\n  Cache-Control: public, max-age=0, must-revalidate/);
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

test("limitador conta apenas falhas, não prolonga bloqueio e é limpo pelo acesso de homologação", async t => {
  const env = await environment("rate");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({message: "not found"}, {status: 404});
  t.after(() => { globalThis.fetch = originalFetch; });
  const headers = {"cf-connecting-ip": "192.0.2.77"};
  let response;
  for (let index = 0; index < 10; index += 1) {
    response = await worker.fetch(request(env, "/api/login", {usuario: "x", senha: "incorreta"}, headers), env);
    assert.equal(response.status, 401);
  }
  response = await worker.fetch(request(env, "/api/login", {usuario: "x", senha: "incorreta"}, headers), env);
  assert.equal(response.status, 429);
  const retryAfter = response.headers.get("retry-after");
  assert.match(retryAfter, /^\d+$/);
  const blockedAgain = await worker.fetch(request(env, "/api/login", {usuario: "x", senha: "incorreta"}, headers), env);
  assert.ok(Number(blockedAgain.headers.get("retry-after")) <= Number(retryAfter));

  const login = await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}, headers), env);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), {papel: "superadmin", troca_senha_obrigatoria: false});
  assert.equal((await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "errada"}, headers), env)).status, 401);
});

test("somente ADMIN / TESTE usa o bypass e clientes mantêm o fluxo normal", async t => {
  const env = await environment("client-login");
  const salt = "saltClienteTeste1";
  const clientHash = `pbkdf2-sha256$310000$${salt}$${await testables.passwordHash("senha-cliente", salt)}`;
  const originalFetch = globalThis.fetch;
  let githubCalls = 0;
  globalThis.fetch = async url => {
    githubCalls += 1;
    if (String(url).includes("private/clientes/cliente-aaa/acesso.json")) {
      const content = btoa(JSON.stringify({ativo: true, senha_hash: clientHash}));
      return Response.json({content, sha: "sha"});
    }
    return Response.json({message: "not found"}, {status: 404});
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  assert.equal((await worker.fetch(request(env, "/api/login", {usuario: "ADMIN", senha: "outra"}), env)).status, 401);
  assert.equal((await worker.fetch(request(env, "/api/login", {usuario: "cliente-aaa", senha: "TESTE"}), env)).status, 401);
  const client = await worker.fetch(request(env, "/api/login", {usuario: "cliente-aaa", senha: "senha-cliente"}), env);
  assert.equal(client.status, 200);
  assert.deepEqual(await client.json(), {papel: "cliente", troca_senha_obrigatoria: false});
  assert.ok(cookieValue(client));
  assert.ok(githubCalls >= 2);
});

test("Pages Function aceita a mesma requisição do painel e rotas administrativas exigem sessão", async () => {
  const env = await environment("pages-function");
  const login = await onRequest({request: request(env, "/api/login", {usuario: "ADMIN", senha: "TESTE"}), env});
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /^session=.+HttpOnly; Secure; SameSite=Strict$/);
  const unauthenticated = await onRequest({request: request(env, "/api/sincronizar", {}), env});
  assert.equal(unauthenticated.status, 401);
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
