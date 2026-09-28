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
  function card(item) {
    const e=C.escapeHtml, id=e(item.id), href=C.url(L.Config.urls.imovel,{id:item.id}), icon=C.icon;
    const location=[item.bairro,item.cidade].filter(Boolean).join(', ');
    const facts=[['bed',item.quartos,'quartos'],['bath',item.banheiros,'banheiros'],['car',item.vagas,'vagas'],['ruler',item.area,'m²']]
      .filter(([,value])=>value).map(([name,value,label])=>`<li title="${e(label)}" aria-label="${e(value)} ${e(label)}">${icon(name)}<b>${e(value)}${name==='ruler'?' m²':''}</b></li>`).join('');
    return `<article class="ln-card" data-id="${id}"><div class="ln-card__media-wrap"><a class="ln-card__media" href="${e(href)}" aria-label="Ver ${e(item.titulo||'imóvel')}">${media(item)?`<img loading="lazy" src="${e(media(item))}" alt="${e(item.titulo||'Imóvel')}" onerror="this.hidden=true">`:''}</a><div class="ln-card__badges">${item.finalidade?`<span>${e(item.finalidade)}</span>`:''}${item.tipo?`<span>${e(item.tipo)}</span>`:''}</div><button class="ln-icon-btn ln-card__favorite${L.Favoritos.contem(item.id)?' is-active':''}" type="button" data-action="favorite" data-id="${id}" aria-label="Alternar favorito" title="Favoritar">${icon('heart')}</button>${item.preco?`<strong class="ln-card__price">${e(C.brl(item.preco))}</strong>`:''}</div><div class="ln-card__body"><div class="ln-card__content">${item.tipo?`<span class="ln-card__type">${e(item.tipo)}</span>`:''}<h3><a href="${e(href)}">${e(item.titulo||'Imóvel')}</a></h3>${location?`<p class="ln-card__location">${icon('pin')}<span>${e(location)}</span></p>`:''}${facts?`<ul class="ln-facts">${facts}</ul>`:''}</div><div class="ln-card__side"><div class="ln-card__actions"><button class="ln-icon-btn" type="button" data-action="compare" data-id="${id}" aria-label="Adicionar à comparação" title="Comparar">${icon('scale')}</button><button class="ln-icon-btn" type="button" data-action="share" data-id="${id}" aria-label="Compartilhar imóvel" title="Compartilhar">${icon('share')}</button></div></div></div></article>`;
  }
  async function share(item) { const href=new URL(C.url(L.Config.urls.imovel,{id:item.id}),location.origin).href; if(navigator.share) return navigator.share({title:item.titulo||"Imóvel",url:href}); if(navigator.clipboard) return navigator.clipboard.writeText(href); }
  L.Utils = Object.freeze({ value, options, filtrar, ordenar, paginas, comparisons, setComparisons, toggleComparison, coords, media, card, share, compareKey });
})(window);
