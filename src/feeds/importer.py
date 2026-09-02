from __future__ import annotations
import ipaddress, socket, urllib.parse, urllib.request
from xml.etree import ElementTree as ET

MAX_FEED = 25 * 1024 * 1024
MAX_ITEMS = 100_000


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, safe_feed_url(newurl))

def safe_feed_url(url: str) -> str:
    if not isinstance(url, str) or len(url) > 2048:
        raise ValueError("URL de feed inválida")
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError("Feed deve usar HTTPS")
    for info in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global: raise ValueError("Destino de feed não permitido")
    return url

def download(url: str, timeout: int = 30) -> bytes:
    request = urllib.request.Request(safe_feed_url(url), headers={"User-Agent": "PortalLondrinense/2"})
    opener = urllib.request.build_opener(SafeRedirect())
    with opener.open(request, timeout=max(1, min(timeout, 60))) as response:
        safe_feed_url(response.geturl())
        if response.status != 200: raise ValueError("Feed indisponível")
        data = response.read(MAX_FEED + 1)
        if len(data) > MAX_FEED: raise ValueError("Feed excede o limite")
        return data

def parse(data: bytes) -> list[dict]:
    if not isinstance(data, bytes) or len(data) > MAX_FEED:
        raise ValueError("Feed excede o limite")
    if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper(): raise ValueError("DTD não permitido")
    try: root = ET.fromstring(data)
    except ET.ParseError as exc: raise ValueError("XML inválido") from exc
    items = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1].lower() in {"imovel", "listing"}]
    if not items: raise ValueError("Feed sem imóveis")
    if len(items) > MAX_ITEMS: raise ValueError("Feed excede o limite de imóveis")
    return [_parse_item(node) for node in items]


def _name(node) -> str:
    return node.tag.rsplit("}", 1)[-1]


def _first(node, *paths: str) -> str:
    wanted = [tuple(part.lower() for part in path.split("/")) for path in paths]
    for candidate in node.iter():
        ancestry = []
        current = candidate
        # ElementTree não mantém pais; os caminhos de VRSync usados aqui têm nomes
        # terminais inequívocos e são tratados explicitamente em _parse_item.
        name = _name(current).lower()
        if any(name == path[-1] for path in wanted) and (current.text or "").strip():
            return (current.text or "").strip()
    return ""


def _parse_item(node) -> dict:
    raw = {_name(child): (child.text or "").strip() for child in node if len(child) == 0}
    aliases = {
        "codigo": ("ListingID", "codigo"), "titulo": ("Title", "titulo"),
        "descricao": ("Description", "descricao"), "cidade": ("City", "cidade"),
        "bairro": ("Neighborhood", "bairro"), "uf": ("State", "uf"),
        "finalidade": ("TransactionType", "finalidade"), "tipo": ("PropertyType", "tipo"),
        "preco": ("ListPrice", "preco"), "area": ("LivingArea", "area"),
        "quartos": ("Bedrooms", "quartos"), "suites": ("Suites", "suites"),
        "banheiros": ("Bathrooms", "banheiros"), "vagas": ("Garage", "vagas"),
        "condominio": ("PropertyAdministrationFee", "condominio"), "iptu": ("YearlyTax", "iptu"),
        "latitude": ("Latitude",), "longitude": ("Longitude",),
        "virtual_tour": ("VirtualTourLink",),
    }
    lowered = {_name(candidate).lower(): (candidate.text or "").strip() for candidate in node.iter() if len(candidate) == 0}
    for target, names in aliases.items():
        raw[target] = next((lowered[name.lower()] for name in names if lowered.get(name.lower())), "")
    media = []
    for candidate in node.iter():
        if _name(candidate).lower() not in {"item", "foto"}: continue
        url = (candidate.text or candidate.get("url") or "").strip()
        medium = (candidate.get("medium") or ("image" if _name(candidate).lower() == "foto" else "")).lower()
        media.append({"url": url, "medium": medium, "primary": (candidate.get("primary") or "").lower() in {"true", "1", "yes"}, "caption": candidate.get("caption") or ""})
    raw["media"] = media
    raw["fotos"] = [item["url"] for item in media if item["medium"] == "image"]
    raw["amenities"] = [(candidate.text or "").strip() for candidate in node.iter() if _name(candidate).lower() == "feature"]
    contact = {}
    for parent in node.iter():
        if _name(parent).lower() == "contactinfo":
            contact = {_name(child).lower(): (child.text or "").strip() for child in parent if len(child) == 0}
            break
    raw["contact"] = contact
    return raw
