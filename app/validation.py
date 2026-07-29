"""Controlled mapping from Pydantic errors to stable API errors."""

from collections.abc import Mapping
from typing import Any

from fastapi.exceptions import RequestValidationError

from app.api_errors import ApiError, ErrorCode

ENUM_FIELD_KEYS = {
    "lead_source": "fields.lead_source.invalid",
    "responsible": "fields.responsible.invalid",
    "deal_stage": "fields.deal_stage.invalid",
}


def validation_api_error(error: RequestValidationError) -> ApiError:
    """Convert FastAPI validation details into translated field messages."""
    field_keys: dict[str, str] = {}

    for issue in error.errors():
        field = _field_name(issue)
        issue_type = str(issue.get("type", ""))

        if field == "client_name":
            field_keys[field] = "fields.client_name.required"
        elif field == "phone":
            field_keys[field] = (
                "fields.phone.required"
                if issue_type in {"missing", "string_too_short"}
                else "fields.phone.invalid"
            )
        elif field in ENUM_FIELD_KEYS:
            field_keys[field] = ENUM_FIELD_KEYS[field]
        else:
            field_keys[field or "request"] = "fields.request.invalid"

    return ApiError(
        status_code=422,
        code=ErrorCode.VALIDATION_ERROR,
        message_key="errors.validation",
        field_keys=field_keys or {"request": "fields.request.invalid"},
    )


def _field_name(issue: Mapping[str, Any]) -> str | None:
    location = issue.get("loc")
    if not isinstance(location, (tuple, list)):
        return None
    for part in reversed(location):
        if isinstance(part, str) and part not in {"body", "query", "path"}:
            return part
    return None
