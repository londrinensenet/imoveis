import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parents[2]
PUBLIC = ROOT / "public"


class Tags(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags = []
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class VisualSystemTests(unittest.TestCase):
    def test_paginas_rotas_e_fallback_estatico(self):
        pages = ("index.html", "resultados.html", "imovel.html", "clientes.html", "cliente.html",
                 "favoritos.html", "comparacao.html", "404.html", "contato.html", "privacidade.html", "termos.html")
        for page in pages:
            self.assertTrue((PUBLIC / page).is_file(), page)
        fallback = (PUBLIC / "404.html").read_text()
        self.assertIn("Página não encontrada", fallback); self.assertIn('href="index.html"', fallback)

    def test_landmarks_skip_navegacao_e_menu_acessivel(self):
        for path in PUBLIC.glob("*.html"):
            tags = Tags(); tags.feed(path.read_text())
            names = [name for name, _ in tags.tags]
            self.assertIn("main", names, path.name); self.assertIn("header", names, path.name)
            self.assertIn("footer", names, path.name)
            self.assertTrue(any(attrs.get("class") == "skip" for name, attrs in tags.tags if name == "a"), path.name)
        nav = (PUBLIC / "assets/js/navigation.js").read_text()
        for term in ("aria-expanded", "Escape", ".focus()", "aria-current"):
            self.assertIn(term, nav)

    def test_css_modular_tokens_componentes_e_breakpoints(self):
        required = ("tokens.css", "base.css", "layout.css", "components.css", "responsive.css")
        for name in required: self.assertTrue((PUBLIC / "assets/css" / name).is_file())
        for name in ("home.css", "resultados.css", "imovel.css", "anunciante.css", "favoritos.css", "comparacao.css"):
            self.assertTrue((PUBLIC / "assets/css/pages" / name).is_file())
        tokens = (PUBLIC / "assets/css/tokens.css").read_text()
        for term in ("--cor-marca", "--fonte", "--esp-", "--raio", "--sombra", "--largura", "--transicao", "--foco"):
            self.assertIn(term, tokens)
        responsive = (PUBLIC / "assets/css/responsive.css").read_text()
        for width in ("1024px", "768px", "600px"): self.assertIn(width, responsive)

    def test_filtros_cards_favoritos_comparacao_e_estados(self):
        scripts = "\n".join(p.read_text() for p in (PUBLIC / "assets/js").rglob("*.js"))
        for term in ('modo:"full"', 'modo:"compact"', "chip", "modo-lista", "Imóvel indisponível",
                     "Anunciante indisponível", "formato inválido", "skeleton"):
            self.assertIn(term, scripts + (PUBLIC / "assets/css/components.css").read_text())
        self.assertIn("MAXIMO=4", (PUBLIC / "assets/js/modules/comparador.js").read_text())
        self.assertIn("reconciliar", (PUBLIC / "assets/js/modules/favoritos.js").read_text())

    def test_sem_html_dinamico_inseguro_ou_dados_privados(self):
        scripts = "\n".join(p.read_text() for p in (PUBLIC / "assets/js").rglob("*.js"))
        self.assertNotIn("innerHTML", scripts); self.assertNotIn("onclick=", scripts)
        content = "\n".join(p.read_text(errors="ignore") for p in PUBLIC.rglob("*") if p.is_file()).lower()
        for private in ("feed_url", "private/clientes", "cnpj", "cpf"):
            self.assertNotIn(private, content)


if __name__ == "__main__": unittest.main()
