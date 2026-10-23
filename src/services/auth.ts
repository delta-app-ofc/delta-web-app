import { ApiError, getJson, postPublicJson } from "./http";
import { saveSession } from "./session";
import { isRecord, readId, readText } from "../utils/apiValidation";

export interface CurrentUser { id: number; name: string; email: string; }

export async function login(email: string, password: string, signal: AbortSignal): Promise<void> {
  const data = await postPublicJson("/delta/auth/login", { email: email.trim(), password }, signal);
  signal.throwIfAborted();
  if (!isRecord(data) || typeof data.accessToken !== "string" || !data.accessToken.trim() ||
      typeof data.refreshToken !== "string" || !data.refreshToken.trim() ||
      typeof data.expiresIn !== "number" || !Number.isFinite(data.expiresIn) || data.expiresIn <= 0 ||
      typeof data.refreshExpiresIn !== "number" || !Number.isFinite(data.refreshExpiresIn) || data.refreshExpiresIn <= 0 ||
      (data.tokenType !== undefined && (typeof data.tokenType !== "string" || data.tokenType.toLowerCase() !== "bearer"))) {
    throw new ApiError("O serviço retornou uma sessão inválida. Tente novamente.");
  }
  const now = Date.now();
  saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken,
    expiresAt: now + data.expiresIn * 1000, refreshExpiresAt: now + data.refreshExpiresIn * 1000 });
}

export async function getCurrentUser(signal: AbortSignal): Promise<CurrentUser> {
  const data = await getJson("/delta/auth/me", signal);
  if (!isRecord(data)) throw new ApiError("O serviço retornou um perfil inválido.");
  return { id: readId(data.id), name: readText(data.name, 100), email: readText(data.email, 255) };
}
