# Modelo efetivo de autenticação e sessões

Google Identity Services autentica MASTER, ADMIN e CLIENTE. O Worker só confia no ID token depois de validar assinatura RS256, issuer Google, audience exata, expiração, `sub`, e-mail e confirmação do e-mail. Em seguida, autoriza o endereço nos registros privados descritos em [AUTENTICACAO-GOOGLE.md](../AUTENTICACAO-GOOGLE.md).

A sessão stateless contém somente os atributos necessários, é autenticada com HMAC-SHA-256 usando `SESSION_SECRET` e expira em uma hora. O cookie contém `Secure`, `HttpOnly`, `SameSite=Strict` e `Path=/`; não armazena o ID token. O logout remove o cookie, e a rotação de `SESSION_SECRET` revoga todas as sessões.

Toda mutação exige JSON, origem HTTPS exatamente igual a `ADMIN_ORIGIN` e corpo de até 16 KiB. Papéis são verificados no Worker: MASTER administra autorizações; ADMIN opera o conjunto administrativo; CLIENTE alcança somente seu próprio `cliente_id`. Caminhos Git derivam apenas de IDs validados.
