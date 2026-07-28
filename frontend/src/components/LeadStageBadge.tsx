import { Badge } from "./ui/badge";
import { useLanguage } from "../hooks/useLanguage";
import { dealStageLabels } from "../lib/i18n";
import type { DealStage } from "../types/lead";
import { cn } from "../lib/utils";

interface LeadStageBadgeProps {
  stage: DealStage;
}

const stageClasses: Record<DealStage, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  qualified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  consultation_scheduled:
    "border-violet-200 bg-violet-50 text-violet-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

export function LeadStageBadge({ stage }: LeadStageBadgeProps) {
  const { language } = useLanguage();

  return (
    <Badge
      variant="outline"
      className={cn("whitespace-normal text-left", stageClasses[stage])}
    >
      <span aria-hidden="true" className="mr-1">●</span>
      {dealStageLabels[language][stage]}
    </Badge>
  );
}
