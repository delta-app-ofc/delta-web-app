import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AsyncFeedback } from "../../components/AsyncFeedback";
import { LoadingPage } from "../loading";
import { useCompanyRegister } from "../../contexts/CompanyRegisterContext";
import { useCompanyRegistration } from "../../hooks/useCompanyRegistration";

export function CompanyBindingPage() {
  const navigate = useNavigate();
  const { companyData } = useCompanyRegister();
  const { state, retry } = useCompanyRegistration(companyData);

  useEffect(() => {
    if (state.status === "success") navigate("/cadastro/empresa/concluido", { replace: true });
  }, [state.status, navigate]);

  if (state.status === "error") {
    return (
      <main>
        <AsyncFeedback status="error" message={state.message} onRetry={retry} />
      </main>
    );
  }

  return <LoadingPage title="Vinculando dispositivo..." />;
}
