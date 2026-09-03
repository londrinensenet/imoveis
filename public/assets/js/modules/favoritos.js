const CHAVE="imoveis:favoritos";
const ler=()=>{try{const value=JSON.parse(localStorage.getItem(CHAVE)||"[]");return new Set(Array.isArray(value)?value.filter(x=>typeof x==="string"):[])}catch{return new Set()}};
const salvar=set=>{localStorage.setItem(CHAVE,JSON.stringify([...set]));window.dispatchEvent(new CustomEvent("favoritos:alterados",{detail:{total:set.size}}))};
export const favoritos={listar:()=>[...ler()],tem:id=>ler().has(id),alternar(id){const set=ler();set.has(id)?set.delete(id):set.add(id);salvar(set);return set.has(id)},remover(id){const set=ler();set.delete(id);salvar(set)},limpar(){salvar(new Set())},reconciliar(idsDisponiveis){const disponiveis=new Set(idsDisponiveis),set=new Set([...ler()].filter(id=>disponiveis.has(id)));salvar(set);return [...set]}};
