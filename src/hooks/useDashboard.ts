import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";
import { listAddresses } from "../services/addresses";
import { ApiError } from "../services/http";
import { listOrganizationKpis } from "../services/indicators";
import { listInstallations } from "../services/installations";
import { getCurrentWeather } from "../services/weather";
import type { DashboardData } from "../types/dashboard";
import type { OrganizationMonthlyKpi } from "../types/indicators";

type State =
  | { status: "loading" }
  | { status: "success"; data: DashboardData }
  | { status: "error"; error: string };

function sum(items: OrganizationMonthlyKpi[], pick: (item: OrganizationMonthlyKpi) => number | null): number | null {
  const values = items.map(pick);
  return values.some((value) => value === null) ? null : values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

// Os indicadores já chegam calculados pela view dw.vw_ft_organization_monthly_kpi; aqui só se escolhe o mês exibido.
export function summarizeKpis(kpis: OrganizationMonthlyKpi[]): Pick<DashboardData, "referenceMonth" | "previousMonth" | "currentLiters" | "previousLiters" | "variationPct" | "estimatedCost" | "projectedCost"> | null {
  if (kpis.length === 0) return null;
  // Mês parcial não é comparável com o anterior: exibe o mais recente já fechado, se houver.
  const months = [...new Set(kpis.map((item) => item.referenceMonth))].sort();
  const closed = months.filter((month) => kpis.filter((item) => item.referenceMonth === month).every((item) => item.isCompleteMonth));
  const referenceMonth = (closed.length ? closed : months).slice(-1)[0];
  const earlier = months.filter((month) => month < referenceMonth);
  const previousMonth = earlier.length ? earlier[earlier.length - 1] : null;
  const current = kpis.filter((item) => item.referenceMonth === referenceMonth);
  const previous = previousMonth ? kpis.filter((item) => item.referenceMonth === previousMonth) : [];
  const previousLiters = sum(current, (item) => item.previousMonthLiters);
  const currentLiters = sum(current, (item) => item.totalLiters);
  return {
    referenceMonth,
    previousMonth: previousMonth ?? referenceMonth,
    currentLiters,
    previousLiters: previousLiters ?? sum(previous, (item) => item.totalLiters),
    variationPct: current.every((item) => item.variationPct !== null) && previousLiters
      ? ((currentLiters ?? 0) - previousLiters) / previousLiters * 100
      : null,
    estimatedCost: sum(current, (item) => item.totalCost),
    projectedCost: sum(current, (item) => item.projectedCost),
  };
}

export function useDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState({ status: "loading" });

    async function load(): Promise<void> {
      try {
        const [userResult, records, kpis] = await Promise.all([
          getCurrentUser(signal).catch(() => null),
          listInstallations(signal),
          listOrganizationKpis(signal),
        ]);
        signal.throwIfAborted();

        let weather = null;
        let weatherUnavailable = false;
        const latest = records[0];
        if (latest?.addressId !== null && latest?.addressId !== undefined) {
          const addressResult = await Promise.allSettled([listAddresses([latest.addressId], signal)]);
          const address = addressResult[0].status === "fulfilled" ? addressResult[0].value[0] : undefined;
          if (address?.latitude !== null && address?.latitude !== undefined && address?.longitude !== null && address?.longitude !== undefined) {
            const weatherResult = await Promise.allSettled([getCurrentWeather(address.latitude, address.longitude, address.city, signal)]);
            if (weatherResult[0].status === "fulfilled") weather = weatherResult[0].value;
            else weatherUnavailable = true;
          } else weatherUnavailable = true;
        } else weatherUnavailable = true;

        const summary = summarizeKpis(kpis);
        const warnings: string[] = [];
        if (!summary) warnings.push("Ainda não há consumo consolidado para a sua organização.");
        if (weatherUnavailable) warnings.push("Não foi possível carregar o clima da instalação mais recente.");
        const data: DashboardData = {
          user: userResult,
          referenceMonth: summary?.referenceMonth ?? "",
          previousMonth: summary?.previousMonth ?? "",
          currentLiters: summary?.currentLiters ?? null,
          previousLiters: summary?.previousLiters ?? null,
          variationPct: summary?.variationPct ?? null,
          estimatedCost: summary?.estimatedCost ?? null,
          projectedCost: summary?.projectedCost ?? null,
          weather,
          warnings,
        };
        if (!signal.aborted) setState({ status: "success", data });
      } catch (error: unknown) {
        if (!signal.aborted) setState({ status: "error", error: error instanceof ApiError ? error.message : "Não foi possível carregar o Dashboard." });
      }
    }

    void load();
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return { state, retry };
}
