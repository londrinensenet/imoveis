# Auditoria integral — FASE 3

## Matriz requisito → implementação

| Requisito arquitetural | Situação | Implementação e comprovação |
|---|---|---|
| Fronteira `private/`/`public/` | Conforme | Allowlists, schemas fechados e validação automatizada; Pages recebe somente `public/`. |
| Feed HTTPS privado e seguro | Parcialmente conforme | Limites, redirecionamentos, IPs, DTD e entidades são testados; DNS rebinding entre resolução/conexão depende do executor. |
| Normalização e JSON determinísticos | Conforme | Ordenação e bytes canônicos, detalhe, cards, shards e manifesto são cobertos por testes. |
| Último resultado válido e isolamento | Conforme | Testes confirmam download exclusivo do selecionado e reconstrução privada dos demais. |
| Remoção e atomicidade | Conforme | Testes cobrem staging falho, preservação integral, remoção de sobras, limpeza do staging e árvore consistente. |
| Site estático, responsivo e acessível | Pendente de teste | Implementado sem Worker/D1/KV para visitantes; ensaios visuais, responsivos e assistivos completos pertencem à FASE 4. |
| Autenticação e autorização | Parcialmente conforme | PBKDF2, HMAC, cookie, expiração, origem e isolamento têm testes; não há revogação individual antecipada de sessão stateless. |
| Sincronização geral e individual | Conforme | Workflows, painel e regressões de isolamento estão presentes. |
| Agenda no fuso IANA | Pendente de teste | Gate usa `ZoneInfo`; os cinco horários e execução real agendada serão exercitados na FASE 4. |
| Commit e push | Conforme | Somente jobs `publicar` têm `contents: write`; SHA e saída da etapa vinculam o push ao commit corrente via `GITHUB_TOKEN`. |
| GitHub Pages e configurações | Pendente de configuração externa | Workflow publica apenas `public/`, mas environment, variables, proteção e Pages não são configurados nesta fase. |
| Portabilidade Cloudflare Pages | Pendente de configuração externa | Saída continua estática em `public/`; nenhuma configuração Cloudflare foi executada. |
| Operação sem terminal | Parcialmente conforme | Guia e painel existem; validação ponta a ponta em serviços reais pertence à FASE 4. |

## Problemas encontrados e correções

1. A sincronização individual gerava o portal somente com o cliente selecionado. Ela agora preserva os últimos resultados válidos dos demais clientes.
2. Imóveis, shards e grupos desaparecidos permaneciam em disco, e os arquivos eram atualizados um por um. A geração agora reconstrói e troca atomicamente a árvore completa.
3. IDs duplicados/perigosos e cards individuais acima do limite não eram rejeitados. A geração falha antes da publicação.
4. Redirecionamentos de feeds não eram revalidados, e o parser não reafirmava os limites de bytes e itens. Os limites passaram a valer em todas as entradas auditáveis.
5. Logos com esquemas inseguros podiam chegar a atributos HTML. Somente referências HTTPS válidas são emitidas.
6. O Worker não validava origem/CSRF, não oferecia CORS compatível com cookie, aceitava corpos sem limite e permitia custo PBKDF2 controlado pelo arquivo. Esses pontos foram fechados e o login recebeu limitação de tentativas por instância.
7. Faltava uma operação lógica para cadastro/edição de cliente. O endpoint autorizado agora aceita apenas campos conhecidos e deriva o caminho pelo ID validado.
8. A agenda convertia manualmente para UTC. O workflow agora é acionado por hora e libera o processamento apenas às 09, 12, 15, 18 e 23 segundo `ZoneInfo("America/Sao_Paulo")`, inclusive diante de futura mudança civil do fuso.
9. O workflow geral podia executar a etapa de push sem um commit criado naquela execução. Uma saída explícita condiciona o push à mudança confirmada.
10. Ações reutilizáveis usavam tags móveis. Todos os usos foram fixados em hashes de commit.
11. Jobs com `contents: read` tentavam publicar com token próprio. Validação e publicação foram separadas; somente `publicar` recebe `contents: write` e usa o `GITHUB_TOKEN` efêmero fornecido pelo checkout.

## Riscos e pendências externas

- A limitação de login é local a cada instância do Worker porque a arquitetura proíbe KV e D1. Proteção global adicional deve ser configurada posteriormente na camada Cloudflare, sem mudar o armazenamento da aplicação.
- DNS pode mudar entre resolução e conexão (DNS rebinding); o importador revalida URL inicial, cada redirecionamento e URL final, mas uma garantia de conexão ao IP previamente validado depende do executor/rede.
- Tokens, variables, ambiente protegido, branch protection, Worker, domínio e Pages dependem de configuração externa e permanecem deliberadamente não configurados nesta fase.
- Nenhum deploy, alteração Cloudflare ou merge foi executado na auditoria.
- A FASE 4 ainda deve executar actionlint, testes do Worker implantado, agenda real, acessibilidade, responsividade, concorrência e publicação protegida ponta a ponta.
