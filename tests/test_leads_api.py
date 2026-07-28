from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

VALID_LEAD = {
    "client_name": "Анна",
    "phone": "+998 90 123 45 67",
    "lead_source": "Тёплый",
    "responsible": "МОП",
    "deal_stage": "Новый лид",
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
        ("lead_source", "Реклама"),
        ("responsible", "Директор"),
        ("deal_stage", "Закрыта"),
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
