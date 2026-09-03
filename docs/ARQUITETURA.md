# Arquitetura operacional

A fonte privada permanece no GitHub. GitHub Actions é o único ambiente que baixa e processa feeds e publica JSON estático. O build copia exclusivamente `public/` para `dist/`; visitantes acessam o Cloudflare Pages diretamente e jamais passam pelo Worker.

O Worker `portal-londrinense-admin` atende apenas APIs administrativas semânticas, deriva internamente caminhos sob `private/`, persiste hashes PBKDF2 e dispara workflows pela API do GitHub. Não há D1, KV, R2, SQL ou processamento de feeds no Worker.
