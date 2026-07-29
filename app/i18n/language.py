"""Reusable Accept-Language resolution."""

from typing import Literal, cast

Language = Literal["ru", "en", "uz"]
SUPPORTED_LANGUAGES: tuple[Language, ...] = ("ru", "en", "uz")
DEFAULT_LANGUAGE: Language = "ru"


def resolve_language(accept_language: str | None) -> Language:
    """Return the best supported language from an Accept-Language header."""
    if not accept_language:
        return DEFAULT_LANGUAGE

    candidates: list[tuple[float, int, Language]] = []
    for position, raw_candidate in enumerate(accept_language.split(",")):
        parts = [part.strip() for part in raw_candidate.split(";")]
        language_code = parts[0].replace("_", "-").split("-")[0].lower()
        if language_code not in SUPPORTED_LANGUAGES:
            continue

        quality = 1.0
        try:
            for parameter in parts[1:]:
                if parameter.lower().startswith("q="):
                    quality = float(parameter[2:])
                    if not 0 <= quality <= 1:
                        raise ValueError
        except ValueError:
            continue

        if quality > 0:
            candidates.append(
                (quality, -position, cast(Language, language_code))
            )

    if not candidates:
        return DEFAULT_LANGUAGE
    return max(candidates)[2]
