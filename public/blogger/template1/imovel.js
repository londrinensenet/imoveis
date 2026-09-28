(function(window){
  "use strict";
  const L=window.Londrinense,C=L.Common,U=L.Utils,root=document.getElementById("ln-imovel");
  if(!root)return;
  const e=C.escapeHtml,icon=C.icon;
  function fact(name,label,value,suffix){return value?`<li>${icon(name)}<span>${e(label)}</span><strong>${e(value)}${suffix||""}</strong></li>`:""}
  function contact(item){
    const info=item.contact_info||{},phone=info.whatsapp||info.telefone||info.phone;
    if(!phone)return"";
    const digits=String(phone).replace(/\D/g,"");
    if(!/^\d{10,15}$/.test(digits))return"";
    return `<a class="ln-btn ln-btn--primary ln-contact__cta" href="https://wa.me/${digits}" rel="noopener" target="_blank">${icon("phone")} WhatsApp / contato</a>`;
  }
  async function init(){
    const id=new URLSearchParams(location.search).get("id");
    if(!C.validId(id)){root.innerHTML='<div class="ln-state ln-state--error">Imóvel inválido ou não informado.</div>';return}
    root.innerHTML='<div class="ln-loading">Carregando imóvel…</div>';
    try{
      const item=await L.Dados.getImovel(id),photos=Array.isArray(item.fotos)?item.fotos.filter(Boolean):[],features=Array.isArray(item.features)?item.features:[],location=[item.bairro,item.cidade,item.uf].filter(Boolean).join(", ");
      root.innerHTML=`<div id="ln-portal"><div class="ln-container ln-detail"><nav class="ln-breadcrumb" aria-label="Navegação estrutural"><a href="${e(L.Config.urls.listagem)}">Imóveis</a>${icon("chevronRight")}<span>${e(item.titulo)}</span></nav><header class="ln-detail-head"><div><div class="ln-detail-head__badges">${item.finalidade?`<span>${e(item.finalidade)}</span>`:""}${item.tipo?`<span>${e(item.tipo)}</span>`:""}</div><h1>${e(item.titulo)}</h1>${location?`<p>${icon("pin")} ${e(location)}</p>`:""}</div><div class="ln-detail-head__price"><strong>${e(C.brl(item.preco))}</strong><small>Código ${e(item.codigo||item.id)}</small></div></header><section class="ln-gallery">${photos.length?photos.slice(0,5).map((photo,index)=>`<button type="button" data-photo="${index}" aria-label="Abrir foto ${index+1}"><img loading="${index?"lazy":"eager"}" src="${e(photo)}" alt="${e(item.titulo)} — foto ${index+1}">${index===4&&photos.length>5?`<span>${icon("maximize")} +${photos.length-5} fotos</span>`:""}</button>`).join(""):`<div class="ln-photo-empty">${icon("house")} Sem fotos</div>`}</section><ul class="ln-facts ln-facts--detail">${fact("bed","Quartos",item.quartos)}${fact("house","Suítes",item.suites)}${fact("bath","Banheiros",item.banheiros)}${fact("car","Vagas",item.vagas)}${fact("ruler","Área",item.area," m²")}${fact("ruler","Terreno",item.area_terreno," m²")}</ul><div class="ln-detail__grid"><main class="ln-detail__main"><section class="ln-detail-section"><h2>Descrição</h2><p class="ln-description">${e(item.descricao||"Descrição não informada.")}</p></section>${features.length?`<section class="ln-detail-section"><h2>Características e comodidades</h2><ul class="ln-features">${features.map(value=>`<li>${icon("check")}${e(value)}</li>`).join("")}</ul></section>`:""}<section class="ln-detail-section"><h2>Localização</h2><div data-detail-map></div></section><section class="ln-detail-section"><h2>Imóveis similares</h2><div class="ln-cards" data-similar></div></section></main><aside class="ln-contact"><span class="ln-contact__eyebrow">Interessado neste imóvel?</span><h2>Fale com o anunciante</h2><p>Solicite informações usando os dados públicos disponíveis.</p>${contact(item)}<div class="ln-contact__actions"><button data-action="favorite" class="ln-btn ln-btn--secondary">${icon("heart")} Favoritar</button><button data-action="share" class="ln-btn ln-btn--secondary">${icon("share")} Compartilhar</button><button data-action="compare" class="ln-btn ln-btn--secondary">${icon("scale")} Comparar</button></div></aside></div></div></div>`;
      root.addEventListener("click",event=>{const action=event.target.closest("[data-action]")?.dataset.action;if(action==="favorite")L.Favoritos.alternar(item.id);if(action==="compare")U.toggleComparison(item.id);if(action==="share")U.share(item)});
      const mapHost=root.querySelector("[data-detail-map]");
      if(U.coords(item)&&L.Mapa)L.Mapa.render(mapHost,[item]);else mapHost.innerHTML='<p class="ln-muted">Coordenadas não disponíveis.</p>';
      const all=await L.Dados.getTodos(),similar=all.filter(value=>value.id!==item.id&&C.normalize(value.tipo)===C.normalize(item.tipo)&&C.normalize(value.finalidade)===C.normalize(item.finalidade)&&C.normalize(value.cidade)===C.normalize(item.cidade)).slice(0,4);
      root.querySelector("[data-similar]").innerHTML=similar.length?similar.map(U.card).join(""):'<p class="ln-muted">Nenhum imóvel similar disponível.</p>';
    }catch(error){root.innerHTML=`<div class="ln-state ln-state--error">${e(error.message)}</div>`}
  }
  init();
})(window);
