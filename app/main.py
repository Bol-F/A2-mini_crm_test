"""FastAPI application entry point."""

import sqlite3
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.api_errors import (
    ApiError,
    ApiErrorResponse,
    ErrorCode,
    api_error_response,
)
from app.database import (
    DATABASE_PATH,
    DuplicateLeadError,
    create_lead,
    get_lead,
    initialize_database,
    list_leads,
    update_lead_stage,
)
from app.i18n import resolve_language
from app.schemas import (
    DealStage,
    HealthResponse,
    LeadCreate,
    LeadResponse,
    LeadStageUpdate,
)
from app.stages import is_stage_transition_allowed
from app.validation import validation_api_error

LANGUAGE_DESCRIPTION = (
    "Responses use ru, en, or uz from Accept-Language; unsupported values "
    "fall back to Russian."
)
ERROR_RESPONSES = {
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
    500: {"model": ApiErrorResponse},
}


def create_app(database_path: Path = DATABASE_PATH) -> FastAPI:
    """Build an application using the requested SQLite database."""

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        initialize_database(application.state.database_path)
        yield

    application = FastAPI(
        title="A2 Mini CRM",
        description=LANGUAGE_DESCRIPTION,
        lifespan=lifespan,
    )
    application.state.database_path = database_path
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Content-Type", "Accept-Language"],
    )

    @application.middleware("http")
    async def language_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request.state.language = resolve_language(
            request.headers.get("Accept-Language")
        )
        response = await call_next(request)
        response.headers["Content-Language"] = request.state.language
        return response

    @application.exception_handler(ApiError)
    async def handle_api_error(request: Request, error: ApiError):
        return api_error_response(request, error)

    @application.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        error: RequestValidationError,
    ):
        return api_error_response(request, validation_api_error(error))

    @application.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request,
        error: StarletteHTTPException,
    ):
        if error.status_code == 405:
            return api_error_response(
                request,
                ApiError(
                    status_code=405,
                    code=ErrorCode.UNSUPPORTED_OPERATION,
                    message_key="errors.unsupported_operation",
                ),
            )
        return api_error_response(
            request,
            ApiError(
                status_code=error.status_code,
                code=ErrorCode.LEAD_NOT_FOUND,
                message_key="errors.lead_not_found",
            ),
        )

    @application.exception_handler(sqlite3.Error)
    @application.exception_handler(RuntimeError)
    async def handle_database_error(request: Request, _error: Exception):
        return api_error_response(
            request,
            ApiError(
                status_code=500,
                code=ErrorCode.DATABASE_ERROR,
                message_key="errors.database",
            ),
        )

    @application.get("/api/health", response_model=HealthResponse)
    def health_check() -> HealthResponse:
        """Confirm that the API is available."""
        return HealthResponse(status="ok")

    @application.get("/api/leads", response_model=list[LeadResponse])
    def get_leads(request: Request) -> list[dict[str, object]]:
        """Return saved leads with the newest first."""
        return list_leads(request.app.state.database_path)

    @application.post(
        "/api/leads",
        response_model=LeadResponse,
        status_code=201,
        responses=ERROR_RESPONSES,
        description=LANGUAGE_DESCRIPTION,
    )
    def post_lead(lead: LeadCreate, request: Request) -> dict[str, object]:
        """Validate and save a new lead."""
        try:
            return create_lead(
                request.app.state.database_path,
                lead.model_dump(mode="json"),
            )
        except DuplicateLeadError as error:
            raise ApiError(
                status_code=409,
                code=ErrorCode.DUPLICATE_LEAD,
                message_key="errors.duplicate_lead",
            ) from error

    @application.patch(
        "/api/leads/{lead_id}/stage",
        response_model=LeadResponse,
        responses=ERROR_RESPONSES,
        description=LANGUAGE_DESCRIPTION,
    )
    def patch_lead_stage(
        lead_id: int,
        stage_update: LeadStageUpdate,
        request: Request,
    ) -> dict[str, object]:
        """Change a lead's deal stage."""
        current_lead = get_lead(request.app.state.database_path, lead_id)
        if current_lead is None:
            raise ApiError(
                status_code=404,
                code=ErrorCode.LEAD_NOT_FOUND,
                message_key="errors.lead_not_found",
            )

        current_stage = DealStage(str(current_lead["deal_stage"]))
        if not is_stage_transition_allowed(
            current_stage,
            stage_update.deal_stage,
        ):
            raise ApiError(
                status_code=409,
                code=ErrorCode.INVALID_STAGE_TRANSITION,
                message_key="errors.invalid_stage_transition",
            )

        updated_lead = update_lead_stage(
            request.app.state.database_path,
            lead_id,
            stage_update.deal_stage.value,
        )
        if updated_lead is None:
            raise ApiError(
                status_code=404,
                code=ErrorCode.LEAD_NOT_FOUND,
                message_key="errors.lead_not_found",
            )
        return updated_lead

    return application


app = create_app()
