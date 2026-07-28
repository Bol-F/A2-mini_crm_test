import { useLanguage } from "../hooks/useLanguage";

export function LoadingState() {
  const { t } = useLanguage();
  return (
    <p className="state-panel" role="status">
      {t("loading")}
    </p>
  );
}
