export const contar=(itens,campo,predicado=()=>true)=>itens.reduce((r,x)=>{if(predicado(x)){const v=campo.split(".").reduce((a,k)=>a?.[k],x);if(v)r[v]=(r[v]||0)+1}return r},{});
