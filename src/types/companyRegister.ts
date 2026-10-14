export const companyRegisterSteps = [
  "company",
  "unit",
  "classification",
  "operation",
  "shifts",
  "water",
  "consumption",
  "device",
] as const;

export type CompanyRegisterStep = (typeof companyRegisterSteps)[number];

export const weekDays = [
  { id: "monday", label: "Segunda" },
  { id: "tuesday", label: "Terça" },
  { id: "wednesday", label: "Quarta" },
  { id: "thursday", label: "Quinta" },
  { id: "friday", label: "Sexta" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
] as const;

export type WeekDay = (typeof weekDays)[number]["id"];

export const industryClassifications = [
  "Comercial normal industrial",
  "Comercial entidade assistência social",
  "Pública com contrato",
  "Comercial especial",
] as const;

export type IndustryClassification =
  (typeof industryClassifications)[number];

export const waterUses = [
  "Processo produtivo",
  "Limpeza e higienização",
  "Resfriamento",
  "Caldeiras",
  "Sanitários",
  "Irrigação",
  "Refeitório",
  "Lavar equipamentos",
] as const;

export type WaterUse = (typeof waterUses)[number];

export const waterSources = [
  "Concessionária",
  "Poço artesiano",
  "Água da chuva",
  "Reúso de água",
] as const;

export type WaterSource = (typeof waterSources)[number];

export interface ShiftSchedule {
  id: string;
  start: string;
  end: string;
}

export interface CompanyRegisterData {
  legalName: string;
  tradeName: string;
  cnpj: string;
  industrySegment: string;
  companySize: string;
  unitName: string;
  postalCode: string;
  state: string;
  city: string;
  streetDistrict: string;
  number: string;
  classification: IndustryClassification | "";
  operationDays: WeekDay[];
  operationStart: string;
  operationEnd: string;
  shiftCount: 1 | 2 | 3 | 4 | null;
  shifts: ShiftSchedule[];
  waterUses: WaterUse[];
  waterSource: WaterSource | "";
  averageMonthlyConsumption: string;
  deviceId: string;
}

export type CompanyTextField =
  | "legalName"
  | "tradeName"
  | "cnpj"
  | "industrySegment"
  | "companySize"
  | "unitName"
  | "postalCode"
  | "state"
  | "city"
  | "streetDistrict"
  | "number"
  | "operationStart"
  | "operationEnd"
  | "averageMonthlyConsumption"
  | "deviceId";
