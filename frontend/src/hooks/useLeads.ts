import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createLead as createLeadRequest,
  getLeads,
  updateLeadStage as updateLeadStageRequest,
} from "../api/leads";
import {
  DEFAULT_LEAD_FILTERS,
  readLeadFilters,
  writeLeadFilters,
} from "../lib/lead-filters";
import { getReadableError } from "../lib/errors";
import type {
  CreateLeadPayload,
  DealStage,
  Lead,
  LeadFilters,
  LeadSummary,
  Pagination,
} from "../types/lead";
import { useLanguage } from "./useLanguage";

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  page_size: 20,
  total_items: 0,
  total_pages: 0,
};
const EMPTY_SUMMARY: LeadSummary = {
  total: 0,
  new: 0,
  qualified: 0,
  consultation_scheduled: 0,
  rejected: 0,
  technical_spec_requested: 0,
};

export function useLeads() {
  const { language, t } = useLanguage();
  const initialParams = new URLSearchParams(window.location.search);
  const [filters, setFiltersState] = useState<LeadFilters>(() =>
    readLeadFilters(initialParams),
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [page, setPage] = useState(() => {
    const value = Number(initialParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch,
      lead_source: filters.lead_source,
      responsible: filters.responsible,
      deal_stage: filters.deal_stage,
      technical_spec_requested: filters.technical_spec_requested,
      sort: filters.sort,
      order: filters.order,
    }),
    [
      debouncedSearch,
      filters.deal_stage,
      filters.lead_source,
      filters.order,
      filters.responsible,
      filters.sort,
      filters.technical_spec_requested,
    ],
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(filters.search),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setLoadError("");
        return getLeads(queryFilters, page, controller.signal);
      })
      .then((response) => {
        setLeads(response.items);
        setPagination(response.pagination);
        setSummary(response.summary);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(getReadableError(error, t));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [language, page, queryFilters, reloadKey, t]);

  useEffect(() => {
    const params = writeLeadFilters(filters, page);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters, page]);

  const setFilters = useCallback((next: LeadFilters) => {
    setFiltersState(next);
    setPage(1);
  }, []);

  const reloadLeads = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const createLead = useCallback(async (payload: CreateLeadPayload) => {
    await createLeadRequest(payload);
    setPage(1);
    setReloadKey((value) => value + 1);
  }, []);

  const updateStage = useCallback(
    async (leadId: number, dealStage: DealStage) => {
      await updateLeadStageRequest(leadId, { deal_stage: dealStage });
      setReloadKey((value) => value + 1);
    },
    [],
  );

  return {
    leads,
    pagination,
    summary,
    filters,
    page,
    isLoading,
    loadError,
    setFilters,
    setPage,
    clearFilters: () => setFilters(DEFAULT_LEAD_FILTERS),
    createLead,
    updateStage,
    reloadLeads,
  };
}
