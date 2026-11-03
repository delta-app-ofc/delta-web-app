import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/http";
import { listPropertyMonthly } from "../services/indicators";
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
  | { status: "success"; data: GoalsData | null }
  | { status: "error"; error: string };

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

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    listPropertyMonthly(null, controller.signal).then(
      (rows) => { if (!controller.signal.aborted) setState({ status: "success", data: buildGoalsData(rows) }); },
      (error: unknown) => { if (!controller.signal.aborted) setState({ status: "error", error: error instanceof ApiError ? error.message : "Não foi possível carregar as metas." }); },
    );
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return { state, retry };
}
