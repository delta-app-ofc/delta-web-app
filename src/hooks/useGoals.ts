import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../services/http";
import { listPropertyMonthly } from "../services/indicators";
import { saveMonthlyGoal } from "../services/propertyGoal";
import type { PropertyMonthlyIndicator } from "../types/indicators";

export interface GoalsData {
  referenceMonth: string;
  units: PropertyMonthlyIndicator[];
  averageGoalPct: number | null;
  unitsOnTarget: number;
  unitsCritical: number;
  annualSavingsPotential: number;
}

type State =
  | { status: "loading" }
  | { status: "success"; data: GoalsData | null; refreshing: boolean }
  | { status: "error"; error: string };

export interface GoalSaveResult {
  error: string | null;
  notice: string | null;
}

// Mês exibido: o mais recente já fechado; sem mês fechado, o mais recente disponível.
export function buildGoalsData(rows: PropertyMonthlyIndicator[]): GoalsData | null {
  if (rows.length === 0) return null;
  const months = [...new Set(rows.map((row) => row.referenceMonth))].sort();
  const complete = months.filter((month) => rows.some((row) => row.referenceMonth === month && row.isCompleteMonth));
  const referenceMonth = (complete.length ? complete : months).slice(-1)[0];
  const units = rows.filter((row) => row.referenceMonth === referenceMonth).sort((a, b) => a.propertyName.localeCompare(b.propertyName));
  const pcts = units.flatMap((unit) => unit.goalPct === null ? [] : [unit.goalPct]);
  return {
    referenceMonth,
    units,
    averageGoalPct: pcts.length ? pcts.reduce((total, pct) => total + pct, 0) / pcts.length : null,
    unitsOnTarget: units.filter((unit) => unit.goalStatus === "OK").length,
    unitsCritical: units.filter((unit) => unit.goalStatus === "CRITICO").length,
    annualSavingsPotential: units.reduce((total, unit) => total + unit.estimatedSavingsValue, 0) * 12,
  };
}

export function useGoals() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  const activeRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async (): Promise<string | null> => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState((current) => current.status === "success"
      ? { ...current, refreshing: true }
      : { status: "loading" });
    try {
      const rows = await listPropertyMonthly(null, controller.signal);
      if (controller.signal.aborted) return null;
      setState({ status: "success", data: buildGoalsData(rows), refreshing: false });
      return null;
    } catch (error: unknown) {
      if (controller.signal.aborted) return null;
      const message = error instanceof ApiError ? error.message : "Não foi possível carregar as metas.";
      setState((current) => current.status === "success"
        ? { ...current, refreshing: false }
        : { status: "error", error: message });
      return message;
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => activeRequest.current?.abort();
  }, [requestVersion, refresh]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);

  // Grava a meta e recarrega os indicadores: o percentual e o status são recalculados pela view, não aqui.
  const saveGoal = useCallback(async (propertyId: number, monthlyTargetLiters: number): Promise<GoalSaveResult> => {
    try {
      await saveMonthlyGoal(propertyId, monthlyTargetLiters, new AbortController().signal);
      const refreshError = await refresh();
      return {
        error: null,
        notice: refreshError ? "A meta foi salva, mas não foi possível atualizar os indicadores. Recarregue a página para ver os valores novos." : null,
      };
    } catch (error: unknown) {
      return { error: error instanceof ApiError ? error.message : "Não foi possível salvar a meta.", notice: null };
    }
  }, [refresh]);

  return { state, retry, saveGoal };
}
