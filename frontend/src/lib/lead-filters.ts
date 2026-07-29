import type { LeadFilters } from "../types/lead";
import {
  DEAL_STAGES,
  LEAD_SOURCES,
  RESPONSIBLE_EMPLOYEES,
} from "../types/lead";

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  search: "",
  lead_source: "",
  responsible: "",
  deal_stage: "",
  technical_spec_requested: "",
  sort: "created_at",
  order: "desc",
};

export function readLeadFilters(params: URLSearchParams): LeadFilters {
  const source = params.get("lead_source");
  const responsible = params.get("responsible");
  const stage = params.get("deal_stage");
  const technicalSpec = params.get("technical_spec_requested");
  const sort = params.get("sort");
  const order = params.get("order");
  return {
    search: params.get("search") ?? "",
    lead_source: LEAD_SOURCES.includes(source as never) ? source as LeadFilters["lead_source"] : "",
    responsible: RESPONSIBLE_EMPLOYEES.includes(responsible as never) ? responsible as LeadFilters["responsible"] : "",
    deal_stage: DEAL_STAGES.includes(stage as never) ? stage as LeadFilters["deal_stage"] : "",
    technical_spec_requested:
      technicalSpec === "true" || technicalSpec === "false" ? technicalSpec : "",
    sort:
      sort === "client_name" || sort === "deal_stage" ? sort : "created_at",
    order: order === "asc" ? "asc" : "desc",
  };
}

export function writeLeadFilters(
  filters: LeadFilters,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== DEFAULT_LEAD_FILTERS[key as keyof LeadFilters]) {
      params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  return params;
}

export function countActiveFilters(filters: LeadFilters): number {
  return [
    filters.search,
    filters.lead_source,
    filters.responsible,
    filters.deal_stage,
    filters.technical_spec_requested,
  ].filter(Boolean).length;
}
