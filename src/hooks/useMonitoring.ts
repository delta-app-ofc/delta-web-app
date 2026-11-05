import { useCallback, useEffect, useReducer, useState } from "react";
import { ApiError } from "../services/http";
import { listAddresses } from "../services/addresses";
import { listMonitoringHourly } from "../services/indicators";
import { listInstallations } from "../services/installations";
import type { Address } from "../types/address";
import type { MonitoringHourlyPoint } from "../types/indicators";
import type { MonitoringData } from "../types/monitoring";
import { weightedFlow } from "../utils/indicators";
import { formatInstallationLabel } from "../utils/installations";

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

export function buildMonitoringData(
  points: MonitoringHourlyPoint[],
  installations: { id: number; name: string; addressId: number | null }[],
  addresses: Address[] = [],
  locationWarning = false,
): MonitoringData {
  const byProperty = new Map<number, MonitoringHourlyPoint[]>();
  const addressById = new Map(addresses.map((address) => [address.id, address]));
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
        name: formatInstallationLabel(installation.name) ?? installation.name,
        city: formatInstallationLabel(addressById.get(installation.addressId ?? -1)?.city ?? null),
        state: addressById.get(installation.addressId ?? -1)?.state.trim().toLocaleUpperCase("pt-BR") ?? null,
        consumptionLiters: items.length ? items.reduce((total, item) => total + item.totalLiters, 0) : null,
        flowLpm: weightedFlow(items),
        readingCount: items.reduce((total, item) => total + item.readingsCount, 0),
      };
    }),
    chart: chartValues.map(([hour, liters]) => ({ id: hour, label: label.format(new Date(hour)), value: max > 0 ? liters / max * 100 : 0, liters })),
    totalLiters: points.reduce((total, point) => total + point.totalLiters, 0),
    averageFlowLpm: weightedFlow(points),
    readingCount: points.reduce((total, point) => total + point.readingsCount, 0),
    warnings: [
      ...(points.length === 0 ? ["Não há leituras consolidadas para a janela selecionada."] : []),
      ...(locationWarning ? ["Não foi possível carregar a cidade de algumas instalações."] : []),
    ],
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
        const addressIds = [...new Set(installations.flatMap((installation) => installation.addressId === null ? [] : [installation.addressId]))];
        let addresses: Address[] = [];
        let locationWarning = false;
        if (addressIds.length > 0) {
          try {
            addresses = await listAddresses(addressIds, controller.signal);
          } catch (error: unknown) {
            if (controller.signal.aborted) return;
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw error;
            locationWarning = true;
          }
        }
        if (!controller.signal.aborted) dispatch({ type: "loaded", data: buildMonitoringData(points, installations, addresses, locationWarning) });
      } catch (error: unknown) {
        if (!controller.signal.aborted) dispatch({ type: "failed", error: error instanceof ApiError ? error.message : "Não foi possível carregar o monitoramento." });
      }
    }
    void load();
    return () => controller.abort();
  }, [interval, requestVersion]);
  return { state, retry: useCallback(() => setRequestVersion((version) => version + 1), []) };
}
