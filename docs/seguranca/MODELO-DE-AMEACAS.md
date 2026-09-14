# Modelo de ameaças

O navegador é não confiável: e-mail ou perfil enviados isoladamente nunca autenticam ninguém. O Worker verifica criptograficamente o ID token Google e só depois consulta autorização privada. Audience, issuer, expiração e e-mail verificado impedem tokens de outro aplicativo, emissor ou conta não confirmada.

Sessões são assinadas, curtas e protegidas por cookie `Secure`, `HttpOnly` e `SameSite=Strict`. Origem, HTTPS, tipo e tamanho do corpo são validados. Tokens, URLs privadas e dados de `private/` não são registrados ou publicados. As limitações externas são disponibilidade das chaves públicas Google e da API GitHub; falhas resultam em negação de acesso, nunca em autorização permissiva.
