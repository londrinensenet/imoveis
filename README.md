# Portal Londrinense — Módulo de Imóveis

Portal imobiliário estático e multicliente para imobiliárias e corretores, planejado para importar feeds XML privados e publicar dados imobiliários estáticos com segurança.

O documento [ARQUITETURA.md](ARQUITETURA.md) é a fonte oficial e obrigatória do projeto.

## Fases do desenvolvimento

1. **FASE 1 — Estruturação:** substituição da base provisória, definição da arquitetura e criação da árvore definitiva.
2. **FASE 2 — Códigos completos:** implementação integral do site, processamento de feeds, publicação, administração, autenticação e workflows.
3. **FASE 3 — Auditoria:** verificação completa de arquitetura, lógica, segurança, integrações e separação de dados.
4. **FASE 4 — Testes:** execução e consolidação dos testes unitários, de integração, segurança e prontidão operacional.

## Estado atual — FASE 4

A implementação funcional foi auditada e submetida aos testes finais locais. O resultado e as ressalvas externas estão em [`docs/testes/FASE-4-RESULTADO-FINAL.md`](docs/testes/FASE-4-RESULTADO-FINAL.md). Nenhuma configuração externa ou publicação é realizada automaticamente: consulte [`docs/operacao/GUIA.md`](docs/operacao/GUIA.md).

## Desenvolvimento

Requer Python 3.11 ou posterior e não possui dependências de produção. Execute `python -m unittest discover -s tests -v`, `python scripts/validate_public.py` e `python scripts/check_secrets.py`. A sincronização local é iniciada com `python -m src.publicacao.sync`; feeds reais permanecem somente em `private/clientes/<id>/feed.json`.

## Busca imobiliária

O site público possui motor multilógica com filtros dependentes, contagens, estado compartilhável em URL, sugestões determinísticas e listagem responsiva em grade/lista. A procedência, categorias, unidades, persistência e comportamento responsivo estão documentados em [`docs/modulos/FILTROS-E-LISTAGENS.md`](docs/modulos/FILTROS-E-LISTAGENS.md). Os contratos públicos em `schemas/public/` incluem separadamente preços de venda/aluguel e atributos tipados dos cards.
