# Guia operacional

1. Acesse `https://imoveis.londrinense.net/painel/` e escolha **Entrar com Google**.
2. O e-mail Google verificado precisa estar autorizado como MASTER, ADMIN ou no `email_login` de um CLIENTE ativo.
3. MASTER cadastra ADMINs por e-mail, gerencia clientes e inicia sincronizações. CLIENTE acessa apenas seu próprio cadastro.
4. Use **Sair** para encerrar a sessão local.

A implantação exige `GOOGLE_CLIENT_ID`, `SESSION_SECRET`, `ADMIN_ORIGIN`, `GITHUB_ADMIN_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` e `GITHUB_BRANCH`. Consulte [`docs/CONFIGURACAO-CLOUDFLARE-GITHUB.md`](../CONFIGURACAO-CLOUDFLARE-GITHUB.md).
