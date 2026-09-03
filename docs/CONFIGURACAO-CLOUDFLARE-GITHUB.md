# Configuração Cloudflare e GitHub

## Worker
Secrets exatos: `GITHUB_ADMIN_TOKEN`, `SESSION_SECRET`, `BOOTSTRAP_MASTER_PASSWORD_HASH` e `BOOTSTRAP_ADMIN_PASSWORD_HASH`. Variables exatas: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` e `ADMIN_ORIGIN=https://imoveis.londrinense.net`.

Gere os dois hashes bootstrap PBKDF2-SHA256 no formato aceito pelo Worker e cadastre-os como Secrets; não cadastre senhas em texto puro. Depois que as duas contas trocarem a senha e os arquivos persistidos existirem em `private/admins/`, remova os dois Secrets `BOOTSTRAP_*`.

O Fine-grained token deve selecionar somente este repositório e conceder apenas **Contents: Read and write**, **Actions: Read and write** e Metadata (obrigatória, somente leitura). Não conceda Administration, Secrets, Pull requests ou acesso organizacional.

## Pages e domínios
Conecte o repositório privado, branch `main`, comando `python scripts/build.py` e saída `dist`. No projeto Pages, associe `imoveis.londrinense.net`. No Worker, adicione Custom Domain `api-imoveis.londrinense.net`; então configure o painel para chamar essa origem administrativa. Faça o merge em `main` somente após revisão.
