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
  const positionedInstallations = saoPaulo.flatMap((installation) => {
    const position = mapPosition(installation);
    return position === null ? [] : [{ installation, position }];
  });
  const installationsWithoutCoordinates = saoPaulo.length - positionedInstallations.length;
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
              >
                <span className={styles.tooltip} aria-hidden="true">
                  <strong>{installation.name}</strong>
                  {installation.city && <span>{installation.city}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <figcaption className={styles.caption}>
          <span className={styles.legend}><span className={styles.dot} aria-hidden="true" />Instalações no mapa</span>
          <span>{positionedInstallations.length} {positionedInstallations.length === 1 ? "marcada" : "marcadas"}</span>
        </figcaption>
        {installationsWithoutCoordinates > 0 && (
          <p className={styles.cities}>
            {installationsWithoutCoordinates === 1
              ? "1 instalação sem coordenadas não aparece no mapa."
              : `${installationsWithoutCoordinates} instalações sem coordenadas não aparecem no mapa.`}
          </p>
        )}
      </figure>
    </section>
  );
}
