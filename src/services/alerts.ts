import type { Alert, AlertPage, AlertQuery, EvidencePoint, LeakSummary, Severity } from "../types/alerts";
import { isRecord, readArray, readOptionalNumber, readText } from "../utils/apiValidation";
import { isValidAlertId, isValidDeviceId } from "../utils/alertsValidation";
import { ApiError, getJsonFrom, writeJsonFrom } from "./http";

// Alertas e detecção exigem o JWT do login; a telemetria pública fica em mongoTelemetry.ts.
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

function parseSeverity(value: unknown): Severity {
  const severity = value ?? "low";
  if (severity !== "high" && severity !== "medium" && severity !== "low") throw new ApiError("Severidade inválida.");
  return severity;
}

/** Converte um alerta da API (snake_case) no tipo do front, rejeitando dados fora do contrato. */
export function parseAlert(value: unknown): Alert {
  if (!isRecord(value) || typeof value._id !== "string" || !isValidAlertId(value._id)) throw new ApiError("Alerta inválido.");
  const triggeredAt = optionalDate(value.triggered_at);
  if (!triggeredAt) throw new ApiError("Alerta sem data de disparo.");
  return {
    id: value._id,
    title: typeof value.title === "string" ? readText(value.title, 200) : "Alerta de consumo",
    message: typeof value.message === "string" ? readText(value.message, 1000) : "Consulte as evidências do alerta.",
    severity: parseSeverity(value.severity),
    alertType: typeof value.alert_type === "string" ? readText(value.alert_type, 80) : null,
    propertyId: typeof value.property_id === "number" ? value.property_id : null,
    deviceId: typeof value.device_id === "string" ? readText(value.device_id, 100) : null,
    triggeredAt,
    resolvedAt: optionalDate(value.resolved_at),
    dismissedAt: optionalDate(value.dismissed_at),
  };
}

export async function listAlerts(query: AlertQuery, signal: AbortSignal): Promise<AlertPage> {
  const params = new URLSearchParams({ page: String(query.page), size: String(query.size) });
  if (query.severity) params.set("severity", query.severity);
  if (query.includeDismissed) params.set("include_dismissed", "true");
  const data = await getJsonFrom(mongoBaseUrl(), `/api/alerts?${params}`, signal);
  if (!isRecord(data) || !isRecord(data.page)) throw new ApiError("Lista de alertas inválida.");
  const alerts = readArray(data.content, parseAlert);
  return {
    // A API não filtra por tipo; o filtro de vazamentos é feito aqui, na camada de serviço.
    content: query.alertType ? alerts.filter((alert) => alert.alertType === query.alertType) : alerts,
    totalElements: nonNegative(data.page.totalElements, "Total de alertas inválido."),
    totalPages: nonNegative(data.page.totalPages, "Total de páginas inválido."),
  };
}

export async function getLeakSummary(signal: AbortSignal): Promise<LeakSummary> {
  const data = await getJsonFrom(mongoBaseUrl(), "/api/alerts/leak-summary", signal);
  if (!isRecord(data)) throw new ApiError("Resumo de vazamentos inválido.");
  return {
    litersPerDay: nonNegative(data.liters_per_day, "Litros por dia inválidos."),
    points: nonNegative(data.points, "Quantidade de pontos inválida."),
    windowHours: nonNegative(data.window_hours, "Janela de análise inválida."),
  };
}

export async function dismissAlert(id: string, signal: AbortSignal): Promise<void> {
  if (!isValidAlertId(id)) throw new ApiError("Identificador de alerta inválido.");
  await writeJsonFrom(mongoBaseUrl(), "PATCH", `/api/alerts/${id}/dismiss`, {}, signal);
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
