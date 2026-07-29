export const LEAD_SOURCES = ["cold", "warm"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const RESPONSIBLE_EMPLOYEES = [
  "lead_generator",
  "sales_manager",
] as const;
export type ResponsibleEmployee = (typeof RESPONSIBLE_EMPLOYEES)[number];

export const DEAL_STAGES = [
  "new",
  "qualified",
  "consultation_scheduled",
  "rejected",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export interface Lead {
  id: number;
  client_name: string;
  phone: string;
  phone_normalized: string;
  lead_source: LeadSource;
  responsible: ResponsibleEmployee;
  deal_stage: DealStage;
  technical_spec_requested: boolean;
  created_at: string;
}

export interface CreateLeadPayload {
  client_name: string;
  phone: string;
  lead_source: LeadSource;
  responsible: ResponsibleEmployee;
  deal_stage: DealStage;
  technical_spec_requested: boolean;
}

export interface UpdateLeadStagePayload {
  deal_stage: DealStage;
}

export type LeadSort = "created_at" | "client_name" | "deal_stage";
export type SortOrder = "asc" | "desc";

export interface LeadFilters {
  search: string;
  lead_source: LeadSource | "";
  responsible: ResponsibleEmployee | "";
  deal_stage: DealStage | "";
  technical_spec_requested: "" | "true" | "false";
  sort: LeadSort;
  order: SortOrder;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface LeadSummary {
  total: number;
  new: number;
  qualified: number;
  consultation_scheduled: number;
  rejected: number;
  technical_spec_requested: number;
}

export interface LeadListResponse {
  items: Lead[];
  pagination: Pagination;
  summary: LeadSummary;
}

export interface LeadStageHistory {
  id: number;
  lead_id: number;
  previous_stage: DealStage;
  new_stage: DealStage;
  changed_at: string;
}
