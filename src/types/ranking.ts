export type RankingCriterion = "perm2";

export type RankingItem = {
  id: string;
  name: string;
  position: number;
  value: number | null;
  variationPercent: number | null;
  areaM2: number | null;
  consumptionLiters: number | null;
};

export type RankingResult = {
  organizationId: number;
  period: string;
  criterion: RankingCriterion;
  items: RankingItem[];
  withoutArea: number[];
};

