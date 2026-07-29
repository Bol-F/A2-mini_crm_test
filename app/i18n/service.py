"""Lightweight translation loading and Accept-Language resolution."""

import json
from pathlib import Path
from typing import Any

from app.i18n.language import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, Language

LOCALES_PATH = Path(__file__).resolve().parent / "locales"


def _load_translations() -> dict[Language, dict[str, Any]]:
    translations: dict[Language, dict[str, Any]] = {}
    for language in SUPPORTED_LANGUAGES:
        with (LOCALES_PATH / f"{language}.json").open(encoding="utf-8") as file:
            translations[language] = json.load(file)
    return translations


TRANSLATIONS = _load_translations()


def translate(language: Language, key: str, **values: object) -> str:
    """Resolve a semantic translation key with a safe Russian fallback."""

    def find(resource: dict[str, Any]) -> object | None:
        current: object = resource
        for segment in key.split("."):
            if not isinstance(current, dict) or segment not in current:
                return None
            current = current[segment]
        return current

    translated = find(TRANSLATIONS[language])
    if not isinstance(translated, str):
        translated = find(TRANSLATIONS[DEFAULT_LANGUAGE])
    if not isinstance(translated, str):
        return key
    return translated.format(**values)
