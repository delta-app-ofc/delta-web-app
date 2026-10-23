import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { InstallationRegistrationForm } from "../../components/InstallationRegistrationForm";
import { useInstallationEditing } from "../../hooks/useInstallationEditing";
import { createInstallationEditor } from "../../services/installationSaving";
import type { InstallationEditingData } from "../../services/installationEditing";
import styles from "./styles.module.css";

function EditingForm({ data }: { data: InstallationEditingData }) {
  const navigate = useNavigate();
  const [save] = useState(() => createInstallationEditor(data.id, data.formData));
  const controller = useRef<AbortController>();
  useEffect(() => () => controller.current?.abort(), []);
  return <InstallationRegistrationForm mode="edit" apiConnected initialData={data.formData} installationName={data.name} returnTo={`/instalacoes/${data.id}`} onSave={async form => {
    controller.current = new AbortController();
    const id = await save(form, controller.current.signal);
    navigate(`/instalacoes/${id}`, { replace: true, state: { saved: "updated" } });
  }} />;
}

export default function InstallationEditingPage() {
  const { installationId } = useParams();
  const { state, retry } = useInstallationEditing(installationId);
  return <AppLayout title="Editar instalação" registration>
    {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando dados da instalação…" />}
    {state.status === "error" && <>
      <Link className={styles.back} to="/instalacoes">← Voltar para instalações</Link>
      <AsyncFeedback status="error" message={state.message} onRetry={retry} />
    </>}
    {state.status === "success" && <>
      {state.data.warnings.length > 0 && <p className={styles.warning} role="status">{state.data.warnings.join(" ")}</p>}
      <EditingForm key={state.data.id} data={state.data} />
    </>}
  </AppLayout>;
}
