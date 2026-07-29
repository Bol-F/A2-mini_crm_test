import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import type { Pagination } from "../types/lead";
import { Button } from "./ui/button";

export function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLanguage();
  if (pagination.total_pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between" aria-label={t("leads:pagination.label")}>
      <Button variant="outline" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
        <ChevronLeft /> {t("leads:pagination.previous")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("leads:pagination.page", { page: pagination.page, total: pagination.total_pages })}
      </span>
      <Button variant="outline" disabled={pagination.page >= pagination.total_pages} onClick={() => onPageChange(pagination.page + 1)}>
        {t("leads:pagination.next")} <ChevronRight />
      </Button>
    </nav>
  );
}
