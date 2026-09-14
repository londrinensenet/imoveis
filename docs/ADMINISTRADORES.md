# Administradores

O MASTER permanente é `londrinense.net@gmail.com` (`SUPERADMIN`, `MASTER`, ativo). O Worker o reconhece pelo e-mail verificado do Google e bloqueia exclusão, desativação, alteração do e-mail e rebaixamento.

Somente MASTER lista, cria, edita, ativa, desativa e exclui ADMINs. Cada `private/admins/<id>.json` contém exclusivamente autorização: `id`, `nome`, `email`, `role: "ADMIN"` e `ativo`. Não há credenciais locais, hashes, primeiro acesso ou redefinição. Um ADMIN ativo entra quando o e-mail verificado no ID token coincide, sem distinção de maiúsculas/minúsculas, com o e-mail cadastrado.
