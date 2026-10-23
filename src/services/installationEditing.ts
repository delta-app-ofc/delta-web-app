import type { InstallationRegistrationData } from "../types/installationRegistration";
import { formatCep, normalizeState } from "../utils/installationRegistration";
import { getCurrentReferenceMonth } from "../utils/installations";
import { listAddresses } from "./addresses";
import { listMonthlyConsumption } from "./consumption";
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
  const [addressResult, consumptionResult] = await Promise.allSettled([
    installation.addressId === null ? Promise.resolve([]) : listAddresses([installation.addressId], signal),
    listMonthlyConsumption(id, signal).then(rows => {
      if (rows.some(row => row.propertyId !== id)) throw new Error("Consumo de outra instalação.");
      const current = rows.filter(row => row.referenceMonth === getCurrentReferenceMonth());
      if (current.length > 1) throw new Error("Consumo mensal duplicado.");
      return current[0] ?? null;
    }),
  ]);
  signal.throwIfAborted();
  for (const result of [addressResult, consumptionResult]) {
    if (result.status === "rejected" && result.reason instanceof ApiError &&
      (result.reason.status === 401 || result.reason.status === 403)) throw result.reason;
  }
  const address = addressResult.status === "fulfilled" ? addressResult.value[0] : undefined;
  const consumption = consumptionResult.status === "fulfilled" ? consumptionResult.value : null;
  return {
    id, name: installation.name,
    formData: {
      name: installation.name, type: installation.type ?? "",
      cep: formatCep(address?.cep ?? ""), city: address?.city ?? "", state: normalizeState(address?.state ?? ""),
      monthlyConsumption: consumption === null ? "" : String(consumption.totalLiters / 1000).replace(".", ","),
      monthlyGoal: "", deviceId: "",
      classification: installation.classification ?? "", regionId: address?.regionId == null ? "" : String(address.regionId),
    },
    warnings: [
      ...(addressResult.status === "rejected" ? ["Não foi possível carregar o endereço. Os campos foram mantidos em branco."] : []),
      ...(consumptionResult.status === "rejected" ? ["Não foi possível carregar o consumo mensal. O campo foi mantido em branco."] : []),
    ],
  };
}
