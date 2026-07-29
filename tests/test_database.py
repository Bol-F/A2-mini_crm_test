from pathlib import Path

from app.database import create_lead, get_connection, initialize_database, list_leads


def test_lead_persists_through_separate_connections(tmp_path: Path) -> None:
    database_path = tmp_path / "test.sqlite3"
    initialize_database(database_path)

    created_lead = create_lead(
        database_path,
        {
            "client_name": "Анна",
            "phone": "+998 90 123 45 67",
            "lead_source": "warm",
            "responsible": "sales_manager",
            "deal_stage": "new",
            "technical_spec_requested": True,
        },
    )
    saved_leads = list_leads(database_path)

    assert saved_leads["items"] == [created_lead]


def test_legacy_russian_enum_values_are_migrated(tmp_path: Path) -> None:
    database_path = tmp_path / "legacy.sqlite3"
    initialize_database(database_path)

    with get_connection(database_path) as connection:
        connection.execute(
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
                "Анна",
                "+998 90 123 45 67",
                "Тёплый",
                "МОП",
                "Назначена консультация",
                1,
                "2026-07-29T00:00:00+00:00",
            ),
        )
        connection.commit()

    initialize_database(database_path)
    migrated_lead = list_leads(database_path)["items"][0]

    assert migrated_lead["lead_source"] == "warm"
    assert migrated_lead["responsible"] == "sales_manager"
    assert migrated_lead["deal_stage"] == "consultation_scheduled"
