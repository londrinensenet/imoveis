# Limpeza operacional

## Escopo e fontes autoritativas

A limpeza atua **somente** na camada gerada `public/dados/imoveis/` e
`public/dados/indices/`. Ela não usa idade de arquivo. O cadastro
`private/clientes/<ID>/cliente.json` determina os clientes ativos e o último
snapshot válido de cada um (`ultimo-valido.json`) determina os IDs de imóveis
ativos. O `public/dados/indices/manifesto.json` é a lista autoritativa de shards.

É considerado `ORPHAN_PROPERTY` apenas o JSON individual cujo nome não aparece
em nenhum snapshot válido de cliente ativo. É `ORPHAN_INDEX_SHARD` apenas o JSON
sob `indices/` que não é referenciado pelo manifesto atual. Arquivos com sufixos
temporários conhecidos dentro dessas duas áreas são `TEMPORARY_FILE`.

Se cadastro, snapshot, manifesto, referência ou caminho estiver inválido, a
execução falha antes de apagar. Um feed com falha continua protegido pela regra
existente: a sincronização conserva `ultimo-valido.json`, portanto a limpeza
conserva seus imóveis. A reconstrução normal de `public/dados` já é integral e
atômica; esta automação é uma defesa operacional adicional para resíduos.

## Uso e relatório

O padrão é seguro e equivale a `--dry-run`:

```bash
python scripts/cleanup_operational.py
python scripts/cleanup_operational.py --dry-run
```

Para aplicar candidatos já validados:

```bash
python scripts/cleanup_operational.py --apply
```

O resumo informa arquivos analisados, preservados, candidatos e removidos,
bytes estimados/liberados, diretórios vazios removidos, erros e totais por
categoria. A listagem normal é agregada para não expor dados nem gerar logs
excessivos. Duas aplicações sobre o mesmo estado são idempotentes.

## Proteções

Não são elegíveis: `.github/`, `scripts/`, `docs/`, `src/`, `tests/`,
`schemas/`, `config/`, `private/`, infraestrutura, templates, código público,
`public/blogger/`, `public/painel/`, clientes públicos e qualquer outro caminho
fora dos dois diretórios gerados explicitamente permitidos. Dados privados,
feeds originais e XMLs nunca são apagados. O projeto não persiste cópias XML
operacionais no Git e a limpeza não introduz essa persistência.

Cada caminho é relativo, não pode conter `..`, é resolvido contra a raiz
permitida e tem todos os componentes verificados contra symlinks. Antes do
primeiro `unlink`, todo o plano e todas as fontes são revalidados. Diretórios
vazios descendentes das áreas permitidas podem ser removidos; suas raízes são
preservadas.

## Automação e concorrência

O workflow `limpeza-operacional.yml` pode ser acionado manualmente e roda aos
domingos às **06:00 UTC (03:00 de Brasília, UTC-3)**. Ele usa o grupo de
concorrência `sincronizacao-publica`, compartilhado com sincronizações geral e
individual. A sequência valida os dados e workflows, verifica segredos, executa
dry-run e testes, reaplica as validações no job de escrita, aplica a limpeza,
valida novamente e só então cria commit se houver remoção real.
O job de escrita respeita as mesmas travas operacionais da sincronização:
`ENABLE_REAL_SYNC` e `ENABLE_REAL_PUBLISH` precisam estar habilitadas.

Uma execução semanal independente recupera resíduos sem acoplar uma nova etapa
ao caminho crítico de sincronização. Executar a limpeza ao fim de cada sync
seria coerente porque o gerador já produz um snapshot integral, mas aumentaria o
impacto de qualquer falha operacional. Para este projeto, recomenda-se manter o
workflow semanal independente e o grupo compartilhado. Uma integração futura
só deve ocorrer após observação do workflow em produção e revisão manual.

## Recuperação e histórico

Uma exclusão versionada pode ser recuperada por uma nova Pull Request que
restaure o arquivo a partir do commit anterior (`git restore --source=<commit>
-- <caminho>`), seguida das validações. Não faça force push.

Limpeza operacional altera apenas o estado corrente e cria commits comuns. Ela
não compacta nem reescreve o histórico Git, não usa `git filter-repo` ou BFG,
não apaga branches/releases e não substitui uma manutenção histórica separada,
manual e expressamente autorizada.
