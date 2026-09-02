# Modelo efetivo de autenticação e sessões

## Identidades e hashes

- O SUPERADMIN é configurado fora do Git como os secrets `SUPERADMIN_USER` e `SUPERADMIN_PASSWORD_HASH` do Worker.
- Cada cliente possui `private/clientes/<id>/acesso.json`; o schema aceita somente a identidade lógica, `senha_hash`, estado e desafio de primeiro acesso/redefinição.
- O runtime administrativo aceita exclusivamente `pbkdf2-sha256$310000$<salt-base64url>$<hash-base64url>`. O salt tem 16 bytes aleatórios e o resultado tem 256 bits. O verificador rejeita outro algoritmo, custo ou tamanho antes de executar PBKDF2.
- A primitiva Python `scrypt` existe para operações privadas locais, mas não é usada pelo Worker para autenticar o painel.

## Sessão sem banco

A sessão é stateless: um JSON mínimo (`sub`, `role`, `exp`) é codificado em base64url e autenticado com HMAC-SHA-256 usando `SESSION_SECRET`. Não há D1, KV nem identidade em JSON público. O cookie dura e expira em uma hora e contém `Secure`, `HttpOnly` e `SameSite=Strict`. O logout remove o cookie no navegador; a rotação de `SESSION_SECRET` revoga todas as sessões. Uma sessão já emitida não possui lista de revogação individual e permanece válida até a expiração, inclusive após redefinição de senha. Esta limitação é explícita e deve ser reavaliada na FASE 4 sem introduzir armazenamento proibido.

## Fronteiras de autorização

- Toda requisição exige a origem HTTPS exata configurada em `ADMIN_ORIGIN`; todo `POST` ou `PUT` exige JSON e respeita 16 KB.
- O Worker valida assinatura, expiração, papel e sujeito em cada operação autenticada.
- SUPERADMIN pode cadastrar clientes, redefinir acesso e iniciar sincronizações. Cliente somente alcança o ID igual a `session.sub`; sincronização continua exclusiva do SUPERADMIN.
- Caminhos Git são derivados exclusivamente de IDs que atendem à expressão regular interna.
- Cookies, tokens, hashes e URLs de feed não são escritos em logs nem emitidos em `public/`; os testes de fronteira verificam esses marcadores.

## Comprovação automatizada

`tests/js/worker.test.mjs` cobre atributos do cookie, assinatura, adulteração, expiração, origem e isolamento entre sujeitos. `tests/security/test_public_boundary.py` cobre a ausência de credenciais e campos privados na raiz publicável. A configuração externa do Worker e testes contra o runtime implantado pertencem à FASE 4.
