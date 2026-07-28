export interface ApiValidationIssue {
  loc?: Array<string | number>;
  msg?: string;
}

export interface ApiError {
  detail?: string | ApiValidationIssue[];
}
