import type { CapexComparison } from "../types/investment";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

function parseCapexComparison(value: unknown): CapexComparison {
  if (!isRecord(value)) throw new Error("A API retornou um cenário inválido.");
  const name = readText(value.name, 150);
  if (!name) throw new Error("A API retornou um cenário sem nome.");

  return {
    scenarioId: readId(value.scenarioId),
    name,
    investmentValue: readOptionalNumber(value.investmentValue),
    reductionPct: readOptionalNumber(value.reductionPct),
    annualSavingsValue: readOptionalNumber(value.annualSavingsValue),
    paybackMonths: readOptionalNumber(value.paybackMonths),
    rankByPayback: value.rankByPayback == null ? null : readId(value.rankByPayback),
  };
}

export async function listCapexComparisons(signal: AbortSignal): Promise<CapexComparison[]> {
  try {
    return readArray(await getJson("/delta/analytics/capex-comparison", signal), parseCapexComparison);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de investimentos inválidos.");
  }
}
