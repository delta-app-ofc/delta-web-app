export type Theme = "dark" | "light";

export interface ThemePreference {
  _versao: 1;
  theme: Theme;
}

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}
