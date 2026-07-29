import { LeadForm } from "../components/LeadForm";
import { LeadList } from "../components/LeadList";
import { LeadStatistics } from "../components/LeadStatistics";
import { useLeads } from "../hooks/useLeads";

export function LeadsPage() {
  const {
    leads,
    isLoading,
    loadError,
    createLead,
    updateStage,
    reloadLeads,
  } = useLeads();

  return (
    <div className="space-y-6">
      <LeadStatistics leads={leads} />
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)]">
        <LeadForm onCreate={createLead} />
        <LeadList
          leads={leads}
          isLoading={isLoading}
          error={loadError}
          onRetry={reloadLeads}
          onUpdateStage={updateStage}
        />
      </div>
    </div>
  );
}
