import { CalendarDays, ClipboardCheck, Phone, UserRound } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import {
  leadSourceLabels,
  responsibleLabels,
} from "../lib/i18n";
import type { DealStage, Lead } from "../types/lead";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LeadStageBadge } from "./LeadStageBadge";
import { LeadStageSelect } from "./LeadStageSelect";

interface LeadMobileCardProps {
  lead: Lead;
  onUpdateStage: (leadId: number, stage: DealStage) => Promise<void>;
}

export function LeadMobileCard({
  lead,
  onUpdateStage,
}: LeadMobileCardProps) {
  const { language, t } = useLanguage();
  const createdAt = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(lead.created_at));

  return (
    <Card role="article" className="gap-4 py-5 shadow-none">
      <CardHeader className="gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-base">
            {lead.client_name}
          </CardTitle>
          <LeadStageBadge stage={lead.deal_stage} />
        </div>
        <a
          href={`tel:${lead.phone}`}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Phone aria-hidden="true" className="size-4" />
          <span className="break-all">{lead.phone}</span>
        </a>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t("leadSource")}</dt>
            <dd className="mt-1 font-medium">
              {leadSourceLabels[language][lead.lead_source]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("responsible")}
            </dt>
            <dd className="mt-1 flex items-center gap-1 font-medium">
              <UserRound aria-hidden="true" className="size-3.5" />
              {responsibleLabels[language][lead.responsible]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("technicalSpecLabel")}
            </dt>
            <dd className="mt-1">
              <Badge variant="secondary">
                <ClipboardCheck aria-hidden="true" />
                {lead.technical_spec_requested ? t("yes") : t("no")}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("created")}</dt>
            <dd className="mt-1 flex items-start gap-1 font-medium">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              {createdAt}
            </dd>
          </div>
        </dl>
        <div className="border-t pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("changeStage")}
          </p>
          <LeadStageSelect
            leadId={lead.id}
            value={lead.deal_stage}
            onUpdate={onUpdateStage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
