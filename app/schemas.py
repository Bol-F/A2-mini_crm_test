"""API response schemas."""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class LeadSource(StrEnum):
    """Allowed ways a lead entered the CRM."""

    COLD = "Холодный"
    WARM = "Тёплый"


class ResponsibleEmployee(StrEnum):
    """Employees who may be responsible for a lead."""

    LEAD_GENERATOR = "Лидоруб"
    SALES_MANAGER = "МОП"


class DealStage(StrEnum):
    """Allowed stages in the lead workflow."""

    NEW = "Новый лид"
    QUALIFIED = "Квалифицирован"
    CONSULTATION_SCHEDULED = "Назначена консультация"
    REJECTED = "Отказ"


class LeadCreate(BaseModel):
    """Fields accepted when creating a lead."""

    client_name: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    lead_source: LeadSource
    responsible: ResponsibleEmployee
    deal_stage: DealStage
    technical_spec_requested: bool

    @field_validator("client_name", "phone", mode="before")
    @classmethod
    def strip_required_text(cls, value: object) -> object:
        """Treat whitespace-only required text as empty."""
        return value.strip() if isinstance(value, str) else value


class LeadResponse(LeadCreate):
    """A complete lead returned by the API."""

    id: int
    created_at: datetime


class HealthResponse(BaseModel):
    """Response returned by the health-check endpoint."""

    status: Literal["ok"]
