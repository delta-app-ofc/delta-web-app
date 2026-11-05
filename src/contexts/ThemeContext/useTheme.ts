import { useContext } from "react";
import { ThemeContext } from "./context";
import type { ThemeContextValue } from "./types";

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  return context;
}
