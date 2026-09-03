# Administradores

O bootstrap cria logicamente `master` (MASTER protegido) e `admin` (ADMIN), ambos com troca obrigatória. Os valores iniciais são os definidos pelo responsável na implantação e entram somente como hashes em Secrets do Worker. No primeiro acesso, autentique-se, conclua a tela obrigatória de troca e repita para a segunda conta. A gravação em `private/admins/<id>.json` contém somente hash PBKDF2; a credencial bootstrap deixa de ser consultada. Remova os Secrets bootstrap após as duas trocas.

MASTER cria, edita, redefine senha, ativa, desativa e exclui ADMIN. Proteções no Worker impedem excluir/desativar `master` ou alterar seu perfil. ADMIN opera clientes e sincronizações, mas recebe 403 em gestão de administradores.
