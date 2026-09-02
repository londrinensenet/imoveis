import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import test from "node:test";

globalThis.crypto ??= webcrypto;
const {default: worker, testables} = await import("../../src/admin/worker.js");
const env={ADMIN_ORIGIN:"https://admin.example",[["SESSION","SECRET"].join("_")]:"valor-inerte-de-teste-com-32-chars",ENABLE_REAL_SYNC:"false"};

test("cookie de sessão possui os atributos obrigatórios",()=>{
  const value=testables.cookie("token");
  for(const attribute of ["HttpOnly","Secure","SameSite=Strict","Max-Age=3600"])assert.match(value,new RegExp(attribute));
});

test("sessão assinada autentica, adulteração e expiração não",async()=>{
  const token=await testables.session("cliente-aaa","cliente",env.SESSION_SECRET);
  const valid=await testables.authenticate(new Request("https://api.example/api/clientes/cliente-aaa",{headers:{cookie:`session=${token}`}}),env);
  assert.equal(valid.sub,"cliente-aaa");assert.equal(valid.role,"cliente");
  assert.equal(await testables.authenticate(new Request("https://api.example/",{headers:{cookie:`session=${token}x`}}),env),null);
  const expired=await testables.session("cliente-aaa","cliente",env.SESSION_SECRET,-1);
  assert.equal(await testables.authenticate(new Request("https://api.example/",{headers:{cookie:`session=${expired}`}}),env),null);
  assert.equal(await testables.authenticate(new Request("https://api.example/",{headers:{cookie:`session=${token}`}}),{...env,[["SESSION","SECRET"].join("_")]:"chave-rotacionada"}),null);
});

test("logout revoga o cookie no navegador",async()=>{
  const response=await worker.fetch(new Request("https://api.example/api/logout",{method:"POST",headers:{origin:env.ADMIN_ORIGIN,"content-type":"application/json"},body:"{}"}),env);
  assert.equal(response.status,200);assert.match(response.headers.get("set-cookie"),/Max-Age=0/);
});

test("origem é obrigatória e cliente não acessa outro sujeito",async()=>{
  const withoutOrigin=await worker.fetch(new Request("https://api.example/api/logout",{method:"POST",headers:{"content-type":"application/json"}}),env);
  assert.equal(withoutOrigin.status,403);
  const token=await testables.session("cliente-aaa","cliente",env.SESSION_SECRET);
  const request=new Request("https://api.example/api/clientes/cliente-bbb/feed",{method:"PUT",headers:{origin:env.ADMIN_ORIGIN,"content-type":"application/json",cookie:`session=${token}`},body:JSON.stringify({feed_url:"https://feed.example/data"})});
  assert.equal((await worker.fetch(request,env)).status,403);
});

test("payload é limitado com e sem Content-Length",async()=>{
  const oversized=JSON.stringify({usuario:"x",senha:"x".repeat(17000)});
  for(const headers of [
    {origin:env.ADMIN_ORIGIN,"content-type":"application/json","content-length":String(oversized.length)},
    {origin:env.ADMIN_ORIGIN,"content-type":"application/json"}
  ]) {
    const response=await worker.fetch(new Request("https://api.example/api/login",{method:"POST",headers,body:oversized}),env);
    assert.equal(response.status,413);
  }
});

test("CORS, CSRF, HTTPS e cache privado são aplicados",async()=>{
  const options=await worker.fetch(new Request("https://api.example/api/login",{method:"OPTIONS",headers:{origin:env.ADMIN_ORIGIN}}),env);
  assert.equal(options.status,204);assert.equal(options.headers.get("access-control-allow-origin"),env.ADMIN_ORIGIN);
  assert.equal(options.headers.get("access-control-allow-credentials"),"true");assert.match(options.headers.get("vary"),/Origin/);
  const wrong=await worker.fetch(new Request("https://api.example/api/login",{method:"POST",headers:{origin:"https://evil.example","content-type":"application/json"},body:"{}"}),env);
  assert.equal(wrong.status,403);assert.equal(wrong.headers.get("cache-control"),"no-store");
  const insecure=await worker.fetch(new Request("http://api.example/api/login",{method:"POST",headers:{origin:env.ADMIN_ORIGIN,"content-type":"application/json"},body:"{}"}),env);
  assert.equal(insecure.status,400);
});

test("autenticação ausente e autorização por papel",async()=>{
  const unauth=await worker.fetch(new Request("https://api.example/api/sincronizar",{method:"POST",headers:{origin:env.ADMIN_ORIGIN,"content-type":"application/json"},body:"{}"}),env);
  assert.equal(unauth.status,401);
  const token=await testables.session("cliente-aaa","cliente",env.SESSION_SECRET);
  const headers={origin:env.ADMIN_ORIGIN,"content-type":"application/json",cookie:`session=${token}`};
  assert.equal((await worker.fetch(new Request("https://api.example/api/sincronizar",{method:"POST",headers,body:"{}"}),env)).status,403);
  const own=await worker.fetch(new Request("https://api.example/api/clientes/cliente-aaa/sincronizar",{method:"POST",headers,body:"{}"}),env);
  assert.equal(own.status,200);assert.deepEqual(await own.json(),{modo:"dry-run"});
  assert.equal((await worker.fetch(new Request("https://api.example/api/clientes/cliente-bbb/sincronizar",{method:"POST",headers,body:"{}"}),env)).status,403);
});

test("URLs de feed com esquema, credencial ou fragmento inseguro são rejeitadas",async()=>{
  const token=await testables.session("cliente-aaa","cliente",env.SESSION_SECRET);
  const headers={origin:env.ADMIN_ORIGIN,"content-type":"application/json",cookie:`session=${token}`};
  for(const feed_url of ["http://feed.example/x","javascript:alert(1)","https://user:pass@feed.example/x","https://feed.example/x#secret"]){
    const response=await worker.fetch(new Request("https://api.example/api/clientes/cliente-aaa/feed",{method:"PUT",headers,body:JSON.stringify({feed_url})}),env);
    assert.equal(response.status,400,feed_url);
  }
});

test("PBKDF2 aceita somente custo fixo e formato limitado",async()=>{
  assert.equal(await testables.verifyPassword("qualquer","pbkdf2-sha256$999999999$saltSaltSaltSalt$hashhashhashhashhashhashhashhashhashhashhash"),false);
  assert.equal(await testables.verifyPassword("qualquer","pbkdf2-sha256$310000$curto$curto"),false);
});

test("tentativas excessivas de login são limitadas",async()=>{
  let response;
  for(let i=0;i<11;i++) response=await worker.fetch(new Request("https://api.example/api/login",{method:"POST",headers:{origin:env.ADMIN_ORIGIN,"content-type":"application/json","cf-connecting-ip":"192.0.2.77"},body:JSON.stringify({usuario:"x",senha:"incorreta"})}),env);
  assert.equal(response.status,429);
});
