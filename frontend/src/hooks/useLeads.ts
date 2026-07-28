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

    async function load() {
      try {
        const savedLeads = await getLeads(language);
        if (isActive) {
          setLeads(savedLeads);
          setLoadError("");
        }
      } catch (error) {
        if (isActive) {
          setLoadError(getReadableError(error, t));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      isActive = false;
    };
  }, [language, t]);

  const createLead = useCallback(
    async (payload: CreateLeadPayload) => {
      const createdLead = await createLeadRequest(payload, language);
      setLeads((currentLeads) => [
        createdLead,
        ...currentLeads.filter((lead) => lead.id !== createdLead.id),
      ]);
    },
    [language],
  );

  const updateStage = useCallback(
    async (leadId: number, dealStage: DealStage) => {
      const updatedLead = await updateLeadStageRequest(
        leadId,
        { deal_stage: dealStage },
        language,
      );
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === updatedLead.id ? updatedLead : lead,
        ),
      );
    },
    [language],
  );

  return { leads, isLoading, loadError, createLead, updateStage };
}
