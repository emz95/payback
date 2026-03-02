"""Shared FastAPI dependencies (e.g. auth)."""
from uuid import UUID

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from core.config import SUPABASE_JWKS_URL

_jwks_client: PyJWKClient | None = (
    PyJWKClient(SUPABASE_JWKS_URL) if SUPABASE_JWKS_URL else None
)


def get_user_id(authorization: str | None = Header(None)) -> UUID:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth header")

    token = authorization.replace("Bearer ", "").strip()

    if not _jwks_client:
        raise HTTPException(
            status_code=503,
            detail="Auth not configured (SUPABASE_URL missing)",
        )

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
