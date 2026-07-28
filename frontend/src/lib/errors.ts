import { ApiClientError } from "../api/client";
import type { LanguageContextValue } from "./language-context";

export function getReadableError(
  error: unknown,
  t: LanguageContextValue["t"],
): string {
  if (!(error instanceof ApiClientError)) {
    return t("genericError");
  }
  if (error.status === null) {
    return t("networkError");
  }
  if (error.message === "malformed_response") {
    return t("malformedResponse");
  }
  if (error.status === 404) {
    return t("notFound");
  }
  if (error.status >= 500) {
    return t("serverError");
  }
  return t("genericError");
}
