import { brazilianStates, tariffClassifications } from "../types/installationRegistration";
import type { InstallationRegistrationData, RegistrationErrors, RegistrationField } from "../types/installationRegistration";

export class RegistrationSubmitError extends Error {
  constructor(message: string, public readonly field?: RegistrationField, public readonly installationId?: number) { super(message); }
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function normalizeState(value: string): string {
  const states: Record<string, string> = {
    acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
    "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
    "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
    paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
    "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
    "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
  };
  const normalized = value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if ((brazilianStates as readonly string[]).includes(normalized.toUpperCase())) return normalized.toUpperCase();
  return Object.prototype.hasOwnProperty.call(states, normalized) ? states[normalized] : "";
}

export function parseCubicMeters(value: string, maximumFractionDigits = 3): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized) || (normalized.split(".")[1]?.length ?? 0) > maximumFractionDigits) return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function validateRegistration(data: InstallationRegistrationData, mode: "create" | "edit" = "create", apiConnected = false): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!data.name.trim()) errors.name = "Informe o nome da unidade.";
  else if (data.name.trim().length > 100) errors.name = "Use até 100 caracteres.";
  if (data.type !== "CASA" && data.type !== "PRÉDIO") errors.type = "Selecione o tipo de imóvel.";
  if (!/^\d{5}-?\d{3}$/.test(data.cep)) errors.cep = "Informe um CEP com 8 dígitos.";
  if (!data.city.trim()) errors.city = "Informe a cidade.";
  else if (data.city.trim().length > 60) errors.city = "Use até 60 caracteres.";
  if (!(brazilianStates as readonly string[]).includes(data.state)) errors.state = "Selecione o estado.";
  if (!apiConnected && data.monthlyConsumption.trim() && parseCubicMeters(data.monthlyConsumption, mode === "edit" ? 9 : 3) === null) errors.monthlyConsumption = "Informe um consumo válido em m³.";
  const goal = parseCubicMeters(data.monthlyGoal);
  if (!apiConnected && mode === "create" && (goal === null || goal <= 0)) errors.monthlyGoal = "Informe uma meta maior que zero em m³.";
  if (mode === "create" && !data.deviceId.trim()) errors.deviceId = "Informe o ID do hidrômetro.";
  else if (data.deviceId.length > 100) errors.deviceId = "Use até 100 caracteres.";
  if (apiConnected) {
    if (!tariffClassifications.some(item => item.value === data.classification)) errors.classification = "Selecione a classificação tarifária.";
    if (!data.regionId || !/^[1-9]\d*$/.test(data.regionId) || !Number.isSafeInteger(Number(data.regionId))) errors.regionId = "Selecione a região tarifária.";
  }
  return errors;
}
