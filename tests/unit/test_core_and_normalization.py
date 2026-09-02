import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.clientes.service import save_client, save_feed
from src.core.io import atomic_write, canonical_bytes, client_path, load_json
from src.normalizacao.normalizer import normalize, number, public_url, text
from src.publicacao.generator import chunks, select, slug_value


class CoreAndNormalizationTests(unittest.TestCase):
    def test_configuracao_e_json_canonico(self):
        config = load_json(Path("config/sync.json"))
        self.assertEqual(config["timezone"], "America/Sao_Paulo")
        self.assertEqual(config["hours"], [9, 12, 15, 18, 23])
        self.assertEqual(canonical_bytes({"z": 1, "á": 2}), '{"z":1,"á":2}\n'.encode())

    def test_load_inexistente_e_json_invalido(self):
        self.assertEqual(load_json(Path("/arquivo/ausente"), {"x": 1}), {"x": 1})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"; path.write_text("{")
            with self.assertRaises(json.JSONDecodeError): load_json(path)

    def test_atomic_write_nao_altera_bytes_iguais(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sub" / "data.json"
            self.assertTrue(atomic_write(path, b"x")); before = path.stat().st_mtime_ns
            self.assertFalse(atomic_write(path, b"x")); self.assertEqual(before, path.stat().st_mtime_ns)
            self.assertEqual([], list(path.parent.glob(".tmp-*")))

    def test_ids_de_cliente_validos_e_perigosos(self):
        self.assertEqual(client_path("cliente-123").name, "cliente-123")
        for value in ("ab", "../fora", "/absoluto", "UPPER", "a" * 41, None):
            with self.subTest(value=value), self.assertRaises(ValueError): client_path(value)

    def test_normalizacao_campos_limites_e_allowlist(self):
        raw = {"codigo":" X  1 ","cidade":" Londrina ","finalidade":"VENDA","tipo":"desconhecido",
               "preco":"1,5","area":"2","quartos":"3.9","fotos":["https://img.example/a.jpg","http://bad/a"]*20,
               "titulo":" t  t ","segredo":"não publicar"}
        item = normalize(raw, "cliente-abc")
        self.assertEqual(item["id"], "cliente-abc-x-1"); self.assertEqual(item["tipo"], "outro")
        self.assertEqual(item["titulo"], "t t"); self.assertEqual(item["quartos"], 3)
        self.assertEqual(len(item["fotos"]), 20); self.assertNotIn("segredo", item)

    def test_normalizacao_rejeita_entradas_perigosas(self):
        base={"codigo":"x","cidade":"Londrina","finalidade":"venda","preco":1}
        for raw, client in (([],"cliente-abc"),(base,"../x"),({**base,"codigo":"!!!"},"cliente-abc"),({**base,"preco":"nan"},"cliente-abc"),({**base,"preco":-1},"cliente-abc")):
            with self.subTest(raw=raw, client=client), self.assertRaises((ValueError, TypeError)): normalize(raw,client)

    def test_texto_numero_url_slug_e_allowlist(self):
        self.assertEqual(text(" a\n b "), "a b"); self.assertEqual(number("2,25"), 2.25)
        self.assertEqual(public_url("https://example.org/a"), "https://example.org/a")
        for url in ("javascript:alert(1)","http://example.org/a","https://user:pass@example.org/a"):
            self.assertEqual(public_url(url), "")
        self.assertEqual(slug_value("São José"), "sao-jose")
        self.assertEqual(select({"a":1,"private":2},("a",)), {"a":1})

    def test_chunks_ordem_limite_e_card_individual(self):
        cards=[{"id":str(i),"titulo":"x"*30} for i in range(5)]
        parts=chunks(cards,100); self.assertEqual([c for part in parts for c in part],cards)
        self.assertTrue(all(len(canonical_bytes(part))<=100 for part in parts))
        with self.assertRaises(ValueError): chunks([{"titulo":"x"*200}],100)

    def test_servico_rejeita_campos_e_urls_perigosas(self):
        with tempfile.TemporaryDirectory() as directory, patch("src.clientes.service.client_path",lambda _:Path(directory)):
            with self.assertRaises(ValueError): save_client("cliente-abc",{"path":"../../x"})
            for url in ("http://example.org/x","https://user:pass@example.org/x","https://example.org/x#frag","https://127.0.0.1/x"):
                with self.subTest(url=url), self.assertRaises(ValueError): save_feed("cliente-abc",url)
            self.assertTrue(save_feed("cliente-abc","https://feeds.example.org/x"))


if __name__ == "__main__": unittest.main()
