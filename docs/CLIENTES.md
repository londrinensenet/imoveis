# Clientes

O painel mantém dados privados, integração e dados públicos separadamente em `private/clientes/<id>/cliente.json`, `feed.json` e `sincronizacao.json`. CPF/CNPJ, URL de feed, responsável e anotações nunca integram a allowlist pública. Operações de cadastro, edição, status, consulta e sincronização usam endpoints semânticos; o browser não escolhe caminhos Git.
