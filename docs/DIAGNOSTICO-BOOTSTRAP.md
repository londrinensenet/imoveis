# Diagnóstico e correção do bootstrap administrativo

## Causa raiz

O painel chama `POST /api/login` na própria origem (`/painel/modulos/api.js`). Cloudflare Pages encaminha `/api/*` à Pages Function `functions/api/[[path]].js`, que importa o mesmo Worker administrativo. Portanto, o login publicado não chamava `api-imoveis.londrinense.net`.

A implementação anterior só construía as contas bootstrap quando `BOOTSTRAP_MASTER_PASSWORD_HASH` e `BOOTSTRAP_ADMIN_PASSWORD_HASH` existiam no ambiente. Como esses Secrets não foram provisionados na produção, `adminAccount()` retornava `null` e ambas as tentativas terminavam em “Credenciais inválidas”. Além disso, o login não aplicava `trim + lowercase` e a troca inicial exigia novamente a senha atual.

A sessão, a rota e a base relativa estavam funcionais; a ausência dos hashes manuais era a condição que impedia a autenticação. A inspeção HTTP direta da implantação ficou limitada no ambiente de desenvolvimento porque o proxy externo recusou o túnel com HTTP 403.

## Solução

`src/admin/bootstrap.js`, que fica fora da raiz publicável, contém somente hashes PBKDF2 das duas credenciais temporárias aprovadas. Não contém as senhas em texto puro. Na ausência de `private/admins/<id>.json`, o backend usa esses registros e força a troca. A troca grava um hash novo no arquivo privado; a existência desse arquivo tem precedência absoluta sobre o bootstrap em todos os deploys seguintes.

Excluir o ADMIN grava uma lápide (`deleted: true`) em vez de apagar o estado. Assim a conta bootstrap não reaparece. MASTER não pode ser excluído, desativado ou rebaixado. O login sempre normaliza o identificador com `trim().toLowerCase()`.

## Configuração externa restante

O primeiro login não exige Secret de bootstrap. Permanecem necessários no ambiente administrativo: `SESSION_SECRET`, `GITHUB_ADMIN_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` e `ADMIN_ORIGIN`. O token precisa de Contents e Actions com leitura/escrita para persistir o estado e disparar workflows.
