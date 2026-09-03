# Acesso temporário de homologação

Enquanto o painel estiver exclusivamente em implantação e homologação, o acesso administrativo temporário é:

- **Usuário:** `ADMIN`
- **Senha:** `TESTE`

Esse acesso concede o papel `superadmin` diretamente, sem troca obrigatória de senha. Ele está explicitamente no código para facilitar a homologação e **deve ser removido antes da publicação definitiva em produção**.

Nenhuma variável, secret, API ou configuração externa adicional é necessária para esse acesso temporário.
