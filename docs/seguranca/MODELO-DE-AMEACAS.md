# Controles de segurança

- A fronteira publicável é exclusivamente `public/`; a validação rejeita nomes de campos privados e URLs de feed.
- O importador aceita HTTPS, bloqueia destinos não globais, DTD e entidades, limita o download e sanitiza falhas.
- Identificadores determinam caminhos internos; a API nunca recebe um caminho de arquivo.
- Sessões têm assinatura, expiração e cookies `Secure`, `HttpOnly` e `SameSite=Strict`; autorização é conferida em cada operação.
- Senhas usam derivação versionada com salt (scrypt no núcleo Python e PBKDF2-SHA-256 com 310 mil iterações no runtime Web Crypto).
- Redefinições são temporárias, aleatórias e não revelam senhas escolhidas ao administrador.
- Workflows começam com leitura mínima, exigem variables, confirmação e secret para operações reais e não publicam sem diferença.

