# Configuração de segredos

> **Estado:** preparação segura; autenticação não ativada. Consulte `docs/AUTENTICACAO.md` para as decisões arquiteturais pendentes.

Nenhum valor real deve ser colocado no repositório, em arquivos públicos, tickets, mensagens, capturas de tela ou logs. O `.env.example` contém exclusivamente nomes e valores vazios. Um arquivo `.env` local é ignorado pelo Git e não é um cofre adequado para produção.

## Inventário

| Nome | Finalidade | Onde cadastrar | Quando |
|---|---|---|---|
| `AUTH_BOOTSTRAP_TOKEN` | Autorizar uma única cerimônia de criação do primeiro SUPERADMIN | Secret do runtime administrativo | Ao ativar autenticação |
| `AUTH_PASSWORD_PEPPER` | Segredo adicional, separado dos hashes de senha | Secret do runtime administrativo | Se confirmado pela arquitetura |
| `AUTH_SESSION_SECRET` | Proteger tokens opacos/artefatos de sessão | Secret do runtime administrativo | Ao ativar autenticação |
| `GITHUB_ADMIN_TOKEN` | Permitir ao Worker acessar somente o repositório necessário | Cloudflare Worker Secret | Somente na futura integração Cloudflare/GitHub |
| `GITHUB_OWNER` | Identificador não secreto do proprietário | Variável do Worker | Somente na futura integração |
| `GITHUB_REPO` | Identificador não secreto do repositório | Variável do Worker | Somente na futura integração |
| `GITHUB_BRANCH` | Branch operacional, não secreta | Variável do Worker | Somente na futura integração |

Os nomes `AUTH_*` registram a estrutura esperada, mas seus valores e uso não devem ser provisionados antes da escolha do backend. Não se deve usar `SUPERADMIN_PASSWORD`, senha em variável de ambiente ou senha em JSON. O nome legado `SUPERADMIN_PASSWORD_HASH`, citado no manual antigo, também não é o armazenamento definitivo: hashes e metadados versionados pertencem ao repositório transacional de identidades a ser definido.

## Onde cadastrar

Em produção, cadastre segredos exclusivamente no gerenciador de segredos do runtime administrativo (planejado: **Cloudflare Workers → Settings → Variables and Secrets → Secret**). Variáveis `GITHUB_*` não secretas podem ser cadastradas como Variables. Restrinja acesso humano, habilite auditoria e use ambientes/valores diferentes para desenvolvimento, homologação e produção.

Nunca exponha `AUTH_*` ou `GITHUB_ADMIN_TOKEN` ao Cloudflare Pages, a código JavaScript entregue ao navegador, a GitHub Actions sem necessidade, ou a qualquer arquivo dentro de `public/`.

## Primeiro SUPERADMIN sem terminal

O fluxo aprovado para implementação futura é uma cerimônia web de bootstrap:

1. um operador autorizado gera o valor de `AUTH_BOOTSTRAP_TOKEN` no gerenciador de segredos, usando o gerador criptográfico oferecido pela plataforma;
2. acessa a rota de configuração por HTTPS e informa o token, identificador da conta e sua própria senha diretamente no formulário;
3. o servidor valida uso único e prazo curto, deriva e armazena somente o hash com salt e parâmetros, cria a conta e exige novo login;
4. o servidor invalida o bootstrap de forma atômica; a rota passa a responder como indisponível;
5. o operador remove o secret de bootstrap pelo painel.

Esse fluxo ainda **não está disponível**, pois falta definir banco, identidade e canal de recuperação. Até isso ocorrer, não existe credencial padrão nem conta embutida. Não cadastrar um hash manual em Git, JSON ou código.

## Credenciais geradas pelo sistema

Quando implementado, o servidor gerará por CSPRNG:

- IDs de sessão e tokens CSRF;
- convites de primeiro acesso;
- tokens de redefinição;
- salts individuais de senha;
- códigos de recuperação, caso segundo fator seja aprovado.

Tokens de convite/recuperação serão exibidos ou enviados somente uma vez e persistidos apenas como hash. Sessões ficarão em cookie protegido. Nenhum desses valores será incluído em JSON público ou log.

## Credenciais fornecidas manualmente

- Cada usuário escolherá a própria senha em conexão HTTPS; administradores não escolhem senhas de terceiros.
- O operador fornece uma única vez o bootstrap pelo painel do gerenciador de segredos.
- Um responsável autorizado cria e cadastra o token fine-grained do GitHub na futura integração.
- Segredos de sessão e pepper são gerados no cofre/plataforma, não inventados ou enviados por mensagem.

## Redefinir a senha de um cliente pelo SUPERADMIN

Este fluxo depende de a arquitetura confirmar que **cliente é um usuário autenticável**. Se confirmado, o SUPERADMIN selecionará “Revogar sessões e enviar redefinição”. O servidor registrará auditoria, revogará todas as sessões e desafios anteriores e emitirá convite de uso único com prazo curto para o canal verificado do cliente. O cliente definirá pessoalmente a nova senha. A interface jamais mostrará senha atual, hash, senha temporária ou token completo ao SUPERADMIN.

Enquanto o papel e o canal não forem definidos, essa ação não deve existir. Um SUPERADMIN nunca deve editar um campo de senha ou gravar senha em `cliente.json`.

## Rotação e incidente

A rotação de `AUTH_SESSION_SECRET` invalida sessões protegidas por ele. A rotação de pepper exige estratégia versionada e rehash após autenticação ou redefinição. Ao suspeitar de vazamento: revogue o segredo na origem, encerre sessões relacionadas, rotacione-o, examine auditoria sem copiar dados sensíveis e documente o incidente fora do repositório público.

## Segredos exclusivos da futura integração Cloudflare

`GITHUB_ADMIN_TOKEN` é o único segredo já previsto especificamente para o Worker acessar o GitHub. `AUTH_BOOTSTRAP_TOKEN`, `AUTH_PASSWORD_PEPPER` e `AUTH_SESSION_SECRET` só serão Workers Secrets se Cloudflare Workers for confirmado como runtime de autenticação. Tokens de API da Cloudflare, IDs de conta, D1/KV/R2 e segredos de feed **não são necessários agora** e não devem ser criados preventivamente.
