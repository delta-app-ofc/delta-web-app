import { memo } from "react";
import searchIcon from "../../assets/installations/search.svg";
import styles from "./styles.module.css";

interface InstallationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const InstallationSearch = memo(function InstallationSearch({ value, onChange }: InstallationSearchProps) {
  return (
    <div className={styles.search} role="search">
      <label htmlFor="installation-search" className="sr-only">Buscar instalações por nome ou região</label>
      <img src={searchIcon} alt="" />
      <input id="installation-search" type="search" placeholder="Buscar por nome ou região"
        maxLength={100} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
});
