import { useLanguage } from "../hooks/useLanguage";
import type { Language } from "../lib/i18n";
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
        {t("language")}
      </span>
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as Language)}
      >
        <SelectTrigger className="w-32" aria-label={t("language")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="ru">{t("russian")}</SelectItem>
          <SelectItem value="en">{t("english")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
