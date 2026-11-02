import type { DeviceTelemetry } from "../types/device";
import { isRecord, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getPublicJsonFrom } from "./http";

const mongoBaseUrl = () => import.meta.env.VITE_MONGO_API_URL?.trim();

function parseStatus(value: unknown): DeviceTelemetry {
  if (!isRecord(value)) throw new Error("A API Mongo retornou uma telemetria inválida.");
  const batteryLevel = readOptionalNumber(value.battery_level);
  if (batteryLevel === null || !Number.isInteger(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) throw new Error("A API Mongo retornou uma bateria inválida.");
  return {
    deviceId: readText(value.device_id, 100),
    lastPingAt: readText(value.last_ping_at, 80),
    wifiSignalRssi: readText(value.wifi_signal_rssi, 50),
    firmwareVersion: readText(value.firmware_version, 100),
    connectivityStatus: readText(value.connectivity_status, 50),
    batteryLevel,
    unavailabilityReason: value.unavailability_reason == null ? null : readText(value.unavailability_reason, 500),
  };
}

export async function getDeviceTelemetry(deviceId: string, signal: AbortSignal): Promise<DeviceTelemetry | null> {
  try {
    const telemetry = parseStatus(await getPublicJsonFrom(mongoBaseUrl(), `/api/telemetry/device-status?device_id=${encodeURIComponent(deviceId)}`, signal));
    if (telemetry.deviceId !== deviceId) throw new Error("A API Mongo retornou outro dispositivo.");
    return telemetry;
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    if (error instanceof ApiError && error.status === 404) return null;
    if (error instanceof ApiError) throw error;
    throw new ApiError("A API Mongo retornou uma telemetria inválida.");
  }
}
