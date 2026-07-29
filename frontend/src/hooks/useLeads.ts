import { useCallback, useEffect, useState } from "react";

import {
  createLead as createLeadRequest,
  getLeads,
  updateLeadStage as updateLeadStageRequest,
} from "../api/leads";
import { getReadableError } from "../lib/errors";
import type {
  CreateLeadPayload,
  DealStage,
  Lead,
} from "../types/lead";
import { useLanguage } from "./useLanguage";

export function useLeads() {
  const { language, t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;
    void getLeads()
      .then((savedLeads) => {
        if (!isActive) return;
        setLeads(savedLeads);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(getReadableError(error, t));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [language, t]);

  const reloadLeads = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const savedLeads = await getLeads();
      setLeads(savedLeads);
    } catch (error) {
      setLoadError(getReadableError(error, t));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const createLead = useCallback(
    async (payload: CreateLeadPayload) => {
      const createdLead = await createLeadRequest(payload);
      setLeads((currentLeads) => [
        createdLead,
        ...currentLeads.filter((lead) => lead.id !== createdLead.id),
      ]);
    },
    [],
  );

  const updateStage = useCallback(
    async (leadId: number, dealStage: DealStage) => {
      const updatedLead = await updateLeadStageRequest(leadId, {
        deal_stage: dealStage,
      });
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === updatedLead.id ? updatedLead : lead,
        ),
      );
    },
    [],
  );

  return {
    leads,
    isLoading,
    loadError,
    createLead,
    updateStage,
    reloadLeads,
  };
}
