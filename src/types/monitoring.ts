import type { ConsumptionSummary } from "./device";

export interface MonitoringInstallation {
  id: number;
  name: string;
  consumptionLiters: number | null;
  flowLpm: number | null;
  readingCount: number;
}

export interface MonitoringChartPoint {
  id: string;
  label: string;
  value: number;
  liters: number;
}

export interface MonitoringData {
  installations: MonitoringInstallation[];
  chart: MonitoringChartPoint[];
  totalLiters: number;
  averageFlowLpm: number | null;
  readingCount: number;
  warnings: string[];
  summaries: ConsumptionSummary[];
}
