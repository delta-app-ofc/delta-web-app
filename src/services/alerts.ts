import type { Alert, AlertPage, AlertQuery, EvidencePoint, LeakSummary, Severity } from "../types/alerts";
import { isRecord, readArray, readOptionalNumber, readText } from "../utils/apiValidation";
import { isValidDeviceId } from "../utils/alertsValidation";
import { ApiError, getJson, getJsonFrom, writeJsonFrom } from "./http";
import { listLeakIndicators } from "./indicators";

// Visita e evidências (ações de detecção) seguem na API Mongo com o JWT do login.
const mongoBaseUrl = () => import.meta.env.VITE_MONGO_API_URL?.trim();
const EVIDENCE_WINDOW_MS = 86_400_000;
const EVIDENCE_MAX_PAGES = 10;

function nonNegative(value: unknown, message: string): number {
  const number = readOptionalNumber(value);
  if (number === null || number < 0) throw new ApiError(message);
  return number;
}

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

/** Converte uma linha da view dw.vw_ft_alert (camelCase) no tipo do front, rejeitando dados fora do contrato. */
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
/** `until` já validado em ISO (src/utils/alertsValidation.ts); `null` cancela a visita. */
export async function declareVisit(deviceId: string, until: string | null, signal: AbortSignal): Promise<void> {
  if (!isValidDeviceId(deviceId)) throw new ApiError("Dispositivo inválido.");
  await writeJsonFrom(mongoBaseUrl(), "PUT", `/api/detection/devices/${encodeURIComponent(deviceId)}/visit`, { visit_until: until }, signal);
}

function parseEvidence(value: unknown): EvidencePoint {
  if (!isRecord(value)) throw new ApiError("Janela de evidência inválida.");
  const time = optionalDate(value.window_started_at);
  if (!time) throw new ApiError("Janela de evidência sem data.");
  const evidence = isRecord(value.anomaly_evidence) ? value.anomaly_evidence : {};
  const baseline = readOptionalNumber(evidence.baseline_median);
  return { time, liters: nonNegative(value.consumption_liters, "Consumo da janela inválido."), baseline: baseline === null || baseline < 0 ? null : baseline };
}

export async function listEvidence(deviceId: string, signal: AbortSignal, now = Date.now()): Promise<EvidencePoint[]> {
  if (!isValidDeviceId(deviceId)) throw new ApiError("Dispositivo inválido.");
  const points: EvidencePoint[] = [];
  for (let page = 0; page < EVIDENCE_MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ start: new Date(now - EVIDENCE_WINDOW_MS).toISOString(), end: new Date(now).toISOString(), page: String(page), size: "100" });
    const data = await getJsonFrom(mongoBaseUrl(), `/api/detection/devices/${encodeURIComponent(deviceId)}/evidence?${params}`, signal);
    if (!isRecord(data) || !isRecord(data.page)) throw new ApiError("Evidências inválidas.");
    points.push(...readArray(data.content, parseEvidence));
    if (page + 1 >= nonNegative(data.page.totalPages, "Total de páginas inválido.")) {
      return points.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
    }
  }
  throw new ApiError("A série de evidências excede o limite de consulta.");
}
