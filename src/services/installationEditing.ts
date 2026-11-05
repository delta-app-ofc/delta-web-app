import type { InstallationRegistrationData } from "../types/installationRegistration";
import { formatCep, normalizeState } from "../utils/installationRegistration";
import { listAddresses } from "./addresses";
import { listPropertyMonthly } from "./indicators";
import { ApiError } from "./http";
import { getInstallation } from "./installations";

export interface InstallationEditingData {
  id: number;
  name: string;
  formData: InstallationRegistrationData;
  warnings: string[];
}

export async function getInstallationForEditing(id: number, signal: AbortSignal): Promise<InstallationEditingData> {
  const installation = await getInstallation(id, signal);
  const [addressResult, goalResult] = await Promise.allSettled([
    installation.addressId === null ? Promise.resolve([]) : listAddresses([installation.addressId], signal),
    listPropertyMonthly(null, signal).then(rows => rows
      .filter(row => row.propertyId === id && row.monthlyTargetLiters !== null)
      .sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth))[0]?.monthlyTargetLiters ?? null),
  ]);
  signal.throwIfAborted();
  for (const result of [addressResult, goalResult]) {
    if (result.status === "rejected" && result.reason instanceof ApiError &&
      (result.reason.status === 401 || result.reason.status === 403)) throw result.reason;
  }
  const address = addressResult.status === "fulfilled" ? addressResult.value[0] : undefined;
  const monthlyGoal = goalResult.status === "fulfilled" ? goalResult.value : null;
  return {
    id, name: installation.name,
    formData: {
      name: installation.name, type: installation.type ?? "PRÉDIO",
      cep: formatCep(address?.cep ?? ""), city: address?.city ?? "", state: normalizeState(address?.state ?? ""),
      monthlyConsumption: "",
      monthlyGoal: monthlyGoal === null ? "" : String(monthlyGoal), deviceId: "",
      classification: installation.classification ?? "", regionId: address?.regionId == null ? "" : String(address.regionId),
    },
    warnings: [
      ...(addressResult.status === "rejected" ? ["Não foi possível carregar o endereço. Os campos foram mantidos em branco."] : []),
      ...(goalResult.status === "rejected" ? ["Não foi possível carregar a meta mensal. Informe uma meta para salvar as alterações."] : []),
    ],
  };
}
