from __future__ import annotations
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit
from src.core.io import CLIENT_ID

KINDS = {"casa", "apartamento", "terreno", "comercial", "rural", "outro"}
PURPOSES = {"venda", "aluguel"}
def text(value, maximum=200): return " ".join(str(value or "").split())[:maximum]
def slug(value): return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text(value).lower()))
def number(value, minimum=0):
    try: result = Decimal(str(value).replace(",", "."))
    except InvalidOperation as exc: raise ValueError("Número inválido") from exc
    if not result.is_finite() or result < minimum: raise ValueError("Número fora do limite")
    return float(result)
def public_url(value):
    parsed = urlsplit(text(value, 2048))
    return value if parsed.scheme == "https" and parsed.netloc and not parsed.username else ""

def normalize(raw: dict, client_id: str) -> dict:
    if not isinstance(raw, dict) or not isinstance(client_id, str) or not CLIENT_ID.fullmatch(client_id):
        raise ValueError("Entrada ou cliente inválido")
    external = text(raw.get("codigo"), 80)
    city, purpose = text(raw.get("cidade"), 80), text(raw.get("finalidade"), 20).lower()
    if not external or not city or purpose not in PURPOSES: raise ValueError("Campos obrigatórios inválidos")
    kind = text(raw.get("tipo"), 30).lower()
    if kind not in KINDS: kind = "outro"
    external_slug = slug(external)
    if not external_slug: raise ValueError("Código não produz ID público válido")
    stable_id = f"{client_id}-{external_slug}"
    photos = [url for url in (public_url(x) for x in raw.get("fotos", [])) if url][:30]
    return {"id": stable_id, "cliente_id": client_id, "codigo": external, "titulo": text(raw.get("titulo"), 160), "descricao": text(raw.get("descricao"), 5000), "cidade": city, "bairro": text(raw.get("bairro"), 100), "uf": text(raw.get("uf"), 2).upper(), "finalidade": purpose, "tipo": kind, "preco": number(raw.get("preco", 0)), "area": number(raw.get("area", 0)), "quartos": int(number(raw.get("quartos", 0))), "banheiros": int(number(raw.get("banheiros", 0))), "vagas": int(number(raw.get("vagas", 0))), "fotos": photos}
