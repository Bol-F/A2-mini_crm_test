import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { normalizeLanguage, type SupportedLanguage } from "../i18n";

export function useLanguage() {
  const { t, i18n } = useTranslation(["common", "leads", "validation"]);
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const setLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => {
      void i18n.changeLanguage(nextLanguage);
    },
    [i18n],
  );

  return { language, setLanguage, t };
}
