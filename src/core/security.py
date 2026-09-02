"""Primitivas de segurança sem dependências externas."""
from __future__ import annotations
import base64, hashlib, hmac, json, secrets, time

PARAMETERS = {"algorithm": "scrypt", "n": 16384, "r": 8, "p": 1, "dklen": 32, "version": 1}

def hash_password(password: str) -> str:
    if not isinstance(password, str) or len(password) < 12 or len(password) > 256:
        raise ValueError("A senha deve ter entre 12 e 256 caracteres")
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(password.encode(), salt=salt, n=PARAMETERS["n"], r=PARAMETERS["r"], p=PARAMETERS["p"], dklen=PARAMETERS["dklen"])
    return "scrypt$v=1$n=16384,r=8,p=1$%s$%s" % (base64.urlsafe_b64encode(salt).decode(), base64.urlsafe_b64encode(key).decode())

def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, version, raw_params, salt64, key64 = encoded.split("$")
        params = dict(item.split("=") for item in raw_params.split(","))
        if algorithm != "scrypt" or version != "v=1": return False
        actual = hashlib.scrypt(password.encode(), salt=base64.urlsafe_b64decode(salt64), n=int(params["n"]), r=int(params["r"]), p=int(params["p"]), dklen=len(base64.urlsafe_b64decode(key64)))
        return hmac.compare_digest(actual, base64.urlsafe_b64decode(key64))
    except (ValueError, KeyError, TypeError): return False

def sign_session(subject: str, role: str, secret: str, ttl: int = 3600) -> str:
    if role not in {"superadmin", "cliente"} or not subject: raise ValueError("Sessão inválida")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": subject, "role": role, "exp": int(time.time()) + ttl}, separators=(",", ":"), sort_keys=True).encode()).decode().rstrip("=")
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return payload + "." + signature

def verify_session(token: str, secret: str) -> dict | None:
    try:
        payload, signature = token.split(".", 1)
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected): return None
        data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        return data if data["exp"] >= int(time.time()) and data["role"] in {"superadmin", "cliente"} else None
    except (ValueError, KeyError, TypeError, json.JSONDecodeError): return None

def authorize(session: dict, role: str, client_id: str | None = None) -> bool:
    return bool(session and (session["role"] == "superadmin" or (session["role"] == role == "cliente" and session["sub"] == client_id)))

