import type { DeviceRecord } from "../types/device";
import { isRecord, readArray, readId, readText } from "../utils/apiValidation";
import { ApiError, getJson, writeJson } from "./http";

function parseInstallationDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return readText(value, 40);
}

function parseDevice(value: unknown): DeviceRecord {
  if (!isRecord(value)) throw new Error("A API retornou um dispositivo inválido.");
  return {
    id: readId(value.id),
    deviceId: readText(value.deviceId, 100),
    propertyId: readId(value.propertyId),
    isActive: typeof value.isActive === "boolean" ? value.isActive : (() => { throw new Error("A API retornou um status inválido."); })(),
    installationDate: parseInstallationDate(value.installationDate),
  };
}

export async function listDevices(signal: AbortSignal): Promise<DeviceRecord[]> {
  try {
    return readArray(await getJson("/delta/device", signal), parseDevice);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de dispositivos inválidos.");
  }
}

export async function createDevice(propertyId: number, deviceId: string, signal: AbortSignal): Promise<DeviceRecord> {
  try {
    const value = await writeJson("POST", "/delta/device", { propertyId, deviceId, isActive: true }, signal);
    const record = parseDevice(value);
    if (record.propertyId !== propertyId || record.deviceId !== deviceId) {
      throw new Error("O dispositivo retornado não corresponde ao cadastro solicitado.");
    }
    return record;
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("Não foi possível confirmar o cadastro do dispositivo.");
  }
}
