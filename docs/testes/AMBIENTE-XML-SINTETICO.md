# Ambiente de teste — cliente XML sintético

Este ambiente valida o fluxo real `XML HTTPS → cliente privado → sincronização → normalização → JSON público → site` sem depender de uma imobiliária real.

## Identidade do cenário

- ID: `cliente-teste-001`
- Slug: `imobiliaria-modelo`
- Nome: **Imobiliária Modelo Londrina — TESTE**
- Cidade: Londrina/PR
- Feed público sintético: `https://imoveis.londrinense.net/feeds-teste/imobiliaria-modelo.xml`

O arquivo é deliberadamente público e contém somente imóveis fictícios. Essa exceção não autoriza a publicação da URL de feeds reais, configurações privadas, credenciais ou dados pessoais.

## Cadastro pelo painel

1. Entre como SUPERADMIN.
2. Crie o cliente com os dados acima e marque-o como teste/sintético quando o painel disponibilizar essa classificação.
3. Registre a URL HTTPS do feed somente na configuração privada do cliente.
4. Execute primeiro a simulação/dry-run da sincronização individual.
5. Confira lidos, aceitos, rejeitados e publicados.
6. Ative a sincronização real somente depois da conferência e acompanhe a execução em Actions.

## Resultado esperado

O feed possui 24 imóveis de venda e aluguel, distribuídos entre apartamentos, casas, terrenos, comerciais, galpões e rurais, nas regiões Central, Norte, Sul, Leste, Oeste e Rural. Há áreas rurais abaixo de 10.000 m² e iguais ou superiores a um hectare. Um anúncio não contém foto para validar o fallback.

Uma execução repetida sem mudança não deve criar commit. Alterações futuras no feed devem atualizar somente os resultados afetados. Falhas temporárias devem preservar o último resultado válido.

## Remoção

Desative o cliente no painel, execute a sincronização/publicação prevista pela arquitetura e confirme a remoção dos índices e JSONs derivados. Depois remova sua configuração privada. O feed sintético pode permanecer como fixture pública de regressão.
