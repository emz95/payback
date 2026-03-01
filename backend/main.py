from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend directory so it works when run from repo root or backend/
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import health
from routers import groups
from routers import expenses

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
