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
  const iconPaths = Object.freeze({
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', sliders:'<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6"/>', pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>', bed:'<path d="M2 20v-8m20 8v-8M4 12V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6m0-4h6a4 4 0 0 1 4 4v3H2v-3a4 4 0 0 1 4-4h6"/>', bath:'<path d="M4 12h16a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-1a1 1 0 0 1 1-1Zm2 7-1 2m13-2 1 2M7 12V5a2 2 0 0 1 4 0"/>', car:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17h14M7 17v2m10-2v2M6 12h12"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/>', ruler:'<path d="m16 2 6 6L8 22l-6-6Z"/><path d="m14 4 2 2m-5 1 2 2m-5 1 2 2m-5 1 2 2"/>', heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>', share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>', scale:'<path d="m16 16 3-8 3 8a5 5 0 0 1-6 0ZM2 16l3-8 3 8a5 5 0 0 1-6 0Zm5 5h10M12 3v18M3 7h18"/>', grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>', rows:'<rect width="18" height="6" x="3" y="4" rx="1"/><rect width="18" height="6" x="3" y="14" rx="1"/>', panels:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18m0-12h12"/>', map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15"/>', house:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>', building:'<path d="M3 21h18M6 21V4h12v17M9 8h2m2 0h2m-6 4h2m2 0h2m-6 4h2m2 0h2"/>', chevronDown:'<path d="m6 9 6 6 6-6"/>', chevronLeft:'<path d="m15 18-6-6 6-6"/>', chevronRight:'<path d="m9 18 6-6-6-6"/>', sort:'<path d="m3 8 4-4 4 4M7 4v16m14-4-4 4-4-4m4 4V4"/>', maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>', check:'<path d="m20 6-11 11-5-5"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>'
  });
  function icon(name, label) {
    const path = iconPaths[name] || iconPaths.house;
    return `<svg class="ln-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${label ? ` role="img" aria-label="${escapeHtml(label)}"` : ' aria-hidden="true"'}>${path}</svg>`;
  }
  function debounce(fn, wait) { let timer; return function () { const args = arguments, that = this; clearTimeout(timer); timer = setTimeout(() => fn.apply(that, args), wait || 250); }; }
  function moduleName() { return ["listagem", "imovel", "anunciante", "comparar"].find(name => document.getElementById("ln-" + name)) || ""; }
  root.Config = Object.freeze(config);
  root.Common = Object.freeze({ allowedParams, params, url, brl, normalize, debounce, escapeHtml, validId, moduleName, icon, iconPaths });
})(window);
