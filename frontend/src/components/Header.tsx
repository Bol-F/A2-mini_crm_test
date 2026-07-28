import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "../hooks/useLanguage";

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="page-header">
      <div className="page-shell header-content">
        <div>
          <p className="eyebrow">{t("appName")}</p>
          <h1>{t("pageTitle")}</h1>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
