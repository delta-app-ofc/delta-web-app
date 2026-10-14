import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { LoadingLogo } from "../../components/LoadingLogo";

import "./style.css";

interface LoadingPageProps {
  title?: string;
  redirectTo?: string;
  redirectDelay?: number;
}

export function LoadingPage({
  title = "Estamos preparando tudo para você...",
  redirectTo,
  redirectDelay = 2500,
}: LoadingPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!redirectTo) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, redirectDelay);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate, redirectDelay, redirectTo]);

  return (
    <main className="loading-page">
      <h1 className="loading-page__title">
        {title}
      </h1>

      <div className="loading-page__content">
        <LoadingLogo />

        <p className="loading-page__message">
          Aguarde alguns minutos
        </p>
      </div>
    </main>
  );
}
