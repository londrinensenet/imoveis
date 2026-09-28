(function (window) {
  "use strict";
  const L = window.Londrinense, U = L.Utils, C = L.Common;
  let loader;
  const instances = new WeakMap(), generations = new WeakMap();

  function leaflet() {
    if (window.L && typeof window.L.map === "function") return Promise.resolve(window.L);
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.integrity = "sha256-p4NxAoJBhIINfQ3ynh3WrzNfMZrKQ+LSfFmxMZRoZDE=";
      css.crossOrigin = "";
      css.onerror = () => {
        css.remove();
        const fallbackCss = document.createElement("link");
        fallbackCss.rel = "stylesheet";
        fallbackCss.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
        fallbackCss.integrity = css.integrity;
        fallbackCss.crossOrigin = "";
        document.head.appendChild(fallbackCss);
      };
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => window.L && typeof window.L.map === "function" ? resolve(window.L) : reject(new Error("Biblioteca do mapa indisponível."));
      script.onerror = () => {
        script.remove();
        const fallback = document.createElement("script");
        fallback.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
        fallback.integrity = script.integrity;
        fallback.crossOrigin = "";
        fallback.onload = () => window.L && typeof window.L.map === "function" ? resolve(window.L) : reject(new Error("Biblioteca do mapa indisponível."));
        fallback.onerror = () => reject(new Error("Não foi possível carregar o mapa."));
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
    return loader.catch(error => { loader = null; throw error; });
  }

  async function pool(items, worker, limit) {
    const result = new Array(items.length), queue = items.map((item, index) => ({item, index}));
    await Promise.all(Array.from({length: Math.min(limit, items.length)}, async () => {
      let entry;
      while ((entry = queue.shift())) try { result[entry.index] = await worker(entry.item); } catch (_) { result[entry.index] = null; }
    }));
    return result;
  }

  function nextFrame() {
    return new Promise(resolve => (window.requestAnimationFrame || (callback => setTimeout(callback, 0)))(resolve));
  }

  function destroy(root) {
    generations.set(root, (generations.get(root) || 0) + 1);
    const map = instances.get(root);
    if (map) {
      map.remove();
      instances.delete(root);
    }
    if (root.classList) root.classList.remove("ln-map-host");
  }

  async function render(root, records) {
    destroy(root);
    const generation = generations.get(root);
    if (root.classList) root.classList.add("ln-map-host");
    root.innerHTML = '<div class="ln-loading">Carregando mapa...</div>';
    try {
      const detailed = await pool(records, item => U.coords(item) ? Promise.resolve(item) : L.Dados.getImovel(item.id), Math.max(1, L.Config.mapConcurrency || 4));
      if (generations.get(root) !== generation) return;
      const valid = detailed.filter(item => U.coords(item));
      if (!valid.length) {
        root.innerHTML = `<div class="ln-empty">${C.icon("pin")}<h3>Localização indisponível</h3><p>Não há imóveis com localização disponível para exibir no mapa.</p></div>`;
        return;
      }
      const Leaflet = await leaflet();
      if (generations.get(root) !== generation) return;
      root.innerHTML = '<div class="ln-map-shell"><div class="ln-map" role="region" aria-label="Mapa dos imóveis"></div></div>';
      await nextFrame();
      if (generations.get(root) !== generation) return;
      const mapElement = root.firstElementChild.firstElementChild;
      const map = Leaflet.map(mapElement);
      instances.set(root, map);
      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {attribution: "&copy; OpenStreetMap contributors", maxZoom: 19}).addTo(map);
      const points = [];
      const compactPrice = value => { const n = Number(value); return !Number.isFinite(n) || n <= 0 ? "Imóvel" : n >= 1000000 ? `R$ ${(n/1000000).toLocaleString("pt-BR",{maximumFractionDigits:1})} mi` : n >= 1000 ? `R$ ${Math.round(n/1000)} mil` : C.brl(n); };
      valid.forEach(item => {
        const point = U.coords(item), e = C.escapeHtml;
        points.push(point);
        const price = e(compactPrice(item.preco));
        const markerIcon = Leaflet.divIcon({className:"ln-map-price",html:`<span>${price}</span>`,iconSize:[96,36],iconAnchor:[48,18],popupAnchor:[0,-20]});
        const marker = Leaflet.marker(point,{icon:markerIcon}).addTo(map).bindPopup(`<div class="ln-popup">${U.media(item) ? `<img src="${e(U.media(item))}" alt="">` : ""}${item.tipo?`<small>${e(item.tipo)}</small>`:""}<strong>${e(item.titulo)}</strong><span>${e(C.brl(item.preco))}</span>${item.bairro?`<small>${e(item.bairro)}</small>`:""}<a href="${e(C.url(L.Config.urls.imovel, {id:item.id}))}">Ver imóvel</a></div>`);
        if (typeof marker.on === "function") marker.on("popupopen", () => { if (marker.getElement) marker.getElement()?.classList.add("is-selected"); }).on("popupclose", () => { if (marker.getElement) marker.getElement()?.classList.remove("is-selected"); });
      });
      const resize = () => {
        if (instances.get(root) !== map) return;
        map.invalidateSize(true);
        if (points.length === 1) map.setView(points[0], 15);
        else {
          const bounds = Leaflet.latLngBounds(points);
          if (bounds.isValid()) map.fitBounds(bounds, {padding: [30, 30], maxZoom: 16});
        }
      };
      await nextFrame();
      resize();
      setTimeout(resize, 100);
    } catch (error) {
      if (generations.get(root) === generation) root.innerHTML = `<div class="ln-state ln-state--error">${C.escapeHtml(error.message)}</div>`;
    }
  }

  L.Mapa = Object.freeze({render, destroy, _pool: pool});
})(window);
