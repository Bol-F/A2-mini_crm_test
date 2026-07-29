"""API response schemas."""

import re
from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

PHONE_CHARACTERS = re.compile(r"^\+?[\d\s()-]+$")


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

    model_config = ConfigDict(extra="forbid")

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

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Accept common phone separators and require 7 to 15 digits."""
        digit_count = sum(character.isdigit() for character in value)
        if not PHONE_CHARACTERS.fullmatch(value) or not 7 <= digit_count <= 15:
            raise ValueError("invalid_phone")
        return value


class LeadResponse(LeadCreate):
    """A complete lead returned by the API."""

    id: int
    created_at: datetime


class LeadStageUpdate(BaseModel):
    """A validated deal-stage change."""

    model_config = ConfigDict(extra="forbid")

    deal_stage: DealStage


class HealthResponse(BaseModel):
    """Response returned by the health-check endpoint."""

    status: Literal["ok"]
