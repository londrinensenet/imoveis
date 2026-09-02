import io
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import URLError

from src.feeds.importer import MAX_FEED, MAX_ITEMS, SafeRedirect, download, parse, safe_feed_url


class ImporterExtendedTests(unittest.TestCase):
    @patch("src.feeds.importer.socket.getaddrinfo")
    def test_ssrf_ips_privados_e_publico(self, addresses):
        for ip in ("127.0.0.1","10.0.0.1","169.254.169.254","::1"):
            addresses.return_value=[(None,None,None,None,(ip,443))]
            with self.subTest(ip=ip), self.assertRaises(ValueError): safe_feed_url("https://feed.example/x")
        addresses.return_value=[(None,None,None,None,("8.8.8.8",443))]
        self.assertEqual(safe_feed_url("https://feed.example/x"),"https://feed.example/x")

    @patch("src.feeds.importer.safe_feed_url", side_effect=lambda value:value)
    @patch("src.feeds.importer.urllib.request.build_opener")
    def test_download_valido_indisponivel_e_acima_limite(self, build, _safe):
        response=MagicMock(); response.__enter__.return_value=response; response.status=200
        response.geturl.return_value="https://feed.example/final"; response.read.return_value=b"ok"
        build.return_value.open.return_value=response
        self.assertEqual(download("https://feed.example/start"),b"ok")
        response.status=503
        with self.assertRaises(ValueError): download("https://feed.example/start")
        response.status=200; response.read.return_value=b"x"*(MAX_FEED+1)
        with self.assertRaises(ValueError): download("https://feed.example/start")

    @patch("src.feeds.importer.safe_feed_url")
    def test_redirect_revalida_destino(self, safe):
        handler=SafeRedirect(); parent=MagicMock(); handler.parent=parent
        with self.assertRaises(Exception): handler.redirect_request(MagicMock(),None,302,"found",{},"https://private.example/x")
        safe.assert_called_once_with("https://private.example/x")

    def test_dtd_entidades_xml_malicioso_e_vazio(self):
        payloads=(b'<!doctype x><imoveis/>',b'<!ENTITY x "boom"><imoveis/>',b'<imoveis/>',b'<imoveis><imovel></imoveis>')
        for payload in payloads:
            with self.subTest(payload=payload), self.assertRaises(ValueError): parse(payload)

    def test_limite_de_itens(self):
        xml=b"<imoveis>"+b"<imovel><codigo>x</codigo></imovel>"*(MAX_ITEMS+1)+b"</imoveis>"
        with patch("src.feeds.importer.MAX_FEED",len(xml)+1), self.assertRaises(ValueError): parse(xml)


if __name__ == "__main__": unittest.main()
