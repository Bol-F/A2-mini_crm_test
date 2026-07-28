import { useState } from "react";

import { getReadableError } from "../lib/errors";
import { dealStageLabels } from "../lib/i18n";
import { DEAL_STAGES, type DealStage } from "../types/lead";
import { useLanguage } from "../hooks/useLanguage";

interface LeadStageSelectProps {
  leadId: number;
  value: DealStage;
  onUpdate: (leadId: number, stage: DealStage) => Promise<void>;
}

export function LeadStageSelect({
  leadId,
  value,
  onUpdate,
}: LeadStageSelectProps) {
  const { language, t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleChange(newStage: DealStage) {
    if (isUpdating || newStage === value) {
      return;
    }

    setIsUpdating(true);
    setMessage("");
    setIsError(false);
    try {
      await onUpdate(leadId, newStage);
      setMessage(t("stageSuccess"));
    } catch (error) {
      setIsError(true);
      setMessage(getReadableError(error, t) || t("stageError"));
    } finally {
      setIsUpdating(false);
    }
  }

  const messageId = `lead-stage-${leadId}-message`;
  return (
    <div className="stage-editor">
      <label htmlFor={`lead-stage-${leadId}`}>{t("changeStage")}</label>
      <select
        id={`lead-stage-${leadId}`}
        value={value}
        disabled={isUpdating}
        aria-describedby={messageId}
        onChange={(event) => void handleChange(event.target.value as DealStage)}
      >
        {DEAL_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {dealStageLabels[language][stage]}
          </option>
        ))}
      </select>
      <p
        id={messageId}
        className={isError ? "card-message card-message-error" : "card-message"}
        role="status"
      >
        {isUpdating ? t("updating") : message}
      </p>
    </div>
  );
}
