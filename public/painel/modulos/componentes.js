const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
export {escape};
export function toast(message,type="sucesso"){const node=document.createElement("div");node.className=`toast ${type}`;node.textContent=message;document.querySelector("#toasts").append(node);setTimeout(()=>node.remove(),4500)}
export function loading(){return '<div class="cards"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>'}
export function empty(title,text,action=""){return `<div class="empty"><h2>${escape(title)}</h2><p class="muted">${escape(text)}</p>${action}</div>`}
export function confirmAction(title,text){const dialog=document.querySelector("#confirm");document.querySelector("#confirm-title").textContent=title;document.querySelector("#confirm-text").textContent=text;dialog.showModal();return new Promise(resolve=>dialog.addEventListener("close",()=>resolve(dialog.returnValue==="confirm"),{once:true}))}
export function errorPage(code,message,retry=true){return `<section class="empty"><p class="eyebrow">Erro ${code}</p><h1>${escape(message)}</h1><p>Verifique sua conexão e tente novamente.</p>${retry?'<button onclick="location.reload()">Tentar novamente</button>':""}</section>`}
