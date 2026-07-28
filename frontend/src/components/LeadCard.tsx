import {
  dealStageLabels,
  leadSourceLabels,
  responsibleLabels,
} from "../lib/i18n";
import type { DealStage, Lead } from "../types/lead";
import { useLanguage } from "../hooks/useLanguage";
import { LeadStageSelect } from "./LeadStageSelect";

interface LeadCardProps {
  lead: Lead;
  onUpdateStage: (leadId: number, stage: DealStage) => Promise<void>;
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <p>
      <strong>{label}: </strong>
      <span>{value}</span>
    </p>
  );
}

export function LeadCard({ lead, onUpdateStage }: LeadCardProps) {
  const { language, t } = useLanguage();
  const createdAt = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(lead.created_at));

  return (
    <article className="lead-card">
      <h3>{lead.client_name}</h3>
      <DetailRow label={t("phoneLabel")} value={lead.phone} />
      <DetailRow
        label={t("leadSource")}
        value={leadSourceLabels[language][lead.lead_source]}
      />
      <DetailRow
        label={t("responsible")}
        value={responsibleLabels[language][lead.responsible]}
      />
      <DetailRow
        label={t("dealStage")}
        value={dealStageLabels[language][lead.deal_stage]}
      />
      <DetailRow
        label={t("technicalSpecLabel")}
        value={lead.technical_spec_requested ? t("yes") : t("no")}
      />
      <DetailRow label={t("created")} value={createdAt} />
      <LeadStageSelect
        leadId={lead.id}
        value={lead.deal_stage}
        onUpdate={onUpdateStage}
      />
    </article>
  );
}
