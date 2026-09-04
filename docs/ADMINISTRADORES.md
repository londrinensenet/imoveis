# Administradores

O bootstrap cria logicamente `master` (MASTER protegido) e `admin` (ADMIN), ambos com troca obrigatória. O backend administrativo inclui apenas hashes PBKDF2 temporários fora de `public/`; nenhum Secret ou cadastro manual é necessário para o primeiro login.

O login normaliza o identificador com `trim + lowercase`. Depois da autenticação bootstrap, a tela inicial solicita somente nova senha e confirmação. A gravação em `private/admins/<id>.json` contém exclusivamente o novo hash PBKDF2 e passa a ter precedência definitiva sobre o bootstrap. Reinícios e deploys não reativam a credencial temporária. Uma exclusão de ADMIN persiste uma lápide para impedir sua recriação pelo fallback.

MASTER cria, lista, edita, redefine senha, ativa, desativa e exclui ADMIN. Proteções no Worker impedem excluir/desativar `master` ou alterar seu perfil. ADMIN opera clientes e sincronizações, mas recebe 403 em gestão de administradores. Minha Conta permite alterar nome, alterar senha e encerrar sessão.
