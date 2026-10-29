import { createContext, useContext } from "react";
import type { Session } from "../../services/session";

export interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, signal: AbortSignal) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  return context;
}
