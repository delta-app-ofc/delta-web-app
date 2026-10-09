import logoLoading from "../../assets/logos/logo-loading.png";
import logoLoadingGota from "../../assets/logos/logo-loading-gota.png";

import "./style.css";

export function LoadingLogo() {
  return (
    <div
      className="loading-logo"
      role="status"
      aria-label="Carregando"
    >
      {/* Logo base */}
      <img
        src={logoLoading}
        alt=""
        className="loading-logo__base"
      />

      {/* Gota que será preenchida */}
      <img
        src={logoLoadingGota}
        alt=""
        className="loading-logo__gota"
      />
    </div>
  );
}