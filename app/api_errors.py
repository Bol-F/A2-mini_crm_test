"""Stable API error models and localized response helpers."""

from enum import StrEnum

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.i18n import DEFAULT_LANGUAGE, Language, translate


class ErrorCode(StrEnum):
    """Language-independent error identifiers for API clients."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    LEAD_NOT_FOUND = "LEAD_NOT_FOUND"
    DUPLICATE_LEAD = "DUPLICATE_LEAD"
    INVALID_STAGE_TRANSITION = "INVALID_STAGE_TRANSITION"
    DATABASE_ERROR = "DATABASE_ERROR"
    UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION"


class ApiErrorDetail(BaseModel):
    """Localized error details returned under the error key."""

    code: ErrorCode
    message: str
    fields: dict[str, str] | None = None
    details: dict[str, int | str] | None = None


class ApiErrorResponse(BaseModel):
    """Consistent envelope used by every controlled API error."""

    error: ApiErrorDetail


class ApiError(Exception):
    """Controlled exception carrying stable codes and translation keys."""

    def __init__(
        self,
        *,
        status_code: int,
        code: ErrorCode,
        message_key: str,
        field_keys: dict[str, str] | None = None,
        details: dict[str, int | str] | None = None,
    ) -> None:
        super().__init__(code.value)
        self.status_code = status_code
        self.code = code
        self.message_key = message_key
        self.field_keys = field_keys
        self.details = details


def request_language(request: Request) -> Language:
    """Read the language selected once by the request middleware."""
    return getattr(request.state, "language", DEFAULT_LANGUAGE)


def api_error_response(request: Request, error: ApiError) -> JSONResponse:
    """Build a translated error response without exposing internals."""
    language = request_language(request)
    fields = (
        {
            field: translate(language, translation_key)
            for field, translation_key in error.field_keys.items()
        }
        if error.field_keys
        else None
    )
    payload = ApiErrorResponse(
        error=ApiErrorDetail(
            code=error.code,
            message=translate(language, error.message_key),
            fields=fields,
            details=error.details,
        )
    )
    return JSONResponse(
        status_code=error.status_code,
        content=payload.model_dump(mode="json"),
        headers={"Content-Language": language},
    )
