# Clientes e acesso

Cada cliente reside privadamente em `private/clientes/<ID>/`. O ID tem cinco dígitos, é reservado por um contador privado monotônico e não pode ser informado ou alterado no painel. Exclusões não fazem o contador retroceder.

O cadastro privado contém a Conta Google autorizada (`email_login`), CPF/CNPJ normalizado, contato administrativo, endereço e observações. O feed XML ou JSON permanece em `feed.json`; HTTP é admitido para origens legadas e HTTPS é o padrão recomendado. Imagens são apenas referências HTTPS externas, classificadas como `logo` ou `foto`; não há upload.

Depois da validação do ID token Google, o Worker atribui `role: CLIENTE` e o `cliente_id` correspondente. Não existe autenticação local por senha.

A publicação usa uma allowlist: nome e descrição públicos, CRECI, telefone público, WhatsApp, e-mail público, site, tipo e URL da imagem. E-mail de login, documento fiscal, feed, contato administrativo, endereço e observações nunca compõem o read model público.
