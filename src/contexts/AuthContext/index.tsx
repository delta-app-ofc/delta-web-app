import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { login } from "../../services/auth";
import { getSession, saveSession, subscribeSession } from "../../services/session";
import { AuthContext, type AuthContextValue } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSession);
  const signIn = useCallback((email: string, password: string, signal: AbortSignal) =>
    login(email, password, signal), []);
  const signOut = useCallback(() => saveSession(null), []);
  const value = useMemo<AuthContextValue>(() => ({
    session,
    isAuthenticated: Boolean(session),
    signIn,
    signOut,
  }), [session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
