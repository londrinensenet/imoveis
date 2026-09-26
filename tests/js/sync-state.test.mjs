import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
if(!globalThis.btoa)globalThis.btoa=value=>Buffer.from(value,'binary').toString('base64');
if(!globalThis.atob)globalThis.atob=value=>Buffer.from(value,'base64').toString('binary');
const {testables}=await import('../../src/admin/worker.js');

const client=(id,name,status,raw)=>({id,nome:name,status:'ativo',ativo:true,feed:{configurado:true,ativo:true,...testables.synchronizationState(raw)}});

test('estado ausente significa nunca sincronizado, sem inferir sucesso pela ausência de erro',()=>{
 assert.deepEqual(testables.synchronizationState(null),{status:'nunca_sincronizado',horario:null,resultado:null,processados:null,importados:null,rejeitados:null,mensagem:null});
});

test('estado legado da execução 91 é reconhecido imediatamente como sincronizado',()=>{
 const state=testables.synchronizationState({cliente_id:'00001',estado:'sucesso',horario:'2026-09-26T04:43:40.654513+00:00',quantidade:24});
 assert.equal(state.status,'sincronizado');assert.equal(state.horario,'2026-09-26T04:43:40.654513+00:00');assert.equal(state.processados,24);assert.equal(state.importados,24);assert.equal(state.rejeitados,null);
});

test('sucesso operacional não altera o status cadastral ativo do cliente',()=>{
 const aranda=client('00001','Aranda','ativo',{estado:'sucesso',horario:'2026-09-26T04:43:40+00:00',quantidade:24}),result=testables.dashboard([aranda]);
 assert.equal(aranda.status,'ativo');assert.equal(aranda.feed.status,'sincronizado');assert.equal(result.clientes.ativos,1);assert.equal(result.feeds.sincronizados,1);
});

test('histórico inclui sucesso e erro, calcula indicadores e não repassa dados privados',()=>{
 const success=client('00001','Aranda','ativo',{estado:'sucesso',horario:'2026-09-26T04:43:40+00:00',quantidade:24,feed_url:'https://secret.example/feed.xml',token:'secret'});
 const failed=client('00002','Cliente com erro','ativo',{estado:'falha',horario:'2026-09-26T05:00:00+00:00',quantidade:0,erro:'Falha ao obter ou validar o feed',feed_url:'https://secret.example/other.xml'});
 const result=testables.dashboard([success,failed]),serialized=JSON.stringify(result);
 assert.equal(result.feeds.com_erro,1);assert.equal(result.feeds.sincronizados,1);assert.equal(result.sincronizacao.em_execucao,0);assert.equal(result.sincronizacao.historico.length,2);assert.equal(result.sincronizacao.historico[0].status,'erro');assert.equal(result.sincronizacao.historico[0].mensagem,'Falha ao obter ou validar o feed');assert.doesNotMatch(serialized,/secret\.example|token|feed_url/);
});

test('em execução e contadores estendidos usam somente valores persistidos',()=>{
 const running=client('00003','Em andamento','ativo',{estado:'em_execucao',horario:'2026-09-26T05:01:00+00:00',quantidade:7,processados:7,importados:5,rejeitados:2}),result=testables.dashboard([running]);
 assert.equal(result.sincronizacao.em_execucao,1);assert.equal(result.sincronizacao.historico[0].rejeitados,2);
});

test('interfaces exibem os rótulos operacionais, data persistida e histórico completo',()=>{
 const clients=fs.readFileSync('public/painel/modulos/clientes-lista.js','utf8'),operation=fs.readFileSync('public/painel/modulos/operacao.js','utf8');
 for(const label of ['Nunca sincronizado','Sincronizado','Erro','Em execução'])assert.match(clients,new RegExp(label));
 for(const column of ['Sincronizados','Processados','Importados','Rejeitados','Mensagem'])assert.match(operation,new RegExp(column));
 assert.match(clients,/feed\.horario/);assert.match(operation,/sincronizacao\.historico/);
});
