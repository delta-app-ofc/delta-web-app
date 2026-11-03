import type { Address } from "./address";
import type { MonthlyConsumption } from "./consumption";
import type { Alert } from "./alerts";
import type { InstallationRecord } from "./installation";
import type { MonitoringHourlyPoint, PropertyMonthlyIndicator } from "./indicators";

export interface DailyConsumption {
  propertyId: number;
  fullDate: string;
  totalLiters: number;
  costValue: number | null;
}

export interface InstallationDetails {
  installation: InstallationRecord;
  address: Address | null;
  monthly: MonthlyConsumption[];
  daily: DailyConsumption[];
  indicators: PropertyMonthlyIndicator[];
  hourly: MonitoringHourlyPoint[];
  alerts: Alert[];
  warnings: string[];
}
