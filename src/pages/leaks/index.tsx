import { useCallback, useMemo, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { EvidenceChart } from "../../components/EvidenceChart";
import { UnavailableValue } from "../../components/UnavailableValue";
import { VisitForm } from "../../components/VisitForm";
import exportIcon from "../../assets/leaks/export.png";
import impactIcon from "../../assets/leaks/impact.png";
import investigateIcon from "../../assets/leaks/investigate.png";
import leaksIcon from "../../assets/leaks/leaks.png";
import { useAlerts, useLeakSummary } from "../../hooks/useAlerts";
import { LEAK_ALERT_TYPE, type Alert } from "../../types/alerts";
import "./style.css";

const PAGE_SIZE = 20;

type OccurrenceStatus = "active" | "resolved";

const statusLabel: Record<OccurrenceStatus, string> = { active: "Ativo", resolved: "Resolvido" };

function occurrenceStatus(alert: Alert): OccurrenceStatus {
  return alert.resolvedAt ? "resolved" : "active";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

function formatDuration(alert: Alert): string {
  const end = alert.resolvedAt;
  if (!end) return "Em andamento";
  const minutes = Math.max(0, Math.round((Date.parse(end) - Date.parse(alert.triggeredAt)) / 60000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
}

export function LeaksPage() {
  const [historyPage, setHistoryPage] = useState(0);
  const goToPreviousPage = useCallback(() => setHistoryPage((current) => Math.max(0, current - 1)), []);
  const summary = useLeakSummary();
  const open = useAlerts({ severity: null, alertType: LEAK_ALERT_TYPE, onlyActive: true, page: 0, size: PAGE_SIZE });
  const history = useAlerts({ severity: null, alertType: LEAK_ALERT_TYPE, onlyActive: false, page: historyPage, size: PAGE_SIZE });
  const activeLeaks = useMemo(() => open.data.content.filter((alert) => occurrenceStatus(alert) === "active"), [open.data.content]);

  return (
    <main className="leaks-page">
      <div className="leaks-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="leaks-page__content" aria-labelledby="leaks-title">
        <header className="leaks-header">
          <h1 id="leaks-title">Vazamentos</h1>
          <button className="leaks-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        <section className="leaks-indicators" aria-label="Resumo dos vazamentos">
          <article className="leaks-card leaks-indicator">
            <div className="leaks-indicator__label"><img src={leaksIcon} alt="" /><span>Vazamentos ativos</span></div>
            <div className="leaks-indicator__value">
              {open.status === "success" ? <><strong>{activeLeaks.length}</strong><small>{activeLeaks.length === 1 ? "vazamento" : "vazamentos"}</small></> : <UnavailableValue />}
            </div>
          </article>
          <article className="leaks-card leaks-indicator">
            <div className="leaks-indicator__label"><img src={investigateIcon} alt="" /><span>Perda estimada (ativos)</span></div>
            <div className="leaks-indicator__value">
              {summary.summary ? <><strong>{summary.summary.lossLiters.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</strong><small>L perdidos · {summary.summary.activeCount} ativo(s)</small></> : <UnavailableValue />}
            </div>
          </article>
          <article className="leaks-card leaks-indicator">
            <div className="leaks-indicator__label"><img src={impactIcon} alt="" /><span>Impacto estimado (histórico)</span></div>
            <div className="leaks-indicator__value">
              {summary.summary ? <><strong>{summary.summary.lossCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><small>custo da água perdida</small></> : <UnavailableValue />}
            </div>
          </article>
        </section>
        {summary.status === "error" && <AsyncFeedback status="error" message="Não foi possível carregar o resumo de vazamentos." onRetry={summary.retry} />}

        <section className="leaks-overview" aria-label="Vazamentos ativos">
          {open.status === "loading" && <AsyncFeedback status="loading" message="Carregando vazamentos…" />}
          {open.status === "error" && <AsyncFeedback status="error" message="Não foi possível carregar os vazamentos ativos." onRetry={open.retry} />}
          {open.status === "success" && activeLeaks.length === 0 && <p role="status">Nenhum vazamento ativo no momento.</p>}
          {activeLeaks.map((leak) => (
            <article className="leaks-card leak-detail" key={leak.id}>
              <header className="leak-detail__header">
                <div>
                  <h2>{leak.title}</h2>
                  <p>{leak.message}</p>
                </div>
                <span className="leak-detail__status">Vazamento detectado</span>
              </header>
              <dl className="leak-detail__metrics">
                <div><dt>Identificado em</dt><dd>{formatDateTime(leak.triggeredAt)}</dd></div>
                <div><dt>Unidade</dt><dd>{leak.propertyId ? `Unidade ${leak.propertyId}` : "Geral"}</dd></div>
              </dl>
              {leak.deviceId && (
                <>
                  <EvidenceChart deviceId={leak.deviceId} />
                  <VisitForm deviceId={leak.deviceId} />
                </>
              )}
            </article>
          ))}
        </section>

        <section className="leaks-history" aria-labelledby="leaks-history-title">
          <h2 id="leaks-history-title">Histórico de ocorrências</h2>
          {history.status === "loading" && <AsyncFeedback status="loading" message="Carregando histórico…" />}
          {history.status === "error" && <AsyncFeedback status="error" message="Não foi possível carregar o histórico." onRetry={history.retry} />}
          {history.status === "success" && (
            history.data.content.length === 0 ? <p role="status">Nenhuma ocorrência registrada.</p> : (
              <div className="leaks-card leaks-table-wrapper">
                <table className="leaks-table">
                  <caption className="sr-only">Histórico de ocorrências de vazamento</caption>
                  <thead>
                    <tr>
                      <th scope="col">Ocorrência</th>
                      <th scope="col">Data</th>
                      <th scope="col">Duração</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.content.map((alert) => {
                      const status = occurrenceStatus(alert);
                      return (
                        <tr key={alert.id}>
                          <td><strong>{alert.title}</strong><small>{alert.propertyId ? `Unidade ${alert.propertyId}` : "Geral"}</small></td>
                          <td>{formatDateTime(alert.triggeredAt)}</td>
                          <td>{formatDuration(alert)}</td>
                          <td><span className={`leaks-status leaks-status--${status}`}>{statusLabel[status]}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
          <nav className="leaks-pagination" aria-label="Paginação do histórico">
            <button type="button" disabled={history.status === "loading" || historyPage === 0} onClick={goToPreviousPage}>Anterior</button>
            <span>Página {historyPage + 1}</span>
            <button type="button" disabled={history.status === "loading" || historyPage + 1 >= history.data.totalPages} onClick={() => setHistoryPage((current) => current + 1)}>Próxima</button>
          </nav>
        </section>
      </section>
    </main>
  );
}
