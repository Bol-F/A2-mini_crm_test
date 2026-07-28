import { useState, type FormEvent } from "react";

import { getReadableError } from "../lib/errors";
import {
  dealStageLabels,
  leadSourceLabels,
  responsibleLabels,
} from "../lib/i18n";
import {
  DEAL_STAGES,
  LEAD_SOURCES,
  RESPONSIBLE_EMPLOYEES,
  type CreateLeadPayload,
} from "../types/lead";
import { useLanguage } from "../hooks/useLanguage";
import { ErrorAlert } from "./ErrorAlert";

interface LeadFormProps {
  onCreate: (payload: CreateLeadPayload) => Promise<void>;
}

const initialForm: CreateLeadPayload = {
  client_name: "",
  phone: "",
  lead_source: "cold",
  responsible: "lead_generator",
  deal_stage: "new",
  technical_spec_requested: false,
};

export function LeadForm({ onCreate }: LeadFormProps) {
  const { language, t } = useLanguage();
  const [form, setForm] = useState<CreateLeadPayload>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    const payload = {
      ...form,
      client_name: form.client_name.trim(),
      phone: form.phone.trim(),
    };
    if (!payload.client_name) {
      setError(t("nameRequired"));
      setSuccess("");
      return;
    }
    if (!payload.phone) {
      setError(t("phoneRequired"));
      setSuccess("");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await onCreate(payload);
      setForm(initialForm);
      setSuccess(t("saveSuccess"));
    } catch (requestError) {
      setError(getReadableError(requestError, t));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="lead-form-title">
      <h2 id="lead-form-title">{t("newLead")}</h2>
      <ErrorAlert message={error} />
      {success ? (
        <div className="message message-success" role="status">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label className="field field-wide">
            <span>{t("clientName")}</span>
            <input
              name="client_name"
              type="text"
              autoComplete="name"
              required
              value={form.client_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  client_name: event.target.value,
                }))
              }
            />
          </label>

          <label className="field field-wide">
            <span>{t("phone")}</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{t("leadSource")}</span>
            <select
              name="lead_source"
              value={form.lead_source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lead_source: event.target.value as CreateLeadPayload["lead_source"],
                }))
              }
            >
              {LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {leadSourceLabels[language][source]}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("responsible")}</span>
            <select
              name="responsible"
              value={form.responsible}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  responsible: event.target
                    .value as CreateLeadPayload["responsible"],
                }))
              }
            >
              {RESPONSIBLE_EMPLOYEES.map((responsible) => (
                <option key={responsible} value={responsible}>
                  {responsibleLabels[language][responsible]}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-wide">
            <span>{t("dealStage")}</span>
            <select
              name="deal_stage"
              value={form.deal_stage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deal_stage: event.target
                    .value as CreateLeadPayload["deal_stage"],
                }))
              }
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {dealStageLabels[language][stage]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="checkbox-field">
          <input
            name="technical_spec_requested"
            type="checkbox"
            checked={form.technical_spec_requested}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                technical_spec_requested: event.target.checked,
              }))
            }
          />
          <span>{t("technicalSpec")}</span>
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? t("saving") : t("save")}
        </button>
      </form>
    </section>
  );
}
