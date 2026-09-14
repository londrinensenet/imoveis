"""Primitivas de sessão local; a identidade é validada pelo Worker com Google."""
import base64
import hashlib
import hmac
import json
import time


def sign_session(payload: dict, secret: str) -> str:
    data=base64.urlsafe_b64encode(json.dumps(payload,separators=(",",":"),sort_keys=True).encode()).rstrip(b"=").decode()
    signature=hmac.new(secret.encode(),data.encode(),hashlib.sha256).digest()
    return f"{data}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def verify_session(token: str, secret: str) -> dict | None:
    try:
        data,signature=token.split(".")
        expected=base64.urlsafe_b64encode(hmac.new(secret.encode(),data.encode(),hashlib.sha256).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(signature,expected): return None
        payload=json.loads(base64.urlsafe_b64decode(data+"="*(-len(data)%4)))
        return payload if payload.get("exp",0)>time.time() else None
    except (ValueError,TypeError,json.JSONDecodeError): return None


def authorize(session: dict | None, cliente_id: str | None=None, master_only: bool=False) -> bool:
    if not session: return False
    if master_only: return session.get("role")=="MASTER"
    return session.get("role") in {"MASTER","ADMIN"} or session.get("role")=="CLIENTE" and session.get("cliente_id")==cliente_id
