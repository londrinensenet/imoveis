import unittest
from pathlib import Path
from src.feeds.importer import parse
from src.normalizacao.normalizer import normalize
class VRSyncTests(unittest.TestCase):
 def test_campos_modulares(self):
  item=normalize(parse((Path(__file__).parents[1]/"fixtures/feed-vrsync.xml").read_bytes())[0],"cliente-a")
  self.assertEqual(item["coordinates"],{"latitude":-23.31,"longitude":-51.17});self.assertTrue(item["images"][0]["primary"]);self.assertEqual(item["amenities"],["Piscina"]);self.assertIn("youtube.com",item["videoYoutube"]);self.assertEqual(item["publicContact"]["name"],"Imobiliária A")
if __name__=="__main__":unittest.main()
