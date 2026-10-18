import saoPauloMap from "../../assets/installations/sao-paulo.svg";
import type { Installation } from "../../types/installation";
import { isInSaoPaulo } from "../../utils/installations";
import styles from "./styles.module.css";

interface InstallationMapProps {
  installations: Installation[];
}

export function InstallationMap({ installations }: InstallationMapProps) {
  const saoPaulo = installations.filter(isInSaoPaulo);
  // O contorno do Figma é ilustrativo, sem projeção geográfica definida.
  // Exibimos as cidades no DOM sem inventar posições sobre esse desenho.
  const cities = Array.from(new Set(saoPaulo.map((item) => item.city).filter((city): city is string => city !== null)));
  return (
    <section className={styles.section} aria-labelledby="installation-map-title">
      <h2 id="installation-map-title">Mapa de Instalações</h2>
      <figure className={styles.card}>
        <div className={styles.canvas}><img src={saoPauloMap} alt="Contorno do estado de São Paulo" /></div>
        <figcaption className={styles.caption}>
          <span className={styles.legend}><span className={styles.dot} aria-hidden="true" />Status não disponível</span>
          <span>{saoPaulo.length} {saoPaulo.length === 1 ? "instalação em São Paulo" : "instalações em São Paulo"}</span>
        </figcaption>
        {cities.length > 0 && <p className={styles.cities}>Cidades: {cities.join(" · ")}</p>}
      </figure>
    </section>
  );
}
