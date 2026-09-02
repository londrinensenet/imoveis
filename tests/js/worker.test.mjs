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
