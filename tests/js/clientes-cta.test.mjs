import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canCreateClient,clientes,newClientLink,NOVO_CLIENTE_ROUTE} from '../../public/painel/modulos/clientes-lista.js';
import {getSession,setSession} from '../../public/painel/modulos/router.js';
import {testables} from '../../src/admin/worker.js';

const sessions={
 MASTER:{papel:'MASTER',direitos:{incluir:false}},
 SUPERADMIN:{papel:'SUPERADMIN',direitos:{incluir:false}},
 ADMIN_ALLOWED:{papel:'ADMIN',permissoes:{incluir:false},direitos:{incluir:true}},
 ADMIN_DENIED:{papel:'ADMIN',permissoes:{incluir:true},direitos:{incluir:false}},
 CLIENTE:{papel:'CLIENTE',direitos:{incluir:true}},
};

test('CTA de clientes respeita o direito de inclusão de cada perfil',()=>{
 assert.equal(canCreateClient(sessions.MASTER),true);
 assert.equal(canCreateClient(sessions.SUPERADMIN),true);
 assert.equal(canCreateClient(sessions.ADMIN_ALLOWED),true);
 assert.equal(canCreateClient(sessions.ADMIN_DENIED),false);
 assert.equal(canCreateClient(sessions.CLIENTE),false);
});

test('API → setSession → getSession → clientes renderiza os dois CTAs do MASTER',async()=>{
 if(!globalThis.crypto)globalThis.crypto=(await import('node:crypto')).webcrypto;
 if(!globalThis.btoa)globalThis.btoa=value=>Buffer.from(value,'binary').toString('base64');
 if(!globalThis.atob)globalThis.atob=value=>Buffer.from(value,'base64').toString('binary');
 const environment={SESSION_SECRET:'s'.repeat(48),ADMIN_ORIGIN:'https://imoveis.londrinense.net',GITHUB_OWNER:'o',GITHUB_REPO:'r',GITHUB_BRANCH:'main',GITHUB_ADMIN_TOKEN:'x'};
 globalThis.fetch=async url=>String(url).includes('/contents/private/admins?')||String(url).includes('/contents/private/clientes?')?Response.json([]):Response.json({message:'not found'},{status:404});
 const signed=await testables.session({sub:'google-subject',email:'londrinense.net@gmail.com',role:'MASTER',nome:'SUPERADMIN'},environment.SESSION_SECRET);
 const response=await testables.handle(new Request('https://api.example/api/sessao',{headers:{origin:environment.ADMIN_ORIGIN,cookie:`session=${signed}`}}),environment);
 const apiSession=await response.json();
 assert.deepEqual(apiSession,{usuario:'MASTER',nome:'SUPERADMIN',email:'londrinense.net@gmail.com',picture:'',foto_url:'',papel:'MASTER',permissoes:{incluir:true,editar:true,excluir:true},direitos:{incluir:true,editar:true,excluir:true,administradores:true}});

 setSession(apiSession);
 assert.strictEqual(getSession(),apiSession);
 globalThis.fetch=async url=>{
  assert.equal(String(url),'/api/clientes?');
  return Response.json({itens:[],total:0});
 };
 const fields={status:{value:''},feed:{value:''},filters:{onsubmit:null},list:{innerHTML:''},count:{textContent:''}};
 const root={html:'',set innerHTML(value){this.html=value},get innerHTML(){return this.html},querySelector(selector){return selector==='[name="status"]'?fields.status:selector==='[name="feed"]'?fields.feed:selector==='#client-list'?fields.list:selector==='#client-count'?fields.count:fields.filters}};
 await clientes(root);
 assert.match(root.innerHTML,/>Novo cliente</);
 assert.match(fields.list.innerHTML,/>Cadastrar primeiro cliente</);
 assert.equal((`${root.innerHTML}${fields.list.innerHTML}`.match(/href="#\/clientes\/novo"/g)||[]).length,2);
});

test('falha de dependência permanece restrita à listagem e preserva cabeçalho e CTA',async()=>{
 setSession(sessions.MASTER);globalThis.fetch=async()=>Response.json({erro:'Credencial do GitHub rejeitada.',codigo:'AUTENTICACAO'},{status:424});
 const fields={status:{value:''},feed:{value:''},filters:{onsubmit:null},list:{innerHTML:''},count:{textContent:''},retry:{onclick:null}};
 const root={html:'',set innerHTML(value){this.html=value},get innerHTML(){return this.html},querySelector(selector){return selector==='[name="status"]'?fields.status:selector==='[name="feed"]'?fields.feed:selector==='#client-list'?fields.list:selector==='#client-count'?fields.count:selector==='#retry-clients'?fields.retry:fields.filters}};
 await clientes(root);assert.match(root.innerHTML,/<h1>Clientes<\/h1>/);assert.match(root.innerHTML,/>Novo cliente</);assert.match(fields.list.innerHTML,/Não foi possível carregar/);assert.match(fields.list.innerHTML,/Credencial do GitHub rejeitada/);assert.match(fields.list.innerHTML,/Tentar novamente/);assert.match(fields.list.innerHTML,/Executar diagnóstico/);assert.equal(typeof fields.retry.onclick,'function');
});

test('CTAs principal e vazio compartilham a rota do formulário existente',()=>{
 const primary=newClientLink('Novo cliente');
 const empty=newClientLink('Cadastrar primeiro cliente');
 for(const link of [primary,empty]){
  assert.match(link,new RegExp(`href="${NOVO_CLIENTE_ROUTE}"`));
  assert.match(link,/<svg[^>]+aria-hidden="true"/);
 }
 assert.match(primary,/>Novo cliente</);
 assert.match(empty,/>Cadastrar primeiro cliente</);
});

test('lista, roteador e formulário compõem um único fluxo de cadastro',()=>{
 const list=fs.readFileSync('public/painel/modulos/clientes-lista.js','utf8');
 const router=fs.readFileSync('public/painel/modulos/router.js','utf8');
 const form=fs.readFileSync('public/painel/modulos/cliente-formulario.js','utf8');
 assert.match(list,/empty\("Nenhum cliente","Cadastre o primeiro cliente ou altere os filtros\.",emptyAction\)/);
 assert.match(router,/parts\[0\]==="clientes"&&parts\[1\]==="novo"&&canCreateClient\(session\)/);
 assert.match(router,/await formCliente\(root\)/);
 assert.equal((router.match(/from "\.\/cliente-formulario\.js/g)||[]).length,1);
 assert.equal(fs.readdirSync('public/painel/modulos').filter(name=>name==='cliente-formulario.js').length,1);
 for(const section of ['Dados de acesso','Dados cadastrais','Contato administrativo privado','Endereço','Dados públicos','Integração / Feed','Interno'])assert.match(form,new RegExp(section,'i'));
});
