# Autenticação — limites e modelo pendente

## Levantamento da arquitetura disponível

O arquivo `ARQUITETURA.md` **não existe neste repositório** na data desta decisão. O único documento arquitetural disponível é o manual em `public/PORTAL-LONDRINENSE-MANUAL-CONFIGURACAO-CLOUDFLARE-GITHUB.md`. Ele define somente:

- um **SUPERADMIN**, autenticado no futuro Worker administrativo;
- um token GitHub fine-grained usado pelo Worker;
- um segredo de sessão;
- cadastros de **clientes**, que são registros administrados e não são definidos como usuários autenticáveis;
- URLs privadas de feeds, que podem ser sensíveis, mas não são credenciais de login.

Não há definição para administradores delegados, imobiliárias, corretores ou clientes autenticáveis, nem para persistência de identidades, e-mail, recuperação de conta, duração de sessões, política de senha ou modelo de autorização.

## Decisão

Não serão implementados formulário, endpoint ou credencial de login enquanto a arquitetura não definir, no mínimo:

1. quais atores podem autenticar e seus papéis/permissões;
2. o armazenamento transacional de usuários, sessões, desafios de primeiro acesso e auditoria;
3. o canal verificado para entrega de convites e recuperação;
4. os tempos de sessão absoluta e ociosa;
5. os requisitos de senha e segundo fator;
6. a tecnologia e os parâmetros de derivação de senha suportados pelo runtime;
7. a política de bloqueio, desbloqueio e proteção contra enumeração;
8. os domínios e origens permitidos para painel e API.

Criar agora login baseado em arquivo Git, JSON público, variável contendo uma senha ou uma lista fixa de usuários produziria um sistema incompatível e inseguro. Esta entrega, portanto, limita-se à estrutura de configuração, documentação operacional e verificações contra vazamento. Isso segue a solicitação de não inventar um modelo quando a arquitetura é insuficiente.

## Requisitos obrigatórios para a futura implementação

- Senhas nunca serão persistidas ou registradas; somente derivadores resistentes a ataque offline, com salt único aleatório por senha e parâmetros versionados. O pepper, se adotado, fica separado do banco.
- Comparações de credenciais e tokens serão feitas em tempo constante.
- Convites, primeiro acesso e redefinições usarão tokens aleatórios, de uso único, armazenados somente por hash, com finalidade e expiração explícitas.
- Alterar ou redefinir senha revogará todas as sessões do usuário. O SUPERADMIN não verá, escolherá nem receberá a nova senha do cliente; apenas emitirá um convite de redefinição.
- Sessões terão identificador aleatório armazenado por hash, expiração absoluta, expiração por inatividade, rotação após autenticação/elevação e revogação no servidor. Cookies serão `Secure`, `HttpOnly`, `SameSite=Strict`, sem token em URL ou armazenamento do navegador.
- Tentativas serão limitadas por conta e por origem, com atraso progressivo e bloqueio temporário. As respostas não revelarão se uma conta existe. Desbloqueios e redefinições serão auditados.
- Logs usarão lista permitida de campos e nunca conterão senha, hash, cookie, cabeçalho de autorização, token, URL completa de feed ou dados de recuperação.
- Nenhum artefato em `public/` poderá conter credenciais, hashes, tokens, sessões, convites ou dados privados.
- Autorização será negada por padrão e verificada no servidor em todas as operações; esconder controles na interface não é autorização.

## Estados mínimos a modelar

Uma identidade deverá possuir estado (`CONVIDADO`, `ATIVO`, `BLOQUEADO`, `DESATIVADO`), papel definido pela arquitetura, versão de credencial e datas de criação/alteração. Desafios de primeiro acesso e recuperação são entidades separadas e descartáveis. Sessões são entidades revogáveis, nunca JWTs irrevogáveis de longa duração.

## Critério para remover a pendência

A implementação só pode começar após inclusão e aprovação de `ARQUITETURA.md` com as decisões acima. Os testes deverão cobrir primeiro acesso, alteração e redefinição, revogação global, expiração absoluta/ociosa, rotação, concorrência, bloqueio, enumeração, CSRF, autorização por papel e ausência de segredos nos logs e na saída pública.
