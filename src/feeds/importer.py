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
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError("URL de feed inválida")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    for info in socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM):
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
    items = root.findall(".//imovel")
    if not items:
        def tag(element): return element.tag.rsplit('}', 1)[-1]
        def child(element, name): return next((entry for entry in element if tag(entry) == name), None) if element is not None else None
        def value(element, name):
            node = child(element, name)
            return (node.text or '').strip() if node is not None else ''
        listings = [element for element in root.iter() if tag(element) == 'Listing']
        if len(listings) > MAX_ITEMS: raise ValueError("Feed excede o limite de imóveis")
        if listings:
            parsed = []
            for listing in listings:
                details, location, media = (child(listing, name) for name in ('Details', 'Location', 'Media'))
                transaction = value(listing, 'TransactionType').lower()
                base = {
                    'ListingID': value(listing, 'ListingID'),
                    'Title': value(listing, 'Title') or value(details, 'Title'),
                    'Description': value(details, 'Description'),
                    'City': value(location, 'City'),
                    'Neighborhood': value(location, 'Neighborhood'),
                    'State': (child(location, 'State').attrib.get('abbreviation') or value(location, 'State')) if child(location, 'State') is not None else '',
                    'PropertyType': value(details, 'PropertyType'),
                    'ListPrice': value(details, 'ListPrice'),
                    'RentalPrice': value(details, 'RentalPrice'),
                    'Bedrooms': value(details, 'Bedrooms'),
                    'Bathrooms': value(details, 'Bathrooms'),
                    'Garage': value(details, 'Garage'),
                    'Suites': value(details, 'Suites'),
                    'TransactionType': transaction,
                    'Location': {name:value(location,name) for name in ('Zone','Latitude','Longitude')},
                    'Details': {name:value(details,name) for name in ('PropertyType','LivingArea','LotArea','LotAreaUnit','UnitFloor','Floors','YearBuilt')},
                    'Media': [{'Type':value(item,'Type'),'URL':value(item,'URL')} for item in (list(media) if media is not None else []) if tag(item) in ('Item','MediaItem')],
                }
                purposes = ('venda','aluguel') if transaction in ('sale/rent','for sale/for rent') else ('venda',) if transaction in ('for sale','sale') else ('aluguel',) if transaction in ('for rent','rent') else ()
                for purpose in purposes:
                    record = base | {'finalidade':purpose}
                    if len(purposes) > 1: record['ListingID'] += '-' + purpose
                    parsed.append(record)
            if not parsed: raise ValueError("Feed sem imóveis válidos")
            return parsed
    if not items: raise ValueError("Feed sem imóveis")
    if len(items) > MAX_ITEMS: raise ValueError("Feed excede o limite de imóveis")
    return [{child.tag: (child.text or "").strip() for child in node if len(child) == 0} | {"fotos": [(f.text or "").strip() for f in node.findall("./fotos/foto")]} for node in items]
