import { getSession, saveSession } from "./session";
import type { Session } from "./session";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number | null = null) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_POSTGRES_API_URL?.trim();
  if (!baseUrl) throw new ApiError("O serviço ainda não foi configurado.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function request(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(apiUrl(path), {
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

export async function postPublicJson(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const response = await request(path, {
    method: "POST", signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = response.status === 401
      ? "E-mail ou senha inválidos, ou conta inativa."
      : response.status === 400
        ? "Confira o e-mail e a senha informados."
        : response.status === 429
          ? "Muitas tentativas. Aguarde um pouco e tente novamente."
          : "Não foi possível entrar. Tente novamente.";
    throw new ApiError(message, response.status);
  }
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

export async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const initial = getSession();
  if (!initial) throw new ApiError("Entre na sua conta para continuar.", 401);
  if (initial.expiresAt <= Date.now() + 5000) await refreshSession(initial);
  signal.throwIfAborted();
  let current = getSession();
  if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  let response = await request(path, { signal, headers: { Authorization: `Bearer ${current.accessToken}` } });
  if (response.status === 401) {
    // Outras consultas podem ter renovado o token enquanto esta estava em trânsito.
    if (getSession() === current) await refreshSession(current);
    signal.throwIfAborted();
    current = getSession();
    if (!current) throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
    response = await request(path, { signal, headers: { Authorization: `Bearer ${current.accessToken}` } });
  }
  if (!response.ok) {
    if (response.status === 401 && getSession() === current) saveSession(null);
    throw new ApiError(response.status === 401 ? "Sua sessão expirou. Entre novamente."
      : response.status === 403 ? "Sua conta não tem permissão para consultar estes dados."
      : "Não foi possível consultar os dados. Tente novamente.", response.status);
  }
  return readJson(response);
}
