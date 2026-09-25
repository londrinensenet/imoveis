import {getSession} from './router.js';
import {api} from "./api.js";
import {escape,empty,loading,toast,confirmAction} from "./componentes.js";

export const NOVO_CLIENTE_ROUTE="#/clientes/novo";
const addClientIcon='<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6"/></svg>';

export const canCreateClient=session=>session?.papel==='MASTER'||session?.papel==='SUPERADMIN'||session?.papel==='ADMIN'&&session?.permissoes?.incluir===true;
export const newClientLink=label=>`<a class="button" href="${NOVO_CLIENTE_ROUTE}">${addClientIcon}<span>${label}</span></a>`;

export async function clientes(root,query=new URLSearchParams()){
 const allowed=canCreateClient(getSession());
 root.innerHTML=loading();
 const data=await api(`/clientes?${query}`);
 const primaryAction=allowed?newClientLink('Novo cliente'):'';
 const emptyAction=allowed?newClientLink('Cadastrar primeiro cliente'):'';
 root.innerHTML=`<div class="page-head"><div><p class="eyebrow">Cadastros</p><h1>Clientes</h1><p class="muted">${data.total} cliente(s) encontrado(s)</p></div>${primaryAction}</div><form id="filters" class="toolbar panel"><input name="q" type="search" placeholder="Nome, ID, CRECI, cidade…" value="${escape(query.get("q")||"")}"><select name="status"><option value="">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option><option value="suspenso">Suspensos</option></select><select name="feed"><option value="">Todos os feeds</option><option value="com">Com feed</option><option value="sem">Sem feed</option></select><button>Filtrar</button></form><section class="panel table-wrap">${data.itens.length?`<table><thead><tr><th>Cliente</th><th>Tipo</th><th>Cidade</th><th>Status</th><th>Feed</th><th>Ações</th></tr></thead><tbody>${data.itens.map(x=>`<tr><td><strong>${escape(x.nome)}</strong><br><small>${escape(x.id)}</small></td><td>${escape(x.tipo)}</td><td>${escape(x.cidade||"—")}</td><td><span class="badge ${escape(x.status||"")}">${escape(x.status||(x.ativo===false?"inativo":"ativo"))}</span></td><td>${x.feed.configurado?escape(x.feed.status):"Não configurado"}</td><td><a href="#/clientes/${encodeURIComponent(x.id)}">Administrar</a></td></tr>`).join("")}</tbody></table>`:empty("Nenhum cliente","Cadastre o primeiro cliente ou altere os filtros.",emptyAction)}</section>`;
 const status=root.querySelector('[name="status"]');status.value=query.get("status")||"";
 const feed=root.querySelector('[name="feed"]');feed.value=query.get("feed")||"";
 root.querySelector("#filters").onsubmit=e=>{e.preventDefault();location.hash=`#/clientes?${new URLSearchParams(new FormData(e.currentTarget))}`};
}

export async function changeStatus(id,status){if(!await confirmAction(`${status[0].toUpperCase()+status.slice(1)} cliente`,`Essa alteração será persistida no repositório privado e poderá ser revertida.`))return;const result=await api(`/clientes/${id}/${status}`,{method:"POST",body:{}});toast(`Cliente ${result.status}.`);location.reload()}
