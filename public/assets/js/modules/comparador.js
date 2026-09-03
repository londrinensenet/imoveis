const CHAVE="imoveis:comparacao",MAXIMO=4;
const ler=()=>{try{const value=JSON.parse(localStorage.getItem(CHAVE)||"[]");return Array.isArray(value)?value.filter(x=>typeof x==="string").slice(0,MAXIMO):[]}catch{return[]}};
const salvar=ids=>{localStorage.setItem(CHAVE,JSON.stringify(ids));window.dispatchEvent(new CustomEvent("comparacao:alterada",{detail:{total:ids.length}}))};
export const comparador={maximo:MAXIMO,listar:ler,tem:id=>ler().includes(id),alternar(id){const ids=ler(),index=ids.indexOf(id);if(index>=0)ids.splice(index,1);else if(ids.length<MAXIMO)ids.push(id);else return false;salvar(ids);return ids.includes(id)},remover(id){salvar(ler().filter(x=>x!==id))},limpar(){salvar([])}};
