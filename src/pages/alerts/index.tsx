import { useCallback, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { EvidenceChart } from "../../components/EvidenceChart";
import { VisitForm } from "../../components/VisitForm";
import attentionIcon from "../../assets/alerts/attention.png";
import criticalIcon from "../../assets/alerts/critical.png";
import informationIcon from "../../assets/alerts/information.png";
import { useAlerts, useLeakSummary } from "../../hooks/useAlerts";
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
  const alerts = useAlerts({ severity, alertType: null, includeDismissed: false, page, size: PAGE_SIZE }, goToPreviousPage);
  const leaks = useLeakSummary();
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

        {leaks.status === "success" && leaks.summary && (
          <section className="alerts-page__summary" aria-label="Resumo de vazamentos">
            <h2>Vazamentos identificados</h2>
            <p>{leaks.summary.litersPerDay.toLocaleString("pt-BR")} L/dia estimados · {leaks.summary.points} medidor(es)</p>
            <small>Alertas abertos e registros das últimas {leaks.summary.windowHours} horas. A projeção não é volume já desperdiçado.</small>
          </section>
        )}
        {leaks.status === "error" && (
          <AsyncFeedback status="error" message="Não foi possível carregar o resumo de vazamentos." onRetry={leaks.retry} />
        )}

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
          <span>{alerts.data.totalElements} alerta(s)</span>
        </div>

        {alerts.actionError && <p role="alert">{alerts.actionError}</p>}
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
                        {alert.deviceId && (
                          <>
                            <EvidenceChart deviceId={alert.deviceId} />
                            <VisitForm deviceId={alert.deviceId} />
                          </>
                        )}
                      </div>
                      <span className={`alerts-page__badge alerts-page__badge--${type.css}`}>{type.label}</span>
                      <button
                        className="alerts-page__dismiss"
                        type="button"
                        disabled={alerts.dismissing !== null}
                        aria-label={`Dispensar alerta: ${alert.title}`}
                        onClick={() => void alerts.dismiss(alert.id, alerts.data.content.length === 1 && page > 0)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <nav aria-label="Paginação de alertas">
          <button type="button" disabled={loading || page === 0} onClick={goToPreviousPage}>Anterior</button>
          <span>Página {page + 1}</span>
          <button type="button" disabled={loading || page + 1 >= alerts.data.totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button>
        </nav>
      </section>
    </main>
  );
}
