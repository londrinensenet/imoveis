# Administradores

O MASTER permanente é `londrinense.net@gmail.com` (`SUPERADMIN`, `MASTER`, ativo). O Worker o reconhece pelo e-mail verificado do Google e bloqueia exclusão, desativação, alteração do e-mail e rebaixamento.

MASTER e SUPERADMIN acessam a administração conforme a hierarquia abaixo. Cada `private/admins/<id>.json` contém exclusivamente dados privados de autorização e perfil; não há credenciais locais, hashes, primeiro acesso ou redefinição. Um administrador ativo entra quando o e-mail verificado no ID token coincide, sem distinção de maiúsculas/minúsculas, com o e-mail cadastrado.

## Hierarquia consolidada do painel

O administrador permanente usa o identificador `MASTER`, perfil `MASTER` e não participa da sequência comum. Ele é único: a API não aceita sua exclusão, desativação, alteração de identificador ou perfil, nem a criação de outro MASTER. Sua edição fica limitada à URL externa opcional da foto.

Administradores comuns usam IDs monotônicos de `A01` a `A99`, reservados no contador privado `private/admins/.sequence.json`; IDs removidos não são reutilizados. Os perfis criáveis são `SUPERADMIN`, com acesso operacional amplo, e `ADMIN`, com permissões booleanas `incluir`, `editar` e `excluir`. O backend é a fonte de verdade para essas autorizações. Um SUPERADMIN não altera o MASTER nem outro SUPERADMIN, e um ADMIN não altera a própria elevação ou permissões.

`foto_url` é opcional e privada. O painel usa primeiro essa URL, depois a foto Google preservada na sessão e, finalmente, as iniciais do nome. Falhas de imagem removem a imagem e preservam o fallback.
