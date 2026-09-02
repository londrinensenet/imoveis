from __future__ import annotations
import json, os, re, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLIENT_ID = re.compile(r"^[a-z0-9][a-z0-9-]{2,39}$")

def client_path(client_id: str) -> Path:
    if not isinstance(client_id, str) or not CLIENT_ID.fullmatch(client_id): raise ValueError("ID de cliente inválido")
    return ROOT / "private" / "clientes" / client_id

def load_json(path: Path, default=None):
    try: return json.loads(path.read_text("utf-8"))
    except FileNotFoundError: return default

def canonical_bytes(data) -> bytes:
    return (json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()

def atomic_write(path: Path, content: bytes) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() == content: return False
    fd, name = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as stream: stream.write(content)
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)
    return True

