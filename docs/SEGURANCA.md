# Segurança

Sessões são HMAC-SHA256, expiram, usam cookie `Secure; HttpOnly; SameSite=Strict`, CORS restrito e HTTPS. Senhas persistem exclusivamente como PBKDF2-SHA256 com sal aleatório e 310.000 iterações. O Worker limita payload, valida IDs, não oferece endpoint genérico de arquivos e não registra segredos. `scripts/build.py` parte de uma allowlist (`public/`) e `scripts/validate_public.py` bloqueia campos e padrões privados antes de gerar `dist/`.
