import type { Address } from "./address";
import type { MonthlyConsumption } from "./consumption";
import type { InstallationRecord } from "./installation";

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
  warnings: string[];
}
