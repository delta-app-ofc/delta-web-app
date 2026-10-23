import styles from "./styles.module.css";

interface UnavailableValueProps {
  variant?: "text" | "badge";
}

export function UnavailableValue({ variant = "text" }: UnavailableValueProps) {
  return <span className={variant === "badge" ? styles.badge : styles.text}>Não disponível</span>;
}
