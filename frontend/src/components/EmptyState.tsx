import { useLanguage } from "../hooks/useLanguage";

export function EmptyState() {
  const { t } = useLanguage();
  return <p className="state-panel state-empty">{t("noLeads")}</p>;
}
