import { useLanguage } from "../hooks/useLanguage";
import { Skeleton } from "./ui/skeleton";

export function LoadingState() {
  const { t } = useLanguage();

  return (
    <div className="space-y-3" role="status" aria-label={t("loading")}>
      <span className="sr-only">{t("loading")}</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
