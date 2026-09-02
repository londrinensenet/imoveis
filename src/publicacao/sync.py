from __future__ import annotations
import argparse, hashlib
from datetime import datetime, timezone
from pathlib import Path
from src.clientes.service import list_clients
from src.core.io import ROOT, atomic_write, canonical_bytes, client_path, load_json
from src.feeds.importer import download, parse
from src.normalizacao.normalizer import normalize
from src.publicacao.generator import generate

def safe_status(client_id, status, count=0, error=""):
    message={"cliente_id":client_id,"estado":status,"horario":datetime.now(timezone.utc).isoformat(),"quantidade":count}
    if error: message["erro"]="Falha ao obter ou validar o feed" # nunca inclui URL/detalhes
    atomic_write(client_path(client_id)/"sincronizacao.json",canonical_bytes(message))

def sync_client(client_id: str, fetch=download) -> list[dict] | None:
    config=load_json(client_path(client_id)/"feed.json")
    if not config or not config.get("ativo"): return None
    try:
        properties=[normalize(item,client_id) for item in parse(fetch(config["feed_url"]))]
        atomic_write(client_path(client_id)/"ultimo-valido.json",canonical_bytes(properties))
        safe_status(client_id,"sucesso",len(properties)); return properties
    except Exception:
        safe_status(client_id,"falha",error="sanitized")
        return load_json(client_path(client_id)/"ultimo-valido.json")

def sync(selected: str | None=None, dry_run=False) -> bool:
    clients=[c for c in list_clients() if c.get("ativo",True) and (not selected or c["id"]==selected)]
    properties=[]
    for client in clients:
        result=sync_client(client["id"])
        if result: properties.extend(result)
    if dry_run: return False
    return generate(properties,clients,ROOT/"public"/"dados")

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--cliente"); parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args(); changed=sync(args.cliente,args.dry_run); print("alterado" if changed else "sem-alteracoes")
if __name__=="__main__": main()

