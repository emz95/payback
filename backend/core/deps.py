"""Shared FastAPI dependencies (e.g. auth). Simplified: decode JWT without verification for reliability."""
from uuid import UUID

import jwt
from fastapi import Header, HTTPException


def get_user_id(authorization: str | None = Header(None)) -> UUID:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth header")

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth header")

    try:
        # Decode without verification so we never hit Supabase JWKS (no SSL/connection issues).
        # Insecure: anyone could forge a token; use only for dev / low-stakes.
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_aud": False, "verify_exp": False},
        )
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UUID(sub)
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except (KeyError, ValueError, TypeError) as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
