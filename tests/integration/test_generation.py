import tempfile,unittest
from pathlib import Path
from unittest.mock import patch
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
 def test_remove_imovel_e_shard_obsoletos(self):
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  with tempfile.TemporaryDirectory() as directory:
   out=Path(directory);old={**prop,"id":"cliente-a-antigo","cidade":"Cidade removida"}
   generate([prop,old],[{"id":"cliente-a","nome":"A"}],out)
   self.assertTrue((out/"imoveis/cliente-a-antigo.json").exists())
   generate([prop],[{"id":"cliente-a","nome":"A"}],out)
   self.assertFalse((out/"imoveis/cliente-a-antigo.json").exists())
   self.assertNotIn("cidade/cidade-removida",(out/"indices/manifesto.json").read_text())
 def test_rejeita_id_perigoso_e_logo_nao_https(self):
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  with tempfile.TemporaryDirectory() as directory:
   with self.assertRaises(ValueError):generate([{**prop,"id":"../escape"}],[],Path(directory))
   generate([prop],[{"id":"cliente-a","nome":"A","logo":"javascript:alert(1)"}],Path(directory))
   self.assertNotIn("javascript",(Path(directory)/"clientes/clientes.json").read_text())
 def test_falha_no_staging_preserva_arvore_anterior_e_remove_staging(self):
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  with tempfile.TemporaryDirectory() as directory:
   out=Path(directory)/"dados";generate([prop],[{"id":"cliente-a","nome":"A"}],out)
   before={str(p.relative_to(out)):p.read_bytes() for p in out.rglob("*") if p.is_file()}
   with patch("src.publicacao.generator._write",side_effect=OSError("falha de staging")):
    with self.assertRaises(OSError):generate([{**prop,"titulo":"alterado"}],[{"id":"cliente-a","nome":"A"}],out)
   self.assertEqual(before,{str(p.relative_to(out)):p.read_bytes() for p in out.rglob("*") if p.is_file()})
   self.assertEqual([],list(Path(directory).glob(".dados-*")))
 def test_manifesto_referencia_uma_unica_arvore_consistente(self):
  import json
  prop=normalize(parse((FIX/"feed-valido.xml").read_bytes())[0],"cliente-a")
  with tempfile.TemporaryDirectory() as directory:
   out=Path(directory)/"dados";generate([prop],[{"id":"cliente-a","nome":"A"}],out)
   manifest=json.loads((out/"indices/manifesto.json").read_text())
   self.assertTrue(all((out/file).is_file() for group in manifest.values() for file in group["partes"]))
   self.assertEqual({prop["id"]},{p.stem for p in (out/"imoveis").glob("*.json")})
if __name__=="__main__":unittest.main()
