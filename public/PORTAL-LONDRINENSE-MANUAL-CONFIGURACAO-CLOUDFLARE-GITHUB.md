# PORTAL LONDRINENSE — MANUAL DE CONFIGURAÇÃO CLOUDFLARE + GITHUB

**Projeto:** Portal Londrinense — Módulo de Imóveis  
**Arquitetura:** GitHub privado + GitHub Actions + Cloudflare Pages + Cloudflare Worker administrativo  
**Domínio público:** `imoveis.londrinense.net`  
**Objetivo:** configurar toda a infraestrutura antes da implementação do sistema.

---

# 1. Visão geral

A infraestrutura será dividida assim:

```text
GITHUB PRIVADO
├── código
├── painel SUPERADMIN
├── /private/clientes
├── feeds privados
├── importadores
├── workflows
└── JSONs gerados
        │
        │ push / commit
        ▼
CLOUDFLARE PAGES
└── site público
    ├── HTML
    ├── CSS
    ├── JS
    ├── manifestos
    └── JSONs públicos
        │
        ▼
imoveis.londrinense.net
```

Administração:

```text
SUPERADMIN
    ↓
Painel
    ↓
Cloudflare Worker administrativo
    ↓
GitHub API
    ↓
Repositório privado
```

O Worker não processa feeds.

Os feeds são processados pelo GitHub Actions.

---

# 2. O que será necessário

## Conta GitHub

Necessário:

- uma conta GitHub;
- um repositório privado;
- GitHub Actions habilitado;
- token Fine-grained para o Worker administrativo.

## Conta Cloudflare

Necessário:

- domínio `londrinense.net` administrado na Cloudflare;
- Cloudflare Pages;
- um Worker administrativo;
- Secrets do Worker;
- subdomínio público.

---

# 3. Nomes sugeridos

Para manter tudo organizado:

```text
REPOSITÓRIO GITHUB
portal-londrinense-imoveis

CLOUDFLARE PAGES
portal-londrinense-imoveis

WORKER
portal-londrinense-admin

SITE PÚBLICO
imoveis.londrinense.net

API ADMINISTRATIVA
api-imoveis.londrinense.net
```

Esses nomes podem ser alterados, mas é recomendável manter um padrão.

---

# 4. ETAPA 1 — Criar o repositório GitHub

No GitHub:

```text
GitHub
→ New repository
```

Nome sugerido:

```text
portal-londrinense-imoveis
```

Configurar:

```text
Visibility:
Private
```

Criar inicialmente a branch:

```text
main
```

O repositório NÃO deve ser público porque armazenará:

- URLs dos feeds;
- dados privados dos clientes;
- código administrativo;
- configurações internas.

---

# 5. ETAPA 2 — Estrutura inicial

Estrutura planejada:

```text
/
├── public/
│   ├── index.html
│   ├── imovel-detalhe.html
│   ├── assets/
│   └── dados/
│
├── admin/
│
├── private/
│   └── clientes/
│
├── importadores/
│
├── worker-admin/
│
└── .github/
    └── workflows/
```

## Regra fundamental

Somente:

```text
/public/
```

deve ser publicado no Cloudflare Pages.

Nunca publicar:

```text
/private/
/importadores/
/worker-admin/
/.github/
```

---

# 6. ETAPA 3 — Conectar GitHub ao Cloudflare Pages

No Cloudflare:

```text
Dashboard
→ Workers & Pages
→ Create application
→ Pages
→ Connect to Git
```

Selecionar:

```text
GitHub
```

Autorizar o aplicativo:

```text
Cloudflare Workers and Pages
```

IMPORTANTE:

Dê acesso somente ao repositório do Portal Londrinense.

No GitHub, preferir:

```text
Repository access
→ Only select repositories
→ portal-londrinense-imoveis
```

Não é necessário dar acesso a todos os seus repositórios.

O Cloudflare Pages aceita repositórios GitHub privados.

---

# 7. ETAPA 4 — Configurar o projeto Pages

Selecionar:

```text
Repository:
portal-londrinense-imoveis

Production branch:
main
```

Como o projeto será estático, a configuração deverá publicar somente a saída pública.

A implementação final definirá o diretório:

```text
public
```

ou um diretório de saída, por exemplo:

```text
dist
```

Recomendação definitiva:

```text
SOURCE PRIVADO
      ↓
workflow/build
      ↓
/dist
      ↓
Cloudflare Pages
```

Assim a publicação nunca aponta diretamente para a raiz do repositório.

---

# 8. ETAPA 5 — Configurar o domínio

No projeto Cloudflare Pages:

```text
Workers & Pages
→ portal-londrinense-imoveis
→ Custom domains
→ Set up a domain
```

Informar:

```text
imoveis.londrinense.net
```

Como `londrinense.net` já está administrado na Cloudflare, o Pages pode criar/configurar o registro DNS necessário.

Não criar primeiro um CNAME manual e depois tentar associar.

Primeiro associe o domínio pelo próprio Pages.

Resultado:

```text
imoveis.londrinense.net
        ↓
Cloudflare Pages
```

---

# 9. ETAPA 6 — Criar o Worker administrativo

No Cloudflare:

```text
Workers & Pages
→ Create
→ Worker
```

Nome:

```text
portal-londrinense-admin
```

O Worker terá somente funções administrativas.

Ele NÃO deverá:

- processar XML;
- processar feeds;
- servir páginas públicas;
- servir imagens;
- servir JSONs públicos.

---

# 10. ETAPA 7 — Criar domínio da API administrativa

Recomendação:

```text
api-imoveis.londrinense.net
```

Fluxo:

```text
Painel SUPERADMIN
        ↓
https://api-imoveis.londrinense.net/
        ↓
Worker administrativo
```

Isso mantém a API administrativa separada do site público.

---

# 11. ETAPA 8 — Token GitHub para o Worker

O Worker precisa acessar o repositório privado.

Para isso, criar um:

```text
Fine-grained Personal Access Token
```

Não usar token clássico se não houver necessidade.

No GitHub:

```text
Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens
→ Generate new token
```

---

# 12. Permissões do token GitHub

## Repository access

Selecionar:

```text
Only select repositories
```

Escolher somente:

```text
portal-londrinense-imoveis
```

## Repository permissions

Dar:

```text
Contents:
Read and write
```

Necessário para:

- criar arquivos;
- alterar cadastro de clientes;
- salvar `cliente.json`;
- salvar `feed.json`;
- atualizar arquivos privados via API.

Dar também:

```text
Actions:
Read and write
```

Necessário para o Worker disparar:

```text
workflow_dispatch
```

que será usado pelos botões:

```text
SINCRONIZAR TODOS AGORA
SINCRONIZAR ESTE CLIENTE
```

## NÃO DAR desnecessariamente

Evitar permissões como:

```text
Administration
Issues
Pull requests
Packages
Codespaces
Secrets
Organization administration
```

se o Worker não precisar delas.

Aplicar o princípio:

```text
menor privilégio possível
```

---

# 13. Nome do Secret GitHub no Worker

No Cloudflare Worker:

```text
Settings
→ Variables and Secrets
→ Add
→ Secret
```

Criar:

```text
GITHUB_ADMIN_TOKEN
```

Valor:

```text
<token Fine-grained criado no GitHub>
```

Esse valor nunca deve aparecer:

- no código;
- no GitHub;
- no JavaScript do navegador;
- nos JSONs;
- em logs.

---

# 14. Variáveis NÃO secretas do Worker

Podem ser variáveis normais:

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_BRANCH
```

Exemplo:

```text
GITHUB_OWNER=SEU-USUARIO-OU-ORGANIZACAO
GITHUB_REPO=portal-londrinense-imoveis
GITHUB_BRANCH=main
```

Elas não são credenciais.

---

# 15. Credenciais do SUPERADMIN

Nunca armazenar a senha em texto puro no repositório.

Criar no Worker:

```text
SUPERADMIN_USER
SUPERADMIN_PASSWORD_HASH
SESSION_SECRET
```

## SUPERADMIN_USER

Pode ser Secret.

Exemplo:

```text
administrador
```

## SUPERADMIN_PASSWORD_HASH

Guardar somente o HASH da senha.

Nunca:

```text
SUPERADMIN_PASSWORD=MinhaSenha123
```

Preferir:

```text
SUPERADMIN_PASSWORD_HASH=<hash forte>
```

A implementação deverá usar derivação segura de senha.

## SESSION_SECRET

Criar um valor aleatório forte, diferente da senha.

Ele será usado para assinar/autenticar a sessão administrativa.

Exemplo de nome:

```text
SESSION_SECRET
```

O valor deve ser aleatório e longo.

---

# 16. Secrets iniciais do Worker

Lista consolidada:

```text
GITHUB_ADMIN_TOKEN
SUPERADMIN_USER
SUPERADMIN_PASSWORD_HASH
SESSION_SECRET
```

Nenhum deles deve estar versionado.

---

# 17. O que NÃO será Secret

A URL do feed de cada cliente NÃO será um Secret do GitHub nem um Secret do Worker.

Ela ficará em:

```text
/private/clientes/<ID>/feed.json
```

Exemplo:

```text
/private/clientes/00017/feed.json
```

Conteúdo:

```json
{
  "cliente_id": "00017",
  "feed_url": "https://crm.example.com/feed.xml",
  "origem": "kenlo",
  "formato": "xml",
  "ativo": true
}
```

O repositório é privado e `/private` nunca é publicado.

---

# 18. GitHub Actions — permissões do workflow

Os workflows que gerarem e commitarem JSONs deverão declarar apenas as permissões necessárias.

Exemplo conceitual:

```yaml
permissions:
  contents: write
```

Isso permite ao próprio workflow fazer commit dos JSONs gerados.

Não adicionar permissões administrativas que não sejam necessárias.

---

# 19. Workflow automático

Workflow sugerido:

```text
.github/workflows/sincronizar-feeds.yml
```

Deve aceitar:

```text
schedule
workflow_dispatch
```

Cron aprovado:

```text
09:00
12:00
15:00
18:00
23:00
```

Fuso:

```text
America/Sao_Paulo
```

Configuração conceitual:

```yaml
on:
  schedule:
    - cron: '0 9,12,15,18,23 * * *'
      timezone: 'America/Sao_Paulo'
  workflow_dispatch:
```

O GitHub Actions atualmente permite definir `timezone` usando identificador IANA.

---

# 20. Regra do workflow automático

Fluxo:

```text
inicia
↓
lê clientes ativos
↓
baixa feeds
↓
normaliza
↓
compara
↓
houve alteração?
├── NÃO
│   └── encerra
│
└── SIM
    ├── gera JSONs
    ├── gera manifestos
    ├── 1 commit consolidado
    └── push
```

Cloudflare Pages detecta o push e publica.

---

# 21. Workflow individual

Criar também:

```text
.github/workflows/sincronizar-cliente.yml
```

Deve aceitar:

```text
workflow_dispatch
```

Input:

```text
cliente_id
```

Exemplo:

```text
cliente_id = 00017
```

Fluxo:

```text
SUPERADMIN
↓
SINCRONIZAR ESTE CLIENTE
↓
Worker
↓
GitHub API
↓
workflow_dispatch
↓
sincronizar-cliente.yml
```

---

# 22. Botão SINCRONIZAR TODOS AGORA

Fluxo:

```text
SUPERADMIN
↓
[ SINCRONIZAR TODOS AGORA ]
↓
Worker
↓
GitHub API
↓
workflow_dispatch
↓
sincronizar-feeds.yml
```

Não altera o cron.

---

# 23. Botão SINCRONIZAR ESTE CLIENTE

Fluxo:

```text
SUPERADMIN
↓
Cliente 00017
↓
[ SINCRONIZAR ESTE CLIENTE ]
↓
Worker
↓
GitHub API
↓
sincronizar-cliente.yml
↓
cliente_id=00017
```

Não consulta os demais feeds.

---

# 24. Regra de commit

Obrigatória:

```text
SEM ALTERAÇÃO
= SEM COMMIT
= SEM DEPLOY
```

Mesmo uma sincronização manual deve obedecer a essa regra.

---

# 25. Cloudflare Pages e commits

Quando o GitHub recebe novo commit na branch:

```text
main
```

o Cloudflare Pages conectado via Git poderá iniciar automaticamente um novo build/deploy.

Isso significa:

```text
GitHub Action
↓
commit
↓
push main
↓
Cloudflare Pages
↓
deploy
```

Não é necessário criar token Cloudflare apenas para esse deploy se usarmos a integração Git nativa.

---

# 26. Segredos que NÃO precisamos criar inicialmente

Não criar sem necessidade:

```text
CLOUDFLARE_API_TOKEN no GitHub
CLOUDFLARE_ACCOUNT_ID no GitHub
um FEED_SECRET por cliente
senha de cliente
banco de dados
D1
KV
R2
```

Nenhum desses é necessário para a arquitetura inicial aprovada.

---

# 27. APIs utilizadas

## GitHub REST API

O Worker usará a API oficial do GitHub para:

### Criar/alterar arquivos

Exemplo de finalidade:

```text
PUT /repos/{owner}/{repo}/contents/{path}
```

Usado para cadastrar/editar clientes.

Permissão necessária:

```text
Contents: write
```

### Disparar workflow

Finalidade:

```text
POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
```

Permissão necessária:

```text
Actions: write
```

---

# 28. Cloudflare API

Na primeira versão, o painel NÃO precisa usar diretamente a Cloudflare API.

A Cloudflare será configurada pelo dashboard para:

- Pages;
- domínio;
- Worker;
- Worker Secrets.

Assim evitamos criar tokens Cloudflare adicionais sem necessidade.

---

# 29. Segurança do painel

O endpoint administrativo deve aceitar apenas HTTPS.

Cookies de sessão:

```text
Secure
HttpOnly
SameSite
```

A API deve validar:

- sessão;
- método HTTP;
- conteúdo recebido;
- tamanho do payload;
- cliente solicitado;
- campos permitidos.

Nunca permitir que o navegador informe arbitrariamente:

```text
qual arquivo do GitHub escrever
```

O navegador envia uma operação lógica:

```text
criar cliente
editar cliente
sincronizar cliente
```

O Worker decide internamente qual arquivo pode ser alterado.

---

# 30. Proteção contra escrita arbitrária

ERRADO:

```text
POST /admin/write-file

path=/qualquer/coisa
content=...
```

CERTO:

```text
POST /admin/clientes
PUT /admin/clientes/00017
POST /admin/clientes/00017/sincronizar
POST /admin/sincronizar-todos
```

O Worker controla os caminhos permitidos.

---

# 31. Dados privados

Exemplo:

```text
/private/clientes/00017/
├── cliente.json
├── feed.json
└── sincronizacao.json
```

`cliente.json`:

- razão social;
- CPF/CNPJ;
- CRECI;
- responsável;
- contatos;
- observações.

`feed.json`:

- URL;
- fornecedor;
- formato;
- ativo.

`sincronizacao.json`:

- última execução;
- último status;
- contadores;
- erro resumido.

---

# 32. Dados públicos

Exemplo:

```text
/public/dados/clientes/clientes.json
/public/dados/vendas/...
/public/dados/aluguel/...
```

Nunca copiar para público:

- CPF/CNPJ;
- URL do feed;
- anotações;
- tokens;
- informações internas.

---

# 33. Fotografias

As fotos continuam na origem.

O sistema guarda somente URLs.

Não criar:

- bucket de imagens;
- upload massivo para GitHub;
- storage adicional;

na primeira versão.

---

# 34. DNS final

Estrutura recomendada:

```text
imoveis.londrinense.net
→ Cloudflare Pages

api-imoveis.londrinense.net
→ Cloudflare Worker administrativo
```

---

# 35. Ordem correta para implantação

Executar nesta ordem:

```text
1. Criar repositório GitHub privado
2. Criar estrutura inicial
3. Conectar Cloudflare Pages ao GitHub
4. Configurar branch main
5. Configurar diretório público/build
6. Criar imoveis.londrinense.net no Pages
7. Criar Worker administrativo
8. Criar api-imoveis.londrinense.net
9. Criar Fine-grained GitHub Token
10. Dar Contents: write
11. Dar Actions: write
12. Salvar token como GITHUB_ADMIN_TOKEN no Worker
13. Criar SUPERADMIN_USER
14. Criar SUPERADMIN_PASSWORD_HASH
15. Criar SESSION_SECRET
16. Criar workflows
17. Configurar cron
18. Testar cadastro de cliente
19. Testar sincronização individual
20. Testar sincronização geral
21. Confirmar que /private não é publicado
22. Confirmar que commit só ocorre quando houve mudança
23. Confirmar deploy automático no Pages
```

---

# 36. Checklist GitHub

```text
[ ] Repositório privado criado
[ ] Branch main criada
[ ] Actions habilitado
[ ] Estrutura /private criada
[ ] Estrutura /public criada
[ ] Workflows criados
[ ] Fine-grained token criado
[ ] Token limitado a um único repositório
[ ] Contents = Read and write
[ ] Actions = Read and write
[ ] Nenhum token salvo no código
```

---

# 37. Checklist Cloudflare

```text
[ ] Projeto Pages criado
[ ] GitHub privado conectado
[ ] Acesso limitado ao repositório correto
[ ] Production branch = main
[ ] Publicação restrita ao diretório público
[ ] imoveis.londrinense.net configurado
[ ] Worker portal-londrinense-admin criado
[ ] api-imoveis.londrinense.net configurado
[ ] GITHUB_ADMIN_TOKEN criado como Secret
[ ] SUPERADMIN_USER criado como Secret
[ ] SUPERADMIN_PASSWORD_HASH criado como Secret
[ ] SESSION_SECRET criado como Secret
```

---

# 38. Checklist de segurança

```text
[ ] Repositório privado
[ ] /private nunca publicado
[ ] Token GitHub nunca chega ao browser
[ ] Senha SUPERADMIN nunca armazenada em texto puro
[ ] Token com menor privilégio possível
[ ] Token limitado a um repositório
[ ] Worker não aceita caminhos arbitrários
[ ] HTTPS obrigatório
[ ] Sessão protegida
[ ] Logs não exibem token
[ ] Logs não exibem URL privada do feed completa quando sensível
```

---

# 39. Segredos definitivos — resumo

## Cloudflare Worker Secrets

```text
GITHUB_ADMIN_TOKEN
SUPERADMIN_USER
SUPERADMIN_PASSWORD_HASH
SESSION_SECRET
```

## GitHub Actions Secrets

Inicialmente:

```text
NENHUM OBRIGATÓRIO PARA O DEPLOY DO PAGES
```

Podem ser adicionados no futuro apenas se algum serviço externo exigir.

## Arquivos privados

```text
URL DO FEED
→ /private/clientes/<ID>/feed.json
```

---

# 40. Arquitetura operacional final

```text
                       GITHUB PRIVADO
                             │
             ┌───────────────┴───────────────┐
             │                               │
        DADOS PRIVADOS                 GITHUB ACTIONS
             │                               │
        feeds/clientes            09/12/15/18/23
                                             │
                                             ▼
                                        JSON PÚBLICO
                                             │
                                      commit se mudou
                                             │
                                             ▼
                                      CLOUDFLARE PAGES
                                             │
                                             ▼
                                  imoveis.londrinense.net


SUPERADMIN
    │
    ▼
Painel
    │
    ▼
api-imoveis.londrinense.net
    │
    ▼
Cloudflare Worker
    │
    │ GITHUB_ADMIN_TOKEN
    ▼
GitHub API
```

---

# 41. Documentação oficial de referência

Cloudflare Pages — Git integration:  
https://developers.cloudflare.com/pages/configuration/git-integration/

Cloudflare Pages — GitHub integration:  
https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/

Cloudflare Pages — Custom domains:  
https://developers.cloudflare.com/pages/configuration/custom-domains/

Cloudflare Workers — Secrets:  
https://developers.cloudflare.com/workers/configuration/secrets/

GitHub — REST repository contents:  
https://docs.github.com/en/rest/repos/contents

GitHub — REST Actions workflows / workflow dispatch:  
https://docs.github.com/en/rest/actions/workflows

GitHub Actions — workflow syntax / schedule:  
https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

---

# 42. Resultado esperado

Depois desta configuração, teremos:

```text
✓ GitHub totalmente privado
✓ site totalmente público
✓ Cloudflare Pages servindo visitantes
✓ Worker usado somente pelo SUPERADMIN
✓ token GitHub protegido na Cloudflare
✓ feeds protegidos no GitHub privado
✓ GitHub Actions processando XML/JSON
✓ sincronização automática
✓ sincronização manual
✓ sem commit quando não houver mudança
✓ sem banco
✓ sem WordPress
✓ sem armazenamento próprio de fotos
✓ custo operacional inicial extremamente baixo
```
