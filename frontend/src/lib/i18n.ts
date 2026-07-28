import type {
  DealStage,
  LeadSource,
  ResponsibleEmployee,
} from "../types/lead";

export type Language = "ru" | "en";

const translations = {
  ru: {
    appName: "Мини-CRM",
    pageTitle: "Работа с лидами",
    language: "Язык",
    russian: "Русский",
    english: "English",
    newLead: "Новый лид",
    clientName: "Имя клиента",
    phone: "Номер телефона",
    leadSource: "Источник лида",
    responsible: "Ответственный",
    dealStage: "Этап сделки",
    technicalSpec: "Запрошено ТЗ",
    save: "Сохранить",
    saving: "Сохраняем…",
    savedLeads: "Сохранённые лиды",
    noLeads: "Сохранённых лидов пока нет.",
    loading: "Загружаем лиды…",
    loadError: "Не удалось загрузить сохранённые лиды.",
    networkError: "Не удалось связаться с сервером.",
    malformedResponse: "Сервер вернул некорректный ответ.",
    genericError: "Произошла ошибка. Попробуйте ещё раз.",
    serverError: "Ошибка сервера. Попробуйте ещё раз.",
    nameRequired: "Укажите имя клиента.",
    phoneRequired: "Укажите номер телефона.",
    saveSuccess: "Лид успешно сохранён.",
    phoneLabel: "Телефон",
    technicalSpecLabel: "Запрошено ТЗ",
    created: "Создан",
    yes: "Да",
    no: "Нет",
    changeStage: "Изменить этап",
    updating: "Обновляем…",
    stageSuccess: "Этап сделки обновлён.",
    stageError: "Не удалось изменить этап сделки.",
    notFound: "Лид не найден. Обновите страницу.",
  },
  en: {
    appName: "Mini CRM",
    pageTitle: "Lead management",
    language: "Language",
    russian: "Русский",
    english: "English",
    newLead: "New lead",
    clientName: "Client name",
    phone: "Phone number",
    leadSource: "Lead source",
    responsible: "Responsible employee",
    dealStage: "Deal stage",
    technicalSpec: "Technical requirements requested",
    save: "Save",
    saving: "Saving…",
    savedLeads: "Saved leads",
    noLeads: "No saved leads yet.",
    loading: "Loading leads…",
    loadError: "Could not load saved leads.",
    networkError: "Could not connect to the server.",
    malformedResponse: "The server returned an invalid response.",
    genericError: "Something went wrong. Please try again.",
    serverError: "Server error. Please try again.",
    nameRequired: "Enter the client name.",
    phoneRequired: "Enter the phone number.",
    saveSuccess: "Lead saved successfully.",
    phoneLabel: "Phone",
    technicalSpecLabel: "Technical requirements requested",
    created: "Created",
    yes: "Yes",
    no: "No",
    changeStage: "Change stage",
    updating: "Updating…",
    stageSuccess: "Deal stage updated.",
    stageError: "Could not update the deal stage.",
    notFound: "Lead not found. Refresh the page.",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ru"];

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key];
}

export const leadSourceLabels: Record<
  Language,
  Record<LeadSource, string>
> = {
  ru: { cold: "Холодный", warm: "Тёплый" },
  en: { cold: "Cold", warm: "Warm" },
};

export const responsibleLabels: Record<
  Language,
  Record<ResponsibleEmployee, string>
> = {
  ru: { lead_generator: "Лидоруб", sales_manager: "МОП" },
  en: { lead_generator: "Lead generator", sales_manager: "Sales manager" },
};

export const dealStageLabels: Record<Language, Record<DealStage, string>> = {
  ru: {
    new: "Новый лид",
    qualified: "Квалифицирован",
    consultation_scheduled: "Назначена консультация",
    rejected: "Отказ",
  },
  en: {
    new: "New lead",
    qualified: "Qualified",
    consultation_scheduled: "Consultation scheduled",
    rejected: "Rejected",
  },
};
