# Guia operacional sem terminal

## Administração diária

1. Abra a URL privada do painel administrativo configurada para o Worker.
2. Entre com seu usuário. No primeiro acesso, use o token temporário fornecido por canal seguro e defina uma senha exclusiva.
3. O **SUPERADMIN** pode cadastrar os dados lógicos de um cliente, registrar sua URL HTTPS de feed, redefinir o acesso e usar **ATUALIZAR/SINCRONIZAR AGORA**. Um cliente somente consulta e altera sua própria configuração.
4. Para uma sincronização individual, abra o cliente e escolha **Sincronizar este cliente**. Para todos, use o botão geral. Se a variável de proteção estiver desligada, a interface confirma apenas uma simulação segura.
5. Acompanhe a execução pela aba **Actions** do GitHub. As mensagens não exibem a URL do feed. Uma falha mantém o último resultado válido.

## Configuração posterior no GitHub

Em **Settings → Secrets and variables → Actions**, crie a variável `ENABLE_REAL_SYNC=true` somente após auditoria. Crie `ENABLE_REAL_PUBLISH=true` somente após aprovação da publicação. Não crie token de push: somente o job `publicar` recebe `contents: write` e o checkout fornece o `GITHUB_TOKEN` efêmero e protegido da própria execução; jobs de validação permanecem em `contents: read`. Configure o ambiente `github-pages` com aprovação obrigatória. O agendamento executa todos os clientes nos cinco horários de Brasília; uma execução manual exige a palavra `SINCRONIZAR`.

## Configuração posterior do Worker

Publique `src/admin/worker.js` no Worker administrativo e configure como secrets `GITHUB_ADMIN_TOKEN`, `SUPERADMIN_USER`, `SUPERADMIN_PASSWORD_HASH` e `SESSION_SECRET`. Configure `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_ORIGIN` (a origem HTTPS exata do painel, sem barra final) e `ENABLE_REAL_SYNC` como variáveis. O hash do SUPERADMIN deve seguir `pbkdf2-sha256$310000$<salt-base64url>$<hash-base64url>`. Restrinja o token ao repositório, com Contents e Actions, e associe a API somente a HTTPS. A origem exata é obrigatória para CORS e para a proteção CSRF.

## Navegador e publicação

No GitHub, abra **Settings → Pages**, selecione GitHub Actions e mantenha a proteção do ambiente. Execute “Publicar GitHub Pages” manualmente apenas após definir `ENABLE_REAL_PUBLISH`. Valide início, busca, filtros, detalhe e anunciantes em larguras de 375, 768 e 1440 pixels usando o modo responsivo do navegador. Para Cloudflare Pages no futuro, selecione `public/` como diretório de saída; nenhum código público depende do provedor.

## Verificação do motor de busca

Sem publicar, sirva `public/` em HTTP local, abra a página inicial e valide: cascata Cidade/Região/Bairro, URL ao pesquisar, voltar/avançar, resultado zero, teclado na gaveta, grade/lista e layout em 375 px, 768 px e 1280 px. Nunca use dados de `private/` nessa verificação.

## Validação visual antes de publicar

Sirva somente `public/` em HTTP e percorra início, resultados com querystring, detalhe, anunciante, favoritos, comparação e 404. Nas larguras de 375, 768, 1024 e 1440 px, confira ausência de rolagem horizontal, menu por teclado e Escape, filtro completo/compacto, chips, alternância grade/lista, contato móvel e foco visível. Confira o console e as falhas simuladas de rede/JSON. Se não houver dados públicos, valide os estados vazios; nunca crie anúncios fictícios para a conferência.
