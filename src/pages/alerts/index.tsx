import { useCallback, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import attentionIcon from "../../assets/alerts/attention.png";
import criticalIcon from "../../assets/alerts/critical.png";
import informationIcon from "../../assets/alerts/information.png";
import { useAlerts } from "../../hooks/useAlerts";
import type { Severity } from "../../types/alerts";
import "./style.css";

interface SeverityFilter {
  id: Severity | null;
  label: string;
}

const PAGE_SIZE = 20;

const filters: readonly SeverityFilter[] = [
  { id: null, label: "Todos" },
  { id: "high", label: "Crítico" },
  { id: "medium", label: "Atenção" },
  { id: "low", label: "Informativo" },
];

const severityContent: Record<Severity, { icon: string; label: string; css: string }> = {
  high: { icon: criticalIcon, label: "Crítico", css: "critical" },
  medium: { icon: attentionIcon, label: "Atenção", css: "warning" },
  low: { icon: informationIcon, label: "Informativo", css: "information" },
};

export function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [page, setPage] = useState(0);
  const goToPreviousPage = useCallback(() => setPage((current) => Math.max(0, current - 1)), []);
  const goToNextPage = useCallback(() => setPage((current) => current + 1), []);
  const alerts = useAlerts({ severity, alertType: null, onlyActive: true, page, size: PAGE_SIZE });
  const loading = alerts.status === "loading";

  return (
    <main className="alerts-page">
      <div className="alerts-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="alerts-page__content" aria-labelledby="alerts-title">
        <header className="alerts-page__header">
          <h1 id="alerts-title">Alertas</h1>
        </header>

        <div className="alerts-page__toolbar">
          <div className="alerts-filters" role="group" aria-label="Filtrar alertas">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter.label}
                className={`alerts-filter ${severity === filter.id ? "alerts-filter--active" : ""}`}
                aria-pressed={severity === filter.id}
                onClick={() => { setSeverity(filter.id); setPage(0); }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <span className="alerts-page__count">{alerts.data.totalElements} alerta(s)</span>
        </div>

        {alerts.status === "error" && (
          <AsyncFeedback status="error" message="Não foi possível carregar os alertas. Tente novamente." onRetry={alerts.retry} />
        )}
        {loading && <AsyncFeedback status="loading" message="Carregando alertas…" />}

        {alerts.status === "success" && (
          <section className="alerts-page__panel" aria-label="Lista de alertas">
            {alerts.data.content.length === 0 ? (
              <p className="alerts-page__empty">Nenhum alerta nesta categoria.</p>
            ) : (
              <ul className="alerts-page__list">
                {alerts.data.content.map((alert) => {
                  const type = severityContent[alert.severity];
                  return (
                    <li key={alert.id}>
                      <span className={`alerts-page__icon alerts-page__icon--${type.css}`} aria-hidden="true">
                        <img src={type.icon} alt="" />
                      </span>
                      <div className="alerts-page__details">
                        <strong>{alert.title}</strong>
                        <span>{alert.message}</span>
                        <small>
                          {alert.propertyId ? `Unidade ${alert.propertyId}` : "Geral"} · {new Date(alert.triggeredAt).toLocaleString("pt-BR")}
                        </small>
                      </div>
                      <span className={`alerts-page__badge alerts-page__badge--${type.css}`}>{type.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <nav className="alerts-page__pagination" aria-label="Paginação de alertas">
          <button type="button" disabled={loading || page === 0} onClick={goToPreviousPage}>Anterior</button>
          <span aria-live="polite">Página {alerts.data.totalPages === 0 ? 0 : page + 1} de {alerts.data.totalPages}</span>
          <button type="button" disabled={loading || page + 1 >= alerts.data.totalPages} onClick={goToNextPage}>Próxima</button>
        </nav>
      </section>
    </main>
  );
}
