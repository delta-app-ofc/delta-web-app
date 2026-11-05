import logoLoading from "../../assets/logos/logo-loading.png";
import logoLoadingGota from "../../assets/logos/logo-loading-gota.png";

import "./style.css";

interface LoadingLogoProps {
  size?: "default" | "compact";
}

export function LoadingLogo({ size = "default" }: LoadingLogoProps) {
  return (
    <div
      className={`loading-logo${size === "compact" ? " loading-logo--compact" : ""}`}
      role="status"
      aria-label="Carregando"
    >
      {/* Logo base */}
      <img
        src={logoLoading}
        alt=""
        width="180"
        height="180"
        className="loading-logo__base"
      />

      {/* Gota que será preenchida */}
      <img
        src={logoLoadingGota}
        alt=""
        width="180"
        height="180"
        className="loading-logo__gota"
      />
    </div>
  );
}
