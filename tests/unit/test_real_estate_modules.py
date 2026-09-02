import json
import tempfile
import unittest
from pathlib import Path

from src.normalizacao.normalizer import normalize, rural_area_m2, rural_area_presentation, rural_filter_m2
from src.publicacao.generator import generate


BASE = {"codigo": "R-1", "cidade": "Londrina", "finalidade": "venda", "tipo": "rural", "preco": 1}


class RealEstateModuleRegressionTests(unittest.TestCase):
    def test_phase_four_guards_remain_active(self):
        for client in ("../cliente", "AB", "a"):
            with self.subTest(client=client), self.assertRaises(ValueError):
                normalize(BASE, client)
        for code in ("!!!", "___"):
            with self.subTest(code=code), self.assertRaises(ValueError):
                normalize({**BASE, "codigo": code}, "cliente-ok")
        for key in ("preco", "area", "quartos"):
            for value in ("NaN", "Infinity", "-Infinity"):
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    normalize({**BASE, key: value}, "cliente-ok")

    def test_vrsync_fields_are_normalized_with_explicit_allowlists(self):
        raw = {
            **BASE,
            "Location": {"Zone": " Norte ", "Latitude": "-23.31", "Longitude": "-51.16", "Secret": "omit"},
            "Media": [
                {"Type": "image", "URL": "https://img.example/1.jpg", "Primary": "true", "Caption": " Frente ", "token": "omit"},
                {"Type": "video", "URL": "https://video.example/1", "Caption": "ignored"},
                {"Type": "document", "URL": "https://private.example/feed"},
            ],
            "Features": [" Piscina ", "Piscina", "Pomar"],
            "ContactInfo": {"Name": "Imobiliária", "Phone": "43 0000-0000", "Website": "https://example.org", "Password": "omit"},
            "VirtualTourLink": "https://tour.example/r-1",
            "Details": {"LotArea": "25000", "LotAreaUnit": "m2"},
            "feed_url": "https://private.example/feed.xml",
        }
        item = normalize(raw, "cliente-ok")
        self.assertEqual(item["location"], {"zone": "Norte", "latitude": -23.31, "longitude": -51.16})
        self.assertEqual(item["media"][0], {"type": "image", "url": "https://img.example/1.jpg", "primary": True, "caption": "Frente"})
        self.assertEqual(item["media"][1], {"type": "video", "url": "https://video.example/1"})
        self.assertEqual(item["fotos"], ["https://img.example/1.jpg"])
        self.assertEqual(item["features"], ["Piscina", "Pomar"])
        self.assertEqual(item["contact_info"], {"name": "Imobiliária", "phone": "43 0000-0000", "website": "https://example.org"})
        self.assertEqual(item["virtual_tour_link"], "https://tour.example/r-1")
        self.assertNotIn("feed_url", item)
        self.assertNotIn("Secret", json.dumps(item))
        self.assertNotIn("Password", json.dumps(item))

    def test_rural_area_boundary_and_filter_use_square_metres(self):
        for value in (500, 1000, 9999):
            item = normalize({**BASE, "Details": {"LotArea": value, "LotAreaUnit": "m2"}}, "cliente-ok")
            self.assertEqual(item["area"], value)
            self.assertEqual(item["area_apresentacao"], {"value": float(value), "unit": "m²"})
        one_hectare = normalize({**BASE, "Details": {"LotArea": 10000}}, "cliente-ok")
        self.assertEqual(one_hectare["area"], 10000)
        self.assertEqual(one_hectare["area_apresentacao"], {"value": 1.0, "unit": "ha"})
        self.assertEqual(rural_area_presentation(25000), {"value": 2.5, "unit": "ha"})
        self.assertEqual(rural_filter_m2(2.5, "ha"), 25000)
        self.assertEqual(rural_area_m2(25000, "m²"), rural_filter_m2(2.5, "hectares"))

    def test_alqueire_is_rejected_and_description_is_never_parsed_as_area(self):
        with self.assertRaises(ValueError):
            normalize({**BASE, "Details": {"LotArea": 1, "LotAreaUnit": "alqueire"}}, "cliente-ok")
        item = normalize({**BASE, "descricao": "Fazenda com 12 alqueires"}, "cliente-ok")
        self.assertEqual(item["area"], 0)

    def test_private_fields_do_not_reach_generated_public_json(self):
        item = normalize({**BASE, "feed_url": "https://private.example/feed", "password": "secret"}, "cliente-ok")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "dados"
            generate([item], [], output)
            public_text = "\n".join(path.read_text() for path in output.rglob("*.json"))
        self.assertNotIn("private.example", public_text)
        self.assertNotIn("password", public_text.lower())
        self.assertNotIn("secret", public_text.lower())


if __name__ == "__main__":
    unittest.main()
