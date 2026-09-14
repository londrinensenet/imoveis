# Clientes

O painel mantém dados privados, integração e dados públicos separadamente em `private/clientes/<id>/cliente.json`, `feed.json` e `sincronizacao.json`. CPF/CNPJ, URL de feed, responsável, e-mail de acesso e anotações nunca integram a allowlist pública. Operações de cadastro, edição, status, consulta e sincronização usam endpoints semânticos; o navegador não escolhe caminhos Git.

Um cliente ativo pode ter `email_login` com a Conta Google autorizada. Depois da validação do ID token, o Worker atribui `role: CLIENTE` e o `cliente_id` correspondente; todas as rotas mantêm o isolamento nesse identificador. A consulta percorre somente a coleção privada de clientes e não impõe limite fixo de contas.
