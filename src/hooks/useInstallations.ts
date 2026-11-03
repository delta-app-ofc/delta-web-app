import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { listAddresses } from "../services/addresses";
import { ApiError } from "../services/http";
import { listPropertyMonthly } from "../services/indicators";
import { listInstallations } from "../services/installations";
import type { Installation, InstallationFilters, InstallationsResult, InstallationSort } from "../types/installation";
import { pickReferenceMonth } from "../utils/indicators";
import { getCurrentReferenceMonth, normalizeSearch } from "../utils/installations";

type State =
  | { status: "loading" }
  | { status: "success"; data: InstallationsResult }
  | { status: "error"; error: string };

type Action =
  | { type: "load" }
  | { type: "loaded"; data: InstallationsResult }
  | { type: "failed"; error: string };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "load": return { status: "loading" };
    case "loaded": return { status: "success", data: action.data };
    case "failed": return { status: "error", error: action.error };
  }
}

export interface UseInstallationsResult {
  state: State;
  filters: InstallationFilters;
  installations: Installation[];
  referenceMonth: string;
  totalCount: number;
  setQuery: (query: string) => void;
  setSort: (sort: InstallationSort) => void;
  retry: () => void;
}

export function useInstallations(): UseInstallationsResult {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const [filters, setFilters] = useState<InstallationFilters>({ query: "", sort: "consumption" });
  const [requestVersion, setRequestVersion] = useState(0);
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    dispatch({ type: "load" });

    async function load(): Promise<void> {
      try {
        const records = await listInstallations(signal);
        if (signal.aborted) return;
        const addressIds = records.flatMap((record) => record.addressId === null ? [] : [record.addressId]);
        const addressResult = await listAddresses(addressIds, signal).then(
          (addresses) => ({ addresses, unavailable: false }),
          () => ({ addresses: [], unavailable: true }),
        );
        if (signal.aborted) return;
        const addresses = new Map(addressResult.addresses.map((address) => [address.id, address]));
        // Consumo e L/m² vêm da view dw.vw_ft_property_monthly: uma consulta, sem cálculo no navegador.
        const monthly = await listPropertyMonthly(null, signal).then((rows) => ({ rows, failed: false }), () => ({ rows: [], failed: true }));
        if (signal.aborted) return;
        const month = pickReferenceMonth(monthly.rows.map((row) => ({ referenceMonth: row.referenceMonth, isComplete: row.isCompleteMonth })));
        const byProperty = new Map(monthly.rows.filter((row) => row.referenceMonth === month).map((row) => [row.propertyId, row]));
        if (month) setReferenceMonth(month);
        const installations: Installation[] = records.map((record) => {
          const reading = byProperty.get(record.id);
          const address = record.addressId === null ? undefined : addresses.get(record.addressId);
          return {
            id: record.id, name: record.name,
            city: address?.city || null, state: address?.state || null,
            latitude: address?.latitude ?? null, longitude: address?.longitude ?? null,
            monthlyLiters: reading?.totalLiters ?? null,
            litersPerM2: reading?.litersPerM2 ?? null,
            goalPct: reading?.goalPct ?? null,
            goalStatus: reading?.goalStatus ?? null,
          };
        });
        const failedConsumptionCount = monthly.failed ? records.length : 0;
        const warnings: string[] = [];
        if (addressResult.unavailable) warnings.push("Não foi possível carregar os endereços. Busca por região e posições no mapa estão indisponíveis.");
        if (failedConsumptionCount > 0) warnings.push("Não foi possível carregar o consumo das instalações. Tente atualizar os dados.");
        if (!signal.aborted) dispatch({ type: "loaded", data: { installations, warnings } });
      } catch (error: unknown) {
        if (!signal.aborted) dispatch({
          type: "failed",
          error: error instanceof ApiError ? error.message : "Não foi possível carregar os dados das instalações.",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [requestVersion]);

  // Busca/ordenação só são refeitas quando os dados ou filtros mudam.
  const installations = useMemo(() => {
    if (state.status !== "success") return [];
    const query = normalizeSearch(filters.query);
    return state.data.installations
      .filter((item) => normalizeSearch(`${item.name} ${item.city ?? ""} ${item.state ?? ""}`).includes(query))
      .sort((first, second) => {
        const a = filters.sort === "consumption" ? first.monthlyLiters : first.litersPerM2;
        const b = filters.sort === "consumption" ? second.monthlyLiters : second.litersPerM2;
        if (a === null && b !== null) return 1;
        if (b === null && a !== null) return -1;
        return (b ?? 0) - (a ?? 0) || first.id - second.id;
      });
  }, [state, filters.query, filters.sort]);

  // Callbacks estáveis permitem que controles memoizados evitem renderizações
  // quando apenas os resultados da API mudam.
  const setQuery = useCallback((query: string) => setFilters((previous) => ({ ...previous, query: query.slice(0, 100) })), []);
  const setSort = useCallback((sort: InstallationSort) => setFilters((previous) => ({ ...previous, sort })), []);
  const retry = useCallback(() => setRequestVersion((previous) => previous + 1), []);

  return {
    state, filters, installations, referenceMonth, setQuery, setSort, retry,
    totalCount: state.status === "success" ? state.data.installations.length : 0,
  };
}
