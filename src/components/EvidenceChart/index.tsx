import { useId, useState } from "react";
import { useEvidence } from "../../hooks/useEvidence";
import { AsyncFeedback } from "../AsyncFeedback";
import type { EvidencePoint } from "../../types/alerts";
import styles from "./styles.module.css";

interface EvidenceChartProps {
  deviceId: string;
}

const WIDTH = 600;
const HEIGHT = 190;

function scalePoints(points: EvidencePoint[]) {
  const max = Math.max(1, ...points.flatMap((point) => [point.liters, point.baseline ?? 0]));
  const first = Date.parse(points[0].time);
  const span = Math.max(1, Date.parse(points[points.length - 1].time) - first);
  return {
    x: (point: EvidencePoint) => 20 + ((WIDTH - 40) * (Date.parse(point.time) - first)) / span,
    y: (value: number) => HEIGHT - 20 - ((HEIGHT - 40) * value) / max,
  };
}

const formatTime = (time: string) => new Date(time).toLocaleString("pt-BR");

export function EvidenceChart({ deviceId }: EvidenceChartProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const state = useEvidence(deviceId, open);

  return (
    <div className={styles.evidence}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((current) => !current)}>
        {open ? "Ocultar evidências" : "Ver evidências"}
      </button>
      <section id={panelId} hidden={!open} aria-label="Evidências das últimas 24 horas">
        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando evidências…" />}
        {state.status === "error" && <AsyncFeedback status="error" message="Não foi possível consultar as evidências." />}
        {state.status === "success" && state.points.length === 0 && <p role="status">Sem medições nas últimas 24 horas.</p>}
        {state.status === "success" && state.points.length > 0 && <EvidenceSeries points={state.points} />}
      </section>
    </div>
  );
}

function EvidenceSeries({ points }: { points: EvidencePoint[] }) {
  const { x, y } = scalePoints(points);
  return (
    <>
      <p>Litros por janela · azul: medido · laranja: baseline disponível</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Consumo por janela e baseline nas últimas 24 horas" className={styles.chart}>
        {points.map((point) => (
          <g key={point.time}>
            <circle cx={x(point)} cy={y(point.liters)} r="3" className={styles.measured}>
              <title>{formatTime(point.time)}: {point.liters} L</title>
            </circle>
            {point.baseline !== null && <circle cx={x(point)} cy={y(point.baseline)} r="2" className={styles.baseline} />}
          </g>
        ))}
      </svg>
      <details>
        <summary>Ver dados em tabela</summary>
        <table className={styles.table}>
          <caption className="sr-only">Medições das últimas 24 horas</caption>
          <thead><tr><th scope="col">Início da janela</th><th scope="col">Litros</th><th scope="col">Baseline (L)</th></tr></thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.time}>
                <td>{formatTime(point.time)}</td>
                <td>{point.liters}</td>
                <td>{point.baseline ?? "Indisponível"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p>Janelas ausentes não são preenchidas com zero. Baseline ausente não é estimado nesta tela.</p>
    </>
  );
}
