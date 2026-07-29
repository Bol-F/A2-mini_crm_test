import { ClipboardCheck, Eye } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { formatLeadDate } from "../i18n";
import type { DealStage, Lead } from "../types/lead";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
  onViewDetails: (lead: Lead) => void;
}

export function LeadTable({ leads, onUpdateStage, onViewDetails }: LeadTableProps) {
  const { language, t } = useLanguage();

  return (
    <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("leads:form.clientName")}</TableHead>
            <TableHead>{t("leads:source.label")}</TableHead>
            <TableHead>{t("leads:responsible.label")}</TableHead>
            <TableHead>{t("leads:stage.label")}</TableHead>
            <TableHead>{t("leads:list.technicalSpec")}</TableHead>
            <TableHead>{t("leads:list.created")}</TableHead>
            <TableHead>{t("leads:list.actions")}</TableHead>
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
                {t(`leads:source.${lead.lead_source}`)}
              </TableCell>
              <TableCell>
                {t(`leads:responsible.${lead.responsible}`)}
              </TableCell>
              <TableCell>
                <LeadStageBadge stage={lead.deal_stage} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <ClipboardCheck aria-hidden="true" />
                  {lead.technical_spec_requested
                    ? t("common:answers.yes")
                    : t("common:answers.no")}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatLeadDate(lead.created_at, language)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <LeadStageSelect leadId={lead.id} value={lead.deal_stage} onUpdate={onUpdateStage} />
                  <Button variant="ghost" size="icon" onClick={() => onViewDetails(lead)} aria-label={t("leads:details.open")}><Eye /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
