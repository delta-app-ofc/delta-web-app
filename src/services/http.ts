import { getSession, saveSession } from "./session";
import type { Session } from "./session";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number | null = null) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string, configuredBaseUrl = import.meta.env.VITE_POSTGRES_API_URL?.trim()): string {
  const baseUrl = configuredBaseUrl;
  if (!baseUrl) throw new ApiError("O serviço ainda não foi configurado.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function request(path: string, options: RequestInit, configuredBaseUrl?: string): Promise<Response> {
  try {
    return await fetch(apiUrl(path, configuredBaseUrl), {
      ...options,
      headers: { Accept: "application/json", ...options.headers },
    });
  } catch (error: unknown) {
    if (options.signal?.aborted || error instanceof ApiError) throw error;
    throw new ApiError("Não foi possível acessar o serviço. Verifique sua conexão e tente novamente.");
  }
}


async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); }
  catch { throw new ApiError("O serviço retornou uma resposta inválida."); }
}

export async function postPublicJson(path: string, body: unknown, signal?: AbortSignal, errorMessages: Readonly<Record<number, string>> = {}, fallbackMessage = "Não foi possível entrar. Tente novamente."): Promise<unknown> {
  const response = await request(path, {
    method: "POST", signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = errorMessages[response.status] ?? (response.status === 401
      ? "E-mail ou senha inválidos, ou conta inativa."
      : response.status === 400
        ? "Confira o e-mail e a senha informados."
        : response.status === 429
          ? "Muitas tentativas. Aguarde um pouco e tente novamente."
          : fallbackMessage);
    throw new ApiError(message, response.status);
  }
  return readJson(response);
}

export async function getPublicJsonFrom(baseUrl: string | undefined, path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await request(path, { method: "GET", signal }, baseUrl);
  if (!response.ok) throw new ApiError("Não foi possível consultar a telemetria.", response.status);
  return readJson(response);
}

let pendingRefresh: { token: string; promise: Promise<void> } | null = null;

async function refreshSession(current: Session): Promise<void> {
  if (pendingRefresh?.token === current.refreshToken) return pendingRefresh.promise;
  const promise = (async () => {
    if (current.refreshExpiresAt <= Date.now()) {
      if (getSession() === current) saveSession(null);
      throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
    }
    const response = await request("/delta/auth/refresh", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!response.ok) {
      if ((response.status === 400 || response.status === 401 || response.status === 403) && getSession() === current) saveSession(null);
      throw new ApiError("Não foi possível renovar sua sessão. Tente novamente.", response.status);
    }
    const data = await readJson(response);
    if (!data || typeof data !== "object" || !("accessToken" in data) ||
        typeof data.accessToken !== "string" || !data.accessToken.trim() ||
        !("expiresIn" in data) || typeof data.expiresIn !== "number" ||
        !Number.isFinite(data.expiresIn) || data.expiresIn <= 0) {
      throw new ApiError("O serviço retornou uma sessão inválida.");
    }
    if (getSession() === current) saveSession({ ...current, accessToken: data.accessToken, expiresAt: Date.now() + data.expiresIn * 1000 });
  })();
  pendingRefresh = { token: current.refreshToken, promise };
  try { await promise; }
  finally { if (pendingRefresh?.promise === promise) pendingRefresh = null; }
}

async function authenticatedRequest(path: string, signal: AbortSignal, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown, configuredBaseUrl?: string, clearSessionOnUnauthorized = true, retryOnUnauthorized = true): Promise<unknown> {
  const initial = getSession();
  if (!initial) throw new ApiError("Entre na sua conta para continuar.", 401);
  if (initial.expiresAt <= Date.now() + 5000) await refreshSession(initial);
  signal.throwIfAborted();
  let current = getSession();
  if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  const options = {
    method, signal, body: body === undefined ? undefined : JSON.stringify(body),
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), Authorization: `Bearer ${current.accessToken}` },
  };
  let response = await request(path, options, configuredBaseUrl);
  if (response.status === 401 && retryOnUnauthorized) {
    // Outras consultas podem ter renovado o token enquanto esta estava em trânsito.
    if (getSession() === current) await refreshSession(current);
    signal.throwIfAborted();
    current = getSession();
    if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
    response = await request(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${current.accessToken}` } }, configuredBaseUrl);
  }
  if (!response.ok) {
    if (response.status === 401 && clearSessionOnUnauthorized && getSession() === current) saveSession(null);
    throw new ApiError(response.status === 401 ? "Sua sessão expirou. Entre novamente."
      : response.status === 403 ? "Sua conta não tem permissão para consultar estes dados."
      : (response.status === 400 || response.status === 409) && method !== "GET" ? await validationMessage(response)
      : "Não foi possível consultar os dados. Tente novamente.", response.status);
  }
  return response.status === 204 ? null : readJson(response);
}

// Em gravações recusadas por regra de negócio (400/409) a API explica o motivo em português; os demais erros não vazam detalhes.
async function validationMessage(response: Response): Promise<string> {
  const fallback = "Não foi possível salvar os dados. Confira as informações e tente novamente.";
  try {
    const body: unknown = await response.json();
    const message = typeof body === "object" && body !== null && "message" in body ? (body as { message: unknown }).message : null;
    if (typeof message !== "string") return fallback;
    const clean = Array.from(message).filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127).join("").trim().slice(0, 200);
    return clean || fallback;
  } catch { return fallback; }
}

export function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  return authenticatedRequest(path, signal, "GET");
}

export function getJsonFrom(baseUrl: string | undefined, path: string, signal: AbortSignal): Promise<unknown> {
  return authenticatedRequest(path, signal, "GET", undefined, baseUrl, false, true);
}

// Escritas só são repetidas após um 401; falhas de rede nunca repetem um POST automaticamente.
export function writeJson(method: "POST" | "PUT", path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  return authenticatedRequest(path, signal, method, body);
}

export async function deleteJson(path: string, signal: AbortSignal): Promise<void> {
  await authenticatedRequest(path, signal, "DELETE");
}

export function writeJsonFrom(baseUrl: string | undefined, method: "POST" | "PUT" | "PATCH", path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  return authenticatedRequest(path, signal, method, body, baseUrl, false, true);
}

export async function postEventStreamFrom(
  baseUrl: string | undefined,
  path: string,
  body: unknown,
  signal: AbortSignal,
  onStage: (stage: string, label: string) => void,
): Promise<unknown> {
  const initial = getSession();
  if (!initial) throw new ApiError("Entre na sua conta para continuar.", 401);
  if (initial.expiresAt <= Date.now() + 5000) await refreshSession(initial);
  signal.throwIfAborted();

  let current = getSession();
  if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  const requestStream = (token: string) => request(path, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }, baseUrl);

  let response = await requestStream(current.accessToken);
  if (response.status === 401) {
    if (getSession() === current) await refreshSession(current);
    signal.throwIfAborted();
    current = getSession();
    if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
    response = await requestStream(current.accessToken);
  }

  if (!response.ok || !response.body) {
    let message = "A API de IA não conseguiu iniciar a resposta.";
    try {
      const errorBody: unknown = await response.json();
      if (typeof errorBody === "object" && errorBody !== null && "detail" in errorBody && typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch { /* Mantém a mensagem segura quando a API não devolve JSON. */ }
    throw new ApiError(message, response.status);
  }

  let result: unknown;
  let receivedResult = false;
  let buffer = "";
  const decoder = new TextDecoder();
  const handleEvent = (block: string) => {
    if (!block.trim() || block.startsWith(":")) return;
    let eventName = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) eventName = line.slice(7);
      else if (line.startsWith("data: ")) data.push(line.slice(6));
    }
    if (data.length === 0) return;
    let parsed: unknown;
    try { parsed = JSON.parse(data.join("\n")) as unknown; }
    catch { throw new ApiError("A API de IA enviou um evento inválido."); }
    if (typeof parsed !== "object" || parsed === null) return;

    if (eventName === "stage" && "stage" in parsed && typeof parsed.stage === "string" && "label" in parsed && typeof parsed.label === "string") {
      onStage(parsed.stage, parsed.label);
    } else if (eventName === "result") {
      result = parsed;
      receivedResult = true;
    } else if (eventName === "error") {
      const detail = "detail" in parsed && typeof parsed.detail === "string" ? parsed.detail : "Não foi possível concluir a resposta da IA.";
      const status = "status" in parsed && typeof parsed.status === "number" ? parsed.status : 500;
      throw new ApiError(detail, status);
    }
  };

  const reader = response.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    buffer = (buffer + decoder.decode(value ?? new Uint8Array(), { stream: !done })).replace(/\r\n/g, "\n");
    let separator = buffer.indexOf("\n\n");
    while (separator >= 0) {
      handleEvent(buffer.slice(0, separator));
      buffer = buffer.slice(separator + 2);
      separator = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  handleEvent(buffer);
  if (!receivedResult) throw new ApiError("A IA encerrou o fluxo sem enviar uma resposta.");
  return result;
}
