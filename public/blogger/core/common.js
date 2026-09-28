(function (window) {
  "use strict";
  const root = window.Londrinense = window.Londrinense || {};
  const supplied = window.LONDRINENSE_BLOGGER_CONFIG || {};
  const defaults = {
    dataBase: "https://imoveis.londrinense.net/dados/",
    urls: { listagem: "/p/imoveis.html", imovel: "/p/detalhe-imovel.html", anunciante: "/p/anunciante.html", favoritos: "/p/favoritos.html", comparar: "/p/comparar.html" },
    perPage: 12,
    mapConcurrency: 4
  };
  const config = Object.assign({}, defaults, supplied, { urls: Object.assign({}, defaults.urls, supplied.urls || {}) });
  config.dataBase = String(config.dataBase).replace(/\/*$/, "/");
  const allowedParams = ["finalidade", "tipo", "cidade", "bairro", "preco_min", "preco_max", "quartos", "banheiros", "vagas", "area_min", "area_max", "ordem", "pagina", "view"];
  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const validId = value => /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(String(value || ""));
  function params(search) {
    const output = {}, query = new URLSearchParams(search == null ? window.location.search : search);
    allowedParams.forEach(key => { if (query.has(key) && query.get(key) !== "") output[key] = query.get(key); });
    return output;
  }
  function url(path, values, preserve) {
    const result = new URL(path, window.location.origin);
    const state = preserve ? params(window.location.search) : {};
    Object.assign(state, values || {});
    Object.keys(state).forEach(key => { const value = state[key]; if (value == null || value === "" || value === false) result.searchParams.delete(key); else result.searchParams.set(key, value); });
    return result.pathname + result.search + result.hash;
  }
  function brl(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(number) : "Preço sob consulta";
  }
  function debounce(fn, wait) { let timer; return function () { const args = arguments, that = this; clearTimeout(timer); timer = setTimeout(() => fn.apply(that, args), wait || 250); }; }
  function moduleName() { return ["listagem", "imovel", "anunciante", "comparar"].find(name => document.getElementById("ln-" + name)) || ""; }
  root.Config = Object.freeze(config);
  root.Common = Object.freeze({ allowedParams, params, url, brl, normalize, debounce, escapeHtml, validId, moduleName });
})(window);
