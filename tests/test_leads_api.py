import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from httpx import Response

import app.main as main_module
from app.main import create_app

VALID_LEAD = {
    "client_name": "Анна",
    "phone": "+998 90 123 45 67",
    "lead_source": "warm",
    "responsible": "sales_manager",
    "deal_stage": "new",
    "technical_spec_requested": True,
}

LANGUAGE_MESSAGES = {
    "ru": {
        "validation": "Проверьте введённые данные",
        "client_name": "Имя клиента обязательно",
        "phone": "Номер телефона обязателен",
        "invalid_phone": "Укажите корректный номер телефона",
        "lead_source": "Укажите допустимый источник лида",
        "responsible": "Укажите допустимого ответственного сотрудника",
        "deal_stage": "Укажите допустимый этап сделки",
        "not_found": "Лид не найден",
        "transition": "Недопустимый переход между этапами сделки",
        "duplicate": "Лид с таким номером телефона уже существует",
        "unsupported": "Операция не поддерживается",
        "database": "Не удалось выполнить операцию с данными",
    },
    "en": {
        "validation": "Check the submitted data",
        "client_name": "Client name is required",
        "phone": "Phone number is required",
        "invalid_phone": "Enter a valid phone number",
        "lead_source": "Select a valid lead source",
        "responsible": "Select a valid responsible employee",
        "deal_stage": "Select a valid deal stage",
        "not_found": "Lead not found",
        "transition": "This deal stage transition is not allowed",
        "duplicate": "A lead with this phone number already exists",
        "unsupported": "This operation is not supported",
        "database": "The data operation could not be completed",
    },
    "uz": {
        "validation": "Kiritilgan ma’lumotlarni tekshiring",
        "client_name": "Mijoz ismi majburiy",
        "phone": "Telefon raqami majburiy",
        "invalid_phone": "To‘g‘ri telefon raqamini kiriting",
        "lead_source": "To‘g‘ri lid manbasini tanlang",
        "responsible": "To‘g‘ri mas’ul xodimni tanlang",
        "deal_stage": "To‘g‘ri bitim bosqichini tanlang",
        "not_found": "Lid topilmadi",
        "transition": "Bitim bosqichlari orasidagi o‘tishga ruxsat berilmagan",
        "duplicate": "Bu telefon raqamli lid allaqachon mavjud",
        "unsupported": "Bu amal qo‘llab-quvvatlanmaydi",
        "database": "Ma’lumotlar bilan amalni bajarib bo‘lmadi",
    },
}


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    app = create_app(tmp_path / "test.sqlite3")
    with TestClient(app) as test_client:
        yield test_client


def assert_error(
    response: Response,
    *,
    status_code: int,
    code: str,
    message: str,
    language: str,
) -> dict[str, object]:
    assert response.status_code == status_code
    assert response.headers["content-language"] == language
    error = response.json()["error"]
    assert error["code"] == code
    assert error["message"] == message
    return error


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
    assert response.headers["content-language"] == "ru"


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
@pytest.mark.parametrize("field", ["client_name", "phone"])
def test_localizes_missing_required_text(
    client: TestClient,
    language: str,
    field: str,
) -> None:
    payload = VALID_LEAD.copy()
    del payload[field]

    response = client.post(
        "/api/leads",
        json=payload,
        headers={"Accept-Language": language},
    )

    messages = LANGUAGE_MESSAGES[language]
    error = assert_error(
        response,
        status_code=422,
        code="VALIDATION_ERROR",
        message=messages["validation"],
        language=language,
    )
    assert error["fields"] == {field: messages[field]}


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_invalid_phone(
    client: TestClient,
    language: str,
) -> None:
    response = client.post(
        "/api/leads",
        json={**VALID_LEAD, "phone": "not-a-phone"},
        headers={"Accept-Language": language},
    )

    messages = LANGUAGE_MESSAGES[language]
    error = assert_error(
        response,
        status_code=422,
        code="VALIDATION_ERROR",
        message=messages["validation"],
        language=language,
    )
    assert error["fields"] == {"phone": messages["invalid_phone"]}


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("lead_source", "advertising"),
        ("responsible", "director"),
        ("deal_stage", "closed"),
    ],
)
def test_localizes_invalid_enum_fields(
    client: TestClient,
    language: str,
    field: str,
    value: str,
) -> None:
    response = client.post(
        "/api/leads",
        json={**VALID_LEAD, field: value},
        headers={"Accept-Language": language},
    )

    messages = LANGUAGE_MESSAGES[language]
    error = assert_error(
        response,
        status_code=422,
        code="VALIDATION_ERROR",
        message=messages["validation"],
        language=language,
    )
    assert error["fields"] == {field: messages[field]}


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_duplicate_lead(
    client: TestClient,
    language: str,
) -> None:
    first_response = client.post("/api/leads", json=VALID_LEAD)
    response = client.post(
        "/api/leads",
        json={**VALID_LEAD, "phone": "+998 (90) 123-45-67"},
        headers={"Accept-Language": language},
    )

    assert first_response.status_code == 201
    assert_error(
        response,
        status_code=409,
        code="DUPLICATE_LEAD",
        message=LANGUAGE_MESSAGES[language]["duplicate"],
        language=language,
    )


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
        key: value for key, value in updated_lead.items() if key != "deal_stage"
    } == {
        key: value for key, value in created_lead.items() if key != "deal_stage"
    }


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_invalid_stage_value(
    client: TestClient,
    language: str,
) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()

    response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "closed"},
        headers={"Accept-Language": language},
    )

    messages = LANGUAGE_MESSAGES[language]
    error = assert_error(
        response,
        status_code=422,
        code="VALIDATION_ERROR",
        message=messages["validation"],
        language=language,
    )
    assert error["fields"] == {"deal_stage": messages["deal_stage"]}


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_nonexistent_lead(
    client: TestClient,
    language: str,
) -> None:
    response = client.patch(
        "/api/leads/999/stage",
        json={"deal_stage": "rejected"},
        headers={"Accept-Language": language},
    )

    assert_error(
        response,
        status_code=404,
        code="LEAD_NOT_FOUND",
        message=LANGUAGE_MESSAGES[language]["not_found"],
        language=language,
    )


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_invalid_stage_transition(
    client: TestClient,
    language: str,
) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()

    response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "consultation_scheduled"},
        headers={"Accept-Language": language},
    )

    assert_error(
        response,
        status_code=409,
        code="INVALID_STAGE_TRANSITION",
        message=LANGUAGE_MESSAGES[language]["transition"],
        language=language,
    )


def test_updated_stage_appears_in_lead_list(client: TestClient) -> None:
    created_lead = client.post("/api/leads", json=VALID_LEAD).json()
    qualified_response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "qualified"},
    )
    update_response = client.patch(
        f"/api/leads/{created_lead['id']}/stage",
        json={"deal_stage": "consultation_scheduled"},
    )

    list_response = client.get("/api/leads")

    assert qualified_response.status_code == 200
    assert update_response.status_code == 200
    assert list_response.status_code == 200
    assert list_response.json()[0]["deal_stage"] == "consultation_scheduled"


@pytest.mark.parametrize(
    ("header", "expected_language", "expected_message"),
    [
        ("en-US", "en", LANGUAGE_MESSAGES["en"]["not_found"]),
        ("uz-UZ", "uz", LANGUAGE_MESSAGES["uz"]["not_found"]),
        ("ru,en;q=0.9", "ru", LANGUAGE_MESSAGES["ru"]["not_found"]),
        ("en;q=broken", "ru", LANGUAGE_MESSAGES["ru"]["not_found"]),
        ("de-DE", "ru", LANGUAGE_MESSAGES["ru"]["not_found"]),
        (None, "ru", LANGUAGE_MESSAGES["ru"]["not_found"]),
    ],
)
def test_accept_language_resolution(
    client: TestClient,
    header: str | None,
    expected_language: str,
    expected_message: str,
) -> None:
    headers = {"Accept-Language": header} if header else {}
    response = client.patch(
        "/api/leads/999/stage",
        json={"deal_stage": "rejected"},
        headers=headers,
    )

    assert_error(
        response,
        status_code=404,
        code="LEAD_NOT_FOUND",
        message=expected_message,
        language=expected_language,
    )


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_unsupported_operation(
    client: TestClient,
    language: str,
) -> None:
    response = client.delete(
        "/api/leads",
        headers={"Accept-Language": language},
    )

    assert_error(
        response,
        status_code=405,
        code="UNSUPPORTED_OPERATION",
        message=LANGUAGE_MESSAGES[language]["unsupported"],
        language=language,
    )


@pytest.mark.parametrize("language", ["ru", "en", "uz"])
def test_localizes_database_error_without_exposing_details(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    language: str,
) -> None:
    def fail_to_list(_database_path: Path) -> list[dict[str, object]]:
        raise sqlite3.OperationalError("private SQL and file details")

    monkeypatch.setattr(main_module, "list_leads", fail_to_list)
    response = client.get(
        "/api/leads",
        headers={"Accept-Language": language},
    )

    assert_error(
        response,
        status_code=500,
        code="DATABASE_ERROR",
        message=LANGUAGE_MESSAGES[language]["database"],
        language=language,
    )
    assert "private SQL" not in response.text
