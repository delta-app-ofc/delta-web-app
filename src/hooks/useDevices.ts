import { useCallback, useEffect, useReducer, useState } from "react";
import { listInstallations } from "../services/installations";
import { listDevices } from "../services/devices";
import { ApiError } from "../services/http";
import { listDeviceIndicators } from "../services/indicators";
import type { DeviceTelemetry, DevicesResult } from "../types/device";
import type { DeviceIndicator } from "../types/indicators";
import { formatInstallationLabel } from "../utils/installations";

// Status e bateria vêm da view dw.vw_ft_device_status (carregada do Mongo pelo ETL), não da telemetria pública.
function toTelemetry(indicator: DeviceIndicator): DeviceTelemetry {
  return {
    deviceId: indicator.deviceId,
    lastPingAt: indicator.lastPingAt ?? "",
    wifiSignalRssi: indicator.wifiSignalRssi ?? "",
    firmwareVersion: indicator.firmwareVersion ?? "",
    connectivityStatus: indicator.connectivityStatus,
    batteryLevel: indicator.batteryLevel ?? 0,
    unavailabilityReason: null,
  };
}

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
        const [records, installations, indicators] = await Promise.all([
          listDevices(controller.signal),
          listInstallations(controller.signal),
          listDeviceIndicators(controller.signal).catch(() => null),
        ]);
        if (controller.signal.aborted) return;
        const installationMap = new Map(installations.map((installation) => [installation.id, installation]));
        const warnings: string[] = [];
        const byDevice = new Map((indicators ?? []).map((indicator) => [indicator.deviceId, indicator]));
        if (indicators === null) warnings.push("Não foi possível consultar o status dos dispositivos.");
        const devices = records.map((record) => {
          const installation = installationMap.get(record.propertyId);
          if (!installation) warnings.push(`A instalação do dispositivo ${record.deviceId} não foi encontrada.`);
          const indicator = byDevice.get(record.deviceId);
          return { record, installationName: formatInstallationLabel(installation?.name ?? null) ?? `Instalação #${record.propertyId}`, region: indicator?.regionName ?? null, telemetry: indicator ? toTelemetry(indicator) : null };
        });
        dispatch({ type: "loaded", data: { devices, warnings: [...new Set(warnings)] } });
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
