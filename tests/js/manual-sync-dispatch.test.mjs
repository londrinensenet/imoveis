import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {testables}=await import('../../src/admin/worker.js');
const env={GITHUB_OWNER:'londrinensenet',GITHUB_REPO:'imoveis',GITHUB_BRANCH:'outra-branch',GITHUB_ADMIN_TOKEN:'test-token'};

test('dispatch geral envia confirmação real na main e retorna apenas solicitação aceita',async()=>{
 let call;
 globalThis.fetch=async(url,options)=>{call={url:String(url),options};return new Response(null,{status:204})};
 const response=await testables.dispatch(env,'sincronizar-feeds.yml',{confirmar:'SINCRONIZAR'}),body=await response.json(),payload=JSON.parse(call.options.body);
 assert.match(call.url,/actions\/workflows\/sincronizar-feeds\.yml\/dispatches$/);
 assert.equal(call.options.method,'POST');
 assert.deepEqual(payload,{ref:'main',inputs:{confirmar:'SINCRONIZAR'}});
 assert.equal(response.status,202);
 assert.equal(body.status,'solicitacao_aceita');
 assert.doesNotMatch(body.mensagem,/conclu[ií]da/i);
});

test('falha do GitHub no dispatch permanece erro operacional',async()=>{
 globalThis.fetch=async()=>Response.json({message:'failure details'},{status:503});
 await assert.rejects(()=>testables.dispatch(env,'sincronizar-feeds.yml',{confirmar:'SINCRONIZAR'}),error=>error instanceof testables.GithubError&&error.category==='GITHUB_INDISPONIVEL');
});

test('token administrativo não é exposto pelos artefatos públicos',()=>{
 const content=[...fs.readdirSync('public/painel',{recursive:true})].filter(path=>/\.(?:html|js|css)$/.test(path)).map(path=>fs.readFileSync(`public/painel/${path}`,'utf8')).join('\n');
 assert.doesNotMatch(content,/GITHUB_ADMIN_TOKEN|test-token/);
});
