# Instruções obrigatórias para agentes

Estas regras se aplicam a todo o repositório:

1. Leia `ARQUITETURA.md` integralmente antes de alterar qualquer arquivo.
2. Pare sem modificar arquivos se `ARQUITETURA.md` estiver ausente.
3. Não modifique decisões arquiteturais sem autorização expressa do responsável pelo projeto.
4. Nunca publique, copie ou exponha dados de `private/` em `public/`, logs ou respostas públicas.
5. Nunca versione segredos, credenciais, tokens, senhas, chaves ou certificados reais.
6. Não use Cloudflare D1 nem Cloudflare KV.
7. Não realize merge automático; toda integração em `main` exige revisão e merge manual.
8. Execute somente a fase expressamente solicitada e respeite seus limites.
9. Em fases de implementação, não crie TODOs, mocks, placeholders ou funcionalidades obrigatórias parciais.
10. Preserve alterações válidas já existentes e evite reescrever funcionalidades corretas.
11. Informe todos os testes e verificações executados, incluindo falhas e limitações reais.
12. Mantenha `public/` como a única raiz publicável e trate `private/` como estritamente confidencial.
