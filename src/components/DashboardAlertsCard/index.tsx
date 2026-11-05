import { Link } from "react-router-dom";
import { useAlerts } from "../../hooks/useAlerts";
import { AsyncFeedback } from "../AsyncFeedback";
import attentionIcon from "../../assets/alerts/attention.png";
import criticalIcon from "../../assets/alerts/critical.png";
import informationIcon from "../../assets/alerts/information.png";
import type { Severity } from "../../types/alerts";

const PREVIEW_SIZE = 4;
const QUERY = { severity: null, alertType: null, onlyActive: true, page: 0, size: PREVIEW_SIZE } as const;

const severityContent: Record<Severity, { icon: string; css: string }> = {
  high: { icon: criticalIcon, css: "critical" },
  medium: { icon: attentionIcon, css: "warning" },
  low: { icon: informationIcon, css: "information" },
};

export function DashboardAlertsCard() {
  const { data, status, retry } = useAlerts(QUERY);

  return (
    <article className="dashboard-card alerts-card">
      <header className="dashboard-card__header">
        <h2>Alertas ativos</h2>
        <Link className="dashboard-card__link" to="/alertas">Ver tudo</Link>
      </header>
      {status === "loading" && <AsyncFeedback status="loading" message="Carregando alertas…" />}
      {status === "error" && <AsyncFeedback status="error" message="Não foi possível carregar os alertas." onRetry={retry} />}
      {status === "success" && data.content.length === 0 && <p className="dashboard-unavailable">Nenhum alerta ativo.</p>}
      {status === "success" && data.content.length > 0 && (
        <ul className="alerts-card__list">
          {data.content.map((alert) => {
            const type = severityContent[alert.severity];
            return (
              <li key={alert.id}>
                <span className={`alerts-card__icon alerts-card__icon--${type.css}`} aria-hidden="true"><img src={type.icon} alt="" /></span>
                <div className="alerts-card__details">
                  <strong>{alert.title}</strong>
                  <small>{alert.message}</small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
