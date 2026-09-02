import tempfile,unittest
from pathlib import Path
from src.feeds.importer import parse
from src.normalizacao.normalizer import normalize
from src.publicacao.generator import generate
FIX=Path(__file__).parents[1]/"fixtures"
class GenerationTests(unittest.TestCase):
 def test_deterministico_sem_alteracao(self):
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  client={"id":"cliente-a","nome":"Cliente A","tipo":"imobiliaria","creci":"1","documento":"privado"}
  with tempfile.TemporaryDirectory() as directory:
   out=Path(directory);self.assertTrue(generate([prop],[client],out));snapshot={str(p.relative_to(out)):p.read_bytes() for p in out.rglob("*.json")};self.assertFalse(generate([prop],[client],out));self.assertEqual(snapshot,{str(p.relative_to(out)):p.read_bytes() for p in out.rglob("*.json")});self.assertNotIn(b"documento",b"".join(snapshot.values()))
 def test_shards_respeitam_limite(self):
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  with tempfile.TemporaryDirectory() as directory:
   generate([{**prop,"id":f"cliente-a-{i}","titulo":"x"*80} for i in range(100)],[{"id":"cliente-a","nome":"A"}],Path(directory))
   self.assertTrue(all(p.stat().st_size<=1_000_000 for p in Path(directory).glob("indices/**/parte*.json")))
if __name__=="__main__":unittest.main()
