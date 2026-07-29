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
    phone_normalized: str
    created_at: datetime


class LeadStageHistoryResponse(BaseModel):
    """One recorded deal-stage change."""

    id: int
    lead_id: int
    previous_stage: DealStage
    new_stage: DealStage
    changed_at: datetime


class PaginationResponse(BaseModel):
    """Pagination metadata for a lead list."""

    page: int
    page_size: int
    total_items: int
    total_pages: int


class LeadSummary(BaseModel):
    """Counts calculated across every matching filtered lead."""

    total: int
    new: int
    qualified: int
    consultation_scheduled: int
    rejected: int
    technical_spec_requested: int


class LeadListResponse(BaseModel):
    """Paginated leads plus accurate matching-result statistics."""

    items: list[LeadResponse]
    pagination: PaginationResponse
    summary: LeadSummary


class LeadListQuery(BaseModel):
    """Validated optional filters accepted by GET /api/leads."""

    search: str | None = Field(default=None, max_length=100)
    lead_source: LeadSource | None = None
    responsible: ResponsibleEmployee | None = None
    deal_stage: DealStage | None = None
    technical_spec_requested: bool | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None
    sort: Literal["created_at", "client_name", "deal_stage"] = "created_at"
    order: Literal["asc", "desc"] = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @field_validator("search", mode="before")
    @classmethod
    def clean_search(cls, value: object) -> object:
        """Trim search text and treat an empty search as no filter."""
        if isinstance(value, str):
            return value.strip() or None
        return value


class LeadStageUpdate(BaseModel):
    """A validated deal-stage change."""

    model_config = ConfigDict(extra="forbid")

    deal_stage: DealStage


class HealthResponse(BaseModel):
    """Response returned by the health-check endpoint."""

    status: Literal["ok"]
