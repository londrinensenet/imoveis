# Motor multilógica de filtros e listagens

## Multilógica e categorias

`filtros.js` é o controlador único dos modos `full`, `compact`, `drawer` e `summary`. A ordem principal é Finalidade, Categoria, Faixa de preço, Mais filtros e Pesquisar. “Todas” limita a gaveta a Cidade, Região e Bairro; categorias habilitam apenas definições aplicáveis com dados positivos no estoque. Terreno nunca recebe dormitórios. A cascata Cidade → Região → Bairro limpa descendentes incompatíveis antes de recalcular opções, contagens, preço, resultado, sugestões e URL.

## Procedência

`filtros/definicoes.js` é o registro auditável: cada filtro declara ID, label, categoria, caminho VRSync, modo (`native`, `normalized` ou `derived`), transformação, unidade e disponibilidade. `Description` não é fonte de filtros. Features passam por allowlist oficial; valores desconhecidos não são indexados.

## Unidades e preço

Comparações de área usam m². Rural aceita m² ou ha (1 ha = 10.000 m²), apresenta ha a partir de 10.000 m² e rejeita alqueire. Venda usa `ListPrice`; aluguel usa `RentalPrice`. Limites numéricos são acessíveis e a escala deve refletir somente valores válidos do recorte atual.

## URL, histórico e sugestões

O estado canônico fica nos parâmetros da URL; Londrina, por ser padrão, é omitida. Alterações intermediárias usam `replaceState`, pesquisas confirmadas usam `pushState`, e `popstate` permite recompor a navegação. Resultado zero oferece, deterministicamente, ampliação de preço, remoção do filtro mais restritivo e ampliação geográfica.

## Responsividade, grade e lista

`listagem.js` é o único renderizador de cards e das visualizações. Desktop oferece grade de três colunas ou lista horizontal, tablet duas colunas e celular uma coluna vertical. A preferência é persistida em `localStorage`. O módulo cria nós DOM, não injeta dados com `innerHTML`, omite métricas vazias/incompatíveis e integra favorito, comparação e compartilhamento.
