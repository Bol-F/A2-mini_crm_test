import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { getLeadHistory } from "../api/leads";
import { useLanguage } from "../hooks/useLanguage";
import { formatLeadDate } from "../i18n";
import { getReadableError } from "../lib/errors";
import type { Lead, LeadStageHistory } from "../types/lead";
import { Button } from "./ui/button";
import { LeadStageBadge } from "./LeadStageBadge";

export function LeadDetailsDialog({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState<LeadStageHistory[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setError("");
        return getLeadHistory(lead.id, controller.signal);
      })
      .then(setHistory)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getReadableError(requestError, t));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [lead, t]);

  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-details-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="lead-details-title" className="text-xl font-semibold">{lead.client_name}</h2>
            <a className="text-primary hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("common:actions.close")}><X /></Button>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label={t("leads:source.label")} value={t(`leads:source.${lead.lead_source}`)} />
          <Detail label={t("leads:responsible.label")} value={t(`leads:responsible.${lead.responsible}`)} />
          <div><dt className="text-muted-foreground">{t("leads:stage.label")}</dt><dd className="mt-1"><LeadStageBadge stage={lead.deal_stage} /></dd></div>
          <Detail label={t("leads:list.created")} value={formatLeadDate(lead.created_at, language)} />
          <Detail label={t("leads:details.normalizedPhone")} value={lead.phone_normalized} />
          <Detail label={t("leads:list.technicalSpec")} value={lead.technical_spec_requested ? t("common:answers.yes") : t("common:answers.no")} />
        </dl>
        <h3 className="mt-6 font-semibold">{t("leads:details.history")}</h3>
        {isLoading ? <p className="mt-3 text-sm text-muted-foreground">{t("leads:details.loading")}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
        {!isLoading && !error && history.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("leads:details.noHistory")}</p> : null}
        <ol className="mt-3 space-y-3">
          {history.map((item) => (
            <li key={item.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <LeadStageBadge stage={item.previous_stage} />
                <span aria-hidden="true">→</span>
                <LeadStageBadge stage={item.new_stage} />
              </div>
              <time className="mt-2 block text-xs text-muted-foreground">{formatLeadDate(item.changed_at, language)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
