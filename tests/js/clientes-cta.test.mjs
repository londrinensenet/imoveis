import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canCreateClient,newClientLink,NOVO_CLIENTE_ROUTE} from '../../public/painel/modulos/clientes-lista.js';

const sessions={
 MASTER:{papel:'MASTER',direitos:{incluir:false}},
 SUPERADMIN:{papel:'SUPERADMIN',direitos:{incluir:false}},
 ADMIN_ALLOWED:{papel:'ADMIN',permissoes:{incluir:true},direitos:{incluir:false}},
 ADMIN_DENIED:{papel:'ADMIN',permissoes:{incluir:false},direitos:{incluir:true}},
};

test('CTA de clientes respeita o direito de inclusão de cada perfil',()=>{
 assert.equal(canCreateClient(sessions.MASTER),true);
 assert.equal(canCreateClient(sessions.SUPERADMIN),true);
 assert.equal(canCreateClient(sessions.ADMIN_ALLOWED),true);
 assert.equal(canCreateClient(sessions.ADMIN_DENIED),false);
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
