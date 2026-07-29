import pytest

from app.i18n import resolve_language


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        ("ru", "ru"),
        ("ru-RU", "ru"),
        ("en-US", "en"),
        ("uz_UZ", "uz"),
        ("fr,uz;q=0.8,en;q=0.5", "uz"),
        ("en;q=0.5,ru;q=0.9", "ru"),
        ("en;q=0", "ru"),
        ("", "ru"),
        (None, "ru"),
        ("not a valid header", "ru"),
    ],
)
def test_resolve_language(header: str | None, expected: str) -> None:
    assert resolve_language(header) == expected
