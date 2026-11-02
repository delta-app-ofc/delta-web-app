import { ApiError, getMongoJson, writeMongoJson } from "./http";
import { isRecord } from "../utils/apiValidation";

export type Severity = "high" | "medium" | "low";
export interface Alert { id: string; title: string; message: string; severity: Severity; propertyId: number | null; deviceId: string | null; triggeredAt: string; }
export interface AlertPage { content: Alert[]; totalElements: number; totalPages: number; }
export interface LeakSummary { litersPerDay: number; points: number; windowHours: number; }
function numeric(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new ApiError("Resposta inválida da API de alertas.");
  return value;
}
export function parseAlert(value: unknown): Alert {
  if (!isRecord(value) || typeof value._id !== "string" || !/^[a-f0-9]{24}$/i.test(value._id) ||
      typeof value.triggered_at !== "string" || !Number.isFinite(Date.parse(value.triggered_at))) throw new ApiError("Alerta inválido.");
  const severity = value.severity ?? "low";
  if (severity !== "high" && severity !== "medium" && severity !== "low") throw new ApiError("Severidade inválida.");
  return { id: value._id, title: typeof value.title === "string" ? value.title : "Alerta de consumo",
    message: typeof value.message === "string" ? value.message : "Consulte as evidências do alerta.", severity,
    propertyId: typeof value.property_id === "number" ? value.property_id : null,
    deviceId: typeof value.device_id === "string" ? value.device_id : null, triggeredAt: value.triggered_at };
}
export async function listAlerts(severity: Severity | null, page: number, signal: AbortSignal): Promise<AlertPage> {
  const query = new URLSearchParams({page: String(page), size: "20"});
  if (severity) query.set("severity", severity);
  const data = await getMongoJson(`/api/alerts?${query}`, signal);
  if (!isRecord(data) || !Array.isArray(data.content) || !isRecord(data.page)) throw new ApiError("Lista de alertas inválida.");
  return {content: data.content.map(parseAlert), totalElements: numeric(data.page.totalElements), totalPages: numeric(data.page.totalPages)};
}
export async function leakSummary(signal: AbortSignal): Promise<LeakSummary> {
  const data = await getMongoJson("/api/alerts/leak-summary", signal);
  if (!isRecord(data)) throw new ApiError("Resumo inválido.");
  return {litersPerDay: numeric(data.liters_per_day), points: numeric(data.points), windowHours: numeric(data.window_hours)};
}
export async function dismissAlert(id: string, signal: AbortSignal): Promise<void> {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError("Identificador inválido.");
  await writeMongoJson("PATCH", `/api/alerts/${id}/dismiss`, {}, signal);
}

export async function declareVisit(deviceId: string, until: string | null, signal: AbortSignal): Promise<void> {
  if (!deviceId || (until !== null && (!Number.isFinite(Date.parse(until)) || Date.parse(until) <= Date.now()))) throw new ApiError("Informe uma data futura válida.");
  await writeMongoJson("PUT", `/api/detection/devices/${encodeURIComponent(deviceId)}/visit`, {visit_until: until}, signal);
}

export interface EvidencePoint { time: string; liters: number; baseline: number | null; }
export async function listEvidence(deviceId: string, signal: AbortSignal): Promise<EvidencePoint[]> {
  const end=new Date(); const start=new Date(end.getTime()-86400000); const points: EvidencePoint[]=[];
  for(let page=0;page<10;page++) {
    const query=new URLSearchParams({start:start.toISOString(),end:end.toISOString(),page:String(page),size:"100"});
    const data=await getMongoJson(`/api/detection/devices/${encodeURIComponent(deviceId)}/evidence?${query}`,signal);
    if(!isRecord(data)||!Array.isArray(data.content)||!isRecord(data.page))throw new ApiError("Evidências inválidas.");
    for(const value of data.content) {
      if(!isRecord(value)||typeof value.window_started_at!=="string"||!Number.isFinite(Date.parse(value.window_started_at)))throw new ApiError("Janela inválida.");
      const evidence=isRecord(value.anomaly_evidence)?value.anomaly_evidence:{};
      points.push({time:value.window_started_at,liters:numeric(value.consumption_liters),baseline:typeof evidence.baseline_median==="number"?numeric(evidence.baseline_median):null});
    }
    if(page+1>=numeric(data.page.totalPages))return points.sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
  }
  throw new ApiError("Série acima do limite de consulta.");
}
