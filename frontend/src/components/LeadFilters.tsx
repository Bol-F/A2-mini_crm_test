import { FilterX, Search } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { countActiveFilters } from "../lib/lead-filters";
import type { LeadFilters as Filters } from "../types/lead";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface LeadFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

export function LeadFilters({
  filters,
  onChange,
  onClear,
}: LeadFiltersProps) {
  const { t } = useLanguage();
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });
  const activeCount = countActiveFilters(filters);

  return (
    <section className="space-y-3 rounded-lg border bg-muted/25 p-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder={t("leads:filters.search")}
          aria-label={t("leads:filters.search")}
          className="pl-9"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <FilterSelect
          value={filters.lead_source || "all"}
          label={t("leads:source.label")}
          options={[
            ["all", t("leads:filters.all")],
            ["cold", t("leads:source.cold")],
            ["warm", t("leads:source.warm")],
          ]}
          onChange={(value) =>
            update("lead_source", value === "all" ? "" : value as Filters["lead_source"])
          }
        />
        <FilterSelect
          value={filters.responsible || "all"}
          label={t("leads:responsible.label")}
          options={[
            ["all", t("leads:filters.all")],
            ["lead_generator", t("leads:responsible.lead_generator")],
            ["sales_manager", t("leads:responsible.sales_manager")],
          ]}
          onChange={(value) =>
            update("responsible", value === "all" ? "" : value as Filters["responsible"])
          }
        />
        <FilterSelect
          value={filters.deal_stage || "all"}
          label={t("leads:stage.label")}
          options={[
            ["all", t("leads:filters.all")],
            ["new", t("leads:stage.new")],
            ["qualified", t("leads:stage.qualified")],
            ["consultation_scheduled", t("leads:stage.consultation_scheduled")],
            ["rejected", t("leads:stage.rejected")],
          ]}
          onChange={(value) =>
            update("deal_stage", value === "all" ? "" : value as Filters["deal_stage"])
          }
        />
        <FilterSelect
          value={filters.technical_spec_requested || "all"}
          label={t("leads:list.technicalSpec")}
          options={[
            ["all", t("leads:filters.all")],
            ["true", t("leads:filters.requested")],
            ["false", t("leads:filters.notRequested")],
          ]}
          onChange={(value) =>
            update("technical_spec_requested", value === "all" ? "" : value as Filters["technical_spec_requested"])
          }
        />
        <FilterSelect
          value={`${filters.sort}:${filters.order}`}
          label={t("leads:filters.sort")}
          options={[
            ["created_at:desc", t("leads:filters.newest")],
            ["created_at:asc", t("leads:filters.oldest")],
            ["client_name:asc", t("leads:filters.name")],
            ["deal_stage:asc", t("leads:filters.stage")],
          ]}
          onChange={(value) => {
            const [sort, order] = value.split(":") as [Filters["sort"], Filters["order"]];
            onChange({ ...filters, sort, order });
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={activeCount === 0}
        >
          <FilterX />
          {t("leads:filters.clear")} {activeCount ? `(${activeCount})` : ""}
        </Button>
      </div>
    </section>
  );
}

function FilterSelect({
  value,
  label,
  options,
  onChange,
}: {
  value: string;
  label: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, text]) => (
          <SelectItem key={optionValue} value={optionValue}>{text}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
