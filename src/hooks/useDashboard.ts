import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth";
import { listMonthlyConsumption } from "../services/consumption";
import { ApiError } from "../services/http";
import { listInstallations } from "../services/installations";
import { calculateWaterCost } from "../services/waterCost";
import type { DashboardData } from "../types/dashboard";
import { getCurrentReferenceMonth } from "../utils/installations";

type State =
  | { status: "loading" }
  | { status: "success"; data: DashboardData }
  | { status: "error"; error: string };

function previousReferenceMonth(referenceMonth: string): string {
  const date = new Date(`${referenceMonth}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 10);
}

export function useDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const referenceMonth = getCurrentReferenceMonth();
    const previousMonth = previousReferenceMonth(referenceMonth);
    setState({ status: "loading" });

    async function load(): Promise<void> {
      try {
        const [userResult, records] = await Promise.all([
          getCurrentUser(signal).catch(() => null),
          listInstallations(signal),
        ]);
        signal.throwIfAborted();

        const monthlyResults = await Promise.allSettled(records.map((record) => listMonthlyConsumption(record.id, signal)));
        signal.throwIfAborted();
        let currentLiters = 0;
        let previousLiters = 0;
        let currentCount = 0;
        let previousCount = 0;
        const currentByProperty = new Map<number, number>();
        let monthlyFailures = 0;

        records.forEach((record, index) => {
          const result = monthlyResults[index];
          if (result.status === "rejected") {
            monthlyFailures += 1;
            return;
          }
          const current = result.value.find((item) => item.propertyId === record.id && item.referenceMonth === referenceMonth);
          const previous = result.value.find((item) => item.propertyId === record.id && item.referenceMonth === previousMonth);
          if (current) {
            currentLiters += current.totalLiters;
            currentCount += 1;
            currentByProperty.set(record.id, current.totalLiters);
          }
          if (previous) {
            previousLiters += previous.totalLiters;
            previousCount += 1;
          }
        });

        const costResults = await Promise.allSettled([...currentByProperty.entries()].map(([propertyId, liters]) =>
          liters <= 0 ? Promise.resolve(null) : calculateWaterCost(propertyId, liters / 1000, referenceMonth, signal),
        ));
        signal.throwIfAborted();
        let estimatedCost = 0;
        let costFailures = 0;
        let costSuccesses = 0;
        costResults.forEach((result) => {
          if (result.status === "rejected") costFailures += 1;
          else {
            costSuccesses += 1;
            if (result.value) estimatedCost += result.value.estimatedCost;
          }
        });

        const warnings: string[] = [];
        if (monthlyFailures > 0) warnings.push("Não foi possível carregar o consumo de algumas instalações.");
        if (costFailures > 0) warnings.push("Não foi possível calcular o custo de algumas instalações.");
        const data: DashboardData = {
          user: userResult,
          referenceMonth,
          previousMonth,
          currentLiters: currentCount > 0 ? currentLiters : null,
          previousLiters: previousCount > 0 ? previousLiters : null,
          estimatedCost: currentByProperty.size === 0 ? null : costFailures === 0 && costSuccesses === currentByProperty.size ? estimatedCost : null,
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
