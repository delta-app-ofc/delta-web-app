import symbol from "../../assets/installations/brand-symbol.svg";
import wordmark from "../../assets/installations/brand-wordmark.svg";
import description from "../../assets/installations/brand-description.svg";
import styles from "./styles.module.css";

interface SidebarBrandProps {
  className?: string;
}

export function SidebarBrand({ className = "" }: SidebarBrandProps) {
  return (
    <div className={`${styles.brand} ${className}`} role="img" aria-label="Delta — Ambiente industrial">
      <img className={styles.symbol} src={symbol} alt="" width="50" height="50" />
      <div className={styles.text}>
        <img className={styles.wordmark} src={wordmark} alt="" width="77" height="20" />
        <img className={styles.description} src={description} alt="" width="95" height="8" />
      </div>
    </div>
  );
}
