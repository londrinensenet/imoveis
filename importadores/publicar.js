export function ordenarPorPreco(imoveis){return [...imoveis].sort((a,b)=>a.preco-b.preco||String(a.id).localeCompare(String(b.id)))}
export function criarManifesto(lotes,versao){return {versao,lotes:lotes.map(l=>({arquivo:l.arquivo,preco_minimo:l.imoveis[0]?.preco??null,preco_maximo:l.imoveis.at(-1)?.preco??null,quantidade:l.imoveis.length}))}}
