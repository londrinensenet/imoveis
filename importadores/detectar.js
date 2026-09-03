const fornecedores=['vrsync','kenlo','ingaia','imobex','custom'];
export function detectar(documento){const texto=String(documento||'').toLowerCase();return fornecedores.find(nome=>texto.includes(nome))||'custom'}
