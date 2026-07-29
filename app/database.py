"""SQLite storage helpers for CRM leads."""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

DATABASE_PATH = Path(__file__).resolve().parent.parent / "crm.sqlite3"


class DuplicateLeadError(Exception):
    """Raised when another lead already uses the normalized phone number."""

LEGACY_ENUM_VALUES = {
    "lead_source": {
        "Холодный": "cold",
        "Тёплый": "warm",
    },
    "responsible": {
        "Лидоруб": "lead_generator",
        "МОП": "sales_manager",
    },
    "deal_stage": {
        "Новый лид": "new",
        "Квалифицирован": "qualified",
        "Назначена консультация": "consultation_scheduled",
        "Отказ": "rejected",
    },
}


@contextmanager
def get_connection(database_path: Path = DATABASE_PATH) -> Iterator[sqlite3.Connection]:
    """Yield a configured connection and always close it afterwards."""
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def initialize_database(database_path: Path = DATABASE_PATH) -> None:
    """Create the leads table without changing existing lead data."""
    with get_connection(database_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                lead_source TEXT NOT NULL,
                responsible TEXT NOT NULL,
                deal_stage TEXT NOT NULL,
                technical_spec_requested INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        for column, value_mapping in LEGACY_ENUM_VALUES.items():
            for old_value, new_value in value_mapping.items():
                connection.execute(
                    f"UPDATE leads SET {column} = ? WHERE {column} = ?",
                    (new_value, old_value),
                )
        connection.commit()


def create_lead(database_path: Path, lead_data: dict[str, Any]) -> dict[str, Any]:
    """Insert a lead and return the saved row."""
    created_at = datetime.now(UTC).isoformat()

    with get_connection(database_path) as connection:
        saved_phones = connection.execute("SELECT phone FROM leads").fetchall()
        normalized_phone = _normalize_phone(str(lead_data["phone"]))
        if any(
            _normalize_phone(str(row["phone"])) == normalized_phone
            for row in saved_phones
        ):
            raise DuplicateLeadError

        cursor = connection.execute(
            """
            INSERT INTO leads (
                client_name,
                phone,
                lead_source,
                responsible,
                deal_stage,
                technical_spec_requested,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lead_data["client_name"],
                lead_data["phone"],
                lead_data["lead_source"],
                lead_data["responsible"],
                lead_data["deal_stage"],
                int(lead_data["technical_spec_requested"]),
                created_at,
            ),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM leads WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    if row is None:
        raise RuntimeError("The created lead could not be loaded.")
    return _row_to_lead(row)


def list_leads(database_path: Path) -> list[dict[str, Any]]:
    """Return all leads from newest to oldest."""
    with get_connection(database_path) as connection:
        rows = connection.execute(
            "SELECT * FROM leads ORDER BY created_at DESC, id DESC"
        ).fetchall()

    return [_row_to_lead(row) for row in rows]


def get_lead(database_path: Path, lead_id: int) -> dict[str, Any] | None:
    """Return one lead or None when its id does not exist."""
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM leads WHERE id = ?",
            (lead_id,),
        ).fetchone()
    return _row_to_lead(row) if row is not None else None


def update_lead_stage(
    database_path: Path,
    lead_id: int,
    deal_stage: str,
) -> dict[str, Any] | None:
    """Update one lead's deal stage and return the complete saved row."""
    with get_connection(database_path) as connection:
        cursor = connection.execute(
            "UPDATE leads SET deal_stage = ? WHERE id = ?",
            (deal_stage, lead_id),
        )
        if cursor.rowcount == 0:
            return None

        connection.commit()
        row = connection.execute(
            "SELECT * FROM leads WHERE id = ?",
            (lead_id,),
        ).fetchone()

    if row is None:
        raise RuntimeError("The updated lead could not be loaded.")
    return _row_to_lead(row)


def _row_to_lead(row: sqlite3.Row) -> dict[str, Any]:
    """Convert a SQLite row into API-friendly values."""
    lead = dict(row)
    lead["technical_spec_requested"] = bool(lead["technical_spec_requested"])
    return lead


def _normalize_phone(phone: str) -> str:
    """Keep digits only when comparing phone numbers for duplicates."""
    return "".join(character for character in phone if character.isdigit())
