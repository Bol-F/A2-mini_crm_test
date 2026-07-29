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


def database_target_from_environment() -> Path | str:
    """Prefer hosted Postgres, while retaining SQLite as the local default."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        return database_path_from_environment()

    scheme = database_url.partition(":")[0].lower()
    if scheme not in {"postgres", "postgresql"}:
        raise RuntimeError(
            "DATABASE_URL must use the postgres:// or postgresql:// scheme."
        )
    return database_url


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
