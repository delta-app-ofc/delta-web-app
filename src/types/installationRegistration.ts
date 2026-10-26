export interface InstallationRegistrationData {
  name: string;
  type: "" | "CASA" | "PRÉDIO";
  cep: string;
  city: string;
  state: string;
  monthlyConsumption: string;
  monthlyGoal: string;
  deviceId: string;
  classification?: string;
  regionId?: string;
}

export type RegistrationField = keyof InstallationRegistrationData;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export const initialRegistrationData: InstallationRegistrationData = {
  name: "", type: "", cep: "", city: "", state: "",
  monthlyConsumption: "", monthlyGoal: "", deviceId: "",
};

export const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const tariffClassifications = [
  { value: "RESIDENCIAL_NORMAL", label: "Residencial normal" },
  { value: "COMERCIAL_ENTIDADE_ASSISTENCIA_SOCIAL", label: "Entidade de assistência social" },
  { value: "COMERCIAL_NORMAL_INDUSTRIAL", label: "Comercial / industrial" },
  { value: "RESIDENCIAL_ESPECIAL", label: "Residencial especial" },
  { value: "COMERCIAL_ESPECIAL", label: "Comercial especial" },
  { value: "RESIDENCIAL_FAVELA", label: "Residencial favela" },
  { value: "PUBLICA_COM_CONTRATO", label: "Pública com contrato" },
  { value: "RESIDENCIAL_SOCIAL", label: "Residencial social" },
] as const;
