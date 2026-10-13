import { LoadingLogo } from "../../components/LoadingLogo";

import "./style.css";

interface LoadingPageProps {
  title?: string;
}

export function LoadingPage({
  title = "Estamos preparando tudo para você...",
}: LoadingPageProps) {
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