"""Small SQLite helpers for future lead-card features."""

import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent.parent / "crm.sqlite3"


def get_connection() -> sqlite3.Connection:
    """Return a SQLite connection whose rows support name-based access."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection

