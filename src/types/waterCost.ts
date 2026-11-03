export interface WaterCost {
  propertyId: number;
  regionId: number;
  consumptionM3: number | null;
  ratePerM3: number | null;
  estimatedCost: number;
  referenceDate: string | null;
}
