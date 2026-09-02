import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).parents[2]/"public"

class Collector(HTMLParser):
    def __init__(self): super().__init__(); self.tags=[]
    def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))

class PublicSiteStaticTests(unittest.TestCase):
    def test_urls_diretas_e_assets_existem(self):
        for name in ("index.html","imovel.html","clientes.html","cliente.html","404.html"):
            self.assertTrue((ROOT/name).is_file(),name)
        for html in ROOT.glob("*.html"):
            parser=Collector();parser.feed(html.read_text())
            for tag,attrs in parser.tags:
                for key in ("href","src"):
                    value=attrs.get(key,"")
                    if value and not value.startswith(("http","data:","#")):
                        self.assertTrue((ROOT/value.split("?")[0]).exists(),f"{html.name}: {value}")

    def test_labels_status_skip_link_e_navegacao(self):
        index=(ROOT/"index.html").read_text()
        self.assertGreaterEqual(index.count("<label>"),4);self.assertIn('role="search"',index)
        self.assertIn('role="status"',index);self.assertIn('class="skip"',index)
        self.assertIn('aria-label="Principal"',index)

    def test_estados_vazio_rede_e_imagem_ausente(self):
        scripts="\n".join(path.read_text() for path in (ROOT/"assets/js").glob("*.js"))
        for text in ("Nenhum imóvel","Não foi possível carregar","Sem foto","Imóvel indisponível","Anunciante inválido"):
            self.assertIn(text,scripts)

    def test_busca_filtros_cards_e_detalhe(self):
        site=(ROOT/"assets/js/site.js").read_text();common=(ROOT/"assets/js/common.js").read_text();detail=(ROOT/"assets/js/detalhe.js").read_text()
        for term in ("finalidade","tipo","preco","toLocaleLowerCase"):self.assertIn(term,site)
        self.assertIn('class="card"',common);self.assertIn("encodeURIComponent(item.id)",common)
        self.assertIn("dados/imoveis/",detail);self.assertIn("escape(x.descricao)",detail)

    def test_responsividade_foco_e_contraste_basico(self):
        css=(ROOT/"assets/css/site.css").read_text()
        self.assertIn("@media(max-width:800px)",css);self.assertIn(":focus",css)
        self.assertIn("outline:3px",css);self.assertIn("color:#17212b",css);self.assertIn("background:#f5f7f6",css)

    def test_jsons_publicos_carregam_e_manifesto_referencia_existentes(self):
        import json
        manifest=json.loads((ROOT/"dados/indices/manifesto.json").read_text())
        clients=json.loads((ROOT/"dados/clientes/clientes.json").read_text())
        self.assertIsInstance(clients,list)
        for group in manifest.values():
            for relative in group["partes"]: self.assertTrue((ROOT/"dados"/relative).is_file())
