# Segurança

Google autentica a identidade; o Worker autoriza apenas e-mails privados ativos. A validação do ID token verifica criptograficamente assinatura RS256 com as chaves públicas Google, issuer, audience igual a `GOOGLE_CLIENT_ID`, expiração, `sub`, e-mail e `email_verified === true`. Dados soltos enviados pelo navegador nunca constituem identidade.

Após autenticar, o Worker emite sessão própria HMAC-SHA256 com duração de uma hora. O cookie usa `Secure; HttpOnly; SameSite=Strict; Path=/`; ID token e tokens de sessão não são registrados. `POST /api/logout` expira a sessão. CORS/CSRF permanece limitado a `ADMIN_ORIGIN`, HTTPS é obrigatório e payloads têm limite de 16 KiB.

Não há autenticação local, segredo de cliente Google, D1 ou KV. A integração GitHub deriva caminhos privados internamente. `scripts/build.py` publica apenas `public/`, e as validações impedem dados privados nos artefatos públicos.
