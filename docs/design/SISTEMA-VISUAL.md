# Sistema visual do portal público

## Princípios e personalização

A interface usa CSS nativo, fonte do sistema e componentes DOM sem dependências externas. A identidade é clara, sóbria e configurável. Cores, tipografia, espaços, raios, bordas, sombras, largura máxima, transições, foco e referências de breakpoint ficam em `public/assets/css/tokens.css`. Para personalizar, altere principalmente `--cor-marca`, `--cor-marca-forte`, `--cor-destaque` e `--fonte`. O símbolo textual `PL` e o nome do portal ficam no link `.marca` dos HTMLs; podem ser substituídos por SVG local com texto alternativo, sem recurso remoto.

## Organização do CSS

- `tokens.css`: variáveis primitivas e semânticas.
- `base.css`: normalização, tipografia, foco, skip link e movimento reduzido.
- `layout.css`: container, cabeçalho, navegação, rodapé e colunas.
- `components.css`: botões, filtros, chips, cards, estados, galeria, contato e tabela.
- `responsive.css`: adaptações progressivas.
- `pages/`: composição exclusiva de início, resultados, imóvel, anunciante, favoritos e comparação.
- `site.css`: único ponto de entrada e importador das camadas compartilhadas.

## Componentes

O cabeçalho é sticky e possui navegação completa, indicação da página atual e menu móvel com `aria-expanded`, foco inicial e fechamento por Escape. O rodapé contém apenas links internos e não inventa contatos. O motor existente produz filtros completos ou compactos. A listagem é o único renderizador de cards: grade com três, duas ou uma coluna e lista horizontal 35/65, convertida em vertical no celular. Métricas são escolhidas pela categoria e valores ausentes não aparecem.

Ações de favorito e comparação usam módulos independentes com `localStorage`; comparação limita quatro itens. Compartilhamento usa a API nativa ou copia a URL. URLs externas passam por validação de protocolo. Dados dinâmicos são inseridos com `textContent`/nós DOM, nunca com HTML interpretado.

## Páginas e navegação

- `index.html`: hero, filtro, categorias, destaques quando existentes, regiões, recentes quando existentes, anunciantes quando existentes e chamada ao cliente.
- `resultados.html`: breadcrumb, título natural, filtro compacto sticky, chips, ordenação, grade/lista e estados.
- `imovel.html`: retorno à pesquisa, galeria, resumo, métricas, descrição, comodidades, mídias opcionais, mapa, calculadora, contato sticky, similares e anterior/próximo.
- `clientes.html` e `cliente.html`: diretório e perfil público, contatos permitidos e catálogo filtrável.
- `favoritos.html`: catálogo local, reconciliação de removidos e limpeza.
- `comparacao.html`: tabela acessível com rolagem horizontal e até quatro colunas.
- `404.html`: estado seguro de endereço inexistente.

As URLs são arquivos estáticos e query parameters canônicos; isso funciona no GitHub Pages sem roteador de servidor e permanece portável. O retorno de uma pesquisa é validado contra a mesma origem.

## Breakpoints e responsividade

A base atende telas largas. Em até 1024 px, cards passam para duas colunas e o filtro para duas. Em até 768 px, abre-se a navegação móvel e a lateral sticky é desativada. Em até 600 px, cards ficam verticais, o alternador lista é ocultado, filtro e rodapé usam uma coluna e a barra de contato aparece somente com canal disponível. As referências 375, 768, 1024 e 1440 px devem ser exercitadas no navegador antes da publicação.

## Estados e acessibilidade

Skeletons reservam espaço durante carga. Mensagens explícitas cobrem rede, JSON inválido, resultado vazio, imagem ausente, imóvel removido, anunciante e módulos opcionais indisponíveis, formulário inválido e 404. Todos os documentos têm idioma, viewport, skip link, cabeçalho, navegação, `main` e rodapé. Formulários têm labels; mensagens usam status/`aria-live`; ações informam estado pressionado; foco é contrastante; Escape fecha o menu; `prefers-reduced-motion` elimina movimento não essencial.
