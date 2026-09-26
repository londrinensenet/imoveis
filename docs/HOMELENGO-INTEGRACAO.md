# Preparação da integração Homelengo + Londrinense

## 1. Escopo e base da auditoria

Esta preparação parte do SHA base `82f4d432ffdb94812022632a321b29b299673ff7`, na branch `codex/preparacao-integracao-homelengo`. O Homelengo será somente uma referência visual e estrutural; a navegação estática, os dados públicos, os filtros e as regras do Londrinense continuam sendo a fonte funcional.

Esta fase **não altera o frontend em uso**: nenhum HTML ou CSS público foi ligado ao template, nenhum script de produção passou a importar código do Homelengo e nenhum dado, imagem, plugin ou conteúdo fictício foi copiado. Também não abrange backend, painel, importadores, schemas, workflows, sincronização ou read models.

## 2. Auditoria do frontend público atual

### Páginas e composição

| Parte | Arquivos que a controlam hoje | Observações para a integração futura |
|---|---|---|
| Página inicial | `public/index.html`, `public/assets/js/site.js`, `public/assets/css/pages/home.css` | Hero, filtro completo, categorias, destaques, regiões, recentes, anunciantes e CTA. Deve preservar carregamento e estados condicionais. |
| Listagem/busca | `public/resultados.html`, `public/assets/js/resultados.js`, `public/assets/css/pages/resultados.css` | Sidebar sticky no desktop e drawer no tablet/celular; URL é o estado canônico. |
| Detalhe | `public/imovel.html`, `public/assets/js/detalhe.js`, `public/assets/css/pages/imovel.css` | Galeria, dados completos, anunciante, ações, contato móvel e imóveis relacionados são montados com DOM seguro. |
| Anunciantes | `public/clientes.html`, `public/cliente.html`, `public/assets/js/clientes.js`, `public/assets/js/cliente.js`, `public/assets/css/pages/anunciante.css` | Diretório, perfil e listagem filtrada por `cliente_id`. |
| Favoritos | `public/favoritos.html`, `public/assets/js/favoritos-page.js`, `public/assets/js/modules/favoritos.js`, `public/assets/css/pages/favoritos.css` | IDs ficam apenas no `localStorage`; a tela reutiliza o renderizador de listagem. |
| Comparação | `public/comparacao.html`, `public/assets/js/comparacao-page.js`, `public/assets/js/modules/comparador.js`, `public/assets/css/pages/comparacao.css` | Até quatro IDs no `localStorage`; tabela é produzida a partir dos cards públicos. |
| Header/footer | `public/componentes/header.html`, `public/componentes/footer.html`, `public/assets/js/componentes.js`, `public/assets/js/site-config.js` | Fragmentos estáticos carregados por `fetch`; configuração gera links e textos sem duplicá-los em cada página. |
| Navegação responsiva | `public/assets/js/navigation.js`, `public/assets/js/icones.js` | Menu, estado ativo, teclado e ícones próprios devem ser preservados, em vez de substituídos pelo JS do template. |
| CSS público | `public/assets/css/site.css` | Entrada única para `tokens.css`, `base.css`, `layout.css`, `components.css`, `responsive.css` e `paridade.css`; estilos exclusivos ficam em `pages/`. |
| Configuração/locale | `public/assets/js/site-config.js`, `public/assets/js/i18n-pt-br.js` | Configuração institucional permanece separada do novo catálogo central de textos e formatadores pt-BR. |

### Lógica reutilizável e leitura dos read models

- `public/assets/js/common.js` contém acesso seguro a JSON, resolução de URLs, formatação monetária atual e `loadCards()`. Este último lê `public/dados/indices/manifesto.json`, busca as partes declaradas em `public/dados/indices/**/parte-*.json` e agrega os anunciantes de `public/dados/clientes/clientes.json`.
- `public/assets/js/modules/listagem.js` é o renderizador único para cards, grade e lista. Ele também conecta favorito, comparação e compartilhamento; o compartilhamento usa `navigator.share` e, quando necessário, a área de transferência.
- `public/assets/js/modules/filtros.js` é o controlador comum dos modos completo e compacto. `modules/filtros/definicoes.js` registra os filtros; `disponibilidade.js`, `contagens.js`, `procedencia.js`, `ranking.js`, `sugestoes.js`, `unidades.js` e `url.js` cuidam, respectivamente, de disponibilidade, facetas, origem permitida, relevância, resultado vazio, unidades e querystring.
- `public/assets/js/modules/favoritos.js` e `public/assets/js/modules/comparador.js` são stores locais independentes. A integração visual não deve mudar suas chaves, limites nem eventos públicos.
- `public/assets/js/detalhe.js` lê o ID validado da querystring e então o JSON individual em `public/dados/imoveis/<id>.json`; links de retorno, URLs externas e dados opcionais continuam sujeitos às validações atuais.

### Contratos que precisam permanecer intactos

1. Site totalmente estático, publicável somente a partir de `public/` e sem dependência de runtime entre portais.
2. Querystring reproduzível para filtros e IDs; números continuam numéricos nos objetos e só são formatados na apresentação.
3. Criação de conteúdo dinâmico com nós DOM/`textContent`, validação de URL e estados explícitos de carregamento, vazio e erro.
4. `lang="pt-BR"`, navegação por teclado, foco visível, rótulos e `prefers-reduced-motion`.
5. Breakpoints atuais de referência em 1024, 768 e 600 px, com verificações visuais futuras também em 375 e 1440 px.

## 3. Auditoria da referência Homelengo

### Estrutura visual encontrada

- **Header e footer:** todas as páginas avaliadas repetem `main-header`, navegação desktop, menu móvel e footer em HTML. O header pode ser fixo e troca estado no scroll; o footer usa colunas expansíveis no celular.
- **Container e grid:** Bootstrap fornece `.container`, linhas e colunas. `styles.css` acrescenta composições próprias, sidebar fixa, cards e seções `flat-*`.
- **Tipografia:** `fonts/fonts.css` declara Manrope, Rubik e Poppins por arquivos externos; `fonts/font-icons.css` e os arquivos IcoMoon fornecem ícones. A predominância visual útil é Manrope, mas a decisão futura deve passar por tokens e arquivos locais, sem trazer todas as famílias.
- **Breakpoints:** a folha principal cobre, entre outros, 1800, 1520, 1440, 1350, 1300, 1200, 1100, 992, 768, 700, 655, 576 e 500 px. Isso é mais granular que o portal atual e não deve ser transplantado integralmente.
- **Botões e badges:** famílias `tf-btn`, `primary`, `btn-line`, `btn-view` e rótulos sobre as imagens. São boas referências de hierarquia, mas deverão ser reexpressas nos tokens/componentes existentes.
- **Listagens:** `sidebar-grid.html` e `sidebar-list.html` compartilham filtro lateral, ordenação, alternador e cards; muda principalmente a apresentação do resultado.
- **Detalhes:** as variantes compartilham descrição, visão geral, vídeo, informações, comodidades, mapa, planta, contato e relacionados. Mudam a galeria e a posição do resumo/contato.
- **Breadcrumb e blog:** `blog.html`, `blog-grid.html` e `blog-detail.html` demonstram breadcrumb, grid/lista editorial e sidebar. Servem somente como referência para uma futura vertical de notícias; não justificam criar páginas nesta fase.
- **Responsividade:** header duplicado para menu móvel, colunas Bootstrap e regras extensas em `styles.css`. A aparência é referência; duplicação de markup e comportamento jQuery não será levada ao Londrinense.
- **Scroll-to-top:** componente `progress-wrap`/`progress-circle` controlado em `main.js`; deverá virar componente nativo e acessível quando for implementado.

### Dependências efetivamente declaradas nas referências

| Grupo | Dependências observadas | Decisão de preparação |
|---|---|---|
| Home (`index.html`) | Bootstrap, jQuery, Swiper, `carousel.js`, `plugin.js`, Nice Select, range slider, contador, `shortcodes.js`, animação de heading, lazy sizes, WOW via `main.js` | Não importar em bloco. Reproduzir apenas padrões aprovados com JS/CSS nativos; avaliar Swiper isoladamente somente se a galeria futura exigir. |
| Sidebar grid/list | Bootstrap, jQuery, Swiper/carousel, plugin, Nice Select, range slider, `shortcodes.js`, `main.js` | Preservar o motor nativo de filtros e `listagem.js`; não adotar Nice Select nem o range slider do template. |
| Detalhes v1/v2 | Grupo de listagem mais Fancybox | Preservar `detalhe.js`; avaliar uma solução isolada para lightbox sem acoplar o restante do template. |
| Detalhes v3/v4 | Dependências de v1/v2 mais `marker.js` e `infobox.min.js` | Não importar scripts de mapa: além do peso, v3/v4 ampliam dependências e não são necessários aos JSONs atuais. |
| Blog/lista/grid | Bootstrap, jQuery, plugin, Nice Select, `shortcodes.js`, lazy sizes, `main.js` | Apenas referência de breadcrumb, cards editoriais e sidebar. |
| Blog detalhe | Grupo de blog mais jQuery Validate | Não adotar validação ou formulário fictício do template. |

`css/bootstrap.min.css` e `css/styles.css` não serão copiados para a raiz pública. Caso um padrão seja aprovado na implementação, somente as regras necessárias serão reescritas na camada adequada de `public/assets/css/`, evitando colisões de classes, CSS não utilizado e dependências implícitas.

## 4. Recomendação comparativa

### Home recomendada: `template-homelengo/index.html`

É a melhor base entre as referências solicitadas porque combina busca destacada, categorias e cards em uma sequência compatível com as seções que `public/index.html` já possui. A estrutura aceita a futura identidade de portais gêmeos por tokens, mantém clara a ação principal e mapeia diretamente para cards e filtros existentes. A recomendação é **adotar a composição, não os plugins**: manter o motor nativo e reduzir carrosséis/animações a melhorias opcionais.

### Listagem recomendada: `template-homelengo/sidebar-grid.html`, com alternância inspirada em `sidebar-list.html`

A grade aproveita melhor a fotografia e corresponde ao modo inicial do renderizador atual. A sidebar separa bem refinamento e resultados em desktop e pode continuar como drawer em telas menores. `sidebar-list.html` não precisa virar outra página: deve apenas informar a variante horizontal já produzida por `modules/listagem.js`. Assim, o mesmo conjunto de JSONs, filtros e cards atende ambos os modos sem duplicação.

### Detalhe recomendado: `template-homelengo/property-details-v1.html`

A v1 apresenta hierarquia convencional e clara entre cabeçalho do imóvel, galeria, conteúdo principal e sidebar de contato, com adaptação direta ao `imovel.html` atual. É preferível às v3/v4 porque não requer os scripts extras de mapas/infobox e à v2 porque mantém a abertura da página e as ações mais fáceis de decompor nos componentes atuais. Fancybox também não é requisito: galeria/lightbox deve ser decidida isoladamente.

## 5. Mapa de integração proposto

Os destinos abaixo são arquivos existentes e coerentes com a arquitetura atual; “planejado” significa deliberadamente não implementado nesta preparação.

| Componente Homelengo | Arquivo de origem | Destino Londrinense | Status | Observações |
|---|---|---|---|---|
| Composição da Home | `template-homelengo/index.html` | `public/index.html`, `public/assets/css/pages/home.css`, `public/assets/js/site.js` | Planejado | Adaptar seções aos dados reais; não copiar conteúdo ou sliders fictícios. |
| Header desktop/móvel | `template-homelengo/index.html` | `public/componentes/header.html`, `public/assets/js/componentes.js`, `public/assets/js/navigation.js` | Planejado | Manter fragmento único, sem markup duplicado e sem jQuery. |
| Footer | `template-homelengo/index.html` | `public/componentes/footer.html`, `public/assets/js/componentes.js` | Planejado | Links continuam vindo de `site-config.js`; nenhum contato fictício. |
| Container, tipografia e espaços | `template-homelengo/css/styles.css`, `template-homelengo/fonts/` | `public/assets/css/tokens.css`, `base.css`, `layout.css` | Planejado | Extrair só decisões aprovadas; evitar Bootstrap completo e fontes remotas desnecessárias. |
| Botões, badges e cards | `template-homelengo/index.html`, `template-homelengo/css/styles.css` | `public/assets/css/components.css`, `public/assets/js/modules/listagem.js` | Planejado | Aparência nova sem alterar IDs, dados, ações ou DOM seguro. |
| Sidebar/grid | `template-homelengo/sidebar-grid.html` | `public/resultados.html`, `public/assets/css/pages/resultados.css` | Planejado | Reusar filtro compacto e drawer atuais. |
| Variante lista | `template-homelengo/sidebar-list.html` | `public/assets/js/modules/listagem.js`, `public/assets/css/pages/resultados.css` | Planejado | Uma variante do mesmo renderizador, não uma página duplicada. |
| Filtros | `template-homelengo/sidebar-grid.html` | `public/assets/js/modules/filtros.js`, `public/assets/js/modules/filtros/` | Planejado | Manter definições, procedência, URL, unidades e contagens Londrinense. |
| Breadcrumb | `template-homelengo/blog.html` | HTMLs públicos e `public/assets/css/components.css` | Planejado | Preservar semântica e rótulo acessível atuais. |
| Detalhe do imóvel | `template-homelengo/property-details-v1.html` | `public/imovel.html`, `public/assets/js/detalhe.js`, `public/assets/css/pages/imovel.css` | Planejado | Dados vêm exclusivamente do JSON individual público. |
| Galeria/lightbox | `template-homelengo/property-details-v1.html`, `template-homelengo/js/jquery.fancybox.js` | `public/assets/js/detalhe.js`, `public/assets/css/components.css` | Em avaliação | Não importar Fancybox automaticamente; definir opção mínima, acessível e isolada. |
| Favoritar, comparar e compartilhar | Cards e ações do Homelengo | `public/assets/js/modules/favoritos.js`, `comparador.js`, `listagem.js`, `detalhe.js` | Preservar | Lógica atual é a fonte; mudar somente apresentação na fase de implementação. |
| Scroll-to-top | `template-homelengo/js/main.js` | Novo componente nativo sob `public/assets/js/`, somente na implementação | Planejado | Sem jQuery; botão com nome acessível, foco e respeito a movimento reduzido. |
| Blog/notícias | `template-homelengo/blog.html`, `blog-grid.html`, `blog-detail.html` | Sem destino público nesta fase | Referência | Arquitetura/dados atuais não definem read model editorial; não inventar rota ou conteúdo. |
| Tradução pt-BR | Textos das páginas Homelengo | `public/assets/js/i18n-pt-br.js` | Preparado, não conectado | Catálogo e formatadores existem sem mudar a interface atual. |

## 6. Estratégia de tradução e locale pt-BR

`public/assets/js/i18n-pt-br.js` centraliza o locale, os termos mínimos da interface e formatadores puros. Ele não é importado pelas páginas nesta fase, portanto não modifica texto ou comportamento em produção. Na implementação:

1. Componentes JS devem solicitar textos por `translate(chave)`; conteúdo estático pode permanecer em pt-BR no HTML quando não houver motivo para internacionalizá-lo.
2. Classes, IDs, nomes de funções/arquivos, atributos de integração, chaves de JSON e bibliotecas nunca passam pelo tradutor.
3. `formatCurrency()` apresenta BRL, `formatNumber()` usa separadores brasileiros, `formatArea()` acrescenta `m²` e `formatDate()` apresenta dia/mês/ano. Esses helpers formatam somente na borda de apresentação e não alteram os valores numéricos dos read models.
4. Todos os documentos públicos já usam `lang="pt-BR"`; essa condição deve permanecer.
5. Na futura conexão, `common.js` pode delegar a apresentação monetária ao módulo de locale sem mudar sua API pública nem a mensagem específica de preço indisponível.

## 7. Estratégia compartilhável entre portais

A linguagem visual deve ser **replicável no código-fonte, nunca consumida em runtime por outro portal**:

- **Tokens portáveis:** manter cores, família tipográfica, largura de container, escala de espaços, raios, sombras, foco, transições e breakpoints em `tokens.css`. Cada instalação copia uma versão revisada e pode sobrescrever somente tokens de marca.
- **Primitivas estáveis:** `base.css` e `layout.css` expressam container, tipografia e estrutura; `components.css` expressa botões e o futuro scroll-to-top. Regras de páginas não devem vazar para essas primitivas.
- **Shell por instalação:** header e footer permanecem fragmentos locais em `public/componentes/`, hidratados por `componentes.js` e configurados pelo `site-config.js` local. Assim, cada portal pode evoluir/publicar independentemente.
- **Contrato documentado:** após validação visual, registrar versão dos tokens, anatomia dos componentes, estados, acessibilidade e exemplos em `docs/design/`, permitindo reprodução controlada sem CDN compartilhada, pacote remoto ou chamada entre domínios.
- **Dependências mínimas:** preferir CSS e ES modules nativos. Qualquer fonte ou biblioteca aprovada deve ser vendorizada e versionada apenas no portal que a usa, com licença e finalidade registradas.

## 8. Sequência segura para a futura implementação

1. Validar wireframes das três referências recomendadas e inventariar campos reais disponíveis nos cards e detalhes.
2. Traduzir decisões visuais em tokens/primitivas isoladas, sem importar `bootstrap.min.css` ou `styles.css` completos.
3. Adaptar shell (header, footer, container e scroll-to-top) preservando configuração, acessibilidade e navegação.
4. Adaptar Home, depois listagem/sidebar, e por último detalhe, sempre mantendo os módulos atuais como fonte de comportamento.
5. Conectar gradualmente o módulo pt-BR e testar valores ausentes, números, BRL, área e datas sem transformar dados internos.
6. Validar cada etapa em 375, 600, 768, 1024 e 1440 px, teclado, leitor semântico, movimento reduzido e falhas de JSON/rede.
7. Verificar que somente `public/` é publicável e que nenhum artefato privado, conteúdo fictício ou dependência desnecessária entrou no bundle.

## 9. Critérios de aceite da implementação futura

- Paridade funcional dos filtros, cards, favoritos, comparação, compartilhamento, detalhes e read models.
- Nenhuma dependência de D1, KV, Worker ou runtime de outro portal.
- Nenhuma cópia integral de páginas, imagens, plugins ou CSS Homelengo.
- Interface pt-BR consistente e valores internos inalterados.
- HTML semântico, foco, teclado, contraste, estados e responsividade preservados.
- Diferenças visuais aprovadas em revisão própria; nunca introduzidas por esta fase preparatória.
