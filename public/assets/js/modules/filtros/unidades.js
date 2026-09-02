export const areaParaM2=(valor,unidade="m²")=>{if(/alqueire/i.test(unidade))throw new RangeError("Alqueire não é permitido");const n=Number(valor);return Number.isFinite(n)&&n>=0?n*(unidade==="ha"?10000:1):null};
export const areaRuralFormatada=m2=>m2>=10000?`${new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(m2/10000)} ha`:`${new Intl.NumberFormat("pt-BR").format(m2)} m²`;
