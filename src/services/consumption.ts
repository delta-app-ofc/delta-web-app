import type { MonthlyConsumption } from "../types/consumption";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

function parseConsumption(value: unknown): MonthlyConsumption {
  if (!isRecord(value)) throw new Error("A API retornou um consumo inválido.");
  const totalLiters = readOptionalNumber(value.totalLiters);
  const referenceMonth = readText(value.referenceMonth, 10);
  if (totalLiters === null || totalLiters < 0 || !/^\d{4}-\d{2}-01$/.test(referenceMonth)) {
    throw new Error("A API retornou um consumo mensal inválido.");
  }
  return { propertyId: readId(value.propertyId), referenceMonth, totalLiters };
}

export async function listMonthlyConsumption(propertyId: number, signal: AbortSignal): Promise<MonthlyConsumption[]> {
  try {
    readId(propertyId);
    return readArray(await getJson(`/delta/analytics/monthly-variation/${propertyId}`, signal), parseConsumption);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de consumo inválidos.");
  }
}
