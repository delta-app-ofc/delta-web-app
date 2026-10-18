import type { InstallationRecord } from "../types/installation";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";
import { getCurrentUser } from "./auth";

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
    const user = await getCurrentUser(signal);
    const propertyIds = readArray(await getJson(`/delta/user-properties/${user.id}`, signal), (value) => {
      if (!isRecord(value) || readId(value.userId) !== user.id) {
        throw new Error("A API retornou uma associação inválida.");
      }
      return readId(value.propertyId);
    });
    const uniqueIds = [...new Set(propertyIds)];
    const records: InstallationRecord[] = [];
    for (let offset = 0; offset < uniqueIds.length; offset += 6) {
      signal.throwIfAborted();
      const batch = await Promise.all(uniqueIds.slice(offset, offset + 6).map(async (id) => {
        const record = parseInstallation(await getJson(`/delta/property/${id}`, signal));
        if (record.id !== id) throw new Error("A API retornou uma instalação diferente da solicitada.");
        return record;
      }));
      records.push(...batch);
    }
    return records;
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de instalação inválidos.");
  }
}
