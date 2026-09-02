import unittest
from pathlib import Path
from src.feeds.importer import parse
from src.normalizacao.normalizer import normalize
FIX=Path(__file__).parents[1]/"fixtures"
class FeedTests(unittest.TestCase):
 def test_valido(self):
  item=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  self.assertEqual(item["id"],"cliente-a-a-10");self.assertEqual(item["preco"],350000)
 def test_invalido(self):
  with self.assertRaises(ValueError):parse((FIX/"feed-invalido.xml").read_bytes())
 def test_entidade_bloqueada(self):
  with self.assertRaises(ValueError):parse(b'<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]><imoveis/>')
if __name__=="__main__":unittest.main()
