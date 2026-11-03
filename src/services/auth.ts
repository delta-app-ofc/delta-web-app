import { ApiError, getJson, postPublicJson, writeJson } from "./http";
import { saveSession } from "./session";
import { isRecord, readId, readText } from "../utils/apiValidation";

export interface CurrentUser { id: number; name: string; email: string; phone?: string | null; birthDate?: string | null; }

function parseCurrentUser(data: unknown): CurrentUser {
  if (!isRecord(data)) throw new ApiError("O serviço retornou um perfil inválido.");
  const user: CurrentUser = {
    id: readId(data.id),
    name: readText(data.name, 100),
    email: readText(data.email, 255),
  };
  if ("phone" in data) user.phone = data.phone == null ? null : readText(data.phone, 15);
  if ("birthDate" in data) user.birthDate = data.birthDate == null ? null : readText(data.birthDate, 10);
  return user;
}

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
  return parseCurrentUser(data);
}

export async function updateCurrentUser(user: Omit<CurrentUser, "id">, signal: AbortSignal): Promise<CurrentUser> {
  const data = await writeJson("PUT", "/delta/auth/me", {
    name: user.name.trim(),
    email: user.email.trim(),
    phone: user.phone?.trim() || null,
    birthDate: user.birthDate,
  }, signal);
  return parseCurrentUser(data);
}
