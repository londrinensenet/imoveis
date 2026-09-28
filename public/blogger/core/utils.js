(function (window) {
  "use strict";
  const L = window.Londrinense, C = L.Common, compareKey = "londrinense.imoveis.comparacao.v1";
  const value = number => Number.isFinite(Number(number)) ? Number(number) : 0;
  function options(records, field) { return [...new Set(records.map(item => item[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "pt-BR")); }
  function filtrar(records, state) {
    return records.filter(item => {
      for (const field of ["finalidade", "tipo", "regiao", "cidade", "bairro"]) if (state[field] && C.normalize(item[field]) !== C.normalize(state[field])) return false;
      for (const field of ["quartos", "banheiros", "vagas"]) if (state[field] && value(item[field]) < value(state[field])) return false;
      if (state.preco_min && value(item.preco) < value(state.preco_min)) return false;
      if (state.preco_max && value(item.preco) > value(state.preco_max)) return false;
      if (state.area_min && value(item.area) < value(state.area_min)) return false;
      if (state.area_max && value(item.area) > value(state.area_max)) return false;
      for (const field of ['area_util','area_total']) { const amount = value(field === 'area_util' ? item.area_util : item.area_terreno); if (state[field+'_min'] && amount < value(state[field+'_min'])) return false; if (state[field+'_max'] && (!amount || amount > value(state[field+'_max']))) return false; }
      return true;
    });
  }
  function ordenar(records, order) { const result = records.slice(); if (order === "preco_asc") result.sort((a,b) => value(a.preco)-value(b.preco)); if (order === "preco_desc") result.sort((a,b) => value(b.preco)-value(a.preco)); return result; }
  function paginas(current, total, radius) { const out = [], wanted = new Set([1, total]); for (let i=Math.max(1,current-(radius||2));i<=Math.min(total,current+(radius||2));i++) wanted.add(i); [...wanted].sort((a,b)=>a-b).forEach(page => { if (out.length && page-out[out.length-1]>1) out.push("…"); out.push(page); }); return total ? out : []; }
  function comparisons() { try { const list=JSON.parse(localStorage.getItem(compareKey)||"[]"); return Array.isArray(list) ? [...new Set(list.filter(C.validId))].slice(0,4) : []; } catch (_) { return []; } }
  function setComparisons(list) { const safe=[...new Set(list.filter(C.validId))].slice(0,4); try { localStorage.setItem(compareKey,JSON.stringify(safe)); } catch (_) {} return safe; }
  function toggleComparison(id) { const list=comparisons(), index=list.indexOf(id), rejected=index<0&&list.length>=4; if(index>=0) list.splice(index,1); else if(!rejected) list.push(id); return {itens:setComparisons(list),limite:rejected}; }
  function coords(item) { const lat=Number(item && item.location && item.location.latitude), lng=Number(item && item.location && item.location.longitude); return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180 ? [lat,lng] : null; }
  function media(item) { return (Array.isArray(item.fotos)&&item.fotos[0]) || item.foto || ""; }
  function safeImage(value) {
    if(!value)return '';
    try {const url=new URL(value,location.origin);return url.protocol==='https:'?url.href:''} catch (_) {return ''}
  }
  function card(item, advertiser) {
    const e=C.escapeHtml, id=e(item.id), href=C.url(L.Config.urls.imovel,{id:item.id}), icon=C.icon;
    const place=[item.bairro,item.cidade].filter(Boolean).join(', ');
    const facts=[['bed',item.quartos,'quartos'],['bath',item.banheiros,'banheiros'],['car',item.vagas,'vagas'],['ruler',item.area,'m²']]
      .filter(([,value])=>value).map(([name,value,label])=>`<li title="${e(label)}" aria-label="${e(value)} ${e(label)}">${icon(name)}<b>${e(value)}${name==='ruler'?' m²':''}</b></li>`).join('');
    const name=advertiser?.nome||advertiser?.nome_publico||'Anunciante';
    const advertiserId=C.validId(item.cliente_id)?item.cliente_id:'';
    const avatar=safeImage(advertiser?.logo||advertiser?.imagem_url);
    const owner=advertiserId?`<a class="ln-card__advertiser" href="${e(C.url(L.Config.urls.anunciante,{id:advertiserId}))}" aria-label="Ver imóveis de ${e(name)}" title="${e(name)}"><span>${icon('building')}</span>${avatar?`<img src="${e(avatar)}" alt="" loading="lazy" onerror="this.hidden=true">`:''}</a>`:'';
    return `<article class="ln-card" data-id="${id}"><div class="ln-card__media-wrap"><a class="ln-card__media" href="${e(href)}" aria-label="Ver ${e(item.titulo||'imóvel')}">${media(item)?`<img loading="lazy" src="${e(media(item))}" alt="${e(item.titulo||'Imóvel')}" onerror="this.hidden=true">`:''}</a><div class="ln-card__badges">${item.finalidade?`<span>${e(item.finalidade)}</span>`:''}</div>${owner}</div><div class="ln-card__body"><div class="ln-card__content">${item.tipo?`<span class="ln-card__type">${e(item.tipo)}</span>`:''}<h3><a href="${e(href)}">${e(item.titulo||'Imóvel')}</a></h3>${place?`<p class="ln-card__location">${icon('pin')}<span>${e(place)}</span></p>`:''}${facts?`<ul class="ln-facts">${facts}</ul>`:''}</div><div class="ln-card__footer">${item.preco?`<strong class="ln-card__footer-price">${e(C.brl(item.preco))}</strong>`:''}<div class="ln-card__actions"><button class="ln-icon-btn" type="button" data-action="share" data-id="${id}" aria-label="Compartilhar imóvel" title="Compartilhar">${icon('share')}</button><button class="ln-icon-btn ln-card__favorite${L.Favoritos.contem(item.id)?' is-active':''}" type="button" data-action="favorite" data-id="${id}" aria-pressed="${L.Favoritos.contem(item.id)}" aria-label="Favoritar imóvel" title="Favoritar">${icon('heart')}</button><button class="ln-icon-btn ln-card__compare${comparisons().includes(item.id)?' is-active':''}" type="button" data-action="compare" data-id="${id}" aria-label="Adicionar à comparação e abrir painel" title="Comparar">${icon('plus')}</button></div></div></div></article>`;
  }
  const drawers=new WeakMap();
  function openComparisonDrawer(host, records, addId) {
    if(!host)return {limite:false};
    let result={limite:false};
    if(addId&&!comparisons().includes(addId)) result=toggleComparison(addId);
    let overlay=host.querySelector('[data-compare-overlay]');
    if(!overlay){
      overlay=document.createElement('div');overlay.className='ln-compare-overlay';overlay.setAttribute('data-compare-overlay','');
      overlay.innerHTML=`<aside class="ln-compare-drawer" role="dialog" aria-modal="true" aria-label="Imóveis para comparar"><header><h2>Comparar imóveis</h2><button type="button" data-action="compare-close" aria-label="Fechar comparação">${C.icon('x')}</button></header><div data-compare-items></div><a class="ln-btn ln-btn--primary ln-compare-drawer__link" href="${C.escapeHtml(L.Config.urls.comparar)}">Comparar selecionados</a></aside>`;
      host.appendChild(overlay);
      overlay.addEventListener('click',event=>{
        const button=event.target.closest('[data-action]');
        if(event.target===overlay||button?.dataset.action==='compare-close'){close();return}
        if(button?.dataset.action==='compare-remove'){setComparisons(comparisons().filter(id=>id!==button.dataset.id));refresh()}
      });
      overlay.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();close();return}
        if(event.key!=='Tab')return;
        const controls=[...overlay.querySelectorAll('button:not([disabled]),a:not([hidden])')];
        if(!controls.length)return;
        if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus()}
        else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus()}
      });
    }
    let state=drawers.get(overlay);
    if(!state){state={generation:0,records,trigger:null};drawers.set(overlay,state)}
    state.records=records;state.trigger=document.activeElement;
    function close(){state.generation++;overlay.hidden=true;document.documentElement.classList.remove('ln-compare-open');if(state.trigger?.isConnected)state.trigger.focus()}
    async function refresh(){
      const token=++state.generation,ids=comparisons(),list=overlay.querySelector('[data-compare-items]');
      host.querySelectorAll('.ln-card__compare').forEach(button=>button.classList.toggle('is-active',ids.includes(button.dataset.id)));
      if(!ids.length){list.innerHTML='<p class="ln-compare-drawer__empty">Nenhum imóvel selecionado.</p>';overlay.querySelector('.ln-compare-drawer__link').hidden=true;return}
      list.innerHTML='<p>Carregando imóveis…</p>';
      const loaded=await Promise.allSettled(ids.map(id=>state.records.find(item=>item.id===id)||L.Dados.getImovel(id)));
      if(token!==state.generation||overlay.hidden)return;
      const items=loaded.filter(entry=>entry.status==='fulfilled').map(entry=>entry.value),e=C.escapeHtml;
      list.innerHTML=items.map(item=>`<article class="ln-compare-drawer__item">${media(item)?`<img src="${e(media(item))}" alt="" loading="lazy">`:''}<div><strong>${e(item.titulo||'Imóvel')}</strong><span>${e(C.brl(item.preco))}</span></div><button type="button" data-action="compare-remove" data-id="${e(item.id)}" aria-label="Remover ${e(item.titulo||'imóvel')} da comparação">${C.icon('x')}</button></article>`).join('');
      overlay.querySelector('.ln-compare-drawer__link').hidden=items.length<2;
      if(items.length===1)list.insertAdjacentHTML('beforeend','<p class="ln-compare-drawer__hint">Selecione mais um imóvel para comparar.</p>');
    }
    overlay.hidden=false;document.documentElement.classList.add('ln-compare-open');overlay.querySelector('[data-action=compare-close]').focus();refresh();
    return result;
  }
  async function share(item) { const href=new URL(C.url(L.Config.urls.imovel,{id:item.id}),location.origin).href; if(navigator.share) return navigator.share({title:item.titulo||"Imóvel",url:href}); if(navigator.clipboard) return navigator.clipboard.writeText(href); }
  L.Utils = Object.freeze({ value, options, filtrar, ordenar, paginas, comparisons, setComparisons, toggleComparison, coords, media, card, share, openComparisonDrawer, compareKey });
})(window);
