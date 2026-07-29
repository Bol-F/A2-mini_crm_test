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
  if (error.status === 404) {
    return t("common:errors.notFound");
  }
  if (error.status >= 500) {
    return t("common:errors.server");
  }
  return t("common:errors.generic");
}
