# Frontend reutilizável para Blogger

## Arquitetura e publicação

O Blogger é exclusivamente a camada visual. Os scripts consomem os read models estáticos de `https://imoveis.londrinense.net/dados/`; não acessam feeds, não processam XML e não criam posts. O GitHub Pages publica `public/`, portanto os artefatos ficam disponíveis em `/blogger/` após merge e deploy.

```text
public/blogger/
├── core/                 # contrato compartilhado por todos os templates
│   ├── common.js         # configuração, URL, formatação e segurança
│   ├── dados.js          # manifesto, shards, detalhes e cache em memória
│   ├── favoritos.js      # favoritos locais versionados
│   └── utils.js          # filtros, cards, paginação e comparação local
└── template1/            # apresentação e controladores do primeiro tema
    ├── portal.css
    ├── listagem.js
    ├── imovel.js
    ├── anunciante.js
    ├── comparar.js
    └── mapa.js
```

Os índices resumidos montam as listagens. JSONs individuais são solicitados somente por detalhe, favoritos, comparação ou mapa sem coordenadas no shard. Leaflet e OpenStreetMap são carregados somente ao abrir um mapa. Favoritos e comparação nunca saem do navegador.

## Instalação no Blogger

Crie páginas com os caminhos configurados (`imoveis`, `detalhe-imovel`, `anunciante`, `favoritos` e `comparar`). Inclua `portal.css`; depois, nesta ordem, `common.js`, `dados.js`, `favoritos.js`, `utils.js`, `mapa.js` e apenas o controlador da página. O template hospedeiro deve fornecer Remix Icon. Não é necessário editar ou duplicar dados no Blogger.

Configure **antes** dos scripts:

```html
<script>
window.LONDRINENSE_BLOGGER_CONFIG = {
  dataBase: "https://imoveis.londrinense.net/dados/",
  urls: {
    listagem: "/p/imoveis.html",
    imovel: "/p/detalhe-imovel.html",
    anunciante: "/p/anunciante.html",
    favoritos: "/p/favoritos.html",
    comparar: "/p/comparar.html"
  },
  perPage: 12,
  mapConcurrency: 4
};
</script>
<link rel="stylesheet" href="https://imoveis.londrinense.net/blogger/template1/portal.css">
<script defer src="https://imoveis.londrinense.net/blogger/core/common.js"></script>
<script defer src="https://imoveis.londrinense.net/blogger/core/dados.js"></script>
<script defer src="https://imoveis.londrinense.net/blogger/core/favoritos.js"></script>
<script defer src="https://imoveis.londrinense.net/blogger/core/utils.js"></script>
<script defer src="https://imoveis.londrinense.net/blogger/template1/mapa.js"></script>
<script defer src="https://imoveis.londrinense.net/blogger/template1/listagem.js"></script>
```

Os exemplos mínimos de conteúdo das páginas são:

```html
<!-- HOME --> <div id="ln-listagem" data-home="true"></div>
<!-- LISTAGEM --> <div id="ln-listagem"></div>
<!-- IMÓVEL --> <div id="ln-imovel"></div>
<!-- ANUNCIANTE --> <div id="ln-anunciante"></div>
<!-- FAVORITOS --> <div id="ln-listagem" data-source="favoritos"></div>
<!-- COMPARAR --> <div id="ln-comparar"></div>
```

Listagem aceita `finalidade`, `tipo`, `cidade`, `bairro`, `preco_min`, `preco_max`, `quartos`, `banheiros`, `vagas`, `area_min`, `area_max`, `ordem`, `pagina` e `view`. Detalhe e anunciante recebem `id`.

As páginas confirmadas no Blogger são `/p/imoveis.html`, `/p/detalhe-imovel.html`, `/p/anunciante.html`, `/p/favoritos.html` e `/p/comparar.html`. A listagem deve conter `<div id="ln-listagem"></div>`; um detalhe, por exemplo, é aberto como `/p/detalhe-imovel.html?id=00001-tst-001`.

## Versionamento de assets no Blogger

Para invalidar caches do Blogger e da CDN sem renomear os arquivos publicados, use uma versão curta e única na querystring de **todos** os `link` e `script` do frontend, por exemplo `portal.css?v=20260928-1` e `common.js?v=20260928-1`. A cada publicação dos assets, altere esse mesmo valor em todas as referências. Como essas tags vivem no template/páginas do Blogger, a aplicação da versão requer uma edição manual posterior no Blogger; nenhum XML é alterado por este repositório nesta tarefa.

## URLs públicas

- manifesto: `/dados/indices/manifesto.json`;
- shards: caminhos indicados em `partes` no manifesto;
- imóvel: `/dados/imoveis/{id}.json`;
- núcleo: `/blogger/core/{arquivo}.js`;
- Template 1: `/blogger/template1/{arquivo}`.

## Novo template visual

Para criar `template2`, preserve os quatro arquivos de `core/` e seus contratos (`Londrinense.Common`, `Dados`, `Favoritos` e `Utils`). Crie somente CSS e controladores em `public/blogger/template2/`, mantenha classes namespaced e containers documentados, e reutilize os read models existentes. Um template não deve alterar a ingestão nem inferir campos ausentes.

## Limitações dos read models

Os shards atuais não incluem `location`; o mapa precisa buscar detalhes com concorrência limitada. Dados institucionais completos do anunciante não fazem parte do índice `cliente_id/{id}`, então a página mostra apenas o identificador público e a carteira. Contato só aparece no detalhe quando `contact_info` fornece telefone ou WhatsApp público válido.
