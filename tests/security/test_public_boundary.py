import unittest
from pathlib import Path
class BoundaryTests(unittest.TestCase):
 def test_public_nao_contem_campos_privados(self):
  root=Path(__file__).parents[2]/"public"; content=b"\n".join(p.read_bytes() for p in root.rglob("*") if p.is_file()).lower()
  for forbidden in (b"feed_url",b"private/clientes",b"cnpj",b"cpf",b"senha_hash"):self.assertNotIn(forbidden,content)
 def test_public_e_unica_raiz_do_site(self):
  self.assertTrue((Path(__file__).parents[2]/"public/index.html").is_file())
if __name__=="__main__":unittest.main()
