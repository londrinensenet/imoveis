(function (window) {
  "use strict";
  const L = window.Londrinense, C = L.Common, compareKey = "londrinense.imoveis.comparacao.v1";
  const value = number => Number.isFinite(Number(number)) ? Number(number) : 0;
  function options(records, field) { return [...new Set(records.map(item => item[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "pt-BR")); }
  function filtrar(records, state) {
    return records.filter(item => {
      for (const field of ["finalidade", "tipo", "cidade", "bairro"]) if (state[field] && C.normalize(item[field]) !== C.normalize(state[field])) return false;
      for (const field of ["quartos", "banheiros", "vagas"]) if (state[field] && value(item[field]) < value(state[field])) return false;
      if (state.preco_min && value(item.preco) < value(state.preco_min)) return false;
      if (state.preco_max && value(item.preco) > value(state.preco_max)) return false;
      if (state.area_min && value(item.area) < value(state.area_min)) return false;
      if (state.area_max && value(item.area) > value(state.area_max)) return false;
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
  function card(item) { const e=C.escapeHtml, id=e(item.id), href=C.url(L.Config.urls.imovel,{id:item.id}); return `<article class="ln-card" data-id="${id}"><a class="ln-card__media" href="${e(href)}"><img loading="lazy" src="${e(media(item))}" alt="${e(item.titulo||'Imóvel')}" onerror="this.hidden=true"></a><div class="ln-card__body"><div class="ln-card__badges"><span>${e(item.finalidade||'')}</span><span>${e(item.tipo||'')}</span></div><h3>${e(item.titulo||'Imóvel')}</h3><p><i class="ri-map-pin-2-line" aria-hidden="true"></i> ${e([item.bairro,item.cidade].filter(Boolean).join(', '))}</p><strong>${e(C.brl(item.preco))}</strong><ul class="ln-facts">${item.quartos?`<li><i class="ri-hotel-bed-line"></i> ${e(item.quartos)}</li>`:''}${item.banheiros?`<li><i class="ri-drop-line"></i> ${e(item.banheiros)}</li>`:''}${item.vagas?`<li><i class="ri-car-line"></i> ${e(item.vagas)}</li>`:''}${item.area?`<li><i class="ri-ruler-2-line"></i> ${e(item.area)} m²</li>`:''}</ul><div class="ln-card__actions"><button type="button" data-action="favorite" data-id="${id}" aria-label="Alternar favorito" title="Favorito"><i class="ri-heart-3-line"></i></button><button type="button" data-action="compare" data-id="${id}" aria-label="Adicionar à comparação" title="Comparar"><i class="ri-list-check-2"></i></button><button type="button" data-action="share" data-id="${id}" aria-label="Compartilhar imóvel" title="Compartilhar"><i class="ri-share-line"></i></button><a class="ln-button" href="${e(href)}">Ver imóvel</a></div></div></article>`; }
  async function share(item) { const href=new URL(C.url(L.Config.urls.imovel,{id:item.id}),location.origin).href; if(navigator.share) return navigator.share({title:item.titulo||"Imóvel",url:href}); if(navigator.clipboard) return navigator.clipboard.writeText(href); }
  L.Utils = Object.freeze({ value, options, filtrar, ordenar, paginas, comparisons, setComparisons, toggleComparison, coords, media, card, share, compareKey });
})(window);
