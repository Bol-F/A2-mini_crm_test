import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "../hooks/useLanguage";
import { getReadableError } from "../lib/errors";
import { DEAL_STAGES, type DealStage } from "../types/lead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleChange(newStage: DealStage) {
    if (isUpdating || newStage === value) return;

    setIsUpdating(true);
    setMessage("");
    setIsError(false);
    try {
      await onUpdate(leadId, newStage);
      setMessage(t("leads:status.stageUpdated"));
    } catch (error) {
      setIsError(true);
      setMessage(getReadableError(error, t));
    } finally {
      setIsUpdating(false);
    }
  }

  const messageId = `lead-stage-${leadId}-message`;
  return (
    <div className="min-w-40">
      <Select
        value={value}
        disabled={isUpdating}
        onValueChange={(stage) => void handleChange(stage as DealStage)}
      >
        <SelectTrigger
          className="w-full bg-card"
          aria-label={t("leads:stage.change")}
          aria-describedby={messageId}
        >
          {isUpdating ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEAL_STAGES.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {t(`leads:stage.${stage}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p
        id={messageId}
        className={`mt-1 min-h-4 text-xs ${
          isError ? "text-destructive" : "text-success"
        }`}
        role="status"
      >
        {isUpdating ? t("leads:status.updatingStage") : message}
      </p>
    </div>
  );
}
