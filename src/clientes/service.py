from __future__ import annotations
from src.core.io import atomic_write, canonical_bytes, client_path, load_json

PRIVATE_FIELDS={"id","nome","tipo","creci","cidade","uf","descricao","logo","razao_social","documento","responsavel","email","telefone","observacoes","ativo"}
def save_client(client_id: str, data: dict) -> bool:
    if set(data)-PRIVATE_FIELDS: raise ValueError("Campo de cliente não permitido")
    clean={key:value for key,value in data.items() if key in PRIVATE_FIELDS}; clean["id"]=client_id
    return atomic_write(client_path(client_id)/"cliente.json",canonical_bytes(clean))
def save_feed(client_id: str, url: str, provider="generico", active=True) -> bool:
    if not isinstance(url,str) or len(url)>2048 or not url.startswith("https://"): raise ValueError("URL de feed inválida")
    return atomic_write(client_path(client_id)/"feed.json",canonical_bytes({"cliente_id":client_id,"feed_url":url,"origem":provider,"formato":"xml","ativo":bool(active)}))
def list_clients():
    base=client_path("abc").parent
    return [data for path in sorted(base.glob("*/cliente.json")) if (data:=load_json(path))]

