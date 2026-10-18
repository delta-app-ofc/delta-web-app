import { memo } from "react";
import type { InstallationSort as Sort } from "../../types/installation";
import styles from "./styles.module.css";

interface InstallationSortProps {
  value: Sort;
  onChange: (value: Sort) => void;
}

export const InstallationSort = memo(function InstallationSort({ value, onChange }: InstallationSortProps) {
  return (
    <div className={styles.sort} role="group" aria-label="Ordenar instalações em ordem decrescente">
      <span>Ordenar por:</span>
      <button type="button" aria-pressed={value === "consumption"} onClick={() => onChange("consumption")}>Consumo</button>
      <button type="button" aria-pressed={value === "litersPerM2"} onClick={() => onChange("litersPerM2")}>L/m²</button>
    </div>
  );
});
