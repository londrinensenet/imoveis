from __future__ import annotations
import ipaddress, socket, urllib.parse, urllib.request
from xml.etree import ElementTree as ET

MAX_FEED = 25 * 1024 * 1024

def safe_feed_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password: raise ValueError("Feed deve usar HTTPS")
    for info in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global: raise ValueError("Destino de feed não permitido")
    return url

def download(url: str, timeout: int = 30) -> bytes:
    request = urllib.request.Request(safe_feed_url(url), headers={"User-Agent": "PortalLondrinense/2"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200: raise ValueError("Feed indisponível")
        data = response.read(MAX_FEED + 1)
        if len(data) > MAX_FEED: raise ValueError("Feed excede o limite")
        return data

def parse(data: bytes) -> list[dict]:
    if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper(): raise ValueError("DTD não permitido")
    try: root = ET.fromstring(data)
    except ET.ParseError as exc: raise ValueError("XML inválido") from exc
    items = root.findall(".//imovel")
    if not items: raise ValueError("Feed sem imóveis")
    return [{child.tag: (child.text or "").strip() for child in node if len(child) == 0} | {"fotos": [(f.text or "").strip() for f in node.findall("./fotos/foto")]} for node in items]

