import saoPauloMap from "../../assets/installations/sao-paulo.svg";
import type { Installation } from "../../types/installation";
import { isInSaoPaulo } from "../../utils/installations";
import { Link } from "react-router-dom";
import styles from "./styles.module.css";

interface InstallationMapProps {
  installations: Installation[];
}

const mapBounds = {
  west: -53.3,
  east: -44,
  north: -19.7,
  south: -25.4,
};

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function mapPosition(installation: Installation): { left: number; top: number } | null {
  if (installation.latitude === null || installation.longitude === null) return null;
  return {
    left: clamp((installation.longitude - mapBounds.west) / (mapBounds.east - mapBounds.west) * 100),
    top: clamp((mapBounds.north - installation.latitude) / (mapBounds.north - mapBounds.south) * 100),
  };
}

export function InstallationMap({ installations }: InstallationMapProps) {
  const saoPaulo = installations.filter(isInSaoPaulo);
  const cities = Array.from(new Set(saoPaulo.map((item) => item.city).filter((city): city is string => city !== null)));
  const positionedInstallations = saoPaulo.flatMap((installation) => {
    const position = mapPosition(installation);
    return position === null ? [] : [{ installation, position }];
  });
  return (
    <section className={styles.section} aria-labelledby="installation-map-title">
      <h2 id="installation-map-title">Mapa de Instalações</h2>
      <figure className={styles.card}>
        <div className={styles.canvas}>
          <div className={styles.mapLayer}>
            <img src={saoPauloMap} alt="Contorno do estado de São Paulo" />
            {positionedInstallations.map(({ installation, position }) => (
              <Link
                className={styles.pin}
                key={installation.id}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                to={`/instalacoes/${installation.id}`}
                aria-label={`Abrir instalação ${installation.name}`}
                title={`${installation.name}${installation.city ? ` · ${installation.city}` : ""}`}
              />
            ))}
          </div>
        </div>
        <figcaption className={styles.caption}>
          <span className={styles.legend}><span className={styles.dot} aria-hidden="true" />Instalações com localização</span>
          <span>{saoPaulo.length} {saoPaulo.length === 1 ? "instalação em São Paulo" : "instalações em São Paulo"}</span>
        </figcaption>
        {cities.length > 0 && <p className={styles.cities}>Cidades: {cities.join(" · ")}</p>}
        {positionedInstallations.length < saoPaulo.length && <p className={styles.cities}>Algumas instalações não possuem latitude e longitude cadastradas.</p>}
      </figure>
    </section>
  );
}
