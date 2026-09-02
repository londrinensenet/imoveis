import unittest
from pathlib import Path
ROOT=Path(__file__).parents[2]
class FilterListingContractTests(unittest.TestCase):
 def setUp(self):
  self.filters=(ROOT/'public/assets/js/modules/filtros.js').read_text()
  self.defs=(ROOT/'public/assets/js/modules/filtros/definicoes.js').read_text()
  self.listing=(ROOT/'public/assets/js/modules/listagem.js').read_text()
 def test_order_default_and_cascade(self):
  self.assertLess(self.filters.index("'finalidade'"),self.filters.index("'categoria'"));self.assertLess(self.filters.index("'categoria'"),self.filters.index("'Faixa de preço'"));self.assertIn('cidade:"Londrina"',self.filters);self.assertIn("estado.regiao=''",self.filters);self.assertIn("estado.bairro=''",self.filters)
 def test_provenance_and_description_absent(self):
  for term in ('campo:','modo:','transformacao:','unidade:','disponibilidade:'):self.assertIn(term,self.defs)
  self.assertNotIn('Description',self.defs);self.assertIn('Features/Feature',self.defs)
 def test_category_area_and_forbidden_unit(self):
  terrain=self.defs[self.defs.index('{id:"areaTerreno"'):self.defs.index('{id:"areaRural"')]
  self.assertNotIn('quartos',terrain);self.assertIn('m² ou ha',self.defs);self.assertIn('alqueire', (ROOT/'public/assets/js/modules/filtros/unidades.js').read_text().lower())
 def test_accessibility_url_and_listing_integrations(self):
  for term in ('aria-expanded','aria-controls','type:\'range\'','history','pushState'):self.assertIn(term,'\n'.join([self.filters,(ROOT/'public/assets/js/modules/filtros/url.js').read_text()]))
  for term in ('localStorage','favorito','comparar','compartilhar','modo-lista'):self.assertIn(term,self.listing)
if __name__=='__main__':unittest.main()
