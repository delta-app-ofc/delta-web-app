export interface CapexComparison {
  scenarioId: number;
  name: string;
  investmentValue: number | null;
  reductionPct: number | null;
  annualSavingsValue: number | null;
  paybackMonths: number | null;
  rankByPayback: number | null;
}
