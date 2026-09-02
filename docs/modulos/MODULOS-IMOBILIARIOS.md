# Módulos imobiliários

## Contrato comum

`modules/index.js` registra e isola os módulos. Cada inicializador recebe `imovel`, `anunciante`, `indices`, `root`, `url` e configuração opcional. Retorna `false`, esvazia e oculta `root` quando o requisito de ativação não existe; uma falha é isolada pelo registro. Dados do feed entram no DOM somente por `textContent`/`createTextNode`. URLs externas são validadas e links usam `noopener noreferrer`.

| Módulo | Finalidade e fonte | Ativação/campos | Ausência, riscos, proteções e testes |
|---|---|---|---|
| Galeria | Fotos VRSync em ordem, com principal, legenda e navegação | `images` ou legado `fotos`, ao menos uma URL HTTPS | Oculta sem imagens; rejeita esquemas inseguros, usa lazy load, teclado, Escape, tela cheia e swipe. Testes: URLs e integração. |
| Comodidades | Lista de `Details/Features/Feature` | `amenities` não vazia | Oculta vazia; normaliza/deduplica e cria nós de texto contra HTML malicioso. |
| Vídeo | Vídeo declarado em `Media/Item` | `videoYoutube` com host YouTube e ID de 11 caracteres | Oculta inválido; rejeita host/esquema/fragmento e incorpora `youtube-nocookie.com` com permissões mínimas. |
| Tour 360° | `VirtualTourLink` | HTTPS sem credenciais, fragmento ou encurtador conhecido | Oculta inseguro; iframe sandbox e alternativa externa segura. |
| Mapa | Coordenadas normalizadas | `coordinates.latitude/longitude` nos intervalos geográficos | Oculta inválido, não geocodifica; OSM é carregado apenas por interseção e não recebe endereço. Registro aceita provedor configurável sem chaves. |
| Calculadora | Simulação client-side SAC/Price | Venda e `preco > 0`; entrada, taxa, prazo e sistema | Oculta em aluguel/preço inválido; rejeita negativos/não finitos, informa taxa mensal, parcelas, juros e total, com aviso não bancário. |
| Contato | Abre canal público do anunciante | ao menos `whatsapp`, `telephone` ou `email` público | Não persiste nem transmite ao portal; `wa.me`, `tel:` e `mailto:` recebem título, código, preço, URL e origem codificados. Campos do visitante viram apenas texto codificado. |
| Similares | Recomendações do índice público já carregado | mesma cidade, tipo e finalidade; preço entre 70% e 130% | Oculta sem resultado; exclui atual, limita quatro e ordena por distância de preço e ID. Não baixa catálogo nacional adicional. |
| Recentes | Histórico local | slug atual e cards públicos existentes | Guarda apenas slug/horário, limita oito, deduplica, elimina inexistentes, oculta sem anteriores e tolera armazenamento indisponível. |
| Favoritos | Seleção local | ID público | Guarda apenas IDs, usa `aria-pressed`, tolera JSON corrompido/armazenamento indisponível. |
| Comparador | Seleção local de até quatro | ID e cards públicos | Guarda IDs, descarta inexistentes, remove/limpa e expõe estado acessível; atributos comparáveis já constam da allowlist. |
| Compartilhar | Share API, cópia e WhatsApp | título e URL atual | Sem encurtador; fallback local e confirmação `aria-live`. |

## VRSync, publicação e privacidade

O importador aceita o formato legado e `Listing`, incluindo `Location`, `Media`, `VirtualTourLink`, `Details/Features` e `ContactInfo`. O normalizador limita textos, itens e números, aceita somente URLs HTTPS sem credenciais e publica `coordinates`, `images`, `videoYoutube`, `virtualTour`, `amenities` e `publicContact`. O gerador aplica allowlists. WhatsApp jamais é inferido do VRSync: ele vem do perfil controlado do cliente. Endereço além de cidade/bairro/UF, URL original do feed e campos privados não integram os schemas públicos.

## Cobertura

`tests/unit/test_vrsync_modules.py` cobre ingestão/normalização. `tests/js/modules/modules.test.mjs` cobre coordenadas, imagens, SAC, Price, canais, codificação, limite do comparador, recentes, similares, texto malicioso, YouTube e tour. Os testes existentes de geração e fronteira comprovam determinismo e ausência dos nomes privados proibidos. A integração de `detalhe.js` é verificada por sintaxe, referências de slots e revisão automatizada; validação visual real requer navegador.
