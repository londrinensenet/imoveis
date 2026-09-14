# Arquitetura operacional

A fonte privada permanece no GitHub. GitHub Actions é o único ambiente que baixa e processa feeds e publica JSON estático. O build copia exclusivamente `public/` para `dist/`; visitantes acessam o Cloudflare Pages diretamente e não passam pelo Worker.

A Pages Function encaminha apenas `/api/*` ao Worker administrativo. O Worker deriva caminhos sob `private/`, autoriza operações e dispara workflows pela API do GitHub. Não há D1, KV, R2, SQL ou processamento de feeds no Worker.

Google Identity Services é a única autenticação. O frontend recebe o Client ID público por `GET /api/config` e envia o ID token a `POST /api/auth/google`. O Worker valida o token com chaves públicas Google, localiza o e-mail em MASTER, ADMIN ou CLIENTE e cria sessão local HMAC. Consulte [AUTENTICACAO-GOOGLE.md](AUTENTICACAO-GOOGLE.md).
