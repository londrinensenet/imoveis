const SVG_NS="http://www.w3.org/2000/svg";

const ICONS={
  menu:[['path',{d:'M4 6h16M4 12h16M4 18h16'}]],
  close:[['path',{d:'m6 6 12 12M18 6 6 18'}]],
  heart:[['path',{d:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z'}]],
  compare:[['path',{d:'M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4m4 4H4'}]],
  search:[['circle',{cx:'11',cy:'11',r:'7'}],['path',{d:'m20 20-4-4'}]],
  map:[['path',{d:'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z'}],['circle',{cx:'12',cy:'10',r:'2'}]],
  bed:[['path',{d:'M3 5v14M21 19v-8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8M3 15h18M6 9V7h5v2'}]],
  bath:[['path',{d:'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V5a2 2 0 0 1 4 0'}]],
  car:[['path',{d:'m5 17-1 2M19 17l1 2M3 13l2-6h14l2 6v4H3v-4Z'}],['circle',{cx:'7',cy:'14',r:'1'}],['circle',{cx:'17',cy:'14',r:'1'}]],
  area:[['path',{d:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'}]],
  share:[['circle',{cx:'18',cy:'5',r:'2'}],['circle',{cx:'6',cy:'12',r:'2'}],['circle',{cx:'18',cy:'19',r:'2'}],['path',{d:'m8 11 8-5M8 13l8 5'}]],
  phone:[['path',{d:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z'}]],
  filter:[['path',{d:'M4 5h16M7 12h10M10 19h4'}]],
  grid:[['rect',{x:'3',y:'3',width:'7',height:'7'}],['rect',{x:'14',y:'3',width:'7',height:'7'}],['rect',{x:'3',y:'14',width:'7',height:'7'}],['rect',{x:'14',y:'14',width:'7',height:'7'}]],
  list:[['path',{d:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'}]]
};

function criarElementoSvg(tag){
  if(typeof document.createElementNS==='function') return document.createElementNS(SVG_NS,tag);
  return document.createElement(tag);
}

function anexar(parent,child,prepend=false){
  if(prepend&&typeof parent.prepend==='function') parent.prepend(child);
  else if(typeof parent.append==='function') parent.append(child);
  else parent.appendChild(child);
}

export function icone(name,label=""){
  const span=document.createElement("span");
  span.className="icone";
  span.setAttribute("aria-hidden",label?"false":"true");
  if(label) span.setAttribute("aria-label",label);

  const svg=criarElementoSvg("svg");
  const attrs={viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round',focusable:'false'};
  Object.entries(attrs).forEach(([key,value])=>svg.setAttribute(key,value));

  for(const [tag,childAttrs] of ICONS[name]||ICONS.search){
    const child=criarElementoSvg(tag);
    Object.entries(childAttrs).forEach(([key,value])=>child.setAttribute(key,value));
    anexar(svg,child);
  }
  anexar(span,svg);
  return span;
}

export function adicionarIcone(node,name,label=""){
  anexar(node,icone(name,label),true);
}

export function aplicarIcones(root=document){
  root.querySelectorAll("[data-icon]").forEach(node=>adicionarIcone(node,node.dataset.icon));
}
