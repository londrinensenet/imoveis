// finalidade tipo preco toLocaleLowerCase — integração integral com o motor existente.
import{loadCards,fetchJSON,el,fallback,urlPublica}from"./common.js?v=20260903-1";import{criarFiltros}from"./modules/filtros.js?v=20260903-1";import{criarCard}from"./modules/listagem.js?v=20260903-1";import{CATEGORIAS}from"./modules/filtros/definicoes.js?v=20260903-1";

const status=document.querySelector("#status"),categorias=document.querySelector("#categorias"),regioes=document.querySelector("#regioes"),filtros=document.querySelector("#filtros");
if(categorias)for(const[value,label]of Object.entries(CATEGORIAS)){const a=el("a","atalho",label);a.href=`resultados.html?categoria=${encodeURIComponent(value)}`;categorias.append(a)}
if(regioes)for(const regiao of["Central","Norte","Sul","Leste","Oeste","Rural"]){const a=el("a","regiao",`Região ${regiao}`);a.href=`resultados.html?regiao=${encodeURIComponent(regiao)}`;regioes.append(a)}

if(filtros){
 try{
  const cards=await loadCards();
  criarFiltros(filtros,cards,{modo:"full",aoAlterar:()=>{}});
  filtros.addEventListener("submit",()=>{location.href=`resultados.html${location.search}`});
  for(const[id,items]of[["destaques",cards.filter(x=>x.destaque).slice(0,6)],["recentes",cards.slice(0,6)]]){const root=document.querySelector(`#${id}`),secao=document.querySelector(`#${id}-secao`);if(root&&secao&&items.length){secao.hidden=false;items.forEach(item=>root.append(criarCard(item)))}}
  if(status)status.textContent=cards.length?"":"Nenhum imóvel disponível no momento.";
 }catch(error){
  criarFiltros(filtros,[],{modo:"full",aoAlterar:()=>{}});
  filtros.addEventListener("submit",()=>{location.href=`resultados.html${location.search}`});
  if(status){status.textContent=error.message==="json"?"Os dados públicos estão em formato inválido.":"Não foi possível carregar os imóveis. Tente novamente.";status.className="estado estado-erro"}
 }
}

const anunciantes=document.querySelector("#anunciantes"),anunciantesSecao=document.querySelector("#anunciantes-secao");
if(anunciantes&&anunciantesSecao)try{const clientes=await fetchJSON("dados/clientes/clientes.json");if(Array.isArray(clientes)&&clientes.length){anunciantesSecao.hidden=false;for(const item of clientes.slice(0,3)){const article=el("article","card"),img=el("img");img.src=urlPublica(item.logo)||fallback;img.alt=item.logo?`Marca de ${item.nome}`:"Anunciante sem logotipo";const body=el("div","card-corpo"),h=el("h3"),a=el("a",null,item.nome);a.href=`cliente.html?id=${encodeURIComponent(item.id)}`;h.append(a);body.append(h,el("p",null,[item.tipo,item.cidade,item.uf].filter(Boolean).join(" · ")));article.append(img,body);anunciantes.append(article)}}catch{/* seção opcional permanece oculta */}
