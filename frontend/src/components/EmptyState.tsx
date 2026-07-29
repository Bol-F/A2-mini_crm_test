import { UserRoundPlus } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { Button } from "./ui/button";

export function EmptyState() {
  const { t } = useLanguage();

  function focusLeadForm() {
    document.querySelector<HTMLElement>("#lead-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    document.querySelector<HTMLInputElement>("#client-name")?.focus({
      preventScroll: true,
    });
  }

  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/25 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRoundPlus aria-hidden="true" className="size-6" />
      </div>
      <h3 className="font-semibold">{t("leads:empty.title")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("leads:empty.description")}
      </p>
      <Button type="button" className="mt-5" onClick={focusLeadForm}>
        <UserRoundPlus aria-hidden="true" />
        {t("leads:empty.action")}
      </Button>
    </div>
  );
}
