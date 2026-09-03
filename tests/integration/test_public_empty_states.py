import re
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[2]
PUBLIC = ROOT / "public"

class PublicEmptyStateRegressionTests(unittest.TestCase):
    def test_paginas_inicial_e_resultados_tratam_zero_imoveis(self):
        site = (PUBLIC / "assets/js/site.js").read_text()
        resultados = (PUBLIC / "assets/js/resultados.js").read_text()
        self.assertIn("Nenhum imóvel disponível no momento.", site)
        self.assertIn("criarFiltros(filtros,[]", site)
        self.assertIn('resumo.textContent="0 imóveis encontrados"', resultados)
        self.assertIn("criarFiltros(filtros,[]", resultados)

    def test_inicializacao_e_independente_e_elementos_sao_verificados(self):
        site = (PUBLIC / "assets/js/site.js").read_text()
        resultados = (PUBLIC / "assets/js/resultados.js").read_text()
        self.assertIn("if(filtros)", site)
        self.assertIn("if(categorias)", site)
        self.assertIn("if(regioes)", site)
        self.assertIn("if(filtros&&listagem)", resultados)
        self.assertNotIn('src="assets/js/site.js?', (PUBLIC / "resultados.html").read_text())
        self.assertNotIn('src="assets/js/resultados.js?', (PUBLIC / "index.html").read_text())

    def test_assets_publicos_possuem_mesma_versao(self):
        versions = set()
        for html in PUBLIC.glob("*.html"):
            refs = re.findall(r'(?:href|src)="(assets/(?:css|js)/[^"]+)"', html.read_text())
            self.assertTrue(refs, html.name)
            for ref in refs:
                match = re.search(r"\?v=([A-Za-z0-9._-]+)$", ref)
                self.assertIsNotNone(match, f"{html.name}: {ref}")
                versions.add(match.group(1))
        self.assertEqual(len(versions), 1)
        imports = "\n".join(path.read_text() for path in (PUBLIC / "assets/js").rglob("*.js"))
        self.assertIsNone(re.search(r'from["\']\.{1,2}/[^"\']+\.js["\']', imports))

    def test_politica_de_cache_revalida_html_manifesto_e_dados(self):
        headers = (PUBLIC / "_headers").read_text()
        self.assertIn("/*.html\n  Cache-Control: public, max-age=0, must-revalidate", headers)
        self.assertIn("/dados/*\n  Cache-Control: public, max-age=0, must-revalidate", headers)
        self.assertIn("/assets/*\n  Cache-Control: public, max-age=31536000, immutable", headers)

if __name__ == "__main__": unittest.main()
