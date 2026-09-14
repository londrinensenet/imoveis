# Autenticação Google

Google Identity Services (GIS) é a única forma de autenticação do painel. No **Google Auth Platform**, configure o aplicativo como **externo** e cadastre `https://imoveis.londrinense.net` como origem JavaScript autorizada. Este fluxo recebe um ID token; não usa authorization code nem `GOOGLE_CLIENT_SECRET`.

## Fluxo e configuração

1. A Pages Function lê `GOOGLE_CLIENT_ID` do ambiente. `GET /api/config` entrega ao navegador exclusivamente `{ "googleClientId": "..." }`.
2. GIS autentica a Conta Google e chama o frontend com `credential`.
3. O frontend envia somente `{ "credential": "<ID token>" }` a `POST /api/auth/google`.
4. O Worker obtém as chaves públicas Google, exige assinatura RS256 válida, `iss` Google, `aud` exatamente igual a `GOOGLE_CLIENT_ID`, `exp` futuro, `email_verified === true`, `sub` e e-mail válido.
5. O e-mail normalizado é autorizado: `londrinense.net@gmail.com` é sempre o MASTER; os arquivos de `private/admins/` autorizam ADMINs ativos; `email_login` nos cadastros de `private/clientes/<id>/cliente.json` autoriza CLIENTEs ativos.
6. O Worker cria uma sessão HMAC com `SESSION_SECRET`. O cookie é `Secure`, `HttpOnly`, `SameSite=Strict` e `Path=/`; ele não contém o ID token Google.
7. `POST /api/logout` apaga apenas a sessão local.

Uma identidade Google válida sem cadastro recebe HTTP 403 e `conta_nao_autorizada`. O Google prova a identidade; nunca concede autorização automaticamente.

## MASTER permanente

O MASTER é `londrinense.net@gmail.com`, nome `SUPERADMIN`, papel `MASTER` e estado ativo. A regra é canônica no Worker e impede exclusão, desativação, troca do e-mail e rebaixamento.

`SESSION_SECRET` continua obrigatório. Também permanecem `ADMIN_ORIGIN`, `GITHUB_ADMIN_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` e `GITHUB_BRANCH`. O Client ID é público; nenhum Client Secret é necessário ou aceito por este fluxo.
