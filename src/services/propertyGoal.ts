import { readId } from "../utils/apiValidation";
import { ApiError, writeJson } from "./http";

const MAX_LITERS = 999_999_999;

// Grava a meta mensal (em litros) da instalação; as views dw passam a refletir o novo valor logo em seguida.
export async function saveMonthlyGoal(propertyId: number, monthlyTargetLiters: number, signal: AbortSignal): Promise<void> {
  readId(propertyId);
  if (!Number.isFinite(monthlyTargetLiters) || monthlyTargetLiters <= 0 || monthlyTargetLiters > MAX_LITERS) {
    throw new ApiError("Informe uma meta mensal entre 1 e 999.999.999 litros.");
  }
  await writeJson("PUT", `/delta/property/${propertyId}/goal`, { monthlyTargetLiters }, signal);
}