import {
  CalendarCheck2,
  ClipboardCheck,
  ContactRound,
  UserCheck,
  UserPlus,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import type { Lead } from "../types/lead";
import { Card, CardContent } from "./ui/card";

interface LeadStatisticsProps {
  leads: Lead[];
}

interface Statistic {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
}

export function LeadStatistics({ leads }: LeadStatisticsProps) {
  const { t } = useLanguage();
  const statistics: Statistic[] = [
    {
      label: t("leads:statistics.total"),
      value: leads.length,
      icon: ContactRound,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: t("leads:statistics.new"),
      value: leads.filter((lead) => lead.deal_stage === "new").length,
      icon: UserPlus,
      iconClassName: "bg-info/10 text-info",
    },
    {
      label: t("leads:statistics.qualified"),
      value: leads.filter((lead) => lead.deal_stage === "qualified").length,
      icon: UserCheck,
      iconClassName: "bg-success/10 text-success",
    },
    {
      label: t("leads:statistics.consultations"),
      value: leads.filter(
        (lead) => lead.deal_stage === "consultation_scheduled",
      ).length,
      icon: CalendarCheck2,
      iconClassName:
        "bg-stage-consultation/10 text-stage-consultation",
    },
    {
      label: t("leads:statistics.rejected"),
      value: leads.filter((lead) => lead.deal_stage === "rejected").length,
      icon: UserX,
      iconClassName: "bg-destructive/10 text-destructive",
    },
    {
      label: t("leads:statistics.withTechnicalSpec"),
      value: leads.filter((lead) => lead.technical_spec_requested).length,
      icon: ClipboardCheck,
      iconClassName: "bg-warning/15 text-warning",
    },
  ];

  return (
    <section
      aria-label={t("leads:statistics.label")}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
    >
      {statistics.map(({ label, value, icon: Icon, iconClassName }) => (
        <Card key={label} className="py-4 shadow-none">
          <CardContent className="flex items-center gap-3 px-4">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
            >
              <Icon aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
