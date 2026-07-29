import { useLanguage } from "../hooks/useLanguage";
import type { SupportedLanguage } from "../i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {t("common:language.label")}
      </span>
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as SupportedLanguage)}
      >
        <SelectTrigger
          className="w-36"
          aria-label={t("common:language.label")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="ru">{t("common:language.ru")}</SelectItem>
          <SelectItem value="en">{t("common:language.en")}</SelectItem>
          <SelectItem value="uz">{t("common:language.uz")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
