import {getSession} from './sessao.js?v=20260925-clientes-sessao-v4';
import {api} from "./api.js?v=20260925-github-diagnostico-v1";
import {escape,empty,toast,confirmAction} from "./componentes.js";

export const NOVO_CLIENTE_ROUTE="#/clientes/novo";
const addClientIcon='<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6"/></svg>';

export const canCreateClient=session=>session?.papel==='MASTER'||session?.papel==='SUPERADMIN'||session?.papel==='ADMIN'&&session?.direitos?.incluir===true;
export const newClientLink=label=>`<a class="button" href="${NOVO_CLIENTE_ROUTE}">${addClientIcon}<span>${label}</span></a>`;

const table=data=>`<table><thead><tr><th>Cliente</th><th>Tipo</th><th>Cidade</th><th>Status</th><th>Feed</th><th>Ações</th></tr></thead><tbody>${data.itens.map(x=>`<tr><td><strong>${escape(x.nome)}</strong><br><small>${escape(x.id)}</small></td><td>${escape(x.tipo)}</td><td>${escape(x.cidade||"—")}</td><td><span class="badge ${escape(x.status||"")}">${escape(x.status||(x.ativo===false?"inativo":"ativo"))}</span></td><td>${x.feed.configurado?escape(x.feed.status):"Não configurado"}</td><td><a href="#/clientes/${encodeURIComponent(x.id)}">Administrar</a></td></tr>`).join("")}</tbody></table>`;

export async function clientes(root,query=new URLSearchParams()){
 const allowed=canCreateClient(getSession()),primaryAction=allowed?newClientLink('Novo cliente'):'';
 root.innerHTML=`<div class="page-head"><div><p class="eyebrow">Cadastros</p><h1>Clientes</h1><p id="client-count" class="muted">Carregando clientes…</p></div>${primaryAction}</div><form id="filters" class="toolbar panel"><input name="q" type="search" placeholder="Nome, ID, CRECI, cidade…" value="${escape(query.get("q")||"")}"><select name="status"><option value="">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option><option value="suspenso">Suspensos</option></select><select name="feed"><option value="">Todos os feeds</option><option value="com">Com feed</option><option value="sem">Sem feed</option></select><button>Filtrar</button></form><section id="client-list" class="panel table-wrap"><p class="muted">Carregando lista de clientes…</p></section>`;
 const status=root.querySelector('[name="status"]'),feed=root.querySelector('[name="feed"]');status.value=query.get("status")||"";feed.value=query.get("feed")||"";
 root.querySelector("#filters").onsubmit=event=>{event.preventDefault();location.hash=`#/clientes?${new URLSearchParams(new FormData(event.currentTarget))}`};
 const list=root.querySelector("#client-list"),count=root.querySelector("#client-count");
 try{const data=await api(`/clientes?${query}`),emptyAction=allowed?newClientLink('Cadastrar primeiro cliente'):'';count.textContent=`${data.total} cliente(s) encontrado(s)`;list.innerHTML=data.itens.length?table(data):empty("Nenhum cliente","Cadastre o primeiro cliente ou altere os filtros.",emptyAction)}catch(error){count.textContent="Listagem indisponível";const diagnostic=['MASTER','SUPERADMIN'].includes(getSession()?.papel)?'<a class="button secondary" href="#/diagnostico">Executar diagnóstico</a>':'';list.innerHTML=`<div class="empty"><h2>Não foi possível carregar a lista de clientes.</h2><p class="muted">${escape(error.message)}</p><div class="actions"><button id="retry-clients">Tentar novamente</button>${diagnostic}</div></div>`;root.querySelector("#retry-clients").onclick=()=>clientes(root,query)}
}

export async function changeStatus(id,status){if(!await confirmAction(`${status[0].toUpperCase()+status.slice(1)} cliente`,`Essa alteração será persistida no repositório privado e poderá ser revertida.`))return;const result=await api(`/clientes/${id}/${status}`,{method:"POST",body:{}});toast(`Cliente ${result.status}.`);location.reload()}
