from __future__ import annotations

import os
import re
import shutil
import tempfile
import unicodedata
import urllib.parse
from collections import defaultdict
from pathlib import Path

from src.core.io import canonical_bytes

CARD_FIELDS = ("id", "cliente_id", "titulo", "cidade", "bairro", "uf", "finalidade", "tipo", "preco", "area", "quartos", "banheiros", "vagas")
FULL_FIELDS = CARD_FIELDS + ("codigo", "descricao", "fotos", "location", "media", "features", "contact_info", "virtual_tour_link", "area_apresentacao")
PUBLIC_CLIENT_FIELDS = ("id", "nome", "tipo", "creci", "cidade", "uf", "descricao", "logo")
TARGET = 1_000_000


def select(item, fields):
    return {key: item[key] for key in fields if key in item}


def slug_value(value):
    value = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value)) or "nao-informado"


def chunks(cards, target=TARGET):
    result, current = [], []
    for card in cards:
        if len(canonical_bytes([card])) > target:
            raise ValueError("Card público excede o limite de shard")
        candidate = current + [card]
        if current and len(canonical_bytes(candidate)) > target:
            result.append(current)
            current = [card]
        else:
            current = candidate
    if current:
        result.append(current)
    return result


def _write(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canonical_bytes(value))


def _snapshot(root: Path) -> dict[str, bytes]:
    if not root.exists():
        return {}
    return {str(path.relative_to(root)): path.read_bytes() for path in sorted(root.rglob("*")) if path.is_file()}


def generate(properties: list[dict], clients: list[dict], output: Path) -> bool:
    """Constrói a árvore inteira fora de ``public`` e a troca de forma atômica.

    A reconstrução integral também remove imóveis, shards e grupos que deixaram de
    existir, sem expor uma publicação parcialmente atualizada.
    """
    properties = sorted(properties, key=lambda item: item["id"])
    ids = [item["id"] for item in properties]
    if any(not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,159}", item_id) for item_id in ids):
        raise ValueError("ID público inválido")
    if len(ids) != len(set(ids)):
        raise ValueError("IDs públicos duplicados")

    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".dados-", dir=output.parent))
    try:
        for prop in properties:
            _write(stage / "imoveis" / f'{prop["id"]}.json', select(prop, FULL_FIELDS))

        cards = [select(prop, CARD_FIELDS) | {"foto": prop.get("fotos", [""])[0] if prop.get("fotos") else ""} for prop in properties]
        groups = {"todos": cards}
        for dimension in ("cidade", "finalidade", "tipo", "cliente_id"):
            grouped = defaultdict(list)
            for card in cards:
                grouped[slug_value(card[dimension])].append(card)
            groups.update({f"{dimension}/{key}": value for key, value in grouped.items()})

        manifests = {}
        for name, values in sorted(groups.items()):
            files = []
            for index, part in enumerate(chunks(values), 1):
                relative = f"indices/{name}/parte-{index:04d}.json"
                _write(stage / relative, part)
                files.append(relative)
            manifests[name] = {"total": len(values), "partes": files}
        _write(stage / "indices" / "manifesto.json", manifests)
        public_clients = [select(client, PUBLIC_CLIENT_FIELDS) for client in sorted(clients, key=lambda item: item["id"])]
        for client in public_clients:
            if "logo" in client:
                parsed = urllib.parse.urlsplit(str(client["logo"]))
                if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
                    client.pop("logo")
        _write(stage / "clientes" / "clientes.json", public_clients)

        if _snapshot(output) == _snapshot(stage):
            return False
        backup = output.with_name(f".{output.name}-anterior")
        shutil.rmtree(backup, ignore_errors=True)
        if output.exists():
            os.replace(output, backup)
        try:
            os.replace(stage, output)
        except BaseException:
            if backup.exists():
                os.replace(backup, output)
            raise
        shutil.rmtree(backup, ignore_errors=True)
        return True
    finally:
        shutil.rmtree(stage, ignore_errors=True)
