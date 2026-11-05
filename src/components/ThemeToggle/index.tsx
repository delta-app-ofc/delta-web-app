import { useTheme } from "../../contexts/ThemeContext/useTheme";
import styles from "./styles.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "claro" : "escuro";
  return (
    <button className={styles.toggle} type="button" onClick={toggleTheme} aria-label={`Ativar modo ${nextTheme}`} aria-pressed={theme === "light"}>
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      <span>Ativar modo {nextTheme}</span>
    </button>
  );
}
