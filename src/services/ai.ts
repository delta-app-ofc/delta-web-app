import type { AiChatMessage, AiChatResponse, AiSession } from "../types/ai";
import { isRecord, readArray, readText } from "../utils/apiValidation";
import { ApiError, getJsonFrom, writeJsonFrom } from "./http";

const aiBaseUrl = () => import.meta.env.VITE_AI_API_URL?.trim();

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

function parseChat(value: unknown): AiChatResponse {
  if (!isRecord(value) || typeof value.response !== "string" || typeof value.session_id !== "string") throw new Error("A API de IA retornou uma resposta inválida.");
  return {
    response: value.response,
    sessionId: value.session_id,
    chartData: isRecord(value.chart_data) ? value.chart_data : null,
    suggestions: Array.isArray(value.suggestions) ? value.suggestions.filter((item): item is string => typeof item === "string").slice(0, 3) : [],
  };
}

export async function getAiSuggestions(signal: AbortSignal): Promise<string[]> {
  try {
    const value = await getJsonFrom(aiBaseUrl(), "/chat/suggestions", signal);
    if (!isRecord(value)) throw new Error();
    return readArray(value.suggestions, (item) => readText(item, 200)).slice(0, 3);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API de IA retornou sugestões inválidas.");
  }
}

export async function sendAiMessage(message: string, sessionId: string | null, signal: AbortSignal): Promise<AiChatResponse> {
  try {
    return parseChat(await writeJsonFrom(aiBaseUrl(), "POST", "/chat", { message, ...(sessionId ? { session_id: sessionId } : {}) }, signal));
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API de IA retornou uma resposta inválida.");
  }
}

export async function listAiSessions(limit: number, offset: number, signal: AbortSignal): Promise<{ sessions: AiSession[]; total: number }> {
  try {
    const value = await getJsonFrom(aiBaseUrl(), `/sessions?limit=${limit}&offset=${offset}`, signal);
    if (!isRecord(value)) throw new Error();
    return { sessions: readArray(value.sessions, parseSession), total: typeof value.total === "number" ? value.total : 0 };
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
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
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API de IA retornou mensagens inválidas.");
  }
}
