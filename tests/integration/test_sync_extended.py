import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.publicacao.sync import sync, sync_client


class SyncExtendedTests(unittest.TestCase):
    def test_feed_inativo_nao_baixa(self):
        with patch("src.publicacao.sync.load_json",return_value={"ativo":False}), patch("src.publicacao.sync.download") as fetch:
            self.assertIsNone(sync_client("cliente-abc")); fetch.assert_not_called()

    def test_sincronizacao_geral_processa_apenas_ativos(self):
        clients=[{"id":"cliente-aaa","ativo":True},{"id":"cliente-bbb","ativo":False}]
        with patch("src.publicacao.sync.list_clients",return_value=clients), patch("src.publicacao.sync.sync_client",return_value=[{"id":"cliente-aaa-x"}]) as one, patch("src.publicacao.sync.generate",return_value=True) as generated:
            self.assertTrue(sync()); one.assert_called_once_with("cliente-aaa")
            self.assertEqual(generated.call_args.args[1], [clients[0]])

    def test_dry_run_nao_gera_publicacao(self):
        with patch("src.publicacao.sync.list_clients",return_value=[]), patch("src.publicacao.sync.generate") as generated:
            self.assertFalse(sync(dry_run=True)); generated.assert_not_called()

    def test_feed_sem_cache_em_falha_retorna_none_e_erro_sanitizado(self):
        with tempfile.TemporaryDirectory() as directory, patch("src.publicacao.sync.client_path",lambda _:Path(directory)):
            Path(directory,"feed.json").write_text('{"ativo":true,"feed_url":"https://segredo.example/feed.xml"}')
            self.assertIsNone(sync_client("cliente-abc",lambda _: (_ for _ in ()).throw(OSError("credencial=secreta"))))
            status=Path(directory,"sincronizacao.json").read_text()
            self.assertNotIn("segredo.example",status); self.assertNotIn("credencial",status)
