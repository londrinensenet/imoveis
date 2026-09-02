import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from src.publicacao.sync import sync_client
FIX=Path(__file__).parents[1]/"fixtures"
class SyncTests(unittest.TestCase):
 def test_falha_preserva_ultimo_valido(self):
  with tempfile.TemporaryDirectory() as directory,patch("src.publicacao.sync.client_path",lambda _:Path(directory)):
   base=Path(directory);(base/"feed.json").write_text(json.dumps({"ativo":True,"feed_url":"https://feed.example/feed.xml"}));valid=(FIX/"feed-valido.xml").read_bytes()
   first=sync_client("cliente-a",lambda _:valid);second=sync_client("cliente-a",lambda _:(_ for _ in ()).throw(OSError("url secreta")))
   self.assertEqual(first,second);self.assertNotIn("url secreta",(base/"sincronizacao.json").read_text())
if __name__=="__main__":unittest.main()
