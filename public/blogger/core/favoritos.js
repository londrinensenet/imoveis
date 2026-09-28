(function (window) {
  "use strict";
  const L = window.Londrinense, key = "londrinense.imoveis.favoritos.v1";
  function listar() { try { const list = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(list) ? [...new Set(list.filter(L.Common.validId))] : []; } catch (_) { return []; } }
  function save(list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {} return list; }
  function adicionar(id) { if (!L.Common.validId(id)) return listar(); const list = listar(); if (!list.includes(id)) list.push(id); return save(list); }
  function remover(id) { return save(listar().filter(item => item !== id)); }
  function alternar(id) { const active = listar().includes(id); return { ativo: !active, itens: active ? remover(id) : adicionar(id) }; }
  L.Favoritos = Object.freeze({ listar, contem: id => listar().includes(id), adicionar, remover, alternar, limpar: () => save([]), chave: key });
})(window);
