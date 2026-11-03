import type {
  DeviceIndicator,
  DeviceSummary,
  GoalStatus,
  LeakIndicator,
  MonitoringHourlyPoint,
  InvestmentImpact,
  OrganizationEsg,
  OrganizationMonthlyKpi,
  PropertyMonthlyIndicator,
} from "../types/indicators";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

// Todos os indicadores analíticos vêm de views dw.* do SQL, expostas em /delta/analytics/*.
const BASE = "/delta/analytics";
const goalStatuses: readonly GoalStatus[] = ["OK", "ATENCAO", "CRITICO", "SEM_META"];

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("A API retornou um item inválido.");
  return value;
}

function number(value: unknown): number {
  const result = readOptionalNumber(value);
  if (result === null) throw new Error("A API retornou um número ausente.");
  return result;
}

function month(value: unknown): string {
  const text = readText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("A API retornou uma data inválida.");
  return text;
}

function dateTime(value: unknown): string {
  const text = readText(value, 40);
  if (!Number.isFinite(Date.parse(text))) throw new Error("A API retornou uma data inválida.");
  return text;
}

function optionalText(value: unknown, max: number): string | null {
  return value === null || value === undefined ? null : readText(value, max);
}

function flag(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("A API retornou um indicador inválido.");
  return value;
}

function parseKpi(value: unknown): OrganizationMonthlyKpi {
  const item = record(value);
  return {
    organizationId: readId(item.organizationId), referenceMonth: month(item.referenceMonth),
    totalLiters: number(item.totalLiters), totalCost: readOptionalNumber(item.totalCost),
    previousMonthLiters: readOptionalNumber(item.previousMonthLiters), variationPct: readOptionalNumber(item.variationPct),
    projectedLiters: readOptionalNumber(item.projectedLiters), projectedCost: readOptionalNumber(item.projectedCost),
    unitsTotal: number(item.unitsTotal), unitsOnTarget: number(item.unitsOnTarget),
    unitsAttention: number(item.unitsAttention), unitsCritical: number(item.unitsCritical),
    avgGoalPct: readOptionalNumber(item.avgGoalPct), estimatedSavingsValue: readOptionalNumber(item.estimatedSavingsValue),
    savedLiters: readOptionalNumber(item.savedLiters), isCompleteMonth: flag(item.isCompleteMonth),
  };
}

function parsePropertyMonthly(value: unknown): PropertyMonthlyIndicator {
  const item = record(value);
  const status = readText(item.goalStatus, 12) as GoalStatus;
  if (!goalStatuses.includes(status)) throw new Error("A API retornou um status de meta inválido.");
  return {
    propertyId: readId(item.propertyId), propertyName: readText(item.propertyName, 100),
    organizationId: item.organizationId === null ? null : readId(item.organizationId),
    builtAreaM2: readOptionalNumber(item.builtAreaM2), referenceMonth: month(item.referenceMonth),
    totalLiters: number(item.totalLiters), totalCost: readOptionalNumber(item.totalCost), litersPerM2: readOptionalNumber(item.litersPerM2),
    variationPct: readOptionalNumber(item.variationPct), monthlyTargetLiters: readOptionalNumber(item.monthlyTargetLiters),
    dailyLimitLiters: readOptionalNumber(item.dailyLimitLiters), remainingLiters: readOptionalNumber(item.remainingLiters),
    goalPct: readOptionalNumber(item.goalPct), goalStatus: status,
    estimatedSavingsValue: number(item.estimatedSavingsValue), isCompleteMonth: flag(item.isCompleteMonth),
  };
}

function parseHourly(value: unknown): MonitoringHourlyPoint {
  const item = record(value);
  return {
    propertyId: readId(item.propertyId), propertyName: readText(item.propertyName, 100),
    windowMinutes: number(item.windowMinutes), readingHour: dateTime(item.readingHour),
    totalLiters: number(item.totalLiters), avgFlowLmin: readOptionalNumber(item.avgFlowLmin),
    readingsCount: number(item.readingsCount),
  };
}

function parseDevice(value: unknown): DeviceIndicator {
  const item = record(value);
  return {
    propertyId: readId(item.propertyId), propertyName: readText(item.propertyName, 100),
    regionName: optionalText(item.regionName, 60), deviceId: readText(item.deviceId, 100),
    isActive: flag(item.isActive), connectivityStatus: readText(item.connectivityStatus, 50),
    isOnline: flag(item.isOnline), batteryLevel: readOptionalNumber(item.batteryLevel), isLowBattery: flag(item.isLowBattery),
    wifiSignalRssi: optionalText(item.wifiSignalRssi, 20), firmwareVersion: optionalText(item.firmwareVersion, 50),
    lastPingAt: item.lastPingAt === null || item.lastPingAt === undefined ? null : dateTime(item.lastPingAt),
  };
}

function parseDeviceSummary(value: unknown): DeviceSummary {
  const item = record(value);
  return {
    organizationId: readId(item.organizationId), propertiesTotal: number(item.propertiesTotal),
    devicesPaired: number(item.devicesPaired), devicesOnline: number(item.devicesOnline),
    devicesLowBattery: number(item.devicesLowBattery), propertiesWithoutDevice: number(item.propertiesWithoutDevice),
  };
}

function parseLeak(value: unknown): LeakIndicator {
  const item = record(value);
  const status = readText(item.leakStatus, 12);
  if (status !== "ATIVO" && status !== "RESOLVIDO") throw new Error("A API retornou um status de vazamento inválido.");
  return {
    alertKey: number(item.alertKey), propertyId: readId(item.propertyId), propertyName: readText(item.propertyName, 100),
    deviceId: readText(item.deviceId, 100), severity: optionalText(item.severity, 10), triggeredAt: dateTime(item.triggeredAt),
    resolvedAt: item.resolvedAt === null || item.resolvedAt === undefined ? null : dateTime(item.resolvedAt),
    isActive: status === "ATIVO", durationMinutes: number(item.durationMinutes),
    estimatedLossLiters: number(item.estimatedLossLiters), estimatedLossCost: number(item.estimatedLossCost),
  };
}

function parseEsg(value: unknown): OrganizationEsg {
  const item = record(value);
  return {
    organizationId: readId(item.organizationId), referenceMonth: month(item.referenceMonth),
    savedLitersMonth: number(item.savedLitersMonth), savedLitersYearProjection: number(item.savedLitersYearProjection),
    tankTrucksEquivalent: number(item.tankTrucksEquivalent), familyMonthsEquivalent: number(item.familyMonthsEquivalent),
    unitsTotal: number(item.unitsTotal), unitsOnTarget: number(item.unitsOnTarget),
    avgGoalPct: readOptionalNumber(item.avgGoalPct), estimatedSavingsValue: number(item.estimatedSavingsValue),
    isCompleteMonth: flag(item.isCompleteMonth),
  };
}

function parseInvestmentImpact(value: unknown): InvestmentImpact {
  const item = record(value);
  return {
    scenarioId: readId(item.scenarioId), organizationId: readId(item.organizationId),
    baselineAnnualLiters: number(item.baselineAnnualLiters), savedLitersYear: number(item.savedLitersYear),
    tankTrucksEquivalent: number(item.tankTrucksEquivalent), familyMonthsEquivalent: number(item.familyMonthsEquivalent),
  };
}

async function load<T>(path: string, parse: (item: unknown) => T, signal: AbortSignal): Promise<T[]> {
  try {
    return readArray(await getJson(`${BASE}/${path}`, signal), parse);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou indicadores inválidos.");
  }
}

export const listOrganizationKpis = (signal: AbortSignal) => load("organization-kpi", parseKpi, signal);
export const listPropertyMonthly = (referenceMonth: string | null, signal: AbortSignal) =>
  load(`property-monthly${referenceMonth ? `?month=${encodeURIComponent(referenceMonth)}` : ""}`, parsePropertyMonthly, signal);
export const listMonitoringHourly = (hours: number, windowMinutes: number, signal: AbortSignal) =>
  load(`monitoring-hourly?hours=${hours}&windowMinutes=${windowMinutes}`, parseHourly, signal);
export const listDeviceIndicators = (signal: AbortSignal) => load("devices", parseDevice, signal);
export const listDeviceSummaries = (signal: AbortSignal) => load("devices/summary", parseDeviceSummary, signal);
export const listLeakIndicators = (signal: AbortSignal) => load("leaks", parseLeak, signal);
export const listOrganizationEsg = (signal: AbortSignal) => load("esg", parseEsg, signal);
export const listInvestmentImpact = (signal: AbortSignal) => load("investment-impact", parseInvestmentImpact, signal);
