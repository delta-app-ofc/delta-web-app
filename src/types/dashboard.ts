import type { CurrentUser } from "../services/auth";
import type { WeatherData } from "./weather";

export interface DashboardData {
  user: CurrentUser | null;
  referenceMonth: string;
  previousMonth: string;
  currentLiters: number | null;
  previousLiters: number | null;
  variationPct: number | null;
  estimatedCost: number | null;
  projectedCost: number | null;
  weather: WeatherData | null;
  warnings: string[];
}
