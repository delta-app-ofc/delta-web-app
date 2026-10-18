import type { Address } from "../types/address";
import { isRecord, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

function parseAddress(value: unknown): Address {
  if (!isRecord(value)) throw new Error("A API retornou um endereço inválido.");
  const latitude = readOptionalNumber(value.latitude);
  const longitude = readOptionalNumber(value.longitude);
  return {
    id: readId(value.id),
    city: readText(value.city ?? "", 100),
    state: readText(value.state ?? "", 30),
    latitude: latitude !== null && Math.abs(latitude) <= 90 ? latitude : null,
    longitude: longitude !== null && Math.abs(longitude) <= 180 ? longitude : null,
  };
}

export async function listAddresses(addressIds: number[], signal: AbortSignal): Promise<Address[]> {
  try {
    const uniqueIds = [...new Set(addressIds.map(readId))];
    const addresses: Address[] = [];
    for (let offset = 0; offset < uniqueIds.length; offset += 6) {
      signal.throwIfAborted();
      const batch = await Promise.all(uniqueIds.slice(offset, offset + 6).map(async (id) => {
        const address = parseAddress(await getJson(`/delta/address/${id}`, signal));
        if (address.id !== id) throw new Error("A API retornou um endereço diferente do solicitado.");
        return address;
      }));
      addresses.push(...batch);
    }
    return addresses;
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de endereço inválidos.");
  }
}
