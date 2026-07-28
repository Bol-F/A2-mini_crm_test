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
