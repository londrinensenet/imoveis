import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from src.publicacao.sync import sync, sync_client
FIX=Path(__file__).parents[1]/"fixtures"
class SyncTests(unittest.TestCase):
 def test_falha_preserva_ultimo_valido(self):
  with tempfile.TemporaryDirectory() as directory,patch("src.publicacao.sync.client_path",lambda _:Path(directory)):
   base=Path(directory);(base/"feed.json").write_text(json.dumps({"ativo":True,"feed_url":"https://feed.example/feed.xml"}));valid=(FIX/"feed-valido.xml").read_bytes()
   first=sync_client("cliente-a",lambda _:valid);second=sync_client("cliente-a",lambda _:(_ for _ in ()).throw(OSError("url secreta")))
   self.assertEqual(first,second);self.assertNotIn("url secreta",(base/"sincronizacao.json").read_text())
 def test_individual_preserva_outros_clientes(self):
  clients=[{"id":"cliente-a","ativo":True},{"id":"cliente-b","ativo":True}]
  cached=[{"id":"cliente-b-b1"}]
  def path(client_id):return Path("/virtual")/client_id
  def load(path,default=None):return cached if "cliente-b" in str(path) else default
  with patch("src.publicacao.sync.list_clients",return_value=clients),patch("src.publicacao.sync.client_path",side_effect=path),patch("src.publicacao.sync.load_json",side_effect=load) as loaded,patch("src.publicacao.sync.sync_client",return_value=[{"id":"cliente-a-a1"}]) as downloaded,patch("src.publicacao.sync.generate",return_value=True) as generated:
   self.assertTrue(sync("cliente-a"))
   downloaded.assert_called_once_with("cliente-a")
   self.assertEqual(generated.call_args.args[0],[{"id":"cliente-a-a1"},{"id":"cliente-b-b1"}])
   self.assertTrue(all("/virtual/cliente-b/ultimo-valido.json" in str(call.args[0]) for call in loaded.call_args_list))
   self.assertTrue(all("public" not in str(call.args[0]) for call in loaded.call_args_list))
 def test_individual_rejeita_cliente_inexistente_ou_inativo(self):
  for clients in ([{"id":"cliente-a","ativo":True}],[{"id":"cliente-b","ativo":False}]):
   with self.subTest(clients=clients),patch("src.publicacao.sync.list_clients",return_value=clients),patch("src.publicacao.sync.sync_client") as downloaded:
    with self.assertRaises(ValueError):sync("cliente-b")
    downloaded.assert_not_called()
if __name__=="__main__":unittest.main()
