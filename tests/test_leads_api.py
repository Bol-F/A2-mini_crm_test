from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

VALID_LEAD = {
    "client_name": "Анна",
    "phone": "+998 90 123 45 67",
    "lead_source": "warm",
    "responsible": "sales_manager",
    "deal_stage": "new",
    "technical_spec_requested": True,
}


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    app = create_app(tmp_path / "test.sqlite3")
    with TestClient(app) as test_client:
        yield test_client


def test_create_lead(client: TestClient) -> None:
    response = client.post("/api/leads", json=VALID_LEAD)

    assert response.status_code == 201
    created_lead = response.json()
    assert created_lead["id"] == 1
    assert created_lead["client_name"] == VALID_LEAD["client_name"]
    assert created_lead["phone"] == VALID_LEAD["phone"]
    assert created_lead["lead_source"] == VALID_LEAD["lead_source"]
    assert created_lead["responsible"] == VALID_LEAD["responsible"]
    assert created_lead["deal_stage"] == VALID_LEAD["deal_stage"]
    assert created_lead["technical_spec_requested"] is True
    assert created_lead["created_at"]


@pytest.mark.parametrize("field", ["client_name", "phone"])
def test_rejects_missing_required_text(
    client: TestClient,
    field: str,
) -> None:
    payload = VALID_LEAD.copy()
    del payload[field]

    response = client.post("/api/leads", json=payload)

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", field]
    assert error["msg"]


@pytest.mark.parametrize("field", ["client_name", "phone"])
def test_rejects_empty_required_text(client: TestClient, field: str) -> None:
    response = client.post(
        "/api/leads",
        json={**VALID_LEAD, field: "  "},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("lead_source", "advertising"),
        ("responsible", "director"),
        ("deal_stage", "closed"),
    ],
)
def test_rejects_invalid_enum_fields(
    client: TestClient,
    field: str,
    value: str,
) -> None:
    payload = {**VALID_LEAD, field: value}

    response = client.post("/api/leads", json=payload)

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", field]
    assert error["msg"]


def test_list_leads_newest_first(client: TestClient) -> None:
    first_response = client.post("/api/leads", json=VALID_LEAD)
    second_response = client.post(
        "/api/leads",
        json={
            **VALID_LEAD,
            "client_name": "Борис",
            "phone": "+998 90 765 43 21",
        },
    )

    response = client.get("/api/leads")

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert response.status_code == 200
    assert [lead["client_name"] for lead in response.json()] == ["Борис", "Анна"]


def test_leads_persist_across_application_restarts(tmp_path: Path) -> None:
    database_path = tmp_path / "test.sqlite3"

    with TestClient(create_app(database_path)) as first_client:
        create_response = first_client.post("/api/leads", json=VALID_LEAD)

    with TestClient(create_app(database_path)) as restarted_client:
        list_response = restarted_client.get("/api/leads")

    assert create_response.status_code == 201
    assert list_response.status_code == 200
    assert [lead["id"] for lead in list_response.json()] == [
        create_response.json()["id"]
    ]


def test_update_lead_stage(client: TestClient) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()

    response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "qualified"},
    )

    assert response.status_code == 200
    updated_lead = response.json()
    assert updated_lead["deal_stage"] == "qualified"
    assert {
        key: value
        for key, value in updated_lead.items()
        if key != "deal_stage"
    } == {
        key: value
        for key, value in created_lead.items()
        if key != "deal_stage"
    }


def test_rejects_invalid_stage_update(client: TestClient) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()

    response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "closed"},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "deal_stage"]


def test_stage_update_returns_not_found(client: TestClient) -> None:
    response = client.patch(
        "/api/leads/999/stage",
        json={"deal_stage": "rejected"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Lead not found."}


def test_updated_stage_appears_in_lead_list(client: TestClient) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()
    update_response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "consultation_scheduled"},
    )

    list_response = client.get("/api/leads")

    assert update_response.status_code == 200
    assert list_response.status_code == 200
    assert list_response.json()[0]["deal_stage"] == "consultation_scheduled"
