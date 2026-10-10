import { LoadingLogo } from "../../components/LoadingLogo";

import "./style.css";

export function LoadingPage() {
  return (
    <main className="loading-page">
      <h1 className="loading-page__title">
        Estamos preparando tudo para você...
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