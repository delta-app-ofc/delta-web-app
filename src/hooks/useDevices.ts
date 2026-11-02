import { useCallback, useEffect, useReducer, useState } from "react";
import { listInstallations } from "../services/installations";
import { listDevices } from "../services/devices";
import { ApiError } from "../services/http";
import { getDeviceTelemetry } from "../services/mongoTelemetry";
import type { DevicesResult } from "../types/device";

type State =
  | { status: "loading" }
  | { status: "success"; data: DevicesResult }
  | { status: "error"; error: string };

type Action =
  | { type: "load" }
  | { type: "loaded"; data: DevicesResult }
  | { type: "failed"; error: string };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "load": return { status: "loading" };
    case "loaded": return { status: "success", data: action.data };
    case "failed": return { status: "error", error: action.error };
  }
}

export function useDevices() {
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "load" });

    async function load(): Promise<void> {
      try {
        const [records, installations] = await Promise.all([
          listDevices(controller.signal),
          listInstallations(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const installationMap = new Map(installations.map((installation) => [installation.id, installation]));
        const activePropertyIds = new Set(records.filter((record) => record.isActive).map((record) => record.propertyId));
        const warnings: string[] = [];
        const telemetryResults = await Promise.allSettled(records.map((record) => getDeviceTelemetry(record.deviceId, controller.signal)));
        if (controller.signal.aborted) return;
        let telemetryFailures = 0;
        const devices = records.map((record, index) => {
          const installation = installationMap.get(record.propertyId);
          if (!installation) warnings.push(`A instalação do dispositivo ${record.deviceId} não foi encontrada.`);
          const result = telemetryResults[index];
          if (result.status === "rejected") telemetryFailures += 1;
          return { record, installationName: installation?.name ?? `Instalação #${record.propertyId}`, region: null, telemetry: result.status === "fulfilled" ? result.value : null };
        });
        if (telemetryFailures > 0) warnings.push("Não foi possível consultar a telemetria de alguns dispositivos.");
        const unlinkedInstallations = installations
          .filter((installation) => !activePropertyIds.has(installation.id))
          .map((installation) => ({ id: installation.id, name: installation.name, region: null }));
        dispatch({ type: "loaded", data: { devices, unlinkedInstallations, warnings: [...new Set(warnings)] } });
      } catch (error: unknown) {
        if (!controller.signal.aborted) dispatch({
          type: "failed",
          error: error instanceof ApiError ? error.message : "Não foi possível carregar os dispositivos.",
        });
      }
    }
    void load();
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return { state, retry };
}
