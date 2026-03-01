"""Shared FastAPI dependencies (e.g. auth)."""
import time
from uuid import UUID

import jwt
import requests
from fastapi import Header, HTTPException
from jwt import PyJWKSet

from core.config import SUPABASE_JWKS_URL

_jwks_cache: tuple[float, PyJWKSet | None] = (0.0, None)
_JWKS_TTL = 600  # seconds


def _get_jwks() -> PyJWKSet | None:
    global _jwks_cache
    if not SUPABASE_JWKS_URL:
        return None
    now = time.monotonic()
    if _jwks_cache[1] is not None and (now - _jwks_cache[0]) < _JWKS_TTL:
        return _jwks_cache[1]
    try:
        resp = requests.get(SUPABASE_JWKS_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        jwks = PyJWKSet.from_dict(data)
        _jwks_cache = (now, jwks)
        return jwks
    except Exception:
        if _jwks_cache[1] is not None:
            return _jwks_cache[1]  # use stale cache
        raise


def get_user_id(authorization: str | None = Header(None)) -> UUID:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth header")

    token = authorization.replace("Bearer ", "").strip()

    try:
        jwks = _get_jwks()
    except Exception as e:
        err_msg = str(e).strip() or type(e).__name__
        raise HTTPException(
            status_code=503,
            detail=f"Auth unavailable (fetch JWKS failed): {err_msg}. Check SUPABASE_URL in backend/.env and run: pip install requests certifi",
        ) from e
    if jwks is None:
        raise HTTPException(
            status_code=503,
            detail="Auth not configured. Set SUPABASE_URL in backend/.env (same value as EXPO_PUBLIC_SUPABASE_URL, without /auth path).",
        )

    try:
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token")
        # PyJWKSet is indexed by kid (no get_signing_key in this PyJWT version)
        jwk = jwks[kid]
        payload = jwt.decode(
            token,
            jwk.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except KeyError:
        raise HTTPException(status_code=401, detail="Invalid token (key not in JWKS)")
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
