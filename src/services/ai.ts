import type { AiChatMessage, AiChatResponse, AiPlotlyFigure, AiSession } from "../types/ai";
import { isRecord, readArray, readText } from "../utils/apiValidation";
import { ApiError, getJsonFrom, postEventStreamFrom } from "./http";

const aiBaseUrl = () => import.meta.env.VITE_AI_API_URL?.trim();

function aiAuthError(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    throw new ApiError("A API de IA não reconheceu sua sessão. Verifique se o JWT da IA usa a mesma configuração de autenticação do login.", 401);
  }
  throw error;
}

function optionalDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return readText(value, 80);
}

function parseSession(value: unknown): AiSession {
  if (!isRecord(value) || typeof value.session_id !== "string") throw new Error("A API de IA retornou uma sessão inválida.");
  return {
    sessionId: value.session_id,
    title: typeof value.title === "string" ? value.title : "Nova conversa",
    preview: typeof value.preview === "string" ? value.preview : "",
    icon: typeof value.icon === "string" ? value.icon : "general",
    createdAt: optionalDate(value.created_at),
    updatedAt: optionalDate(value.updated_at),
    isOpen: value.is_open === true,
  };
}

function escapeChartText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function parseChartValue(value: unknown): string | number | null {
  if (value === null || (typeof value === "number" && Number.isFinite(value))) return value;
  if (typeof value === "string") return escapeChartText(readText(value, 120));
  throw new Error("A API retornou um valor de gráfico inválido.");
}

function parseChartData(value: unknown): AiPlotlyFigure | null {
  if (!isRecord(value) || !Array.isArray(value.data) || value.data.length === 0 || value.data.length > 8) return null;

  const data = value.data.map((item): Record<string, unknown> => {
    if (!isRecord(item) || (item.type !== "bar" && item.type !== "scatter")) throw new Error();
    const parsed: Record<string, unknown> = { type: item.type };
    for (const axis of ["x", "y"] as const) {
      const values = item[axis];
      if (!Array.isArray(values) || values.length > 500) throw new Error();
      parsed[axis] = values.map(parseChartValue);
    }
    if ((parsed.x as unknown[]).length !== (parsed.y as unknown[]).length) throw new Error();
    if (typeof item.name === "string") parsed.name = escapeChartText(readText(item.name, 120));
    if (typeof item.mode === "string" && /^(lines|markers|lines\+markers)$/.test(item.mode)) parsed.mode = item.mode;
    if (item.orientation === "h" || item.orientation === "v") parsed.orientation = item.orientation;
    if (Array.isArray(item.text) && item.text.length <= 500) parsed.text = item.text.map(parseChartValue);
    if (typeof item.textposition === "string" && /^(auto|inside|outside|none)$/.test(item.textposition)) parsed.textposition = item.textposition;
    if (isRecord(item.marker)) {
      const color = item.marker.color;
      const isColor = (candidate: unknown): candidate is string => typeof candidate === "string" && /^#[\da-f]{3,8}$/i.test(candidate);
      if (isColor(color) || (Array.isArray(color) && color.length <= 500 && color.every(isColor))) {
        parsed.marker = { color };
      }
    }
    if (isRecord(item.line) && typeof item.line.color === "string" && /^#[\da-f]{3,8}$/i.test(item.line.color)) {
      parsed.line = { color: item.line.color };
    }
    return parsed;
  });

  const layout: Record<string, unknown> = {};
  if (isRecord(value.layout)) {
    const title = value.layout.title;
    if (typeof title === "string") layout.title = { text: escapeChartText(readText(title, 160)) };
    else if (isRecord(title) && typeof title.text === "string") layout.title = { text: escapeChartText(readText(title.text, 160)) };
    if (typeof value.layout.height === "number" && Number.isFinite(value.layout.height)) {
      layout.height = Math.min(600, Math.max(220, value.layout.height));
    }
    for (const axisName of ["xaxis", "yaxis"] as const) {
      const axis = value.layout[axisName];
      if (!isRecord(axis)) continue;
      const axisLayout: Record<string, unknown> = {};
      const axisTitle = axis.title;
      if (typeof axisTitle === "string") axisLayout.title = { text: escapeChartText(readText(axisTitle, 100)) };
      else if (isRecord(axisTitle) && typeof axisTitle.text === "string") axisLayout.title = { text: escapeChartText(readText(axisTitle.text, 100)) };
      if (Object.keys(axisLayout).length > 0) layout[axisName] = axisLayout;
    }
  }
  return { data, layout };
}

function parseChat(value: unknown): AiChatResponse {
  if (!isRecord(value) || typeof value.response !== "string" || typeof value.session_id !== "string") throw new Error("A API de IA retornou uma resposta inválida.");
  let chartData: AiPlotlyFigure | null = null;
  try { chartData = parseChartData(value.chart_data); }
  catch { chartData = null; }
  return {
    response: value.response,
    sessionId: value.session_id,
    chartData,
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.filter((item): item is string => typeof item === "string").slice(0, 4) : [],
  };
}

export async function getAiSuggestions(signal: AbortSignal): Promise<string[]> {
  try {
    const value = await getJsonFrom(aiBaseUrl(), "/chat/suggestions", signal);
    if (!isRecord(value)) throw new Error();
    return readArray(value.suggestions, (item) => readText(item, 200)).slice(0, 4);
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    if (error instanceof ApiError) aiAuthError(error);
    throw new ApiError("A API de IA retornou sugestões inválidas.");
  }
}

export async function sendAiMessage(message: string, sessionId: string | null, signal: AbortSignal, onProgress: (label: string) => void): Promise<AiChatResponse> {
  try {
    return parseChat(await postEventStreamFrom(aiBaseUrl(), "/chat/stream", { message, ...(sessionId ? { session_id: sessionId } : {}) }, signal, (_stage, label) => {
      onProgress(readText(label, 200));
    }));
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    if (error instanceof ApiError) aiAuthError(error);
    throw new ApiError("A API de IA retornou uma resposta inválida.");
  }
}

export async function listAiSessions(limit: number, offset: number, signal: AbortSignal): Promise<{ sessions: AiSession[]; total: number }> {
  try {
    const value = await getJsonFrom(aiBaseUrl(), `/sessions?limit=${limit}&offset=${offset}`, signal);
    if (!isRecord(value)) throw new Error();
    return { sessions: readArray(value.sessions, parseSession), total: typeof value.total === "number" ? value.total : 0 };
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    if (error instanceof ApiError) aiAuthError(error);
    throw new ApiError("A API de IA retornou um histórico inválido.");
  }
}

export async function getAiSessionMessages(sessionId: string, signal: AbortSignal): Promise<AiChatMessage[]> {
  try {
    const value = await getJsonFrom(aiBaseUrl(), `/sessions/${encodeURIComponent(sessionId)}/messages`, signal);
    if (!isRecord(value)) throw new Error();
    return readArray(value.messages, (item) => {
      if (!isRecord(item) || (item.role !== "user" && item.role !== "bot")) throw new Error();
      return { role: item.role, content: readText(item.content, 10000), timestamp: optionalDate(item.timestamp) };
    });
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    if (error instanceof ApiError) aiAuthError(error);
    throw new ApiError("A API de IA retornou mensagens inválidas.");
  }
}
