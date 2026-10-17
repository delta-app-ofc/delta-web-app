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
      <img className={styles.symbol} src={symbol} alt="" />
      <div className={styles.text}>
        <img className={styles.wordmark} src={wordmark} alt="" />
        <img className={styles.description} src={description} alt="" />
      </div>
    </div>
  );
}
