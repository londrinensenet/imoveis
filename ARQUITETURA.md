# Arquitetura do Portal Londrinense — Módulo de Imóveis

> **Fonte oficial e obrigatória:** este documento governa todas as fases, implementações, auditorias e testes do projeto. Qualquer alteração de decisão arquitetural exige autorização expressa. Em caso de divergência, este arquivo prevalece.

## 1. Objetivo

O sistema é um portal imobiliário estático e multicliente para imobiliárias e corretores. Ele importará automaticamente feeds XML privados, validará e normalizará os imóveis, gerará JSONs públicos determinísticos e oferecerá administração privada para o SUPERADMIN e para os clientes, dentro de suas permissões.

## 2. Repositório e hospedagem

- O GitHub privado é a fonte do sistema, do código e dos dados privados permitidos pela arquitetura.
- O GitHub Actions executará sincronização, validação, normalização, geração e publicação.
- O GitHub Pages será a hospedagem pública inicial e publicará exclusivamente o conteúdo de `public/`.
- A arquitetura deve permanecer desacoplada da hospedagem: artefatos públicos são estáticos e não pressupõem um provedor específico.
- Uma futura migração para Cloudflare Pages deve ser possível sem redesenhar o sistema.
- Quando configurada, a Cloudflare será responsável pelo domínio, DNS e cache, sem se tornar requisito para a geração dos artefatos.
- A operação cotidiana deverá ser realizável por interfaces web, sem dependência obrigatória de terminal.
- Configurações externas somente serão realizadas na fase apropriada, depois de implementação e auditoria; não pertencem à FASE 1.

## 3. Regras de dados

- É proibido usar Cloudflare D1.
- É proibido usar Cloudflare KV.
- Não haverá banco público para leitura dos visitantes.
- Visitantes consumirão somente HTML, CSS, JavaScript, imagens e JSONs estáticos publicados.
- A URL de cada feed XML permanecerá exclusivamente na área privada do respectivo cliente.
- URLs de feeds nunca poderão aparecer em JSONs, páginas, scripts, mapas de código ou outros artefatos públicos.
- Credenciais, tokens, senhas, dados fiscais e dados pessoais privados nunca serão publicados.
- GitHub Secrets ficam reservados a credenciais e segredos operacionais; valores reais nunca serão versionados.
- Dados privados de cada cliente residirão em `private/clientes/<ID>/`.
- A publicação pública residirá exclusivamente em `public/`.
- O gerador deverá usar listas explícitas de campos públicos e impedir, por construção e por testes, que arquivos ou campos de `private/` sejam copiados para `public/`.
- Fotografias poderão continuar hospedadas na origem; apenas referências públicas necessárias poderão compor os dados publicados, nunca a URL do feed que as forneceu.

## 4. Feeds e sincronização

- Cada imobiliária ou corretor terá uma URL privada de feed XML.
- Os feeds serão baixados e processados por GitHub Actions, sem exposição da origem ao navegador.
- Cada feed será validado antes de qualquer atualização pública.
- A normalização será determinística: a mesma entrada e configuração produzirão bytes públicos idênticos.
- Se um feed falhar temporariamente, o último JSON público válido daquele cliente será preservado; uma falha não poderá apagar ou substituir dados válidos por saída incompleta.
- O resultado de cada sincronização será registrado privadamente, com estado, horário e contadores, sem segredos nem URL completa de feed em logs públicos.
- Haverá sincronizações automáticas às **09:00, 12:00, 15:00, 18:00 e 23:00**, sempre no fuso IANA `America/Sao_Paulo` (horário de Brasília).
- Todos os clientes ativos serão processados em uma única execução agendada.
- Commit e publicação ocorrerão somente quando houver alteração real e determinística nos resultados versionáveis. Sem alteração, não haverá commit nem publicação.
- O painel do SUPERADMIN terá o botão **“ATUALIZAR/SINCRONIZAR AGORA”** para iniciar a sincronização geral.
- Também existirá sincronização individual, restrita a um cliente selecionado e sujeita às mesmas validações e à regra de não criar commit sem alteração.

## 5. JSONs públicos

- Cada imóvel terá um JSON individual e uma URL estável.
- Haverá índices públicos por cidade, finalidade e pelos demais filtros definidos nos schemas e requisitos da implementação.
- Índices serão particionados quando necessário, com manifestos determinísticos para descoberta das partições.
- Cada arquivo comprimido de listagem terá tamanho-alvo máximo de **1 MB**; a estratégia de partição não poderá alterar a ordenação lógica dos resultados.
- A geração será determinística e repetível, com ordenação estável de registros e chaves e sem timestamps voláteis no conteúdo comparado.
- Dados resumidos usados por cards serão separados dos dados completos do imóvel.
- Somente campos explicitamente públicos poderão ser emitidos. Campos privados serão rigorosamente excluídos.
- Schemas de feeds, dados privados e JSONs públicos serão separados em `schemas/feeds/`, `schemas/private/` e `schemas/public/`.
- Os agrupamentos públicos residirão sob `public/dados/`, incluindo cidades, clientes, imóveis e índices.

## 6. Site público

- O site será inteiramente estático.
- Incluirá portal inicial, listagens, busca, filtros e página individual do imóvel.
- Incluirá páginas públicas de imobiliárias e corretores quando previstas pelos dados e schemas públicos implementados.
- Será responsivo para celular, tablet e computador.
- Aplicará acessibilidade básica: HTML semântico, navegação por teclado, foco visível, rótulos, contraste adequado e alternativas textuais.
- Tratará explicitamente estados vazios, falhas de carregamento e imagens ausentes.
- Toda a navegação pública funcionará sem Worker, D1 ou KV.
- Cache e invalidação respeitarão URLs estáveis, manifestos/versionamento determinístico e publicação atômica dos artefatos.

## 7. Área privada

- O SUPERADMIN administrará clientes, feeds, sincronizações e publicação.
- Clientes acessarão e modificarão somente os dados permitidos de sua própria conta.
- Papéis e permissões serão separados e verificados no servidor; ocultar controles na interface não será considerado autorização.
- Autenticação, sessões, desafios e dados administrativos serão privados e não dependerão de JSONs públicos.
- Senhas nunca serão armazenadas em texto puro.
- Nenhuma senha real será criada ou versionada durante as fases de código.
- O sistema terá procedimento seguro de primeiro acesso e de redefinição administrativa, sem revelar a senha ao SUPERADMIN.
- O modelo definitivo de autenticação, sessões e autorização será implementado integralmente na FASE 2 conforme estes requisitos, sem D1, KV ou dados públicos como armazenamento de identidade.
- Operações administrativas aceitarão somente ações lógicas permitidas; o usuário nunca poderá indicar arbitrariamente um caminho Git para leitura ou escrita.

## 8. Segurança

- Nenhum segredo será versionado.
- Nenhum segredo será escrito em logs.
- Nenhuma URL completa de feed aparecerá em logs públicos.
- Todas as entradas serão validadas quanto a tipo, formato, tamanho, campos permitidos e autorização.
- Escrita arbitrária em caminhos Git será bloqueada; caminhos serão derivados internamente de identificadores validados.
- A separação entre `private/` e `public/` será absoluta e validada automaticamente.
- Workflows usarão privilégio mínimo e permissões explícitas.
- A publicação será controlada, revisável e restrita aos artefatos públicos.
- Testes específicos verificarão vazamento de URLs de feeds, credenciais, dados fiscais e dados pessoais privados.
- Configurações externas e secrets somente serão criados depois da implementação e auditoria, nunca nesta fase estrutural.
- Logs serão seguros, mínimos e sanitizados; erros públicos não revelarão entradas privadas ou detalhes internos.

## 9. Fluxo de entrega

Toda entrega seguirá este fluxo:

```text
alteração
→ branch
→ Pull Request
→ validação
→ revisão
→ merge manual em main
→ GitHub Actions
→ publicação controlada
```

Nenhuma fase pode realizar merge automático. Commit ou publicação automatizada de resultados também deverá respeitar as condições e permissões definidas nesta arquitetura.

## 10. Quatro fases oficiais

### FASE 1 — Estruturação

- apagar a base provisória;
- criar a árvore definitiva;
- criar `ARQUITETURA.md`;
- criar `README.md`;
- criar `AGENTS.md`;
- registrar diretórios vazios com `.gitkeep`;
- não implementar código funcional.

**Critério de conclusão:** estrutura integralmente versionada, documentação coerente e ausência de código funcional, de workflows ativos, de exemplos de dados e de secrets. A fase somente estará concluída após revisão e merge manual da Pull Request.

### FASE 2 — Códigos completos

- implementar todo o sistema;
- implementar o site público;
- implementar importação, validação e normalização de feeds;
- implementar geração e particionamento dos JSONs;
- implementar SUPERADMIN e painel dos clientes;
- implementar autenticação, autorização, sessões, primeiro acesso e redefinição;
- implementar workflows e sincronizações automática, geral manual e individual;
- implementar cache, invalidação, logs seguros e documentação operacional sem terminal;
- preparar a portabilidade para Cloudflare Pages;
- não deixar funcionalidade obrigatória como TODO, mock ou placeholder.

**Critério de conclusão:** todas as funcionalidades obrigatórias operacionais e cobertas por testes incorporados, sem configurar serviços externos nem realizar deploy real.

### FASE 3 — Auditoria

- comparar todos os arquivos com `ARQUITETURA.md`;
- encontrar erros de lógica, segurança e integração;
- identificar divergências, duplicações e código obsoleto;
- corrigir todos os problemas encontrados;
- verificar a ausência de dados privados em todos os artefatos públicos;
- revisar permissões, logs, dependências, schemas e fronteiras de publicação.

**Critério de conclusão:** matriz de conformidade completa, problemas encontrados corrigidos e riscos externos reais documentados.

### FASE 4 — Testes

- executar testes unitários;
- executar testes de integração;
- executar testes de segurança;
- testar feeds válidos e inválidos;
- testar geração determinística;
- testar ausência de commit sem alterações;
- testar todos os horários agendados em `America/Sao_Paulo`;
- testar sincronização manual geral e individual;
- testar o site responsivo e acessível;
- testar autenticação, sessões e permissões;
- validar workflows;
- produzir relatório final de prontidão.

**Critério de conclusão:** suíte integral aprovada ou limitações externas reais claramente registradas, acompanhada do relatório final de prontidão para configuração e publicação controlada.

## 11. Organização da árvore

- `.github/workflows/`: workflows, somente a partir da FASE 2.
- `config/`: configurações não secretas e versionáveis.
- `docs/`: documentação operacional, de segurança e de schemas.
- `private/clientes/`: dados privados por cliente; nunca publicável.
- `public/`: única raiz de publicação pública.
- `schemas/`: contratos separados para feeds, dados privados e públicos.
- `scripts/`: automações de validação, geração e operação.
- `src/`: módulos administrativos, autenticação, clientes, feeds, normalização, painel, publicação, site e código compartilhado.
- `tests/`: fixtures e testes unitários, de integração e de segurança.

Na FASE 1, diretórios deliberadamente vazios são registrados exclusivamente por `.gitkeep`. Esses marcadores deverão ser removidos quando arquivos reais passarem a ocupar os respectivos diretórios.

## 12. Motor público de filtros e listagens

A busca pública continua integralmente estática e opera sobre os shards públicos. Um registro explícito de procedência limita filtros aos campos VRSync permitidos e a uma allowlist de Features, sem derivação de `Description`. O estado multilógica é reproduzível pela URL; a unidade canônica de área é m². Um controlador de filtros atende os quatro modos responsivos e um único renderizador atende grade/lista e cards por categoria. Essas decisões detalham, sem substituir, as regras das seções 3, 5 e 6.

## 13. Sistema visual e navegação pública

A implementação pública organiza tokens, base, layout, componentes, responsividade e estilos por página sob `public/assets/css/`, mantendo `site.css` como ponto de entrada. Início, resultados, detalhe, anunciantes, favoritos, comparação e 404 são documentos estáticos navegáveis. Filtros permanecem canônicos na querystring; preferências, favoritos e comparação são exclusivamente locais ao navegador. Componentes criam nós DOM e validam URLs públicas, preservando a fronteira absoluta de publicação e as decisões das seções anteriores.
