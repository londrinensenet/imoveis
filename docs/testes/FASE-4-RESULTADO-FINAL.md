# FASE 4 — Resultado final de testes e prontidão

## Conclusão objetiva

**Classificação: APROVADO COM RESSALVAS.**

O código, os artefatos públicos e os contratos locais de publicação passaram nas suítes automatizadas executáveis no ambiente. A classificação não autoriza publicação e não significa que o sistema esteja publicado. A ressalva existe porque não foi possível instalar um navegador headless nem o binário `actionlint` devido a bloqueio HTTP 403 do ambiente, e porque Worker, GitHub Actions, Pages, DNS, domínio e feeds reais não foram configurados nem exercitados ponta a ponta.

## Resultado consolidado

| Grupo | Aprovados | Reprovados ao final | Ignorados/não comprovados |
|---|---:|---:|---:|
| Python (unitário, integração, segurança e site estático) | 47 | 0 | 0 |
| Node/Worker | 10 | 0 | 0 |
| Validadores locais (fronteira, segredos, workflows, YAML e JavaScript) | 6 | 0 | 0 |
| Navegador headless/visual | 0 | 0 | 14 |
| Serviços externos reais | 0 | 0 | 6 |
| **Total** | **63** | **0** | **20** |

Os 14 cenários de navegador não comprovados visualmente são: página inicial, carregamento no navegador, busca, filtros, cards, detalhe, anunciantes, estados vazios, erro de rede, imagem ausente, URL direta, três famílias de viewport (contadas como três), teclado/foco/labels/contraste e console JavaScript (os itens correlatos foram agrupados para totalização). Os seis ensaios externos são Worker implantado, GitHub Actions real, agenda real, Pages, DNS/domínio e feed real.

## Testes executados e cobertura alcançada

- **Configuração e núcleo:** leitura de JSON, ausência e JSON inválido, configuração de timezone/horários, serialização canônica, escrita atômica e ausência de mudança para bytes iguais.
- **Normalização:** espaços, limites, números decimais, `NaN`, negativos, tipos, finalidades, URLs públicas, máximo de fotos, allowlists e descarte de campo privado.
- **IDs e caminhos:** IDs válidos, curtos, longos, maiúsculos, absolutos, traversal, cliente inválido, código sem slug, duplicidade e ID público perigoso.
- **Feeds/XML:** válido, inválido, vazio, indisponível, acima de 25 MiB, acima do máximo de itens, DTD, entidades, XXE e redirecionamento revalidado.
- **SSRF/URL:** somente HTTPS, proibição de credenciais e fragmentos, esquemas inseguros, loopback, link-local, redes privadas, IPv6 local e destino público.
- **Geração:** allowlists, ordem estável, determinismo byte a byte, shards abaixo de 1 MB, card individual excessivo, índices, manifesto, remoção de imóvel/grupo/shard obsoleto, staging, troca, restauração e limpeza.
- **Sincronização:** geral, individual, ativo, inativo, inexistente, preservação de outros clientes, último resultado válido, falha sem cache, erro sanitizado e dry-run sem geração.
- **Segurança pública:** ausência de conteúdo/nomes privados, feed, senha, hash, token, cookie, credencial, staging e arquivos temporários em `public/`; varredura da árvore e de objetos Git alcançáveis sem imprimir valores encontrados.
- **Worker/painel:** cookie `Secure`, `HttpOnly`, `SameSite=Strict`, login/sessão assinada, adulteração, expiração, logout, autenticação, papéis, isolamento, acesso cruzado, sincronização geral/individual, CSRF/origem, CORS com credenciais, HTTPS, `no-store`, payload declarado e transmitido sem tamanho, PBKDF2 com custo fixo e limitação de login.
- **Site por análise automatizada estática:** URLs, assets, JSON/manifesto, busca/filtros/cards/detalhe, anunciantes, mensagens de vazio/rede/imagem ausente, semântica, labels, status, skip link, foco, breakpoint responsivo e cores básicas.
- **Workflows:** parsing YAML por AST, validador de eventos/jobs/outputs/needs/concurrency/permissões/conditions, hashes SHA completos, gates explícitos, horários em `America/Sao_Paulo`, Pages limitado a `public/`, e push condicionado a commit criado pela própria execução. O dry-run foi comprovado pelas condições e testes locais; nenhuma publicação foi feita.

Não foi calculada cobertura percentual por instrumentação, pois não há ferramenta de cobertura instalada/declarada. A cobertura acima é por requisito e cenário observável.

## Falhas encontradas e correções

1. **Custo de hash controlável no verificador Python:** parâmetros scrypt vindos do hash podiam impor custo excessivo. O verificador agora aceita somente versão, parâmetros, salt e comprimento previstos; há regressão automatizada.
2. **Normalização aceitava cliente inválido, código sem slug e números não finitos:** agora esses valores são rejeitados antes de formar IDs/JSON; há regressões.
3. **Cadastro local de feed aceitava credencial, fragmento e IP privado literal:** a validação sintática foi endurecida; a resolução/revalidação de rede continua no importador.
4. **Worker dependia de `Content-Length`:** corpos enviados sem esse cabeçalho podiam ultrapassar 16 KiB. O tamanho real UTF-8 agora é verificado; há teste com e sem cabeçalho.
5. **Worker aceitava URLs de feed com credenciais ou fragmento:** esses formatos e esquemas inseguros agora são recusados; há regressão.
6. **Painel oferecia sincronização individual ao cliente, mas a API a proibia para a própria conta:** a autorização foi alinhada, preservando a proibição de acesso cruzado e da sincronização geral.
7. **Workflows ignoravam arquivos novos ao decidir se houve mudança:** `git diff --quiet` não cobre untracked. A decisão agora usa `git status --porcelain -- public private`; o commit/sha/push permanecem vinculados à execução.
8. **Varredura de segredos não cobria histórico:** agora examina a árvore e blobs alcançáveis de todas as refs, sem mostrar valores sensíveis.

As falhas intermediárias dos próprios testes durante construção foram corrigidas e a suíte completa foi repetida; não há falha final ocultada ou teste reduzido.

## Navegador

Nenhum navegador estava instalado. A tentativa de instalar Playwright 1.55.0 com npm falhou com HTTP 403 do registro. Não foi possível comprovar renderização, dimensões reais, navegação por teclado em engine, contraste calculado, carregamento sob falha de rede ou ausência de mensagens no console em Chromium. As verificações estáticas correspondentes passaram, mas não substituem ensaio headless/assistivo.

## Workflows

`actionlint` não estava instalado. As tentativas de obter a versão 1.7.7 pelo release do GitHub e por `go install` falharam com HTTP 403. Foi usado o equivalente disponível: parser AST YAML do Ruby mais o validador específico do repositório e testes de invariantes. Isso comprovou sintaxe YAML estrutural e contratos locais, mas não a semântica completa do interpretador do GitHub nem a autenticidade remota dos hashes.

- Jobs de validação: `contents: read`.
- Apenas jobs denominados `publicar` que fazem commit/push: `contents: write`.
- Pages: permissões próprias `pages: write`/`id-token: write`, gate manual/variável/main e upload exclusivo de `public/`.
- Sincronização/publicação real: depende de `ENABLE_REAL_SYNC`; push depende também de `ENABLE_REAL_PUBLISH` e de saída `created=true` com SHA conferido.
- Agenda: gatilho por hora com gate em 09, 12, 15, 18 e 23 usando `ZoneInfo("America/Sao_Paulo")`.
- `private/` não é fornecido ao upload de Pages.

## Riscos residuais

- DNS rebinding entre resolução e conexão continua dependente do executor/rede, conforme já auditado.
- Limitação de login é local por instância do Worker; proteção global precisa ser configurada na borda sem KV/D1.
- Sessões stateless não têm revogação individual antecipada; rotação da chave revoga todas.
- Ensaios visual, responsivo, teclado, assistivo, console e rede em navegador real permanecem obrigatórios antes de publicação.
- Execuções reais podem revelar diferenças de permissões, proteção de branch, environment e comportamento do GitHub não simuláveis localmente.
- A varredura reconhece padrões definidos; nenhum scanner de entropia/serviço externo foi disponibilizado.

## Configurações externas ainda necessárias (não executadas)

1. Revisar e fazer merge manual da Pull Request em `main`.
2. Configurar branch protection, environment protegido e revisores.
3. Criar secrets/variables reais segundo o guia, sem versioná-los.
4. Configurar e validar o Worker, rotas, proteção global de login e CORS/origem administrativa.
5. Habilitar GitHub Pages exclusivamente a partir do artefato `public/`.
6. Configurar DNS/domínio/cache somente após os gates anteriores.
7. Executar actionlint oficial e testes headless/assistivos em ambiente com downloads permitidos.
8. Realizar dry-run com feeds controlados e depois uma sincronização canário, conferindo que nenhuma URL privada aparece em logs.
9. Observar os cinco horários reais em `America/Sao_Paulo` antes de considerar a operação recorrente validada.

Nenhum secret real, configuração externa, deploy, publicação, alteração Cloudflare ou merge foi realizado nesta fase.

# Complemento posterior à FASE 4 — módulos imobiliários

Os módulos imobiliários foram criados depois da conclusão original da FASE 4. Sua cobertura complementar inclui testes específicos de normalização dos campos VRSync (localização, mídia, características, contato e tour virtual), das regras de área rural e da fronteira entre dados privados e JSONs públicos.

Quando o ambiente não disponibiliza navegador, não há validação visual completa; as verificações automatizadas e estáticas não substituem essa validação em um navegador real. Esta cobertura complementar não reescreve nem apaga o relatório ou o histórico original acima.

Nenhum deploy, secret ou configuração externa foi criado, alterado ou executado durante este complemento.
