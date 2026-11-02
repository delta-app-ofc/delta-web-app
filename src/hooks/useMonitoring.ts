import { useCallback, useEffect, useReducer, useState } from "react";
import { listDevices } from "../services/devices";
import { listInstallations } from "../services/installations";
import { listConsumptionSummaries } from "../services/mongoTelemetry";
import { ApiError } from "../services/http";
import type { MonitoringData } from "../types/monitoring";

export type MonitoringInterval = 5 | 10 | 15;
type State = { status: "loading" } | { status: "success"; data: MonitoringData } | { status: "error"; error: string };
type Action = { type: "load" } | { type: "loaded"; data: MonitoringData } | { type: "failed"; error: string };
function reducer(_state: State, action: Action): State {
  if (action.type === "load") return { status: "loading" };
  if (action.type === "loaded") return { status: "success", data: action.data };
  return { status: "error", error: action.error };
}

export function useMonitoring(interval: MonitoringInterval) {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "load" });
    async function load(): Promise<void> {
      try {
        const [devices, installations] = await Promise.all([listDevices(controller.signal), listInstallations(controller.signal)]);
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        const summaries: Awaited<ReturnType<typeof listConsumptionSummaries>> = [];
        let failures = 0;
        for (let offset = 0; offset < devices.length; offset += 6) {
          const results = await Promise.allSettled(devices.slice(offset, offset + 6).map((device) => listConsumptionSummaries(device.deviceId, start.toISOString(), end.toISOString(), controller.signal)));
          results.forEach((result) => result.status === "fulfilled" ? summaries.push(...result.value) : failures += 1);
        }
        if (controller.signal.aborted) return;
        const selected = summaries.filter((summary) => Math.round((Date.parse(summary.windowFinishedAt) - Date.parse(summary.windowStartedAt)) / 60000) === interval);
        const deviceProperty = new Map(devices.map((device) => [device.deviceId, device.propertyId]));
        const dataByInstallation = new Map<number, typeof selected>();
        selected.forEach((summary) => {
          const propertyId = deviceProperty.get(summary.deviceId);
          if (propertyId !== undefined) dataByInstallation.set(propertyId, [...(dataByInstallation.get(propertyId) ?? []), summary]);
        });
        const installationData = installations.map((installation) => {
          const items = dataByInstallation.get(installation.id) ?? [];
          const flows = items.flatMap((item) => item.lpmAverage === null ? [] : [item.lpmAverage]);
          return { id: installation.id, name: installation.name, consumptionLiters: items.length ? items.reduce((total, item) => total + item.consumptionLiters, 0) : null, flowLpm: flows.length ? flows.reduce((total, flow) => total + flow, 0) / flows.length : null, readingCount: items.length };
        });
        const buckets = new Map<string, number>();
        selected.forEach((summary) => { const date = new Date(summary.windowStartedAt); const key = date.toISOString(); buckets.set(key, (buckets.get(key) ?? 0) + summary.consumptionLiters); });
        const chartValues = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
        const max = Math.max(...chartValues.map(([, liters]) => liters), 0);
        const flowValues = selected.flatMap((item) => item.lpmAverage === null ? [] : [item.lpmAverage]);
        dispatch({ type: "loaded", data: { installations: installationData, chart: chartValues.map(([date, liters]) => ({ id: date, label: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date)), value: max > 0 ? liters / max * 100 : 0, liters })), totalLiters: selected.reduce((total, item) => total + item.consumptionLiters, 0), averageFlowLpm: flowValues.length ? flowValues.reduce((total, flow) => total + flow, 0) / flowValues.length : null, readingCount: selected.length, summaries, warnings: [...(failures ? ["Não foi possível consultar o consumo de alguns dispositivos."] : []), ...(selected.length === 0 ? ["Não há leituras Mongo para o intervalo selecionado."] : [])] } });
      } catch (error: unknown) {
        if (!controller.signal.aborted) dispatch({ type: "failed", error: error instanceof ApiError ? error.message : "Não foi possível carregar o monitoramento." });
      }
    }
    void load();
    return () => controller.abort();
  }, [interval, requestVersion]);
  return { state, retry: useCallback(() => setRequestVersion((version) => version + 1), []) };
}
