import type { InstallationRecord } from "../types/installation";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

function parseInstallation(value: unknown): InstallationRecord {
  if (!isRecord(value)) throw new Error("A API retornou uma instalação inválida.");
  const area = readOptionalNumber(value.builtAreaM2);
  return {
    id: readId(value.id),
    name: readText(value.name, 100),
    addressId: value.addressId == null ? null : readId(value.addressId),
    builtAreaM2: area !== null && area > 0 ? area : null,
  };
}

export async function listInstallations(signal: AbortSignal): Promise<InstallationRecord[]> {
  try {
    return readArray(await getJson("/delta/property", signal), parseInstallation);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de instalação inválidos.");
  }
}
