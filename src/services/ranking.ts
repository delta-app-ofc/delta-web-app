import { getPublicJsonFrom } from "./http";
import type { RankingCriterion, RankingItem, RankingResult } from "../types/ranking";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return Array.isArray(record.items) ? record.items : [];
}

function normalizeItem(value: unknown, index: number): RankingItem {
  const record = asRecord(value);
  const position = readNumber(record.position ?? record.rank ?? record.colocacao) ?? index + 1;
  const valuePerArea = readNumber(record.value ?? record.score ?? record.consumptionPerArea ?? record.perm2);
  const name = readText(record.name ?? record.propertyName ?? record.installationName ?? record.property_name) ?? `Instalação ${position}`;
  return {
    id: String(record.id ?? record.propertyId ?? record.installationId ?? position),
    name,
    position,
    value: valuePerArea,
    variationPercent: readNumber(record.variationPercent ?? record.variation ?? record.deltaPercent),
    areaM2: readNumber(record.areaM2 ?? record.area ?? record.builtAreaM2),
    consumptionLiters: readNumber(record.consumptionLiters ?? record.consumption ?? record.totalLiters),
  };
}

export function normalizeRankingResponse(value: unknown, organizationId: number, period: string, criterion: RankingCriterion): RankingResult {
  const record = asRecord(value);
  return {
    organizationId,
    period,
    criterion,
    items: readItems(value).map(normalizeItem),
    withoutArea: Array.isArray(record.withoutArea) ? record.withoutArea.flatMap((item) => {
      const id = readNumber(item);
      return id === null ? [] : [id];
    }) : [],
  };
}

export async function getRanking(organizationId: number, period: string, criterion: RankingCriterion, limit: number, signal: AbortSignal): Promise<RankingResult> {
  const baseUrl = import.meta.env.VITE_RANKING_API_URL;
  const params = new URLSearchParams({ organizationId: String(organizationId), period, criterion, limit: String(limit) });
  const response = await getPublicJsonFrom(baseUrl, `/get-ranking?${params.toString()}`, signal);
  return normalizeRankingResponse(response, organizationId, period, criterion);
}

