"""Small environment-based configuration for local and hosted runs."""

import os
from pathlib import Path

DEFAULT_DATABASE_PATH = Path(__file__).resolve().parent.parent / "crm.sqlite3"
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def database_path_from_environment() -> Path:
    """Use DATABASE_PATH when configured, otherwise the local CRM database."""
    configured = os.getenv("DATABASE_PATH", "").strip()
    return Path(configured) if configured else DEFAULT_DATABASE_PATH


def cors_origins_from_environment() -> list[str]:
    """Read a comma-separated allowlist without accepting wildcard origins."""
    configured = os.getenv("CORS_ORIGINS", "").strip()
    if not configured:
        return list(DEFAULT_CORS_ORIGINS)
    origins = [
        origin.strip()
        for origin in configured.split(",")
        if origin.strip()
    ]
    return [origin for origin in origins if origin != "*"]
