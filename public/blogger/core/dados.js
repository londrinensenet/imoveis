(function (window) {
  "use strict";
  const L = window.Londrinense;
  if (!L || !L.Common) throw new Error("Londrinense.Common deve ser carregado primeiro");
  const requests = new Map();
  function request(relative) {
    const target = new URL(String(relative).replace(/^\/+/, ""), L.Config.dataBase).href;
    if (!requests.has(target)) requests.set(target, fetch(target, { headers: { Accept: "application/json" } }).then(response => {
      if (!response.ok) throw new Error("Falha HTTP " + response.status + " ao carregar dados públicos");
      return response.json();
    }).catch(error => { requests.delete(target); throw error; }));
    return requests.get(target);
  }
  function getManifesto() { return request("indices/manifesto.json"); }
  function getClientes() { return request("clientes/clientes.json"); }
  async function getIndice(chave) {
    const key = String(chave || "").replace(/^\/+|\/+$/g, "");
    if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)?$/i.test(key)) throw new Error("Chave de índice inválida");
    const manifesto = await getManifesto(), entry = manifesto[key];
    if (!entry || !Array.isArray(entry.partes)) throw new Error("Índice público não encontrado: " + key);
    const parts = await Promise.all(entry.partes.map(request));
    return parts.reduce((all, part) => all.concat(Array.isArray(part) ? part : []), []);
  }
  function getImovel(id) {
    if (!L.Common.validId(id)) return Promise.reject(new Error("ID de imóvel inválido"));
    return request("imoveis/" + encodeURIComponent(id) + ".json");
  }
  L.Dados = Object.freeze({ getManifesto, getClientes, getIndice, getImovel, getTodos: () => getIndice("todos"), _request: request });
})(window);
