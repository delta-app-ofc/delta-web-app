export type GoalStatus = "OK" | "ATENCAO" | "CRITICO" | "SEM_META";

export interface OrganizationMonthlyKpi {
  organizationId: number;
  referenceMonth: string;
  totalLiters: number;
  totalCost: number | null;
  previousMonthLiters: number | null;
  variationPct: number | null;
  projectedLiters: number | null;
  projectedCost: number | null;
  unitsTotal: number;
  unitsOnTarget: number;
  unitsAttention: number;
  unitsCritical: number;
  avgGoalPct: number | null;
  estimatedSavingsValue: number | null;
  savedLiters: number | null;
  isCompleteMonth: boolean;
}

export interface PropertyMonthlyIndicator {
  propertyId: number;
  propertyName: string;
  organizationId: number | null;
  builtAreaM2: number | null;
  referenceMonth: string;
  totalLiters: number;
  totalCost: number | null;
  litersPerM2: number | null;
  variationPct: number | null;
  monthlyTargetLiters: number | null;
  dailyLimitLiters: number | null;
  remainingLiters: number | null;
  goalPct: number | null;
  goalStatus: GoalStatus;
  estimatedSavingsValue: number;
  isCompleteMonth: boolean;
}

export interface MonitoringHourlyPoint {
  propertyId: number;
  propertyName: string;
  windowMinutes: number;
  readingHour: string;
  totalLiters: number;
  avgFlowLmin: number | null;
  readingsCount: number;
}

export interface DeviceIndicator {
  propertyId: number;
  propertyName: string;
  regionName: string | null;
  deviceId: string;
  isActive: boolean;
  connectivityStatus: string;
  isOnline: boolean;
  batteryLevel: number | null;
  isLowBattery: boolean;
  wifiSignalRssi: string | null;
  firmwareVersion: string | null;
  lastPingAt: string | null;
}

export interface DeviceSummary {
  organizationId: number;
  propertiesTotal: number;
  devicesPaired: number;
  devicesOnline: number;
  devicesLowBattery: number;
  propertiesWithoutDevice: number;
}

export interface LeakIndicator {
  alertKey: number;
  propertyId: number;
  propertyName: string;
  deviceId: string;
  severity: string | null;
  triggeredAt: string;
  resolvedAt: string | null;
  isActive: boolean;
  durationMinutes: number;
  estimatedLossLiters: number;
  estimatedLossCost: number;
}

export interface InvestmentImpact {
  scenarioId: number;
  organizationId: number;
  baselineAnnualLiters: number;
  savedLitersYear: number;
  tankTrucksEquivalent: number;
  familyMonthsEquivalent: number;
}

export interface OrganizationEsg {
  organizationId: number;
  referenceMonth: string;
  savedLitersMonth: number;
  savedLitersYearProjection: number;
  tankTrucksEquivalent: number;
  familyMonthsEquivalent: number;
  unitsTotal: number;
  unitsOnTarget: number;
  avgGoalPct: number | null;
  estimatedSavingsValue: number;
  isCompleteMonth: boolean;
}
