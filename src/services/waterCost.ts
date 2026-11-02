import type { WaterCost } from "../types/waterCost";
import { isRecord, readId, readOptionalNumber } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

function parseWaterCost(value: unknown): WaterCost {
  if (!isRecord(value)) throw new Error("A API retornou um custo inválido.");
  const estimatedCost = readOptionalNumber(value.estimatedCost);
  if (estimatedCost === null || estimatedCost < 0) throw new Error("A API retornou um custo inválido.");
  return {
    propertyId: readId(value.propertyId),
    regionId: readId(value.regionId),
    consumptionM3: readOptionalNumber(value.consumptionM3),
    ratePerM3: readOptionalNumber(value.ratePerM3),
    estimatedCost,
    referenceDate: typeof value.referenceDate === "string" ? value.referenceDate : null,
  };
}

export async function calculateWaterCost(propertyId: number, consumptionM3: number, referenceDate: string, signal: AbortSignal): Promise<WaterCost> {
  if (!Number.isSafeInteger(propertyId) || propertyId <= 0 || !Number.isFinite(consumptionM3) || consumptionM3 <= 0) {
    throw new ApiError("Não foi possível calcular o custo da instalação.");
  }
  const query = new URLSearchParams({ consumptionM3: String(consumptionM3), referenceDate });
  try {
    const result = parseWaterCost(await getJson(`/delta/property/${propertyId}/watercost?${query.toString()}`, signal));
    if (result.propertyId !== propertyId) throw new Error("A API retornou um custo de outra instalação.");
    return result;
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de custo inválidos.");
  }
}
