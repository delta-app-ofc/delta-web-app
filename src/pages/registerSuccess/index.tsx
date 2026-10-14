import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import successIcon from "../../assets/icones/cadastro-concluido.png";

import "./style.css";

interface RegisterSuccessPageProps {
  redirectDelay?: number;
}

export function RegisterSuccessPage({
  redirectDelay = 2500,
}: RegisterSuccessPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, redirectDelay);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, redirectDelay]);

  return (
    <main className="register-success" aria-live="polite">
      <h1>Cadastro concluído com sucesso!</h1>
      <img src={successIcon} alt="" className="register-success__icon" />
    </main>
  );
}
