from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]; failures=[]
for path in (ROOT/"public").rglob("*"):
    if not path.is_file(): continue
    data=path.read_text("utf-8",errors="replace")
    for pattern in (r'private/clientes',r'https?://[^\s"\']+(?:feed|xml)[^\s"\']*'):
        if re.search(pattern,data,re.I): failures.append(f"{path.relative_to(ROOT)}: conteúdo proibido")
    if path.suffix==".json":
        try:
            value=json.loads(data)
            serialized=json.dumps(value,ensure_ascii=False)
            if re.search(r'feed_url|cpf|cnpj|documento|razao_social|responsavel|observacoes',serialized,re.I):
                failures.append(f"{path.relative_to(ROOT)}: campo privado em JSON público")
        except json.JSONDecodeError: failures.append(f"{path.relative_to(ROOT)}: JSON inválido")
if failures: print("\n".join(failures)); sys.exit(1)
print("Fronteira public/ validada")
