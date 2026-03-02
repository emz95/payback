"""App config from environment. Load dotenv in main before importing this."""
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_JWKS_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else None
