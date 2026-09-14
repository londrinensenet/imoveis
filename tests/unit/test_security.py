import time
import unittest
from src.core.security import authorize,sign_session,verify_session

class SecurityTests(unittest.TestCase):
 def test_sessao_assinada_expira(self):
  payload={"sub":"google-subject","email":"cliente@example.com","role":"CLIENTE","cliente_id":"abc","exp":time.time()+60}
  token=sign_session(payload,"segredo-local-de-teste")
  self.assertEqual(verify_session(token,"segredo-local-de-teste")["sub"],"google-subject")
  self.assertIsNone(verify_session(token+"x","segredo-local-de-teste"))
 def test_isolamento(self):
  self.assertTrue(authorize({"role":"CLIENTE","cliente_id":"abc"},"abc"))
  self.assertFalse(authorize({"role":"CLIENTE","cliente_id":"abc"},"xyz"))
  self.assertTrue(authorize({"role":"MASTER"},"xyz"))
  self.assertFalse(authorize({"role":"ADMIN"},master_only=True))
if __name__=="__main__": unittest.main()
