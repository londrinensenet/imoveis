export const CATEGORIAS={apartamento:"Apartamentos",casa:"Casas",terreno:"Terrenos",comercial:"Comerciais",rural:"Rurais",galpao:"Galpões"};
export const FEATURES_OFICIAIS=["Academia","Acessibilidade","Ar-condicionado","Churrasqueira","Elevador","Jardim","Mobiliado","Piscina","Playground","Pomar","Portaria","Quintal","Salão de festas","Sauna","Varanda"];
export const DEFINICOES=[
 {id:"cidade",label:"Cidade",categorias:"*",campo:"Location/City",modo:"native",transformacao:"trim",unidade:null,disponibilidade:"valor não vazio"},
 {id:"regiao",label:"Região",categorias:"*",campo:"Location/Zone",modo:"normalized",transformacao:"trim",unidade:null,disponibilidade:"opção no estoque"},
 {id:"bairro",label:"Bairro",categorias:"*",campo:"Location/Neighborhood",modo:"native",transformacao:"trim",unidade:null,disponibilidade:"opção no estoque"},
 {id:"subtipo",label:"Subtipo",categorias:["casa","apartamento","rural","comercial"],campo:"Details/PropertyType",modo:"normalized",transformacao:"trim",unidade:null,disponibilidade:"ao menos uma opção"},
 {id:"areaUtil",label:"Área útil",categorias:["casa","apartamento","comercial","galpao"],campo:"LivingArea",modo:"native",transformacao:"number",unidade:"m²",disponibilidade:"valor positivo"},
 {id:"areaTerreno",label:"Área do terreno",categorias:["casa","terreno"],campo:"LotArea",modo:"native",transformacao:"number",unidade:"m²",disponibilidade:"valor positivo"},
 {id:"areaRural",label:"Área rural",categorias:["rural"],campo:"LotArea",modo:"normalized",transformacao:"m² ou ha para m²",unidade:"m²",disponibilidade:"valor positivo"},
 ...[["quartos","Quartos","Bedrooms",["casa","apartamento","rural"]],["suites","Suítes","Suites",["casa","apartamento"]],["banheiros","Banheiros","Bathrooms",["casa","apartamento","rural","comercial","galpao"]],["vagas","Vagas","Garage",["casa","apartamento","rural","comercial","galpao"]],["andar","Andar","UnitFloor",["apartamento","comercial"]]].map(([id,label,campo,categorias])=>({id,label,categorias,campo,modo:"native",transformacao:"integer",unidade:null,disponibilidade:"valor positivo"})),
 {id:"features",label:"Comodidades",categorias:["casa","apartamento","terreno","rural","comercial","galpao"],campo:"Features/Feature",modo:"native",transformacao:"allowlist oficial",unidade:null,disponibilidade:"opção oficial no estoque"}
];
