import unittest
from unittest.mock import patch
from src.core.security import authorize,hash_password,sign_session,verify_password,verify_session
class SecurityTests(unittest.TestCase):
 def test_hash_forte_e_salt(self):
  first=hash_password("Senha longa! 2026");second=hash_password("Senha longa! 2026")
  self.assertNotEqual(first,second);self.assertTrue(verify_password("Senha longa! 2026",first));self.assertFalse(verify_password("errada",first))
 def test_sessao_assinada_expira(self):
  token=sign_session("cliente-a","cliente","segredo-local-de-teste")
  self.assertEqual(verify_session(token,"segredo-local-de-teste")["sub"],"cliente-a");self.assertIsNone(verify_session(token+"x","segredo-local-de-teste"))
 def test_isolamento(self):
  self.assertTrue(authorize({"role":"cliente","sub":"abc"},"cliente","abc"));self.assertFalse(authorize({"role":"cliente","sub":"abc"},"cliente","xyz"));self.assertTrue(authorize({"role":"superadmin","sub":"root"},"cliente","xyz"))
if __name__=="__main__": unittest.main()
