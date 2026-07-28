"""FastAPI application entry point."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.schemas import HealthResponse

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="A2 Mini CRM")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", response_class=HTMLResponse)
def home(request: Request) -> HTMLResponse:
    """Render the application landing page."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Confirm that the API is available."""
    return HealthResponse(status="ok")
