export interface MonitoringInstallation {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
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
}
