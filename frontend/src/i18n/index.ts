import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enLeads from "./locales/en/leads.json";
import enValidation from "./locales/en/validation.json";
import ruCommon from "./locales/ru/common.json";
import ruLeads from "./locales/ru/leads.json";
import ruValidation from "./locales/ru/validation.json";
import uzCommon from "./locales/uz/common.json";
import uzLeads from "./locales/uz/leads.json";
import uzValidation from "./locales/uz/validation.json";

export const supportedLanguages = ["ru", "en", "uz"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const resources = {
  ru: { common: ruCommon, leads: ruLeads, validation: ruValidation },
  en: { common: enCommon, leads: enLeads, validation: enValidation },
  uz: { common: uzCommon, leads: uzLeads, validation: uzValidation },
} as const;

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}

export function normalizeLanguage(value: string): SupportedLanguage {
  const language = value.split("-")[0];
  return isSupportedLanguage(language) ? language : "ru";
}

await i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: "ru",
    defaultNS: "common",
    ns: ["common", "leads", "validation"],
    load: "languageOnly",
    returnNull: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "crm.language",
    },
    saveMissing: false,
  });

function updateDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(language);
  }
}

updateDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", updateDocumentLanguage);

export function getCurrentLanguage(): SupportedLanguage {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
}

export function formatLeadDate(
  value: string | null | undefined,
  language: SupportedLanguage,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default i18n;
