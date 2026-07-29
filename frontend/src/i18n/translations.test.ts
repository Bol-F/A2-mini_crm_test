import { describe, expect, it } from "vitest";

import enCommon from "./locales/en/common.json";
import enLeads from "./locales/en/leads.json";
import enValidation from "./locales/en/validation.json";
import ruCommon from "./locales/ru/common.json";
import ruLeads from "./locales/ru/leads.json";
import ruValidation from "./locales/ru/validation.json";
import uzCommon from "./locales/uz/common.json";
import uzLeads from "./locales/uz/leads.json";
import uzValidation from "./locales/uz/validation.json";

type TranslationObject = Record<string, unknown>;

const translations = {
  ru: { common: ruCommon, leads: ruLeads, validation: ruValidation },
  en: { common: enCommon, leads: enLeads, validation: enValidation },
  uz: { common: uzCommon, leads: uzLeads, validation: uzValidation },
} satisfies Record<
  string,
  Record<string, TranslationObject>
>;

const requiredKeys = {
  common: [
    "app.name",
    "app.title",
    "app.description",
    "language.label",
    "language.ru",
    "language.en",
    "language.uz",
    "actions.save",
    "actions.reset",
    "errors.generic",
  ],
  leads: [
    "form.title",
    "form.clientName",
    "form.clientNamePlaceholder",
    "form.phone",
    "source.cold",
    "source.warm",
    "responsible.lead_generator",
    "responsible.sales_manager",
    "stage.new",
    "stage.qualified",
    "stage.consultation_scheduled",
    "stage.rejected",
    "statistics.total",
    "list.title",
    "list.count_one",
    "empty.title",
    "status.saved",
  ],
  validation: ["required", "clientNameRequired", "phoneRequired"],
} as const;

function getNestedValue(resource: TranslationObject, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (typeof value !== "object" || value === null) return undefined;
    return (value as TranslationObject)[segment];
  }, resource);
}

describe("translation resources", () => {
  for (const [language, namespaces] of Object.entries(translations)) {
    it(`contains the main keys for ${language}`, () => {
      for (const [namespace, keys] of Object.entries(requiredKeys)) {
        for (const key of keys) {
          const resource = (
            namespaces as Record<string, TranslationObject>
          )[namespace];
          const value = getNestedValue(resource, key);
          expect(value, `${language}:${namespace}:${key}`).toBeTypeOf("string");
          expect(String(value).trim(), `${language}:${namespace}:${key}`).not
            .toBe("");
        }
      }
    });
  }
});
