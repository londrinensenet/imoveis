const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};
const MAX_PAYLOAD = 16_384;
const PBKDF2_ITERATIONS = 310_000;
const SESSION_SECONDS = 3_600;
const TEMPORARY_PASSWORD = "TESTE";
// Acesso temporário exclusivo de homologação; remover antes da publicação definitiva.
const HOMOLOGATION_ADMIN_USER = "ADMIN";
const HOMOLOGATION_ADMIN_PASSWORD = "TESTE";
const attempts = new Map();
const replacedHashes = new Map();

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {...JSON_HEADERS, ...headers},
});
const bytes = value => new TextEncoder().encode(value);
const encode = value => btoa(String.fromCharCode(...value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const decode = value => atob(value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
const constant = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
};

function activeAttempts(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(value => now - value < 900_000);
  if (recent.length) attempts.set(key, recent);
  else attempts.delete(key);
  return recent;
}

function limitation(key) {
  const recent = activeAttempts(key);
  if (recent.length < 10) return null;
  return Math.max(1, Math.ceil((recent[0] + 900_000 - Date.now()) / 1_000));
}

function recordInvalidAttempt(key) {
  attempts.set(key, [...activeAttempts(key), Date.now()]);
}

async function jsonBody(request) {
  const raw = await request.text();
  if (bytes(raw).length > MAX_PAYLOAD) throw new RangeError("payload");
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch {
    throw new SyntaxError("json");
  }
}

async function mac(value, secret) {
  const key = await crypto.subtle.importKey("raw", bytes(secret), {name: "HMAC", hash: "SHA-256"}, false, ["sign"]);
  return encode(new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes(value))));
}

async function session(user, role, secret, ttl = SESSION_SECONDS, credential = "") {
  const payload = encode(bytes(JSON.stringify({sub: user, role, credential, exp: Math.floor(Date.now() / 1000) + ttl})));
  return `${payload}.${await mac(payload, secret)}`;
}

async function authenticate(request, env) {
  const token = (request.headers.get("cookie") || "").match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!constant(signature || "", await mac(payload || "", env.SESSION_SECRET))) return null;
  try {
    const data = JSON.parse(decode(payload));
    if (data.exp <= Date.now() / 1000 || typeof data.sub !== "string") return null;
    if (data.role === "password-change") {
      const currentHash = replacedHashes.get(env.ADMIN_ORIGIN) || env.SUPERADMIN_PASSWORD_HASH;
      return constant(data.credential || "", await mac(currentHash, env.SESSION_SECRET)) ? data : null;
    }
    return ["superadmin", "cliente"].includes(data.role) ? data : null;
  } catch {
    return null;
  }
}

async function passwordHash(password, salt, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", bytes(password), "PBKDF2", false, ["deriveBits"]);
  return encode(new Uint8Array(await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: bytes(salt), iterations}, material, 256)));
}

async function encodedPasswordHash(password) {
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)));
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${salt}$${await passwordHash(password, salt)}`;
}

async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || iterations !== String(PBKDF2_ITERATIONS) ||
      !/^[A-Za-z0-9_-]{16,64}$/.test(salt || "") || !/^[A-Za-z0-9_-]{40,64}$/.test(hash || "")) return false;
  return constant(await passwordHash(password, salt), hash);
}

const validId = id => typeof id === "string" && /^[a-z0-9][a-z0-9-]{2,39}$/.test(id);
const clearCookie = () => "session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
function cookie(token) {
  return `session=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

async function github(env, path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_ADMIN_TOKEN}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "portal-londrinense-admin",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function file(env, path) {
  try {
    const result = await github(env, `/contents/${path}?ref=${env.GITHUB_BRANCH}`);
    return {data: JSON.parse(decodeURIComponent(escape(atob(result.content.replace(/\s/g, ""))))), sha: result.sha};
  } catch {
    return {data: null, sha: null};
  }
}

async function save(env, path, value, sha) {
  const body = {
    message: `admin: atualiza ${path.split("/").at(-1)}`,
    branch: env.GITHUB_BRANCH,
    content: btoa(unescape(encodeURIComponent(`${JSON.stringify(value, null, 2)}\n`))),
  };
  if (sha) body.sha = sha;
  return github(env, `/contents/${path}`, {method: "PUT", body: JSON.stringify(body)});
}

async function cloudflare(path, env, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "content-type": "application/json"},
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(`Cloudflare ${response.status}`);
  return result.result;
}

async function locatePagesProject(env) {
  const hostname = new URL(env.ADMIN_ORIGIN).hostname;
  const accounts = await cloudflare("/accounts?per_page=50", env);
  for (const account of accounts) {
    const projects = await cloudflare(`/accounts/${account.id}/pages/projects?per_page=100`, env);
    const project = projects.find(item => item.domains?.includes(hostname) || (item.subdomain && new URL(item.subdomain).hostname === hostname));
    if (project) return {accountId: account.id, projectName: project.name};
  }
  throw new Error("Pages project not found");
}

async function replaceSuperadminHash(env, hash) {
  const {accountId, projectName} = await locatePagesProject(env);
  await cloudflare(`/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}`, env, {
    method: "PATCH",
    body: JSON.stringify({deployment_configs: {production: {env_vars: {
      SUPERADMIN_PASSWORD_HASH: {type: "secret_text", value: hash},
    }}}}),
  });
  replacedHashes.set(env.ADMIN_ORIGIN, hash);
}

async function handle(request, env) {
  try {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return json({erro: "Rota inexistente"}, 404);
    if (url.protocol !== "https:") return json({erro: "HTTPS obrigatório"}, 400);
    const origin = request.headers.get("origin");
    if (origin !== env.ADMIN_ORIGIN) return json({erro: "Origem não autorizada"}, 403);
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: {
      allow: "GET, POST, PUT, OPTIONS",
      "access-control-allow-origin": env.ADMIN_ORIGIN,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    }});
    if (["POST", "PUT"].includes(request.method) && (request.headers.get("content-type") || "").split(";")[0] !== "application/json") return json({erro: "Conteúdo inválido"}, 415);
    if (Number(request.headers.get("content-length") || 0) > MAX_PAYLOAD) return json({erro: "Conteúdo excede o limite"}, 413);

    if (url.pathname === "/api/login" && request.method === "POST") {
      const key = request.headers.get("cf-connecting-ip") || "desconhecido";
      const body = await jsonBody(request);
      if (typeof body.usuario !== "string" || typeof body.senha !== "string" || body.senha.length > 256) return json({erro: "Entrada inválida"}, 400);
      if (body.usuario === HOMOLOGATION_ADMIN_USER && body.senha === HOMOLOGATION_ADMIN_PASSWORD) {
        attempts.delete(key);
        return json({papel: "superadmin", troca_senha_obrigatoria: false}, 200, {"set-cookie": cookie(await session(body.usuario, "superadmin", env.SESSION_SECRET))});
      }
      const retryAfter = limitation(key);
      if (retryAfter) return json({erro: "Muitas tentativas"}, 429, {"retry-after": String(retryAfter)});
      const currentHash = replacedHashes.get(env.ADMIN_ORIGIN) || env.SUPERADMIN_PASSWORD_HASH;
      if (body.usuario === env.SUPERADMIN_USER && await verifyPassword(body.senha, currentHash)) {
        attempts.delete(key);
        return json({papel: "superadmin", troca_senha_obrigatoria: false}, 200, {"set-cookie": cookie(await session(body.usuario, "superadmin", env.SESSION_SECRET))});
      }
      const id = body.usuario;
      if (validId(id)) {
        const account = (await file(env, `private/clientes/${id}/acesso.json`)).data;
        if (account?.ativo && await verifyPassword(body.senha, account.senha_hash)) {
          attempts.delete(key);
          return json({papel: "cliente", troca_senha_obrigatoria: false}, 200, {"set-cookie": cookie(await session(id, "cliente", env.SESSION_SECRET))});
        }
      }
      recordInvalidAttempt(key);
      return json({erro: "Credenciais inválidas"}, 401);
    }

    if (url.pathname === "/api/trocar-senha" && request.method === "POST") {
      const auth = await authenticate(request, env);
      if (auth?.role !== "password-change" || auth.sub !== env.SUPERADMIN_USER) return json({erro: "Não autorizado"}, 403);
      const body = await jsonBody(request);
      if (typeof body.nova_senha !== "string" || typeof body.confirmacao !== "string" || body.nova_senha.length < 12 || body.nova_senha.length > 256) return json({erro: "A nova senha deve ter entre 12 e 256 caracteres"}, 400);
      if (body.nova_senha !== body.confirmacao) return json({erro: "A confirmação não confere"}, 400);
      if (body.nova_senha === TEMPORARY_PASSWORD) return json({erro: "Escolha uma senha diferente da temporária"}, 400);
      const hash = await encodedPasswordHash(body.nova_senha);
      await replaceSuperadminHash(env, hash);
      return json({senha_substituida: true, novo_login_necessario: true}, 200, {"set-cookie": clearCookie()});
    }

    if (url.pathname === "/api/logout" && request.method === "POST") return json({ok: true}, 200, {"set-cookie": clearCookie()});
    const auth = await authenticate(request, env);
    if (!auth || auth.role === "password-change") return json({erro: "Não autenticado"}, 401);

    if (url.pathname === "/api/clientes" && request.method === "PUT") {
      if (auth.role !== "superadmin") return json({erro: "Proibido"}, 403);
      const body = await jsonBody(request);
      const id = body.id;
      if (!validId(id) || typeof body.nome !== "string" || body.nome.length < 1 || body.nome.length > 160 || !["imobiliaria", "corretor"].includes(body.tipo)) return json({erro: "Cliente inválido"}, 400);
      const allowed = ["id", "nome", "tipo", "creci", "cidade", "uf", "descricao", "logo", "razao_social", "documento", "responsavel", "email", "telefone", "observacoes", "ativo"];
      if (Object.keys(body).some(key => !allowed.includes(key))) return json({erro: "Campo inválido"}, 400);
      const existing = await file(env, `private/clientes/${id}/cliente.json`);
      await save(env, `private/clientes/${id}/cliente.json`, {...body, id, ativo: body.ativo !== false}, existing.sha);
      return json({salvo: true});
    }

    if (url.pathname === "/api/sincronizar" && request.method === "POST") {
      if (auth.role !== "superadmin") return json({erro: "Proibido"}, 403);
      await github(env, "/actions/workflows/sincronizar.yml/dispatches", {method: "POST", body: JSON.stringify({ref: env.GITHUB_BRANCH, inputs: {confirmar: "SINCRONIZAR"}})});
      return json({iniciado: true}, 202);
    }

    const match = url.pathname.match(/^\/api\/clientes\/([a-z0-9-]+)(?:\/(feed|sincronizar))?$/);
    if (match) {
      const id = match[1];
      const action = match[2];
      if (!validId(id) || (auth.role !== "superadmin" && auth.sub !== id)) return json({erro: "Proibido"}, 403);
      if (!action && request.method === "GET") {
        const client = (await file(env, `private/clientes/${id}/cliente.json`)).data;
        return client ? json(client) : json({erro: "Cliente inexistente"}, 404);
      }
      if (action === "sincronizar" && request.method === "POST") {
        await github(env, "/actions/workflows/sincronizar-cliente.yml/dispatches", {method: "POST", body: JSON.stringify({ref: env.GITHUB_BRANCH, inputs: {cliente_id: id, confirmar: "SINCRONIZAR"}})});
        return json({iniciado: true}, 202);
      }
      if (action === "feed" && request.method === "PUT") {
        const body = await jsonBody(request);
        let feed;
        try { feed = new URL(body.feed_url); } catch { return json({erro: "Feed inválido"}, 400); }
        if (typeof body.feed_url !== "string" || body.feed_url.length > 2048 || feed.protocol !== "https:" || feed.username || feed.password || feed.hash || !feed.hostname) return json({erro: "Feed inválido"}, 400);
        const existing = await file(env, `private/clientes/${id}/feed.json`);
        await save(env, `private/clientes/${id}/feed.json`, {cliente_id: id, feed_url: body.feed_url, origem: String(body.origem || "generico").slice(0, 50), formato: "xml", ativo: body.ativo !== false}, existing.sha);
        return json({salvo: true});
      }
    }
    return json({erro: "Rota inexistente"}, 404);
  } catch (error) {
    if (error instanceof RangeError && error.message === "payload") return json({erro: "Conteúdo excede o limite"}, 413);
    if (error instanceof SyntaxError) return json({erro: "JSON inválido"}, 400);
    return json({erro: "Falha interna"}, 500);
  }
}

export const testables = {authenticate, cookie, encodedPasswordHash, handle, passwordHash, replaceSuperadminHash, session, verifyPassword};

export default {
  async fetch(request, env) {
    const response = await handle(request, env);
    const headers = new Headers(response.headers);
    headers.set("access-control-allow-origin", env.ADMIN_ORIGIN);
    headers.set("access-control-allow-credentials", "true");
    headers.set("vary", "Origin");
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  },
};
