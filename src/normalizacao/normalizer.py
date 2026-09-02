from __future__ import annotations
import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit

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
    return value if parsed.scheme == "https" and parsed.netloc and not parsed.username and not parsed.password else ""
def optional_number(value):
    if value in (None, ""): return None
    try: return number(value)
    except ValueError: return None
def coordinate_number(value):
    if value in (None, ""): return None
    try:
        result = Decimal(str(value).replace(",", "."))
        return float(result) if result.is_finite() else None
    except InvalidOperation: return None

def normalize(raw: dict, client_id: str) -> dict:
    external = text(raw.get("codigo"), 80)
    city, purpose = text(raw.get("cidade"), 80), text(raw.get("finalidade"), 20).lower()
    if not external or not city or purpose not in PURPOSES: raise ValueError("Campos obrigatórios inválidos")
    kind = text(raw.get("tipo"), 30).lower()
    if kind not in KINDS: kind = "outro"
    stable_id = f"{client_id}-{slug(external)}"
    images = [{"url": public_url(item.get("url")), "primary": bool(item.get("primary")), "caption": text(item.get("caption"), 240)} for item in raw.get("media", []) if item.get("medium") == "image" and public_url(item.get("url"))]
    if not images: images = [{"url": url, "primary": index == 0, "caption": ""} for index, url in enumerate(public_url(x) for x in raw.get("fotos", [])) if url]
    images = sorted(images[:30], key=lambda item: not item["primary"])
    videos = [public_url(item.get("url")) for item in raw.get("media", []) if item.get("medium") == "video" and public_url(item.get("url"))]
    lat, lon = coordinate_number(raw.get("latitude")), coordinate_number(raw.get("longitude"))
    coordinates = {"latitude": lat, "longitude": lon} if lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180 else None
    amenities = list(dict.fromkeys(filter(None, (text(value, 120) for value in raw.get("amenities", [])))))[:100]
    contact = raw.get("contact") or {}
    public_contact = {key: value for key, value in {"name": text(contact.get("name"), 160), "email": text(contact.get("email"), 254), "website": public_url(contact.get("website")), "logo": public_url(contact.get("logo")), "telephone": text(contact.get("telephone"), 40)}.items() if value}
    result = {"id": stable_id, "cliente_id": client_id, "codigo": external, "titulo": text(raw.get("titulo"), 160), "descricao": text(raw.get("descricao"), 5000), "cidade": city, "bairro": text(raw.get("bairro"), 100), "uf": text(raw.get("uf"), 2).upper(), "finalidade": purpose, "tipo": kind, "preco": number(raw.get("preco") or 0), "area": number(raw.get("area") or 0), "quartos": int(number(raw.get("quartos") or 0)), "suites": int(number(raw.get("suites") or 0)), "banheiros": int(number(raw.get("banheiros") or 0)), "vagas": int(number(raw.get("vagas") or 0)), "condominio": optional_number(raw.get("condominio")), "iptu": optional_number(raw.get("iptu")), "fotos": [item["url"] for item in images], "images": images, "amenities": amenities, "publicContact": public_contact}
    if coordinates: result["coordinates"] = coordinates
    if videos: result["videoYoutube"] = videos[0]
    tour = public_url(raw.get("virtual_tour"))
    if tour: result["virtualTour"] = tour
    return result
