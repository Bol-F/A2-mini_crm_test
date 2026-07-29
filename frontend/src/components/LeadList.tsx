import { ListChecks } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import type { DealStage, Lead } from "../types/lead";
import { EmptyState } from "./EmptyState";
import { ErrorAlert } from "./ErrorAlert";
import { LeadMobileCard } from "./LeadMobileCard";
import { LeadTable } from "./LeadTable";
import { LoadingState } from "./LoadingState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";

interface LeadListProps {
  leads: Lead[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onUpdateStage: (leadId: number, stage: DealStage) => Promise<void>;
}

export function LeadList({
  leads,
  isLoading,
  error,
  onRetry,
  onUpdateStage,
}: LeadListProps) {
  const { t } = useLanguage();
  const hasLeads = !isLoading && !error && leads.length > 0;

  return (
    <Card className="min-w-0 shadow-sm" aria-labelledby="saved-leads-title">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListChecks aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle id="saved-leads-title">
              {t("leads:list.title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("leads:list.description")}{" "}
              <span className="font-medium">
                {t("leads:list.count", { count: leads.length })}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="min-w-0 pt-6">
        {isLoading ? <LoadingState /> : null}
        {!isLoading && error ? (
          <ErrorAlert message={error} onRetry={onRetry} />
        ) : null}
        {!isLoading && !error && leads.length === 0 ? <EmptyState /> : null}
        {hasLeads ? (
          <div aria-live="polite">
            <LeadTable leads={leads} onUpdateStage={onUpdateStage} />
            <div className="space-y-3 md:hidden">
              {leads.map((lead) => (
                <LeadMobileCard
                  key={lead.id}
                  lead={lead}
                  onUpdateStage={onUpdateStage}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
