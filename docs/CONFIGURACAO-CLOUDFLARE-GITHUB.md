# Configuração Cloudflare e GitHub

## Worker / Pages Function

Secrets exatos: `GITHUB_ADMIN_TOKEN` e `SESSION_SECRET`. Variables exatas: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` e `ADMIN_ORIGIN=https://imoveis.londrinense.net`. Não existem Secrets manuais de bootstrap: os hashes temporários aprovados são provisionados pelo código administrativo privado e são substituídos pelo estado definitivo após a troca.

O Fine-grained token deve selecionar somente este repositório e conceder apenas **Contents: Read and write**, **Actions: Read and write** e Metadata (obrigatória, somente leitura). Não conceda Administration, Secrets, Pull requests ou acesso organizacional.

## Endpoint real

O painel usa a base relativa `/api`; o login real é `POST https://imoveis.londrinense.net/api/login`. `_routes.json` limita a Pages Function a `/api/*`. Caso a implantação seja posteriormente separada no domínio do Worker, altere a base da API de forma explícita e configure CORS antes de retirar a Function.

## Pages e domínios

Conecte o repositório privado, branch `main`, comando `python scripts/build.py` e saída `dist`. No projeto Pages, associe `imoveis.londrinense.net`. O domínio reservado ao Worker é `api-imoveis.londrinense.net`; na configuração atual o painel usa a Function na mesma origem. Faça o merge em `main` somente após revisão.
