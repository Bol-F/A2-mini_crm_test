import type { DealStage, Lead } from "../types/lead";
import { useLanguage } from "../hooks/useLanguage";
import { EmptyState } from "./EmptyState";
import { ErrorAlert } from "./ErrorAlert";
import { LeadCard } from "./LeadCard";
import { LoadingState } from "./LoadingState";

interface LeadListProps {
  leads: Lead[];
  isLoading: boolean;
  error: string;
  onUpdateStage: (leadId: number, stage: DealStage) => Promise<void>;
}

export function LeadList({
  leads,
  isLoading,
  error,
  onUpdateStage,
}: LeadListProps) {
  const { t } = useLanguage();

  return (
    <section className="panel" aria-labelledby="saved-leads-title">
      <h2 id="saved-leads-title">{t("savedLeads")}</h2>
      {isLoading ? <LoadingState /> : null}
      {!isLoading ? <ErrorAlert message={error} /> : null}
      {!isLoading && !error && leads.length === 0 ? <EmptyState /> : null}
      {!isLoading && !error && leads.length > 0 ? (
        <div className="lead-cards" aria-live="polite">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdateStage={onUpdateStage}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
