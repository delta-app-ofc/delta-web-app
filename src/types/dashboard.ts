import type { CurrentUser } from "../services/auth";

export interface DashboardData {
  user: CurrentUser | null;
  referenceMonth: string;
  previousMonth: string;
  currentLiters: number | null;
  previousLiters: number | null;
  estimatedCost: number | null;
  warnings: string[];
}
