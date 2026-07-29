"""SQLite storage helpers for CRM leads."""

import math
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import DEFAULT_DATABASE_PATH

DATABASE_PATH = DEFAULT_DATABASE_PATH


class DuplicateLeadError(Exception):
    """Raised when another lead already uses the normalized phone number."""

    def __init__(self, existing_lead_id: int) -> None:
        super().__init__("duplicate lead")
        self.existing_lead_id = existing_lead_id


LEGACY_ENUM_VALUES = {
    "lead_source": {
        "Холодный": "cold",
        "Тёплый": "warm",
        "РҐРѕР»РѕРґРЅС‹Р№": "cold",
        "РўС‘РїР»С‹Р№": "warm",
    },
    "responsible": {
        "Лидоруб": "lead_generator",
        "МОП": "sales_manager",
        "Р›РёРґРѕСЂСѓР±": "lead_generator",
        "РњРћРџ": "sales_manager",
    },
    "deal_stage": {
        "Новый лид": "new",
        "Квалифицирован": "qualified",
        "Назначена консультация": "consultation_scheduled",
        "Отказ": "rejected",
        "РќРѕРІС‹Р№ Р»РёРґ": "new",
        "РљРІР°Р»РёС„РёС†РёСЂРѕРІР°РЅ": "qualified",
        "РќР°Р·РЅР°С‡РµРЅР° РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ": "consultation_scheduled",
        "РћС‚РєР°Р·": "rejected",
    },
}

SORT_COLUMNS = {
    "created_at": "created_at",
    "client_name": "client_name COLLATE NOCASE",
    "deal_stage": "deal_stage",
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


def normalize_phone(phone: str) -> str:
    """Return the language-independent digits-only phone representation."""
    return "".join(character for character in phone.strip() if character.isdigit())


def initialize_database(database_path: Path = DATABASE_PATH) -> None:
    """Create or safely migrate the CRM tables without deleting records."""
    with get_connection(database_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                phone_normalized TEXT,
                lead_source TEXT NOT NULL,
                responsible TEXT NOT NULL,
                deal_stage TEXT NOT NULL,
                technical_spec_requested INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(leads)").fetchall()
        }
        if "phone_normalized" not in columns:
            connection.execute("ALTER TABLE leads ADD COLUMN phone_normalized TEXT")

        for column, value_mapping in LEGACY_ENUM_VALUES.items():
            for old_value, new_value in value_mapping.items():
                connection.execute(
                    f"UPDATE leads SET {column} = ? WHERE {column} = ?",
                    (new_value, old_value),
                )

        rows = connection.execute(
            "SELECT id, phone FROM leads WHERE phone_normalized IS NULL "
            "OR phone_normalized = ''"
        ).fetchall()
        for row in rows:
            connection.execute(
                "UPDATE leads SET phone_normalized = ? WHERE id = ?",
                (normalize_phone(str(row["phone"])), row["id"]),
            )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS lead_stage_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER NOT NULL,
                previous_stage TEXT NOT NULL,
                new_stage TEXT NOT NULL,
                changed_at TEXT NOT NULL,
                FOREIGN KEY (lead_id) REFERENCES leads (id)
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_lead_id "
            "ON lead_stage_history (lead_id, changed_at DESC, id DESC)"
        )
        connection.commit()


def create_lead(database_path: Path, lead_data: dict[str, Any]) -> dict[str, Any]:
    """Insert a lead after checking its normalized phone."""
    created_at = datetime.now(UTC).isoformat()
    phone = str(lead_data["phone"]).strip()
    phone_normalized = normalize_phone(phone)

    with get_connection(database_path) as connection:
        duplicate = connection.execute(
            "SELECT id FROM leads WHERE phone_normalized = ? LIMIT 1",
            (phone_normalized,),
        ).fetchone()
        if duplicate is not None:
            raise DuplicateLeadError(int(duplicate["id"]))

        cursor = connection.execute(
            """
            INSERT INTO leads (
                client_name,
                phone,
                phone_normalized,
                lead_source,
                responsible,
                deal_stage,
                technical_spec_requested,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lead_data["client_name"],
                phone,
                phone_normalized,
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


def list_leads(
    database_path: Path,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return safely filtered, sorted, paginated leads and matching summaries."""
    filters = {
        "sort": "created_at",
        "order": "desc",
        "page": 1,
        "page_size": 20,
        **(filters or {}),
    }
    where_sql, parameters = _build_filters(filters)
    page = int(filters["page"])
    page_size = int(filters["page_size"])
    offset = (page - 1) * page_size
    sort_column = SORT_COLUMNS[str(filters["sort"])]
    direction = "ASC" if filters["order"] == "asc" else "DESC"

    with get_connection(database_path) as connection:
        total_items = int(
            connection.execute(
                f"SELECT COUNT(*) FROM leads {where_sql}",
                parameters,
            ).fetchone()[0]
        )
        rows = connection.execute(
            f"""
            SELECT * FROM leads
            {where_sql}
            ORDER BY {sort_column} {direction}, id {direction}
            LIMIT ? OFFSET ?
            """,
            (*parameters, page_size, offset),
        ).fetchall()
        summary_row = connection.execute(
            f"""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN deal_stage = 'new' THEN 1 ELSE 0 END) AS new,
                SUM(CASE WHEN deal_stage = 'qualified' THEN 1 ELSE 0 END)
                    AS qualified,
                SUM(CASE WHEN deal_stage = 'consultation_scheduled'
                    THEN 1 ELSE 0 END) AS consultation_scheduled,
                SUM(CASE WHEN deal_stage = 'rejected' THEN 1 ELSE 0 END)
                    AS rejected,
                SUM(CASE WHEN technical_spec_requested = 1
                    THEN 1 ELSE 0 END) AS technical_spec_requested
            FROM leads
            {where_sql}
            """,
            parameters,
        ).fetchone()

    summary = {
        key: int(summary_row[key] or 0)
        for key in (
            "total",
            "new",
            "qualified",
            "consultation_scheduled",
            "rejected",
            "technical_spec_requested",
        )
    }
    return {
        "items": [_row_to_lead(row) for row in rows],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": math.ceil(total_items / page_size),
        },
        "summary": summary,
    }


def get_lead(database_path: Path, lead_id: int) -> dict[str, Any] | None:
    """Return one lead or None when its id does not exist."""
    with get_connection(database_path) as connection:
        row = connection.execute(
            "SELECT * FROM leads WHERE id = ?",
            (lead_id,),
        ).fetchone()
    return _row_to_lead(row) if row is not None else None


def list_lead_history(
    database_path: Path,
    lead_id: int,
) -> list[dict[str, Any]]:
    """Return one lead's stage changes with the newest change first."""
    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT * FROM lead_stage_history
            WHERE lead_id = ?
            ORDER BY changed_at DESC, id DESC
            """,
            (lead_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def update_lead_stage(
    database_path: Path,
    lead_id: int,
    previous_stage: str,
    new_stage: str,
) -> dict[str, Any] | None:
    """Update a stage and record history atomically; no-op on the same stage."""
    if previous_stage == new_stage:
        return get_lead(database_path, lead_id)

    changed_at = datetime.now(UTC).isoformat()
    with get_connection(database_path) as connection:
        try:
            cursor = connection.execute(
                "UPDATE leads SET deal_stage = ? WHERE id = ? AND deal_stage = ?",
                (new_stage, lead_id, previous_stage),
            )
            if cursor.rowcount == 0:
                connection.rollback()
                return None
            connection.execute(
                """
                INSERT INTO lead_stage_history (
                    lead_id, previous_stage, new_stage, changed_at
                )
                VALUES (?, ?, ?, ?)
                """,
                (lead_id, previous_stage, new_stage, changed_at),
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        row = connection.execute(
            "SELECT * FROM leads WHERE id = ?",
            (lead_id,),
        ).fetchone()

    if row is None:
        raise RuntimeError("The updated lead could not be loaded.")
    return _row_to_lead(row)


def _build_filters(filters: dict[str, Any]) -> tuple[str, tuple[Any, ...]]:
    clauses: list[str] = []
    parameters: list[Any] = []

    search = filters.get("search")
    if search:
        escaped_search = _escape_like(str(search).lower())
        normalized_search = normalize_phone(str(search))
        search_clauses = [
            "LOWER(client_name) LIKE ? ESCAPE '\\'",
            "LOWER(phone) LIKE ? ESCAPE '\\'",
        ]
        parameters.extend([f"%{escaped_search}%", f"%{escaped_search}%"])
        if normalized_search:
            search_clauses.append("phone_normalized LIKE ? ESCAPE '\\'")
            parameters.append(f"%{_escape_like(normalized_search)}%")
        clauses.append(f"({' OR '.join(search_clauses)})")

    for field in ("lead_source", "responsible", "deal_stage"):
        value = filters.get(field)
        if value is not None:
            clauses.append(f"{field} = ?")
            parameters.append(str(value))

    technical_spec_requested = filters.get("technical_spec_requested")
    if technical_spec_requested is not None:
        clauses.append("technical_spec_requested = ?")
        parameters.append(int(technical_spec_requested))

    if filters.get("created_from") is not None:
        clauses.append("created_at >= ?")
        parameters.append(filters["created_from"].isoformat())
    if filters.get("created_to") is not None:
        clauses.append("created_at <= ?")
        parameters.append(filters["created_to"].isoformat())

    return (
        f"WHERE {' AND '.join(clauses)}" if clauses else "",
        tuple(parameters),
    )


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _row_to_lead(row: sqlite3.Row) -> dict[str, Any]:
    lead = dict(row)
    lead["technical_spec_requested"] = bool(lead["technical_spec_requested"])
    lead["phone_normalized"] = str(
        lead.get("phone_normalized") or normalize_phone(str(lead["phone"]))
    )
    return lead
