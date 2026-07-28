import { ClipboardCheck } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import {
  leadSourceLabels,
  responsibleLabels,
} from "../lib/i18n";
import type { DealStage, Lead } from "../types/lead";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { LeadStageBadge } from "./LeadStageBadge";
import { LeadStageSelect } from "./LeadStageSelect";

interface LeadTableProps {
  leads: Lead[];
  onUpdateStage: (leadId: number, stage: DealStage) => Promise<void>;
}

export function LeadTable({ leads, onUpdateStage }: LeadTableProps) {
  const { language, t } = useLanguage();
  const locale = language === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("clientName")}</TableHead>
            <TableHead>{t("leadSource")}</TableHead>
            <TableHead>{t("responsible")}</TableHead>
            <TableHead>{t("stageLabel")}</TableHead>
            <TableHead>{t("technicalSpecLabel")}</TableHead>
            <TableHead>{t("created")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="max-w-48">
                <p className="break-words font-medium">{lead.client_name}</p>
                <a
                  href={`tel:${lead.phone}`}
                  className="break-all text-xs text-primary hover:underline"
                >
                  {lead.phone}
                </a>
              </TableCell>
              <TableCell>
                {leadSourceLabels[language][lead.lead_source]}
              </TableCell>
              <TableCell>
                {responsibleLabels[language][lead.responsible]}
              </TableCell>
              <TableCell>
                <LeadStageBadge stage={lead.deal_stage} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <ClipboardCheck aria-hidden="true" />
                  {lead.technical_spec_requested ? t("yes") : t("no")}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(lead.created_at))}
              </TableCell>
              <TableCell>
                <LeadStageSelect
                  leadId={lead.id}
                  value={lead.deal_stage}
                  onUpdate={onUpdateStage}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
