"""FastAPI stateless AI microservice for LLM generation.

Internal service only — called by backend-node. No auth.
"""
import os
import sys
from pathlib import Path

# Load .env from AI/ or project root (for MODEL_ID, PEFT_ADAPTER_PATH)
try:
    from dotenv import load_dotenv
    _ai_dir = Path(__file__).resolve().parent
    load_dotenv(_ai_dir / ".env")
    load_dotenv(_ai_dir.parent / ".env")  # project root
except ImportError:
    pass

# Fail fast if running with system Python when venv is expected (avoids torch CUDA DLL errors)
_venv = os.environ.get("VIRTUAL_ENV")
if _venv and "AppData" in sys.executable and ".venv" not in sys.executable:
    print("ERROR: Using system Python instead of venv. Run: python -m uvicorn main:app --port 8002 --reload")
    sys.exit(1)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import overview, backlog, system

app = FastAPI(
    title="My Crew Manager AI Service",
    description="Stateless LLM service for overview and backlog generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/generate-overview", tags=["overview"])
app.include_router(backlog.router, prefix="/generate-backlog", tags=["backlog"])
app.include_router(system.router, prefix="/system", tags=["system"])


@app.get("/health")
def health():
    """Health check for load balancers and readiness probes."""
    return {"status": "ok"}
