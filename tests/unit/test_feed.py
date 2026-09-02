import unittest
from pathlib import Path
from src.feeds.importer import MAX_FEED, parse, safe_feed_url
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
 def test_limites_e_url_perigosa(self):
  with self.assertRaises(ValueError):parse(b"x"*(MAX_FEED+1))
  for url in ("http://example.com/feed.xml","https://user@example.com/feed.xml","https://example.com/feed.xml#fragment"):
   with self.assertRaises(ValueError):safe_feed_url(url)
if __name__=="__main__":unittest.main()
