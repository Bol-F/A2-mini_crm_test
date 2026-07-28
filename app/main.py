"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    DATABASE_PATH,
    create_lead,
    initialize_database,
    list_leads,
    update_lead_stage,
)
from app.schemas import HealthResponse, LeadCreate, LeadResponse, LeadStageUpdate


def create_app(database_path: Path = DATABASE_PATH) -> FastAPI:
    """Build an application using the requested SQLite database."""

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        initialize_database(application.state.database_path)
        yield

    application = FastAPI(title="A2 Mini CRM", lifespan=lifespan)
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
    )
    def post_lead(lead: LeadCreate, request: Request) -> dict[str, object]:
        """Validate and save a new lead."""
        return create_lead(
            request.app.state.database_path,
            lead.model_dump(mode="json"),
        )

    @application.patch(
        "/api/leads/{lead_id}/stage",
        response_model=LeadResponse,
    )
    def patch_lead_stage(
        lead_id: int,
        stage_update: LeadStageUpdate,
        request: Request,
    ) -> dict[str, object]:
        """Change a lead's deal stage."""
        updated_lead = update_lead_stage(
            request.app.state.database_path,
            lead_id,
            stage_update.deal_stage.value,
        )
        if updated_lead is None:
            raise HTTPException(status_code=404, detail="Lead not found.")
        return updated_lead

    return application


app = create_app()
