import { LeadForm } from "../components/LeadForm";
import { LeadList } from "../components/LeadList";
import { useLeads } from "../hooks/useLeads";

export function LeadsPage() {
  const { leads, isLoading, loadError, createLead, updateStage } = useLeads();

  return (
    <>
      <LeadForm onCreate={createLead} />
      <LeadList
        leads={leads}
        isLoading={isLoading}
        error={loadError}
        onUpdateStage={updateStage}
      />
    </>
  );
}
