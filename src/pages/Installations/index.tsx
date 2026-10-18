import { AppLayout } from "../../components/AppLayout";
import { InstallationMap } from "../../components/InstallationMap";
import { InstallationSearch } from "../../components/InstallationSearch";
import { InstallationSort } from "../../components/InstallationSort";
import { InstallationsTable } from "../../components/InstallationsTable";
import exportIcon from "../../assets/installations/export.svg";
import plusIcon from "../../assets/installations/plus.svg";
import { useState } from "react";
import type { Installation, InstallationSort as InstallationSortValue } from "../../types/installation";
import { getMonthLabel, getCurrentReferenceMonth } from "../../utils/installations";
import styles from "./styles.module.css";

export default function InstallationsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<InstallationSortValue>("consumption");
  const filters = { query, sort };
  const installations: Installation[] = [];
  const referenceMonth = getCurrentReferenceMonth();
  const monthLabel = getMonthLabel(referenceMonth);

  return (
    <AppLayout title="Instalações">
      <div className={styles.toolbar}>
        <InstallationSearch value={filters.query} onChange={setQuery} />
        <div className={styles.actions}>
          <button className={styles.export} type="button" disabled title="Exportação para PDF será implementada posteriormente"><img src={exportIcon} alt="" />Exportar para PDF</button>
          <button className={styles.create} type="button" disabled title="Cadastro de instalação será desenvolvido em uma próxima etapa"><img src={plusIcon} alt="" />Cadastrar instalação</button>
        </div>
      </div>
      <div className={styles.filters}><InstallationSort value={filters.sort} onChange={setSort} /></div>
      <>
        <InstallationMap installations={installations} />
        <InstallationsTable installations={installations} monthLabel={monthLabel} isFiltered={filters.query.trim().length > 0} />
      </>
    </AppLayout>
  );
}
