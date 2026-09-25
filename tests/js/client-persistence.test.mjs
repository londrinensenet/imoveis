import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
if(!globalThis.btoa)globalThis.btoa=value=>Buffer.from(value,'binary').toString('base64');
if(!globalThis.atob)globalThis.atob=value=>Buffer.from(value,'base64').toString('binary');

const {testables}=await import('../../src/admin/worker.js');
const origin='https://imoveis.londrinense.net';
const baseEnv={SESSION_SECRET:'s'.repeat(48),ADMIN_ORIGIN:origin,GITHUB_OWNER:'owner',GITHUB_REPO:'repo',GITHUB_BRANCH:'main',GITHUB_ADMIN_TOKEN:'x'};
const payload=email=>({nome:'Imobiliária Teste',tipo:'imobiliaria',status:'ativo',ativo:true,email_login:email,cpf_cnpj:'529.982.247-25',uf:'PR',cidade:'Londrina',cep:'86000-000',site:'https://imobiliaria.example',feed_url:'https://crm.example/feed.xml?private=sim',feed_formato:'xml',feed_ativo:true});
const request=(path,method='GET',data,cookie)=>new Request(`https://api.example${path}`,{method,headers:{origin,...(data?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data&&JSON.stringify(data)});

function memoryGithub(initial={},failure){
 const files=new Map(Object.entries(initial).map(([path,value])=>[path,{value,sha:`sha-${path}`}])) ,calls=[];
 globalThis.fetch=async(raw,options={})=>{
  const url=new URL(raw),method=options.method||'GET';
  if(url.pathname.includes('/branches/'))return failure?.({method,path:'@branch',calls,files})||Response.json({name:'main'});
  const marker='/contents/',index=url.pathname.indexOf(marker),path=index<0?'':decodeURIComponent(url.pathname.slice(index+marker.length));calls.push({method,path});
  const failed=failure?.({method,path,calls,files});if(failed)return failed;
  if(method==='PUT'){const body=JSON.parse(options.body);if(!body.sha&&files.has(path))return Response.json({message:'already exists'},{status:422});if(body.sha&&files.get(path)?.sha!==body.sha)return Response.json({message:'sha mismatch'},{status:409});const value=JSON.parse(Buffer.from(body.content,'base64').toString()),sha=`sha-${calls.length}-${path}`;files.set(path,{value,sha});return Response.json({content:{sha}})}
  if(method==='DELETE'){const body=JSON.parse(options.body);if(files.get(path)?.sha!==body.sha)return Response.json({message:'sha mismatch'},{status:409});files.delete(path);return new Response(null,{status:204})}
  if(files.has(path)){const record=files.get(path);return Response.json({content:Buffer.from(JSON.stringify(record.value)).toString('base64'),sha:record.sha})}
  const prefix=`${path}/`,children=new Map();for(const key of files.keys()){if(!key.startsWith(prefix))continue;const rest=key.slice(prefix.length),name=rest.split('/')[0];children.set(name,{name,type:rest.includes('/')?'dir':'file'})}if(children.size)return Response.json([...children.values()]);
  return Response.json({message:'not found'},{status:404});
 };
 return{files,calls};
}
async function authCookie(identity={id:'MASTER',sub:'subject',email:'londrinense.net@gmail.com',role:'MASTER',nome:'SUPERADMIN',permissoes:{incluir:true,editar:true,excluir:true}}){return`session=${await testables.session(identity,baseEnv.SESSION_SECRET)}`}

test('primeiro cadastro inicializa diretórios implicitamente, cria os dois arquivos, sequence e retorna 201',async()=>{
 const github=memoryGithub(),cookie=await authCookie(),response=await testables.handle(request('/api/clientes','POST',payload('primeiro@example.com'),cookie),baseEnv);
 assert.equal(response.status,201);assert.deepEqual(await response.json(),{salvo:true,id:'00001'});
 assert.equal(github.files.get('private/clientes/00001/cliente.json').value.email_login,'primeiro@example.com');
 assert.equal(github.files.get('private/clientes/00001/feed.json').value.cliente_id,'00001');
 assert.deepEqual(github.files.get('private/clientes/.sequence.json').value,{last_id:1});
 assert.equal([...github.files.keys()].some(path=>path.endsWith('.gitkeep')),false);
});

test('duas criações produzem 00001 e 00002 e integração POST → GET lista o novo cliente',async()=>{
 memoryGithub();const cookie=await authCookie();
 const first=await testables.handle(request('/api/clientes','POST',payload('um@example.com'),cookie),baseEnv),second=await testables.handle(request('/api/clientes','POST',payload('dois@example.com'),cookie),baseEnv);
 assert.equal((await first.json()).id,'00001');assert.equal((await second.json()).id,'00002');
 const listed=await testables.handle(request('/api/clientes','GET',undefined,cookie),baseEnv),body=await listed.json();assert.equal(listed.status,200);assert.deepEqual(new Set(body.itens.map(item=>item.id)),new Set(['00001','00002']));assert.doesNotMatch(JSON.stringify(body),/crm\.example|private=sim/);
});

for(const [label,failedPath] of [['cliente.json','private/clientes/00001/cliente.json'],['feed.json','private/clientes/00001/feed.json'],['sequence','private/clientes/.sequence.json']])test(`falha em ${label} faz rollback e não perde o ID`,async()=>{
 let enabled=true;const github=memoryGithub({},({method,path})=>enabled&&method==='PUT'&&path===failedPath?Response.json({message:'failure'},{status:500}):null),cookie=await authCookie();
 const failed=await testables.handle(request('/api/clientes','POST',payload(`${label.replace('.','')}@example.com`),cookie),baseEnv);assert.equal(failed.status,503);assert.equal((await failed.json()).codigo,'GITHUB_INDISPONIVEL');
 assert.equal(github.files.has('private/clientes/00001/cliente.json'),false);assert.equal(github.files.has('private/clientes/00001/feed.json'),false);assert.equal(github.files.has('private/clientes/.sequence.json'),false);
 enabled=false;const retried=await testables.handle(request('/api/clientes','POST',payload(`${label.replace('.','')}-retry@example.com`),cookie),baseEnv);assert.deepEqual(await retried.json(),{salvo:true,id:'00001'});
});

test('diretório existente prevalece sobre sequence atrasada e impede colisão',async()=>{
 memoryGithub({'private/clientes/00007/cliente.json':{id:'00007',email_login:'old@example.com'},'private/clientes/00007/feed.json':{cliente_id:'00007',feed_url:'https://private.example/feed'},'private/clientes/.sequence.json':{last_id:3}});assert.equal(await testables.nextClientId(baseEnv),'00008');
});

test('e-mail conflitante é rejeitado sem qualquer escrita',async()=>{
 const github=memoryGithub({'private/clientes/00001/cliente.json':{id:'00001',email_login:'duplicado@example.com'}}),cookie=await authCookie(),response=await testables.handle(request('/api/clientes','POST',payload('DUPLICADO@example.com'),cookie),baseEnv);
 assert.equal(response.status,409);assert.equal((await response.json()).codigo,'CONFLITO');assert.equal(github.calls.some(call=>call.method==='PUT'),false);
});

test('MASTER e ADMIN com direito incluem; ADMIN sem direito recebe 403',async()=>{
 const admin=value=>({id:value.id,nome:value.nome,email:value.email,role:'ADMIN',ativo:true,permissoes:{incluir:value.incluir,editar:false,excluir:false}}),allowed=admin({id:'A01',nome:'Permitido',email:'permitido@example.com',incluir:true}),denied=admin({id:'A02',nome:'Negado',email:'negado@example.com',incluir:false});
 memoryGithub({'private/admins/A01.json':allowed,'private/admins/A02.json':denied});
 const master=await testables.handle(request('/api/clientes','POST',payload('master-client@example.com'),await authCookie()),baseEnv);assert.equal(master.status,201);
 const allowedResponse=await testables.handle(request('/api/clientes','POST',payload('admin-client@example.com'),await authCookie({...allowed,sub:'admin-sub'})),baseEnv);assert.equal(allowedResponse.status,201);
 const deniedResponse=await testables.handle(request('/api/clientes','POST',payload('denied-client@example.com'),await authCookie({...denied,sub:'denied-sub'})),baseEnv);assert.equal(deniedResponse.status,403);
});

test('URL do feed fica somente no arquivo privado e não no cliente nem na resposta',async()=>{
 const github=memoryGithub(),response=await testables.handle(request('/api/clientes','POST',payload('private-feed@example.com'),await authCookie()),baseEnv),body=await response.json();
 assert.equal(response.status,201);assert.deepEqual(body,{salvo:true,id:'00001'});assert.doesNotMatch(JSON.stringify(github.files.get('private/clientes/00001/cliente.json').value),/crm\.example/);assert.match(github.files.get('private/clientes/00001/feed.json').value.feed_url,/crm\.example/);
});

test('configuração ausente e respostas GitHub 401, 403, 404 de branch e 409 são diagnosticadas sem segredos',async()=>{
 const cases=[[401,'AUTENTICACAO'],[403,'PERMISSAO'],[404,'BRANCH'],[409,'CONFLITO'],[418,'GITHUB_INESPERADO']];
 for(const [status,code] of cases){memoryGithub({},({path})=>path==='@branch'?Response.json({message:'safe'},{status}):null);const response=await testables.handle(request('/api/clientes','POST',payload(`${status}@example.com`),await authCookie()),baseEnv),text=await response.text();assert.equal(JSON.parse(text).codigo,code);assert.doesNotMatch(text,/authorization/i)}
 const response=await testables.handle(request('/api/clientes','POST',payload('config@example.com'),await authCookie()),{...baseEnv,['GITHUB_ADMIN_'+'TOKEN']:''});assert.equal(response.status,503);assert.equal((await response.json()).codigo,'CONFIGURACAO');
});
