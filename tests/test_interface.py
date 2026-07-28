from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def test_lead_form_contains_required_russian_fields(tmp_path: Path) -> None:
    app = create_app(tmp_path / "test.sqlite3")

    with TestClient(app) as client:
        response = client.get("/")

    assert response.status_code == 200
    page = response.text
    assert '<html lang="ru">' in page
    assert 'name="client_name"' in page
    assert 'name="phone"' in page
    assert 'name="lead_source"' in page
    assert 'name="responsible"' in page
    assert 'name="deal_stage"' in page
    assert 'name="technical_spec_requested"' in page
    assert "Имя клиента" in page
    assert "Номер телефона" in page
    assert "Источник лида" in page
    assert "Ответственный" in page
    assert "Этап сделки" in page
    assert "Запрошено ТЗ" in page
    assert "Сохранить" in page
    assert "Сохранённые лиды" in page
    assert "Сохранённых лидов пока нет." in page
    assert "Загружаем лиды…" in page
    assert 'id="leads-load-error"' in page
    assert '<form id="lead-form" novalidate>' in page


def test_lead_form_contains_exact_select_options(tmp_path: Path) -> None:
    app = create_app(tmp_path / "test.sqlite3")

    with TestClient(app) as client:
        page = client.get("/").text

    expected_options = [
        "Холодный",
        "Тёплый",
        "Лидоруб",
        "МОП",
        "Новый лид",
        "Квалифицирован",
        "Назначена консультация",
        "Отказ",
    ]
    for option in expected_options:
        assert f'<option value="{option}">{option}</option>' in page


def test_interface_static_assets_are_available(tmp_path: Path) -> None:
    app = create_app(tmp_path / "test.sqlite3")

    with TestClient(app) as client:
        styles_response = client.get("/static/styles.css")
        script_response = client.get("/static/app.js")

    assert styles_response.status_code == 200
    assert "@media (max-width: 32rem)" in styles_response.text
    assert script_response.status_code == 200
    assert 'fetch("/api/leads"' in script_response.text
    assert "loadLeads();" in script_response.text
    assert "renderedLeadIds" in script_response.text
    assert 'method: "POST"' in script_response.text
    assert "textContent" in script_response.text
    assert "innerHTML" not in script_response.text
