from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]; failures=[]
for path in (ROOT/"public").rglob("*"):
    if not path.is_file(): continue
    data=path.read_text("utf-8",errors="replace")
    for pattern in (r'feed_url',r'private/clientes',r'cpf|cnpj|documento|razao_social|responsavel|observacoes',r'https?://[^\s"\']+(?:feed|xml)[^\s"\']*'):
        if re.search(pattern,data,re.I): failures.append(f"{path.relative_to(ROOT)}: conteúdo proibido")
    if path.suffix==".json":
        try: json.loads(data)
        except json.JSONDecodeError: failures.append(f"{path.relative_to(ROOT)}: JSON inválido")
if failures: print("\n".join(failures)); sys.exit(1)
print("Fronteira public/ validada")

