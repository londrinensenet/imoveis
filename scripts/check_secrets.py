from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]; bad=[]
patterns=[r'gh[pousr]_[A-Za-z0-9_]{30,}',r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',r'(?i)(?:password|token|secret)\s*[:=]\s*["\'][^$<{\s][^"\']{10,}']
for path in ROOT.rglob("*"):
    if path.is_file() and ".git" not in path.parts and path.suffix not in {".png",".jpg",".woff"}:
        text=path.read_text("utf-8",errors="ignore")
        if any(re.search(p,text) for p in patterns): bad.append(str(path.relative_to(ROOT)))
if bad: print("Possíveis segredos: "+", ".join(bad)); sys.exit(1)
print("Nenhum segredo reconhecível encontrado")
