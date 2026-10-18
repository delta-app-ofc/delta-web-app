import type { Address } from "../types/address";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
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

export async function listAddresses(signal: AbortSignal): Promise<Address[]> {
  try {
    return readArray(await getJson("/delta/address", signal), parseAddress);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de endereço inválidos.");
  }
}
