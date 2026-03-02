"""Shared FastAPI dependencies (e.g. auth). Dev-only: we decode the JWT without verifying the signature."""
from uuid import UUID

import jwt
from fastapi import Header, HTTPException


def get_user_id(authorization: str | None = Header(None)) -> UUID:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth header")

    token = authorization.replace("Bearer ", "").strip()

    try:
        # Decode without verifying signature — simple and works everywhere (dev only, not secure).
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
        )
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token (no sub)")
        return UUID(sub)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except (KeyError, ValueError, TypeError) as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
