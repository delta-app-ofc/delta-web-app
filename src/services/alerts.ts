import type { Alert, AlertPage, AlertQuery, LeakSummary, Severity } from "../types/alerts";
import { isRecord, readArray, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";
import { listLeakIndicators } from "./indicators";

function optionalDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = readText(value, 80);
  if (!Number.isFinite(Date.parse(text))) throw new ApiError("Data inválida na API de alertas.");
  return text;
}

const alertTitles: Record<string, string> = {
  vazamento_continuo: "Possível vazamento",
  fluxo_atipico: "Consumo acima do esperado",
  dispositivo_offline: "Dispositivo sem comunicação",
  leitura_impossivel: "Leitura impossível",
};

function parseSeverity(value: unknown): Severity {
  const severity = value ?? "low";
  if (severity !== "high" && severity !== "medium" && severity !== "low") throw new ApiError("Severidade inválida.");
  return severity;
}

// Converte uma linha da view dw.vw_ft_alert (camelCase) no tipo do front, rejeitando dados fora do contrato.
export function parseAlert(value: unknown): Alert {
  if (!isRecord(value)) throw new ApiError("Alerta inválido.");
  const triggeredAt = optionalDate(value.triggeredAt);
  const alertKey = readOptionalNumber(value.alertKey);
  if (!triggeredAt || alertKey === null) throw new ApiError("Alerta sem identificação ou data de disparo.");
  const alertType = readText(value.alertType, 80);
  const propertyName = typeof value.propertyName === "string" ? readText(value.propertyName, 100) : "Unidade";
  return {
    id: String(alertKey),
    title: alertTitles[alertType] ?? "Alerta de consumo",
    message: `${propertyName} · dispositivo ${typeof value.deviceId === "string" ? readText(value.deviceId, 100) : "não informado"}`,
    severity: parseSeverity(value.severity),
    alertType,
    propertyId: typeof value.propertyId === "number" ? value.propertyId : null,
    deviceId: typeof value.deviceId === "string" ? readText(value.deviceId, 100) : null,
    triggeredAt,
    resolvedAt: optionalDate(value.resolvedAt),
  };
}

// Alertas e resumo de vazamentos são indicadores: vêm das views SQL. A API devolve a lista completa
// (ordenada do mais recente) e a paginação é feita aqui.
export async function listAlerts(query: AlertQuery, signal: AbortSignal): Promise<AlertPage> {
  const params = new URLSearchParams();
  if (query.severity) params.set("severity", query.severity);
  if (query.alertType) params.set("alertType", query.alertType);
  if (query.onlyActive) params.set("onlyActive", "true");
  const all = readArray(await getJson(`/delta/analytics/alerts${params.size ? `?${params}` : ""}`, signal), parseAlert);
  const start = query.page * query.size;
  return { content: all.slice(start, start + query.size), totalElements: all.length, totalPages: Math.ceil(all.length / query.size) };
}

export async function getLeakSummary(signal: AbortSignal): Promise<LeakSummary> {
  const leaks = await listLeakIndicators(signal);
  const active = leaks.filter((leak) => leak.isActive);
  return {
    activeCount: active.length,
    lossLiters: active.reduce((total, leak) => total + leak.estimatedLossLiters, 0),
    lossCost: leaks.reduce((total, leak) => total + leak.estimatedLossCost, 0),
  };
}
