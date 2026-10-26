export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

const storageKey = "delta.session";
const listeners = new Set<() => void>();

function restoreSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null") as Partial<Session> | null;
    if (value && typeof value.accessToken === "string" && value.accessToken &&
        typeof value.refreshToken === "string" && value.refreshToken &&
        typeof value.expiresAt === "number" && typeof value.refreshExpiresAt === "number" &&
        value.refreshExpiresAt > Date.now()) return value as Session;
    sessionStorage.removeItem(storageKey);
  } catch { /* A sessão permanece em memória quando o armazenamento não está disponível. */ }
  return null;
}

let session = restoreSession();

export function getSession(): Session | null { return session; }

export function saveSession(value: Session | null): void {
  session = value;
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch { /* A indisponibilidade do armazenamento não impede o login. */ }
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
