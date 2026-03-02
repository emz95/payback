import os
from pathlib import Path

import certifi
from dotenv import load_dotenv

# Use certifi CA bundle so SSL verification works on macOS for outbound HTTPS (e.g. Supabase)
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

# Load .env from backend directory so it works when run from repo root or backend/
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import health
from routers import groups
from routers import expenses
from routers import profiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(groups.router)
app.include_router(expenses.router)
app.include_router(profiles.router)
