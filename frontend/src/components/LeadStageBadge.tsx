import { Badge } from "./ui/badge";
import { useLanguage } from "../hooks/useLanguage";
import type { DealStage } from "../types/lead";
import { cn } from "../lib/utils";

interface LeadStageBadgeProps {
  stage: DealStage;
}

const stageClasses: Record<DealStage, string> = {
  new: "border-stage-new/20 bg-stage-new/10 text-stage-new",
  qualified:
    "border-stage-qualified/20 bg-stage-qualified/10 text-stage-qualified",
  consultation_scheduled:
    "border-stage-consultation/20 bg-stage-consultation/10 text-stage-consultation",
  rejected:
    "border-stage-rejected/20 bg-stage-rejected/10 text-stage-rejected",
};

export function LeadStageBadge({ stage }: LeadStageBadgeProps) {
  const { t } = useLanguage();

  return (
    <Badge
      variant="outline"
      className={cn("whitespace-normal text-left", stageClasses[stage])}
    >
      <span aria-hidden="true" className="mr-1">●</span>
      {t(`leads:stage.${stage}`)}
    </Badge>
  );
}
