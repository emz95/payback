"""App config from environment. Load dotenv in main before importing this."""
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL")
