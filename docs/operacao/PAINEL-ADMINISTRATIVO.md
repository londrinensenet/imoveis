# Painel administrativo — núcleo funcional e evolução

## Escopo desta entrega

Esta entrega substitui a tela provisória pelo núcleo modular do painel: shell responsivo, sessão, dashboard calculado a partir da fonte administrativa privada, listagem/pesquisa/filtros de clientes, cadastro e edição persistidos por commit, página contextual do cliente, ciclo de status recuperável, configuração/teste de feed e disparo das sincronizações existentes.

A aplicação usa exclusivamente a Pages Function como fronteira administrativa. O navegador não consulta `private/`, não obtém métricas de JSON público e não recebe a URL de feed em respostas públicas. Cada escrita usa caminhos internos derivados de IDs validados e a API de conteúdo do repositório privado.

## Contratos implementados

- `GET /api/sessao`
- `GET|POST|PUT /api/clientes` (`PUT` é mantido por compatibilidade)
- `GET|PUT /api/clientes/:id`
- `POST /api/clientes/:id/ativar|desativar|suspender`
- `GET /api/clientes/:id/exportar`
- `GET|PUT /api/clientes/:id/feed`
- `POST /api/clientes/:id/feed/testar`
- `POST /api/clientes/:id/sincronizar`
- `GET /api/dashboard`
- `POST /api/sincronizar`
- `POST /api/logout`

O retorno `solicitacao_enviada` significa apenas que o GitHub aceitou o dispatch. A conclusão deve ser confirmada no histórico do workflow.

## Segurança operacional

A API exige HTTPS, origem administrativa exata, cookie `HttpOnly; Secure; SameSite=Strict`, payload JSON limitado e autorização no servidor. IDs têm allowlist e nunca são aceitos como caminhos. Feeds exigem HTTPS, não aceitam credenciais, fragmentos, localhost nem faixas IP privadas literais. Erros externos são sanitizados. O token GitHub e demais credenciais existem apenas como bindings da Function.

O acesso ADMIN/TESTE de homologação foi preservado conforme a PR #12. Ele não deve ser removido antes da implementação e validação do fluxo definitivo solicitado.

## Backlog por incrementos completos

O volume restante deve ser entregue em incrementos verticais, sem controles inoperantes:

1. **Identidade definitiva:** usuários e funções persistidos privadamente, matriz de permissões, sessões revogáveis, alteração/redefinição de senha e desativação segura de ADMIN/TESTE.
2. **Observabilidade:** registros privados sanitizados de auditoria e sincronização, consulta/paginação, correlação com workflows e diagnóstico completo das integrações.
3. **Catálogo administrativo:** índices administrativos gerados privadamente pelo sincronizador, imóveis/rejeições/origem permitida e exportações, mantendo XML como autoridade.
4. **Configuração versionada:** conteúdo institucional e limites operacionais com validação, histórico Git e restauração confirmada.
5. **Operação avançada:** ações em lote, histórico detalhado, relatórios e recuperação de versões.

Cada incremento requer autorização server-side, persistência confirmada e testes de isolamento antes de expor a respectiva rota na navegação.
