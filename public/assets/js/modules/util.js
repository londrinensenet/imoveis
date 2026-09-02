export const el=(tag,attrs={},text="")=>{const node=document.createElement(tag);for(const[key,value]of Object.entries(attrs)){if(key==="class")node.className=value;else if(key.startsWith("on"))node.addEventListener(key.slice(2),value);else node.setAttribute(key,String(value))}if(text!=="")node.textContent=String(text);return node};
export const https=value=>{try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password?url:null}catch{return null}};
export const storage=(key)=>({read(){try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]}catch{return[]}},write(value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}});
export const mount=(root,node)=>{if(!root)return false;root.replaceChildren(node);root.hidden=false;return true};
export const hide=root=>{if(root){root.replaceChildren();root.hidden=true}return false};
export const section=title=>{const node=el("section",{class:"modulo-imovel"});node.append(el("h2",{},title));return node};
