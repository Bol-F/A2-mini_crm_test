export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "LEAD_NOT_FOUND"
  | "DUPLICATE_LEAD"
  | "INVALID_STAGE_TRANSITION"
  | "DATABASE_ERROR"
  | "UNSUPPORTED_OPERATION";

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  fields: Record<string, string> | null;
  details: Record<string, string | number> | null;
}

export interface ApiError {
  error?: ApiErrorDetail;
}
