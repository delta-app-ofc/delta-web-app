import { AppLayout } from "../../components/AppLayout";
import { InstallationRegistrationForm } from "../../components/InstallationRegistrationForm";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInstallationWorkflow } from "../../services/installationSaving";

export default function InstallationRegistrationPage() {
  const navigate = useNavigate();
  const [save] = useState(createInstallationWorkflow);
  const controller = useRef<AbortController>();
  useEffect(() => () => controller.current?.abort(), []);
  return <AppLayout title="Cadastrar instalação" registration>
    <InstallationRegistrationForm apiConnected onSave={async data => {
      controller.current = new AbortController();
      const id = await save(data, controller.current.signal);
      navigate(`/instalacoes/${id}`, { replace: true, state: { saved: "created" } });
    }} />
  </AppLayout>;
}
