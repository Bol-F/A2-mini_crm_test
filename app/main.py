"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.database import DATABASE_PATH, create_lead, initialize_database, list_leads
from app.schemas import HealthResponse, LeadCreate, LeadResponse

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")


def create_app(database_path: Path = DATABASE_PATH) -> FastAPI:
    """Build an application using the requested SQLite database."""

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        initialize_database(application.state.database_path)
        yield

    application = FastAPI(title="A2 Mini CRM", lifespan=lifespan)
    application.state.database_path = database_path
    application.mount(
        "/static",
        StaticFiles(directory=BASE_DIR / "static"),
        name="static",
    )

    @application.get("/", response_class=HTMLResponse)
    def home(request: Request) -> HTMLResponse:
        """Render the application landing page."""
        return templates.TemplateResponse(request=request, name="index.html")

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

    return application


app = create_app()
