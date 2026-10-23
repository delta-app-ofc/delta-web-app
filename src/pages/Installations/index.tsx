import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../components/AppLayout";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { InstallationMap } from "../../components/InstallationMap";
import { InstallationSearch } from "../../components/InstallationSearch";
import { InstallationSort } from "../../components/InstallationSort";
import { InstallationsTable } from "../../components/InstallationsTable";
import exportIcon from "../../assets/installations/export.svg";
import plusIcon from "../../assets/installations/plus.svg";
import { useInstallations } from "../../hooks/useInstallations";
import { getMonthLabel } from "../../utils/installations";
import styles from "./styles.module.css";

export default function InstallationsPage() {
  const navigate = useNavigate();
  const { state, filters, installations, referenceMonth, totalCount, setQuery, setSort, retry } = useInstallations();
  const monthLabel = getMonthLabel(referenceMonth);

  return (
    <AppLayout title="Instalações">
      <div className={styles.toolbar}>
        <InstallationSearch value={filters.query} onChange={setQuery} />
        <div className={styles.actions}>
          <button className={styles.export} type="button" disabled title="Exportação para PDF será implementada posteriormente"><img src={exportIcon} alt="" />Exportar para PDF</button>
          <button className={styles.create} type="button" onClick={() => navigate("/instalacoes/cadastrar")}><img src={plusIcon} alt="" />Cadastrar instalação</button>
        </div>
      </div>
      <div className={styles.filters}><InstallationSort value={filters.sort} onChange={setSort} /></div>
      {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando instalações e consumo mensal…" />}
      {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}
      {state.status === "success" && <>
        <div className={styles.summary} role="status" aria-live="polite">
          <p>{installations.length} de {totalCount} instalações · Consumo de {monthLabel}</p>
          <button type="button" onClick={retry}>Atualizar dados</button>
        </div>
        {state.data.warnings.length > 0 && <div className={styles.warning} role="alert">{state.data.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
        <InstallationMap installations={installations} />
        <InstallationsTable installations={installations} monthLabel={monthLabel} isFiltered={filters.query.trim().length > 0} />
      </>}
    </AppLayout>
  );
}
