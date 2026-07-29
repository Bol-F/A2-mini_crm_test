import { CheckCircle2, RotateCcw, Save, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useLanguage } from "../hooks/useLanguage";
import { getReadableError } from "../lib/errors";
import {
  DEAL_STAGES,
  LEAD_SOURCES,
  RESPONSIBLE_EMPLOYEES,
  type CreateLeadPayload,
} from "../types/lead";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface LeadFormProps {
  onCreate: (payload: CreateLeadPayload) => Promise<void>;
}

type FieldErrors = Partial<Record<"client_name" | "phone", string>>;

const initialForm: CreateLeadPayload = {
  client_name: "",
  phone: "",
  lead_source: "cold",
  responsible: "lead_generator",
  deal_stage: "new",
  technical_spec_requested: false,
};

export function LeadForm({ onCreate }: LeadFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CreateLeadPayload>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetForm(showMessage = true) {
    setForm(initialForm);
    setFieldErrors({});
    setRequestError("");
    setSuccess(showMessage ? t("leads:status.formReset") : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const payload = {
      ...form,
      client_name: form.client_name.trim(),
      phone: form.phone.trim(),
    };
    const errors: FieldErrors = {};
    if (!payload.client_name) {
      errors.client_name = t("validation:clientNameRequired");
    }
    if (!payload.phone) errors.phone = t("validation:phoneRequired");
    setFieldErrors(errors);
    setSuccess("");
    setRequestError("");
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await onCreate(payload);
      resetForm(false);
      setSuccess(t("leads:status.saved"));
    } catch (error) {
      setRequestError(getReadableError(error, t));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card id="lead-form" className="scroll-mt-6 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle>{t("leads:form.title")}</CardTitle>
            <CardDescription className="mt-1">
              {t("leads:form.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {requestError ? (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{requestError}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert className="mb-5 border-success/30 bg-success/5 text-success">
            <CheckCircle2 aria-hidden="true" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              {t("leads:form.clientName")} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="client-name"
              name="client_name"
              autoComplete="name"
              required
              placeholder={t("leads:form.clientNamePlaceholder")}
              value={form.client_name}
              aria-invalid={Boolean(fieldErrors.client_name)}
              aria-describedby={
                fieldErrors.client_name ? "client-name-error" : undefined
              }
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  client_name: event.target.value,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  client_name: undefined,
                }));
              }}
            />
            {fieldErrors.client_name ? (
              <p
                id="client-name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.client_name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("leads:form.phone")} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder={t("leads:form.phonePlaceholder")}
              value={form.phone}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }));
                setFieldErrors((current) => ({
                  ...current,
                  phone: undefined,
                }));
              }}
            />
            {fieldErrors.phone ? (
              <p
                id="phone-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-source">{t("leads:source.label")}</Label>
              <Select
                value={form.lead_source}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    lead_source: value as CreateLeadPayload["lead_source"],
                  }))
                }
              >
                <SelectTrigger id="lead-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {t(`leads:source.${source}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">
                {t("leads:responsible.label")}
              </Label>
              <Select
                value={form.responsible}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    responsible: value as CreateLeadPayload["responsible"],
                  }))
                }
              >
                <SelectTrigger id="responsible" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_EMPLOYEES.map((responsible) => (
                    <SelectItem key={responsible} value={responsible}>
                      {t(`leads:responsible.${responsible}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-stage">{t("leads:stage.label")}</Label>
            <Select
              value={form.deal_stage}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  deal_stage: value as CreateLeadPayload["deal_stage"],
                }))
              }
            >
              <SelectTrigger id="deal-stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {t(`leads:stage.${stage}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/35 p-4">
            <Label htmlFor="technical-spec" className="cursor-pointer">
              {t("leads:form.technicalSpec")}
            </Label>
            <Switch
              id="technical-spec"
              name="technical_spec_requested"
              checked={form.technical_spec_requested}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  technical_spec_requested: checked,
                }))
              }
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => resetForm()}
            >
              <RotateCcw aria-hidden="true" />
              {t("common:actions.reset")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save aria-hidden="true" />
              {isSaving
                ? t("common:actions.saving")
                : t("common:actions.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
