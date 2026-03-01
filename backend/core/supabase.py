"""
Supabase client for the backend. Uses the service_role key (server-side only).
Never expose this key to the frontend.
"""
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise RuntimeError(
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment"
    )

supabase = create_client(url, key)
