import { useCallback, useEffect, useReducer, useState } from "react";
import { ApiError } from "../services/http";
import { listMonitoringHourly } from "../services/indicators";
import { listInstallations } from "../services/installations";
import type { MonitoringHourlyPoint } from "../types/indicators";
import type { MonitoringData } from "../types/monitoring";

// Janelas de leitura disponíveis na view dw.vw_ft_monitoring_hourly (minutos por leitura).
export type MonitoringInterval = 10 | 60;
const WINDOW_HOURS = 24;
const CHART_POINTS = 12;

type State = { status: "loading" } | { status: "success"; data: MonitoringData } | { status: "error"; error: string };
type Action = { type: "load" } | { type: "loaded"; data: MonitoringData } | { type: "failed"; error: string };
function reducer(_state: State, action: Action): State {
  if (action.type === "load") return { status: "loading" };
  if (action.type === "loaded") return { status: "success", data: action.data };
  return { status: "error", error: action.error };
}

function weightedFlow(points: MonitoringHourlyPoint[]): number | null {
  const withFlow = points.filter((point) => point.avgFlowLmin !== null);
  const readings = withFlow.reduce((total, point) => total + point.readingsCount, 0);
  if (readings === 0) return null;
  return withFlow.reduce((total, point) => total + (point.avgFlowLmin ?? 0) * point.readingsCount, 0) / readings;
}

export function buildMonitoringData(points: MonitoringHourlyPoint[], installations: { id: number; name: string }[]): MonitoringData {
  const byProperty = new Map<number, MonitoringHourlyPoint[]>();
  points.forEach((point) => byProperty.set(point.propertyId, [...(byProperty.get(point.propertyId) ?? []), point]));
  const buckets = new Map<string, number>();
  points.forEach((point) => buckets.set(point.readingHour, (buckets.get(point.readingHour) ?? 0) + point.totalLiters));
  const chartValues = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-CHART_POINTS);
  const max = Math.max(...chartValues.map(([, liters]) => liters), 0);
  const label = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return {
    installations: installations.map((installation) => {
      const items = byProperty.get(installation.id) ?? [];
      return {
        id: installation.id,
        name: installation.name,
        consumptionLiters: items.length ? items.reduce((total, item) => total + item.totalLiters, 0) : null,
        flowLpm: weightedFlow(items),
        readingCount: items.reduce((total, item) => total + item.readingsCount, 0),
      };
    }),
    chart: chartValues.map(([hour, liters]) => ({ id: hour, label: label.format(new Date(hour)), value: max > 0 ? liters / max * 100 : 0, liters })),
    totalLiters: points.reduce((total, point) => total + point.totalLiters, 0),
    averageFlowLpm: weightedFlow(points),
    readingCount: points.reduce((total, point) => total + point.readingsCount, 0),
    warnings: points.length === 0 ? ["Não há leituras consolidadas para a janela selecionada."] : [],
  };
}

export function useMonitoring(interval: MonitoringInterval) {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "load" });
    async function load(): Promise<void> {
      try {
        const [points, installations] = await Promise.all([
          listMonitoringHourly(WINDOW_HOURS, interval, controller.signal),
          listInstallations(controller.signal),
        ]);
        if (!controller.signal.aborted) dispatch({ type: "loaded", data: buildMonitoringData(points, installations) });
      } catch (error: unknown) {
        if (!controller.signal.aborted) dispatch({ type: "failed", error: error instanceof ApiError ? error.message : "Não foi possível carregar o monitoramento." });
      }
    }
    void load();
    return () => controller.abort();
  }, [interval, requestVersion]);
  return { state, retry: useCallback(() => setRequestVersion((version) => version + 1), []) };
}
