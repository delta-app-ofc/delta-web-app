import type { DailyConsumption, InstallationDetails } from "../types/installationDetails";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { listAddresses } from "./addresses";
import { listMonthlyConsumption } from "./consumption";
import { ApiError, getJson } from "./http";
import { getInstallation } from "./installations";

function parseDaily(value: unknown): DailyConsumption {
  if (!isRecord(value)) throw new Error("Leitura inválida.");
  const fullDate = readText(value.fullDate, 10);
  const totalLiters = readOptionalNumber(value.totalLiters);
  const costValue = readOptionalNumber(value.costValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fullDate) ||
    !Number.isFinite(Date.parse(fullDate)) || new Date(fullDate).toISOString().slice(0, 10) !== fullDate ||
    totalLiters === null || totalLiters < 0 || (costValue !== null && costValue < 0)) {
    throw new Error("Leitura inválida.");
  }
  return { propertyId: readId(value.propertyId), fullDate, totalLiters, costValue };
}

function validateReadings<T extends { propertyId: number }>(readings: T[], id: number, key: (row: T) => string): T[] {
  const seen = new Set<string>();
  for (const row of readings) {
    const date = key(row);
    if (row.propertyId !== id || seen.has(date) || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Leituras inconsistentes.");
    seen.add(date);
  }
  return readings.sort((a, b) => key(a).localeCompare(key(b)));
}

export async function getInstallationDetails(id: number, signal: AbortSignal): Promise<InstallationDetails> {
  // Autoriza a instalação antes de consultar endereço ou dados de consumo.
  const installation = await getInstallation(id, signal);
  const results = await Promise.allSettled([
    installation.addressId === null ? Promise.resolve([]) : listAddresses([installation.addressId], signal),
    listMonthlyConsumption(id, signal).then(rows => validateReadings(rows, id, row => row.referenceMonth)),
    getJson(`/delta/analytics/consumption-daily/${id}`, signal)
      .then(value => validateReadings(readArray(value, parseDaily), id, row => row.fullDate)),
  ]);
  signal.throwIfAborted();
  // Falhas de autenticação interrompem a página, mesmo quando uma consulta já terminou.
  for (const result of results) {
    if (result.status === "rejected" && result.reason instanceof ApiError &&
      (result.reason.status === 401 || result.reason.status === 403)) throw result.reason;
  }
  const [address, monthly, daily] = results;
  return {
    installation,
    address: address.status === "fulfilled" ? address.value[0] ?? null : null,
    monthly: monthly.status === "fulfilled" ? monthly.value : [],
    daily: daily.status === "fulfilled" ? daily.value : [],
    warnings: [
      ...(address.status === "rejected" ? ["Não foi possível carregar o endereço."] : []),
      ...(monthly.status === "rejected" ? ["Não foi possível carregar o histórico mensal."] : []),
      ...(daily.status === "rejected" ? ["Não foi possível carregar as leituras diárias e os custos."] : []),
    ],
  };
}
