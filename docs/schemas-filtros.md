# Campos públicos para filtros

Os schemas `card.schema.json` e `imovel.schema.json` expõem somente atributos públicos tipados. `preco_venda` deriva de `ListPrice`, `preco_aluguel` de `RentalPrice`, áreas permanecem em m², contagens são inteiros e `subtipo` deriva de `Details/PropertyType`. `features` contém apenas a allowlist oficial normalizada. O campo descritivo é exibível no detalhe, mas nunca indexável como filtro.
