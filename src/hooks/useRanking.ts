import { useCallback, useEffect, useReducer, useState } from "react";
import { resolveAccessibleOrganization } from "../services/organizationAccess";
import { getRanking } from "../services/ranking";
import { ApiError } from "../services/http";
import type { RankingCriterion, RankingResult } from "../types/ranking";

type State =
  | { status: "loading" }
  | { status: "success"; data: RankingResult }
  | { status: "unavailable"; message: string }
  | { status: "error"; error: string };

type Action =
  | { type: "load" }
  | { type: "loaded"; data: RankingResult }
  | { type: "unavailable"; message: string }
  | { type: "failed"; error: string };

function reducer(_state: State, action: Action): State {
  if (action.type === "load") return { status: "loading" };
  if (action.type === "loaded") return { status: "success", data: action.data };
  if (action.type === "unavailable") return { status: "unavailable", message: action.message };
  return { status: "error", error: action.error };
}

export function useRanking(period: string, criterion: RankingCriterion = "perm2") {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "load" });
    async function load(): Promise<void> {
      try {
        const organization = await resolveAccessibleOrganization(controller.signal);
        if (organization.status === "none") {
          dispatch({ type: "unavailable", message: "Não foi possível identificar a organização deste usuário." });
          return;
        }
        if (organization.status === "multiple") {
          dispatch({ type: "unavailable", message: "O ranking precisa de uma organização ativa para ser consultado." });
          return;
        }
        const data = await getRanking(organization.organizationId, period, criterion, 10, controller.signal);
        if (!controller.signal.aborted) dispatch({ type: "loaded", data });
      } catch (error: unknown) {
        if (!controller.signal.aborted) dispatch({ type: "failed", error: error instanceof ApiError ? error.message : "Não foi possível carregar o ranking." });
      }
    }
    void load();
    return () => controller.abort();
  }, [criterion, period, requestVersion]);

  return { state, retry: useCallback(() => setRequestVersion((version) => version + 1), []) };
}

