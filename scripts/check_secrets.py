"""Varre a árvore de trabalho e todo o histórico Git alcançável sem exibir valores."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
PATTERNS=[re.compile(value) for value in (r"gh[pousr]_[A-Za-z0-9_]{30,}",r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----",r"(?i)(?:password|token|secret)\s*[:=]\s*[\"\'][^$<{\s][^\"\']{10,}")]
failures=set()

def inspect(label, data):
    text=data.decode("utf-8",errors="ignore")
    if any(pattern.search(text) for pattern in PATTERNS): failures.add(label)

for path in ROOT.rglob("*"):
    if path.is_file() and ".git" not in path.parts and path.suffix.lower() not in {".png",".jpg",".jpeg",".woff",".woff2"}:
        inspect(str(path.relative_to(ROOT)),path.read_bytes())

try:
    objects=subprocess.run(["git","rev-list","--objects","--all"],cwd=ROOT,check=True,capture_output=True,text=True).stdout.splitlines()
    seen=set()
    for line in objects:
        object_id, _, name=line.partition(" ")
        if object_id in seen: continue
        seen.add(object_id)
        kind=subprocess.run(["git","cat-file","-t",object_id],cwd=ROOT,capture_output=True,text=True).stdout.strip()
        if kind!="blob": continue
        data=subprocess.run(["git","cat-file","blob",object_id],cwd=ROOT,check=True,capture_output=True).stdout
        if len(data)<=10_000_000: inspect("histórico:"+(name or object_id[:12]),data)
except (OSError,subprocess.SubprocessError) as exc:
    print("Não foi possível varrer o histórico Git",file=sys.stderr);sys.exit(2)
if failures:
    print("Possíveis segredos encontrados em: "+", ".join(sorted(failures)));sys.exit(1)
print(f"Nenhum segredo reconhecível encontrado (árvore e {len(seen)} objetos históricos)")
