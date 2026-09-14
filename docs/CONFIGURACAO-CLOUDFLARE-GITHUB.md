# Configuração Cloudflare e GitHub

## Pages e Functions

Mantenha `public/` como diretório de publicação. `functions/api/[[path]].js` encaminha somente `/api/*` ao Worker; páginas e dados estáticos de visitantes não passam por ele.

Configure no ambiente Cloudflare:

- `GOOGLE_CLIENT_ID`: Client ID OAuth público do aplicativo web;
- `SESSION_SECRET`: segredo forte para assinar a sessão local;
- `ADMIN_ORIGIN=https://imoveis.londrinense.net`;
- `GITHUB_ADMIN_TOKEN` como secret de privilégio mínimo;
- `GITHUB_OWNER`, `GITHUB_REPO` e `GITHUB_BRANCH`.

No Google Auth Platform, use aplicativo **externo** e inclua `https://imoveis.londrinense.net` nas origens JavaScript autorizadas. Não configure Client Secret: GIS entrega um ID token ao navegador e o Worker verifica esse token com chaves públicas Google. `GET /api/config` expõe somente o Client ID.

O MASTER é `londrinense.net@gmail.com`. Não existem variáveis, hashes ou credenciais de bootstrap local. A integração em `main` continua exclusivamente por revisão e merge manual de Pull Request.
