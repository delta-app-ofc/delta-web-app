import { AppLayout } from "../../components/AppLayout";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { InstallationMap } from "../../components/InstallationMap";
import { InstallationSearch } from "../../components/InstallationSearch";
import { InstallationSort } from "../../components/InstallationSort";
import { InstallationsTable } from "../../components/InstallationsTable";
import exportIcon from "../../assets/installations/export.svg";
import plusIcon from "../../assets/installations/plus.svg";
import { useInstallations } from "../../hooks/useInstallations";
import { usePdfExport } from "../../hooks/usePdfExport";
import { getMonthLabel } from "../../utils/installations";
import styles from "./styles.module.css";
import { useNavigate } from "react-router-dom";

export default function InstallationsPage() {
  const navigate = useNavigate();
  const { state, filters, installations, referenceMonth, totalCount, setQuery, setSort, retry } = useInstallations();
  const monthLabel = getMonthLabel(referenceMonth);
  const { exporting, message: exportMessage, exportPdf } = usePdfExport();

  function downloadReport() {
    if (state.status !== "success") return;
    void exportPdf(async () => {
      const { buildInstallationsPdf } = await import("../../services/installationPdf");
      const document = buildInstallationsPdf(installations, referenceMonth, filters, state.data.warnings);
      await document.save(`delta-instalacoes-${referenceMonth.slice(0, 7)}.pdf`, { returnPromise: true });
    });
  }

  return (
    <AppLayout title="Instalações">
      <div className={styles.toolbar}>
        <InstallationSearch value={filters.query} onChange={setQuery} />
        <div className={styles.actions}>
          <button className={styles.export} type="button" disabled={state.status !== "success" || exporting} onClick={downloadReport} aria-busy={exporting}><img src={exportIcon} alt="" />{exporting ? "Gerando PDF…" : "Exportar para PDF"}</button>
          <button className={styles.create} type="button" onClick={() => navigate("/instalacoes/cadastrar")}><img src={plusIcon} alt="" />Cadastrar instalação</button>
        </div>
      </div>
      {exportMessage && <p className={styles.exportMessage} role="status">{exportMessage}</p>}
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
