import type { RankingCriterion, RankingItem, RankingResult } from "../types/ranking";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { formatInstallationLabel } from "../utils/installations";
import { ApiError, getPublicJsonFrom } from "./http";

// Contrato da API Redis (GET /get-ranking): item { position, propertyId, name, areaM2,
// consumptionLiters, litersPerM2 } e withoutArea [{ propertyId, name }]. A API não envia variação.
function parseItem(value: unknown): RankingItem {
  if (!isRecord(value)) throw new Error("A API de ranking retornou um item inválido.");
  const propertyId = readId(value.propertyId);
  const name = typeof value.name === "string" ? formatInstallationLabel(readText(value.name, 200)) ?? "" : "";
  return {
    id: String(propertyId),
    name: name || `Instalação ${propertyId}`,
    position: readId(value.position),
    value: readOptionalNumber(value.litersPerM2),
    variationPercent: null,
    areaM2: readOptionalNumber(value.areaM2),
    consumptionLiters: readOptionalNumber(value.consumptionLiters),
  };
}

function parseWithoutAreaId(value: unknown): number {
  return readId(isRecord(value) ? value.propertyId : value);
}

export function normalizeRankingResponse(value: unknown, organizationId: number, period: string, criterion: RankingCriterion): RankingResult {
  if (!isRecord(value)) throw new Error("A API de ranking retornou uma resposta inválida.");
  return {
    organizationId,
    period,
    criterion,
    items: readArray(value.items, parseItem),
    withoutArea: value.withoutArea === undefined ? [] : readArray(value.withoutArea, parseWithoutAreaId),
  };
}

export async function getRanking(organizationId: number, period: string, criterion: RankingCriterion, limit: number, signal: AbortSignal): Promise<RankingResult> {
  const params = new URLSearchParams({ organizationId: String(organizationId), period, criterion, limit: String(limit) });
  try {
    const response = await getPublicJsonFrom(import.meta.env.VITE_RANKING_API_URL?.trim(), `/get-ranking?${params}`, signal);
    return normalizeRankingResponse(response, organizationId, period, criterion);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API de ranking retornou dados inválidos.");
  }
}
