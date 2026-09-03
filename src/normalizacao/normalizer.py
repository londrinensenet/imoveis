from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit

from src.core.io import CLIENT_ID


KINDS = {"casa", "apartamento", "terreno", "comercial", "rural", "galpao", "outro"}
PURPOSES = {"venda", "aluguel"}
MEDIA_TYPES = {"image", "video"}
MAX_AREA_M2 = Decimal("1000000000")
MAX_MONEY = Decimal("1000000000000")
MAX_COUNT = Decimal("1000")
OFFICIAL_FEATURES = {
    "Academia", "Acessibilidade", "Ar-condicionado", "Churrasqueira", "Elevador",
    "Jardim", "Mobiliado", "Piscina", "Playground", "Pomar", "Portaria",
    "Quintal", "Salão de festas", "Sauna", "Varanda",
}


def text(value, maximum=200):
    return " ".join(str(value or "").split())[:maximum]


def slug(value):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", text(value).lower()))


def number(value, minimum=0, maximum=None):
    try:
        result = Decimal(str(value).strip().replace(",", "."))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Número inválido") from exc
    if not result.is_finite() or result < Decimal(str(minimum)):
        raise ValueError("Número fora do limite")
    if maximum is not None and result > Decimal(str(maximum)):
        raise ValueError("Número fora do limite")
    return float(result)


def public_url(value):
    candidate = text(value, 2048)
    parsed = urlsplit(candidate)
    return candidate if parsed.scheme == "https" and parsed.netloc and not parsed.username and not parsed.password and not parsed.fragment else ""


def rural_area_m2(value, unit="m2"):
    """Converte uma área rural declarada para a unidade canônica (m²)."""
    normalized_unit = text(unit, 20).lower().replace("²", "2").replace(" ", "")
    if normalized_unit in {"alqueire", "alqueires"}:
        raise ValueError("Alqueire não é uma unidade permitida")
    if normalized_unit in {"ha", "hectare", "hectares"}:
        factor = Decimal("10000")
    elif normalized_unit in {"m2", "metroquadrado", "metrosquadrados", ""}:
        factor = Decimal("1")
    else:
        raise ValueError("Unidade de área inválida")
    result = Decimal(str(number(value, 0))) * factor
    if result > MAX_AREA_M2:
        raise ValueError("Número fora do limite")
    return float(result)


def rural_area_presentation(area_m2):
    area = Decimal(str(number(area_m2, 0, MAX_AREA_M2)))
    if area < Decimal("10000"):
        return {"value": float(area), "unit": "m²"}
    return {"value": float(area / Decimal("10000")), "unit": "ha"}


def rural_filter_m2(value, unit="m2"):
    """Normaliza limites do filtro; comparações permanecem sempre em m²."""
    return rural_area_m2(value, unit)


def _mapping(value):
    return value if isinstance(value, dict) else {}


def _sequence(value):
    if isinstance(value, list):
        return value
    return [value] if isinstance(value, dict) else []


def _first(mapping, *names, default=None):
    for name in names:
        if name in mapping and mapping[name] not in (None, ""):
            return mapping[name]
    return default


def _location(raw):
    source = _mapping(_first(raw, "Location", "location", default={}))
    latitude = _first(source, "Latitude", "latitude", default=_first(raw, "Latitude", "latitude"))
    longitude = _first(source, "Longitude", "longitude", default=_first(raw, "Longitude", "longitude"))
    result = {
        "zone": text(_first(source, "Zone", "zone", default=_first(raw, "Zone", "zone")), 100),
    }
    if latitude not in (None, ""):
        result["latitude"] = number(latitude, -90, 90)
    if longitude not in (None, ""):
        result["longitude"] = number(longitude, -180, 180)
    return {key: value for key, value in result.items() if value not in (None, "")}


def _media(raw):
    source = _first(raw, "Media", "media", default=[])
    if isinstance(source, dict):
        source = _first(source, "Item", "item", "MediaItem", default=source)
    result = []
    for item in _sequence(source)[:60]:
        kind = text(_first(item, "Type", "type"), 10).lower()
        url = public_url(_first(item, "URL", "Url", "url", "Link", "link"))
        if kind not in MEDIA_TYPES or not url:
            continue
        normalized = {"type": kind, "url": url}
        if kind == "image":
            normalized["primary"] = str(_first(item, "Primary", "primary", default="")).lower() in {"1", "true", "yes", "sim"}
            caption = text(_first(item, "Caption", "caption"), 300)
            if caption:
                normalized["caption"] = caption
        result.append(normalized)
    return result


def _features(raw):
    source = _first(raw, "Features", "features", default=[])
    if isinstance(source, dict):
        source = _first(source, "Feature", "feature", default=[])
    values = source if isinstance(source, list) else [source]
    return list(dict.fromkeys(value for value in (text(item, 100) for item in values[:100]) if value in OFFICIAL_FEATURES))


def _contact_info(raw):
    source = _mapping(_first(raw, "ContactInfo", "contact_info", default={}))
    allowed = {
        "name": ("Name", "name"),
        "email": ("Email", "email"),
        "phone": ("Phone", "phone", "Telephone", "telephone"),
        "website": ("Website", "website"),
    }
    result = {}
    for target, names in allowed.items():
        value = text(_first(source, *names), 254)
        if target == "website":
            value = public_url(value)
        if value:
            result[target] = value
    return result


def normalize(raw: dict, client_id: str) -> dict:
    if not isinstance(raw, dict) or not isinstance(client_id, str) or not CLIENT_ID.fullmatch(client_id):
        raise ValueError("Entrada ou cliente inválido")
    external = text(_first(raw, "codigo", "ListingID", "Code"), 80)
    city = text(_first(raw, "cidade", "City"), 80)
    purpose = text(_first(raw, "finalidade", "TransactionType"), 20).lower()
    if not external or not city or purpose not in PURPOSES:
        raise ValueError("Campos obrigatórios inválidos")
    kind = text(_first(raw, "tipo", "PropertyType"), 30).lower()
    if kind not in KINDS:
        kind = "outro"
    external_slug = slug(external)
    if not external_slug:
        raise ValueError("Código não produz ID público válido")

    media = _media(raw)
    legacy_photos = [url for url in (public_url(item) for item in raw.get("fotos", [])) if url][:30]
    media_photos = [item["url"] for item in media if item["type"] == "image"]
    photos = (media_photos + legacy_photos)[:30]
    location = _location(raw)
    details = _mapping(_first(raw, "Details", "details", default={}))
    raw_area = _first(details, "LotArea", "lot_area", default=_first(raw, "area", default=0))
    area_unit = _first(details, "LotAreaUnit", "lot_area_unit", default="m2")
    area = rural_area_m2(raw_area, area_unit) if kind == "rural" else number(raw_area, 0, MAX_AREA_M2)

    result = {
        "id": f"{client_id}-{external_slug}",
        "cliente_id": client_id,
        "codigo": external,
        "titulo": text(_first(raw, "titulo", "Title"), 160),
        "descricao": text(_first(raw, "descricao", "Description"), 5000),
        "cidade": city,
        "bairro": text(_first(raw, "bairro", "Neighborhood"), 100),
        "uf": text(_first(raw, "uf", "State"), 2).upper(),
        "finalidade": purpose,
        "tipo": kind,
        "preco": number(_first(raw, "preco", "ListPrice", default=0), 0, MAX_MONEY),
        "preco_venda": number(_first(raw, "ListPrice", "preco_venda", default=_first(raw, "preco", default=0)), 0, MAX_MONEY),
        "preco_aluguel": number(_first(raw, "RentalPrice", "preco_aluguel", default=_first(raw, "preco", default=0)), 0, MAX_MONEY),
        "area": area,
        "area_util": number(_first(details, "LivingArea", "living_area", default=_first(raw, "LivingArea", default=0)), 0, MAX_AREA_M2),
        "area_terreno": number(raw_area, 0, MAX_AREA_M2) if kind != "rural" else area,
        "quartos": int(number(_first(raw, "quartos", "Bedrooms", default=0), 0, MAX_COUNT)),
        "suites": int(number(_first(raw, "suites", "Suites", default=0), 0, MAX_COUNT)),
        "banheiros": int(number(_first(raw, "banheiros", "Bathrooms", default=0), 0, MAX_COUNT)),
        "vagas": int(number(_first(raw, "vagas", "Garage", default=0), 0, MAX_COUNT)),
        "andar": int(number(_first(raw, "UnitFloor", default=_first(details, "UnitFloor", default=0)), 0, MAX_COUNT)),
        "andares": int(number(_first(raw, "Floors", default=_first(details, "Floors", default=0)), 0, MAX_COUNT)),
        "ano_construcao": int(number(_first(raw, "YearBuilt", default=_first(details, "YearBuilt", default=0)), 0, 3000)),
        "subtipo": text(_first(details, "PropertyType", "property_type", default=""), 80),
        "fotos": photos,
        "location": location,
        "media": media,
        "features": _features(raw),
        "contact_info": _contact_info(raw),
    }
    # Um anúncio só entra na publicação quando a operação declarada possui preço
    # numérico estritamente positivo. A validação ocorre no core, antes dos JSONs.
    required_price = result["preco_venda" if purpose == "venda" else "preco_aluguel"]
    if required_price <= 0:
        raise ValueError("Imóvel sem preço válido para a operação")
    result["preco"] = required_price
    tour = public_url(_first(raw, "VirtualTourLink", "virtual_tour_link"))
    if tour:
        result["virtual_tour_link"] = tour
    if kind == "rural":
        result["area_apresentacao"] = rural_area_presentation(area)
    return result
