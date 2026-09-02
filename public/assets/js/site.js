// finalidade tipo preco toLocaleLowerCase — estado delegado ao motor multilógica.
// Nenhum imóvel; Não foi possível carregar.
import{loadCards}from"./common.js";import{criarFiltros}from"./modules/filtros.js";import{criarListagem}from"./modules/listagem.js";
const filtros=document.querySelector('#filtros'),lista=criarListagem(document.querySelector('#listagem'));lista.carregando();try{const cards=await loadCards();criarFiltros(filtros,cards,{modo:'full',aoAlterar:(encontrados,estado,sugestoes)=>{lista.mostrar(encontrados);const root=document.querySelector('#sugestoes');root.replaceChildren();for(const s of sugestoes){const p=document.createElement('p');p.textContent=s.texto;root.append(p)}}})}catch{lista.erro()}
