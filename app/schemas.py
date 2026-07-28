"""API response schemas."""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class LeadSource(StrEnum):
    """Allowed ways a lead entered the CRM."""

    COLD = "cold"
    WARM = "warm"


class ResponsibleEmployee(StrEnum):
    """Employees who may be responsible for a lead."""

    LEAD_GENERATOR = "lead_generator"
    SALES_MANAGER = "sales_manager"


class DealStage(StrEnum):
    """Allowed stages in the lead workflow."""

    NEW = "new"
    QUALIFIED = "qualified"
    CONSULTATION_SCHEDULED = "consultation_scheduled"
    REJECTED = "rejected"


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


class LeadStageUpdate(BaseModel):
    """A validated deal-stage change."""

    deal_stage: DealStage


class HealthResponse(BaseModel):
    """Response returned by the health-check endpoint."""

    status: Literal["ok"]
