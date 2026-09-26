/** Configuração declarativa da vertical. Os componentes globais não conhecem imóveis. */
export const SITE_CONFIG={
  nome:"Londrinense",vertical:"Imóveis",accent:"imoveis",
  descricao:"O encontro de Londrina e região com as melhores oportunidades locais.",
  navegacao:[
    {label:"Início",href:"index.html"},{label:"Comprar",href:"resultados.html?finalidade=comprar"},
    {label:"Alugar",href:"resultados.html?finalidade=alugar"},{label:"Imobiliárias",href:"clientes.html"}
  ],
  acoes:[{label:"Favoritos",href:"favoritos.html",icon:"heart"},{label:"Comparar",href:"comparacao.html",icon:"compare"}],
  rodape:{
    principais:[{label:"Portal Londrinense",href:"https://londrinense.com.br/"},{label:"Contato",href:"contato.html"}],
    vertical:[{label:"Comprar",href:"resultados.html?finalidade=comprar"},{label:"Alugar",href:"resultados.html?finalidade=alugar"},{label:"Anunciantes",href:"clientes.html"}],
    legais:[{label:"Privacidade",href:"privacidade.html"},{label:"Termos de uso",href:"termos.html"},{label:"Acesso do cliente",href:"acesso.html"}]
  }
};
