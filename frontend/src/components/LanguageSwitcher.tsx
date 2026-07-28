import { useLanguage } from "../hooks/useLanguage";
import type { Language } from "../lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="language-switcher">
      <span>{t("language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="ru">{t("russian")}</option>
        <option value="en">{t("english")}</option>
      </select>
    </label>
  );
}
