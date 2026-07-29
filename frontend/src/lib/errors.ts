import type { TFunction } from "i18next";

import { ApiClientError } from "../api/client";

export function getReadableError(
  error: unknown,
  t: TFunction<readonly ["common", "leads", "validation"]>,
): string {
  if (!(error instanceof ApiClientError)) {
    return t("common:errors.generic");
  }
  if (error.status === null) {
    return t("common:errors.network");
  }
  if (error.message === "malformed_response") {
    return t("common:errors.malformedResponse");
  }
  const apiError = error.data?.error;
  if (apiError) {
    if (
      apiError.code === "VALIDATION_ERROR" &&
      apiError.fields &&
      Object.keys(apiError.fields).length > 0
    ) {
      return Object.values(apiError.fields).join(" ");
    }
    return apiError.message;
  }
  if (error.status >= 500) {
    return t("common:errors.server");
  }
  return t("common:errors.generic");
}
