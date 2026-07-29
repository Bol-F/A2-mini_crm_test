import { LayoutDashboard } from "lucide-react";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "../hooks/useLanguage";

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              {t("common:app.name")}
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {t("common:app.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("common:app.description")}
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
