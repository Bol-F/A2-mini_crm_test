from pathlib import Path

import pytest

from app.config import database_target_from_environment
from app.database import POSTGRES_SCHEMA_CHECK_SQL, _build_filters
from app.main import create_app

MIGRATIONS_PATH = Path(__file__).parent.parent / "supabase" / "migrations"


def test_database_url_takes_priority_over_sqlite(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_url = "postgresql://crm.example/test"
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("DATABASE_PATH", "ignored.sqlite3")

    assert database_target_from_environment() == database_url
    assert create_app().state.database_target == database_url


def test_sqlite_remains_the_local_default(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "local.sqlite3"
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_PATH", str(database_path))

    assert database_target_from_environment() == database_path


def test_invalid_database_url_fails_fast(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///unexpected.sqlite3")

    with pytest.raises(
        RuntimeError,
        match="DATABASE_URL must use the postgres:// or postgresql:// scheme",
    ):
        database_target_from_environment()


def test_postgres_filters_use_psycopg_placeholders() -> None:
    where_sql, parameters = _build_filters(
        {
            "search": "Ali",
            "lead_source": "warm",
            "technical_spec_requested": True,
        },
        placeholder="%s",
        is_postgres=True,
    )

    assert "?" not in where_sql
    assert where_sql.count("%s") == len(parameters)
    assert parameters[-2:] == ("warm", True)


def test_postgres_startup_checks_required_tables() -> None:
    assert "to_regclass('public.leads')" in POSTGRES_SCHEMA_CHECK_SQL
    assert (
        "to_regclass('public.lead_stage_history')"
        in POSTGRES_SCHEMA_CHECK_SQL
    )


def test_postgres_migration_is_private_and_enforces_domain_values() -> None:
    schema_sql = (
        MIGRATIONS_PATH / "20260729105231_create_crm_schema.sql"
    ).read_text(encoding="utf-8")

    assert "enable row level security" in schema_sql
    assert "revoke all on table" in schema_sql
    assert "phone_normalized text not null unique" in schema_sql
    assert "check (lead_source in ('cold', 'warm'))" in schema_sql
