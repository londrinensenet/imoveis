# Portal Londrinense — Módulo de Imóveis

Portal imobiliário estático e multicliente para imobiliárias e corretores, planejado para importar feeds XML privados e publicar dados imobiliários estáticos com segurança.

O documento [ARQUITETURA.md](ARQUITETURA.md) é a fonte oficial e obrigatória do projeto.

## Fases do desenvolvimento

1. **FASE 1 — Estruturação:** substituição da base provisória, definição da arquitetura e criação da árvore definitiva.
2. **FASE 2 — Códigos completos:** implementação integral do site, processamento de feeds, publicação, administração, autenticação e workflows.
3. **FASE 3 — Auditoria:** verificação completa de arquitetura, lógica, segurança, integrações e separação de dados.
4. **FASE 4 — Testes:** execução e consolidação dos testes unitários, de integração, segurança e prontidão operacional.

## Estado atual — FASE 3

A implementação funcional auditada inclui site estático responsivo, pipeline determinístico de feeds, schemas separados, administração no Cloudflare Worker, autenticação e workflows protegidos. A matriz e as correções da auditoria estão em [`docs/auditoria/FASE-3.md`](docs/auditoria/FASE-3.md). Nenhuma configuração externa ou publicação é realizada automaticamente: consulte [`docs/operacao/GUIA.md`](docs/operacao/GUIA.md).

## Desenvolvimento

Requer Python 3.11 ou posterior e não possui dependências de produção. Execute `python -m unittest discover -s tests -v`, `python scripts/validate_public.py` e `python scripts/check_secrets.py`. A sincronização local é iniciada com `python -m src.publicacao.sync`; feeds reais permanecem somente em `private/clientes/<id>/feed.json`.

## Módulos da página do imóvel

O complemento imobiliário adiciona módulos ES condicionais para galeria, comodidades, vídeo, tour 360°, mapa, simulação financeira, contato, similares, vistos recentemente, favoritos, comparação e compartilhamento. O registro está em `public/assets/js/modules/index.js`; detalhes de dados, ativação e segurança estão em [`docs/modulos/MODULOS-IMOBILIARIOS.md`](docs/modulos/MODULOS-IMOBILIARIOS.md).

Além da suíte Python, execute `node --test tests/js/*.test.mjs tests/js/modules/*.test.mjs` e valide a sintaxe com `node --check public/assets/js/modules/*.js`. A página não consulta serviços quando um módulo não tem dados válidos.
