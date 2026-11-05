import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "dark" | "light";
interface ThemePreference { _versao: 1; theme: Theme; }
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; }

const STORAGE_KEY = "delta-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (typeof saved === "object" && saved !== null && "_versao" in saved && saved._versao === 1 &&
      "theme" in saved && (saved.theme === "light" || saved.theme === "dark")) return saved.theme;
  } catch { /* Preferência inválida é descartada e o tema escuro padrão é usado. */ }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const preference: ThemePreference = { _versao: 1, theme };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preference)); } catch { /* O tema segue ativo nesta sessão. */ }
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme((current) => current === "dark" ? "light" : "dark"), []);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return context;
}
