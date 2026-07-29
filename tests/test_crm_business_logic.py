from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    with TestClient(create_app(tmp_path / "business.sqlite3")) as test_client:
        yield test_client


def make_lead(
    client: TestClient,
    *,
    name: str = "Ali",
    phone: str = "+998 90 123 45 67",
    source: str = "warm",
    responsible: str = "sales_manager",
    stage: str = "new",
    technical_spec: bool = True,
) -> dict[str, object]:
    response = client.post(
        "/api/leads",
        json={
            "client_name": name,
            "phone": phone,
            "lead_source": source,
            "responsible": responsible,
            "deal_stage": stage,
            "technical_spec_requested": technical_spec,
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.parametrize(
    ("formatted", "normalized"),
    [
        ("+998 90 123 45 67", "998901234567"),
        ("+998 (90) 123-45-67", "998901234567"),
        (" 998901234567 ", "998901234567"),
    ],
)
def test_phone_is_validated_and_normalized(
    client: TestClient,
    formatted: str,
    normalized: str,
) -> None:
    lead = make_lead(client, phone=formatted)
    assert lead["phone"] == formatted.strip()
    assert lead["phone_normalized"] == normalized


def test_duplicate_response_contains_existing_lead_id(client: TestClient) -> None:
    existing = make_lead(client)
    response = client.post(
        "/api/leads",
        json={
            "client_name": "Duplicate",
            "phone": "+998 (90) 123-45-67",
            "lead_source": "cold",
            "responsible": "lead_generator",
            "deal_stage": "new",
            "technical_spec_requested": False,
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "DUPLICATE_LEAD"
    assert response.json()["error"]["details"] == {
        "existing_lead_id": existing["id"]
    }


@pytest.mark.parametrize(
    ("current_stage", "new_stage"),
    [
        ("new", "qualified"),
        ("new", "rejected"),
        ("qualified", "consultation_scheduled"),
        ("qualified", "rejected"),
        ("consultation_scheduled", "rejected"),
        ("rejected", "new"),
    ],
)
def test_allowed_stage_transitions(
    client: TestClient,
    current_stage: str,
    new_stage: str,
) -> None:
    lead = make_lead(client, stage=current_stage)
    response = client.patch(
        f"/api/leads/{lead['id']}/stage",
        json={"deal_stage": new_stage},
    )
    assert response.status_code == 200
    assert response.json()["deal_stage"] == new_stage


def test_stage_history_is_newest_first_and_no_op_is_not_recorded(
    client: TestClient,
) -> None:
    lead = make_lead(client)
    lead_id = lead["id"]
    client.patch(f"/api/leads/{lead_id}/stage", json={"deal_stage": "new"})
    client.patch(f"/api/leads/{lead_id}/stage", json={"deal_stage": "qualified"})
    client.patch(
        f"/api/leads/{lead_id}/stage",
        json={"deal_stage": "consultation_scheduled"},
    )
    history = client.get(f"/api/leads/{lead_id}/history").json()
    assert [(item["previous_stage"], item["new_stage"]) for item in history] == [
        ("qualified", "consultation_scheduled"),
        ("new", "qualified"),
    ]


def test_filter_search_sort_pagination_and_summary(client: TestClient) -> None:
    make_lead(client, name="Ali", phone="+998 90 111 11 11", source="warm")
    make_lead(
        client,
        name="Bob",
        phone="+998 90 222 22 22",
        source="cold",
        responsible="lead_generator",
        technical_spec=False,
    )
    response = client.get(
        "/api/leads",
        params={
            "search": "998901",
            "lead_source": "warm",
            "responsible": "sales_manager",
            "deal_stage": "new",
            "technical_spec_requested": "true",
            "sort": "client_name",
            "order": "asc",
            "page": 1,
            "page_size": 1,
        },
    )
    body = response.json()
    assert response.status_code == 200
    assert [item["client_name"] for item in body["items"]] == ["Ali"]
    assert body["pagination"] == {
        "page": 1,
        "page_size": 1,
        "total_items": 1,
        "total_pages": 1,
    }
    assert body["summary"]["total"] == 1
    assert body["summary"]["technical_spec_requested"] == 1


def test_sql_like_characters_are_escaped(client: TestClient) -> None:
    make_lead(client)
    response = client.get("/api/leads", params={"search": "%' OR 1=1 --"})
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert client.get("/api/leads").json()["pagination"]["total_items"] == 1


def test_page_size_limit_uses_stable_validation_error(client: TestClient) -> None:
    response = client.get("/api/leads", params={"page_size": 101})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
