import { Link, useLocation, useParams } from "react-router-dom";
import { isRecord } from "../../utils/apiValidation";
import { AppLayout } from "../../components/AppLayout";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { InstallationDetailsContent } from "../../components/InstallationDetailsContent";
import { useInstallationDetails } from "../../hooks/useInstallationDetails";
import styles from "./styles.module.css";

export default function InstallationDetailsPage() {
  const { installationId } = useParams();
  const { state, retry } = useInstallationDetails(installationId);
  const navigationState: unknown = useLocation().state;
  const saved = isRecord(navigationState) ? navigationState.saved : undefined;
  return <AppLayout title="Detalhe da instalação" details>
    {(saved === "created" || saved === "updated") && <p className={styles.success} role="status">{saved === "created" ? "Instalação cadastrada com sucesso." : "Alterações salvas com sucesso."}</p>}
    {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando instalação…" />}
    {state.status === "error" && <>
      <Link to="/instalacoes">← Voltar para instalações</Link>
      <AsyncFeedback status="error" message={state.message} onRetry={retry} />
    </>}
    {state.status === "success" && <InstallationDetailsContent key={installationId} data={state.data} onRetry={retry} />}
  </AppLayout>;
}
