import { ApiClientError, apiRequest } from "./client";
import type {
  CreateLeadPayload,
  DealStage,
  Lead,
  LeadFilters,
  LeadListResponse,
  LeadSource,
  LeadStageHistory,
  ResponsibleEmployee,
  UpdateLeadStagePayload,
} from "../types/lead";
import {
  DEAL_STAGES,
  LEAD_SOURCES,
  RESPONSIBLE_EMPLOYEES,
} from "../types/lead";

function isAllowedValue<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isLead(value: unknown): value is Lead {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const lead = value as Partial<Lead>;
  return (
    typeof lead.id === "number" &&
    typeof lead.client_name === "string" &&
    typeof lead.phone === "string" &&
    typeof lead.phone_normalized === "string" &&
    isAllowedValue<LeadSource>(LEAD_SOURCES, lead.lead_source) &&
    isAllowedValue<ResponsibleEmployee>(
      RESPONSIBLE_EMPLOYEES,
      lead.responsible,
    ) &&
    isAllowedValue<DealStage>(DEAL_STAGES, lead.deal_stage) &&
    typeof lead.technical_spec_requested === "boolean" &&
    typeof lead.created_at === "string" &&
    !Number.isNaN(Date.parse(lead.created_at))
  );
}

function ensureLead(value: unknown): Lead {
  if (!isLead(value)) {
    throw new ApiClientError("malformed_response", 200);
  }
  return value;
}

export function buildLeadQuery(
  filters: LeadFilters,
  page: number,
  pageSize = 20,
): string {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort: filters.sort,
    order: filters.order,
  });
  for (const key of [
    "search",
    "lead_source",
    "responsible",
    "deal_stage",
    "technical_spec_requested",
  ] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return params.toString();
}

export async function getLeads(
  filters: LeadFilters,
  page: number,
  signal?: AbortSignal,
): Promise<LeadListResponse> {
  const query = buildLeadQuery(filters, page);
  const data = await apiRequest<unknown>(`/api/leads?${query}`, { signal });
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as LeadListResponse).items) ||
    !(data as LeadListResponse).items.every(isLead)
  ) {
    throw new ApiClientError("malformed_response", 200);
  }
  return data as LeadListResponse;
}

export async function createLead(
  payload: CreateLeadPayload,
): Promise<Lead> {
  const data = await apiRequest<unknown>("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return ensureLead(data);
}

export async function updateLeadStage(
  leadId: number,
  payload: UpdateLeadStagePayload,
): Promise<Lead> {
  const data = await apiRequest<unknown>(`/api/leads/${leadId}/stage`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return ensureLead(data);
}

export async function getLeadHistory(
  leadId: number,
  signal?: AbortSignal,
): Promise<LeadStageHistory[]> {
  const data = await apiRequest<unknown>(`/api/leads/${leadId}/history`, {
    signal,
  });
  if (!Array.isArray(data)) {
    throw new ApiClientError("malformed_response", 200);
  }
  return data as LeadStageHistory[];
}
