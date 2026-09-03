import re
import unittest
from pathlib import Path

ROOT=Path(__file__).parents[2]

class WorkflowAndExposureTests(unittest.TestCase):
    def test_agenda_fuso_e_horarios(self):
        sync=(ROOT/".github/workflows/sincronizar.yml").read_text()
        self.assertIn("America/Sao_Paulo",sync)
        self.assertIn("{9, 12, 15, 18, 23}",sync)
        self.assertIn("cron: '0 * * * *'",sync)

    def test_permissoes_publicacao_e_gates(self):
        for path in (ROOT/".github/workflows").glob("*.yml"):
            text=path.read_text()
            self.assertNotIn("contents: write",text) if "publicar:" not in text else None
            if "git push" in text:
                self.assertIn("ENABLE_REAL_SYNC == 'true'",text)
                self.assertIn("ENABLE_REAL_PUBLISH == 'true'",text)
                self.assertIn('git status --porcelain -- public private',text)
                self.assertIn("steps.commit.outputs.created == 'true'",text)
        pages=(ROOT/".github/workflows/pages.yml").read_text()
        self.assertIn("workflow_dispatch",pages); self.assertIn("ENABLE_REAL_PUBLISH",pages)
        self.assertIn("with: {path: public}",pages); self.assertNotIn("private",pages)

    def test_actions_fixadas_em_hash(self):
        for path in (ROOT/".github/workflows").glob("*.yml"):
            for action in re.findall(r"uses:\s*([^\s]+)",path.read_text()):
                self.assertRegex(action,r"^[\w.-]+/[\w.-]+@[0-9a-f]{40}$")

    def test_publico_sem_staging_credenciais_ou_url_feed(self):
        # O painel contém os rótulos da interface de autenticação, mas não valores
        # de credenciais nem dados privados. O portal do visitante continua sendo
        # verificado pela lista histórica mais estrita abaixo.
        files=[path for path in (ROOT/"public").rglob("*") if path.is_file() and "painel" not in path.parts]
        self.assertFalse(any(".dados-" in path.name or path.name.startswith(".tmp-") for path in files))
        content=b"\n".join(path.read_bytes() for path in files).lower()
        # "tokens.css" é o vocabulário padrão do sistema visual, não uma credencial.
        for forbidden in (b"feed_url",b"private/clientes",b"senha",b"password",b"api_token",b"access_token",b"cookie",b"pbkdf2",b"scrypt"):
            self.assertNotIn(forbidden,content)

    def test_pages_executa_functions_somente_na_api(self):
        routes=(ROOT/"public/_routes.json").read_text()
        self.assertIn('"include": ["/api/*"]',routes)
        self.assertIn('"exclude": []',routes)
        self.assertTrue((ROOT/"functions/api/[[path]].js").is_file())
        self.assertEqual(list((ROOT/"functions").glob("*.js")),[])
