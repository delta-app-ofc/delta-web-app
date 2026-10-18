import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { listAddresses } from "../services/addresses";
import { listMonthlyConsumption } from "../services/consumption";
import { ApiError } from "../services/http";
import { listInstallations } from "../services/installations";
import type { Installation, InstallationFilters, InstallationsResult, InstallationSort } from "../types/installation";
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
  const [referenceMonth] = useState(getCurrentReferenceMonth);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    dispatch({ type: "load" });

    async function load(): Promise<void> {
      try {
        const [records, addressResult] = await Promise.all([
          listInstallations(signal),
          listAddresses(signal).then(
            (addresses) => ({ addresses, unavailable: false }),
            () => ({ addresses: [], unavailable: true }),
          ),
        ]);
        if (signal.aborted) return;
        const addresses = new Map(addressResult.addresses.map((address) => [address.id, address]));
        const installations: Installation[] = [];
        let failedConsumptionCount = 0;

        // Limita consultas simultâneas para não sobrecarregar o backend.
        for (let offset = 0; offset < records.length; offset += 6) {
          if (signal.aborted) return;
          const batch = records.slice(offset, offset + 6);
          const consumption = await Promise.allSettled(batch.map((record) => listMonthlyConsumption(record.id, signal)));
          if (signal.aborted) return;
          batch.forEach((record, position) => {
            const result = consumption[position];
            if (result.status === "rejected") failedConsumptionCount += 1;
            const reading = result.status === "fulfilled"
              ? result.value.find((item) => item.propertyId === record.id && item.referenceMonth === referenceMonth)
              : undefined;
            const monthlyLiters = reading?.totalLiters ?? null;
            const address = record.addressId === null ? undefined : addresses.get(record.addressId);
            installations.push({
              id: record.id, name: record.name,
              city: address?.city || null, state: address?.state || null,
              latitude: address?.latitude ?? null, longitude: address?.longitude ?? null,
              monthlyLiters,
              litersPerM2: monthlyLiters !== null && record.builtAreaM2 !== null
                ? monthlyLiters / record.builtAreaM2 : null,
            });
          });
        }

        const warnings: string[] = [];
        if (addressResult.unavailable) warnings.push("Não foi possível carregar os endereços. Busca por região e posições no mapa estão indisponíveis.");
        if (failedConsumptionCount > 0) warnings.push("Não foi possível carregar o consumo de algumas instalações. Tente atualizar os dados.");
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
  }, [referenceMonth, requestVersion]);

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
