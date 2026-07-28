from pathlib import Path

from app.database import create_lead, initialize_database, list_leads


def test_lead_persists_through_separate_connections(tmp_path: Path) -> None:
    database_path = tmp_path / "test.sqlite3"
    initialize_database(database_path)

    created_lead = create_lead(
        database_path,
        {
            "client_name": "Анна",
            "phone": "+998 90 123 45 67",
            "lead_source": "Тёплый",
            "responsible": "МОП",
            "deal_stage": "Новый лид",
            "technical_spec_requested": True,
        },
    )
    saved_leads = list_leads(database_path)

    assert saved_leads == [created_lead]
