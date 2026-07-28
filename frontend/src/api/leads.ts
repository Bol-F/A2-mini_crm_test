import { ApiClientError, apiRequest } from "./client";
import type { Language } from "../lib/i18n";
import type {
  CreateLeadPayload,
  DealStage,
  Lead,
  LeadSource,
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

export async function getLeads(language: Language): Promise<Lead[]> {
  const data = await apiRequest<unknown>("/api/leads", language);
  if (!Array.isArray(data) || !data.every(isLead)) {
    throw new ApiClientError("malformed_response", 200);
  }
  return data;
}

export async function createLead(
  payload: CreateLeadPayload,
  language: Language,
): Promise<Lead> {
  const data = await apiRequest<unknown>("/api/leads", language, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return ensureLead(data);
}

export async function updateLeadStage(
  leadId: number,
  payload: UpdateLeadStagePayload,
  language: Language,
): Promise<Lead> {
  const data = await apiRequest<unknown>(`/api/leads/${leadId}/stage`, language, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return ensureLead(data);
}
