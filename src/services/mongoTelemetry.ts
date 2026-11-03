import type { ConsumptionSummary, DeviceTelemetry } from "../types/device";
import { isRecord, readArray, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getPublicJsonFrom } from "./http";

const mongoBaseUrl = () => import.meta.env.VITE_MONGO_API_URL?.trim();

function parseSummary(value: unknown): ConsumptionSummary {
  if (!isRecord(value)) throw new Error("A API Mongo retornou um resumo inválido.");
  const consumption = readOptionalNumber(value.consumption_liters);
  const flow = readOptionalNumber(value.lpm_average);
  if (consumption === null || consumption < 0 || (flow !== null && flow < 0)) throw new Error("A API Mongo retornou valores de consumo inválidos.");
  return {
    id: typeof value._id === "string" ? value._id : null,
    deviceId: readText(value.device_id, 100),
    windowStartedAt: readText(value.window_started_at, 80),
    windowFinishedAt: readText(value.window_finished_at, 80),
    consumptionLiters: consumption,
    lpmAverage: flow,
  };
}

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

export async function listConsumptionSummaries(deviceId: string, start: string, end: string, signal: AbortSignal): Promise<ConsumptionSummary[]> {
  const query = new URLSearchParams({ device_id: deviceId, start, end, page: "0", size: "100" });
  try {
    const value = await getPublicJsonFrom(mongoBaseUrl(), `/api/telemetry/consumption-summary?${query.toString()}`, signal);
    if (!isRecord(value)) throw new Error();
    return readArray(value.content, parseSummary).filter((summary) => summary.deviceId === deviceId);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API Mongo retornou resumos de consumo inválidos.");
  }
}
