from __future__ import annotations
from collections import defaultdict
from pathlib import Path
from src.core.io import atomic_write, canonical_bytes

CARD_FIELDS = ("id", "cliente_id", "titulo", "cidade", "bairro", "uf", "finalidade", "tipo", "preco", "area", "quartos", "banheiros", "vagas")
FULL_FIELDS = CARD_FIELDS + ("codigo", "descricao", "fotos")
TARGET = 1_000_000
def select(item, fields): return {key: item[key] for key in fields if key in item}

def chunks(cards, target=TARGET):
    result, current = [], []
    for card in cards:
        candidate = current + [card]
        if current and len(canonical_bytes(candidate)) > target: result.append(current); current = [card]
        else: current = candidate
    if current: result.append(current)
    return result

def generate(properties: list[dict], clients: list[dict], output: Path) -> bool:
    properties = sorted(properties, key=lambda x: x["id"])
    changed = False
    for prop in properties: changed |= atomic_write(output / "imoveis" / f'{prop["id"]}.json', canonical_bytes(select(prop, FULL_FIELDS)))
    cards = [select(prop, CARD_FIELDS) | {"foto": prop.get("fotos", [""])[0] if prop.get("fotos") else ""} for prop in properties]
    groups = {"todos": cards}; dimensions = ("cidade", "finalidade", "tipo", "cliente_id")
    for dimension in dimensions:
        grouped = defaultdict(list)
        for card in cards: grouped[slug_value(card[dimension])].append(card)
        groups.update({f"{dimension}/{key}": value for key, value in grouped.items()})
    manifests = {}
    for name, values in sorted(groups.items()):
        files=[]
        for index, part in enumerate(chunks(values), 1):
            rel=f"indices/{name}/parte-{index:04d}.json"; changed |= atomic_write(output / rel, canonical_bytes(part)); files.append(rel)
        manifests[name] = {"total": len(values), "partes": files}
    changed |= atomic_write(output / "indices" / "manifesto.json", canonical_bytes(manifests))
    public_clients=[{k:c[k] for k in ("id","nome","tipo","creci","cidade","uf","descricao","logo") if k in c} for c in sorted(clients,key=lambda x:x["id"])]
    changed |= atomic_write(output / "clientes" / "clientes.json", canonical_bytes(public_clients))
    return changed

def slug_value(value):
    import re, unicodedata
    value=unicodedata.normalize("NFKD",str(value)).encode("ascii","ignore").decode().lower()
    return re.sub(r"(^-|-$)","",re.sub(r"[^a-z0-9]+","-",value)) or "nao-informado"
