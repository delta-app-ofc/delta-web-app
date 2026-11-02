import { useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { useMonitoring, type MonitoringInterval } from "../../hooks/useMonitoring";
import consumptionIcon from "../../assets/monitoring/consumption.png";
import exportIcon from "../../assets/monitoring/export.png";
import flowIcon from "../../assets/monitoring/flow.png";
import installationsIcon from "../../assets/monitoring/installations.png";
import readingsIcon from "../../assets/monitoring/readings.png";

import "./style.css";

const monitoringIntervals: readonly MonitoringInterval[] = [5, 10, 15];
const liters = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const flow = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function MonitoringPage() {
  const [monitoringInterval, setMonitoringInterval] = useState<MonitoringInterval>(5);
  const { state, retry } = useMonitoring(monitoringInterval);

  return (
    <main className="monitoring-page">
      <div className="monitoring-page__sidebar"><AppSidebar label="Navegação principal" profile={{ name: "Talita", email: "talita@delta.com.br" }} /></div>
      <section id="page-content" tabIndex={-1} className="monitoring-page__content" aria-labelledby="monitoring-title">
        <header className="monitoring-header"><div className="monitoring-header__heading"><h1 id="monitoring-title">Monitoramento</h1><div className="monitoring-intervals" role="group" aria-label="Intervalo de monitoramento">{monitoringIntervals.map((interval) => <button className={`monitoring-interval ${monitoringInterval === interval ? "monitoring-interval--active" : ""}`} type="button" key={interval} aria-pressed={monitoringInterval === interval} onClick={() => setMonitoringInterval(interval)}>{interval} min</button>)}</div></div><button className="monitoring-export" type="button" onClick={() => window.print()}><img src={exportIcon} alt="" /><span>Exportar para PDF</span></button></header>

        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando leituras de monitoramento…" />}
        {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}
        {state.status === "success" && <>
          {state.data.warnings.map((warning) => <p className="monitoring-data-warning" role="alert" key={warning}>{warning}</p>)}
          <section className="monitoring-indicators" aria-label="Resumo do monitoramento">
            {[{ id: "consumption", label: "Consumo na janela", value: `${liters.format(state.data.totalLiters)} L`, icon: consumptionIcon }, { id: "flow", label: "Vazão média", value: state.data.averageFlowLpm === null ? "Não informado" : `${flow.format(state.data.averageFlowLpm)} L/min`, icon: flowIcon }, { id: "readings", label: "Leituras recentes", value: String(state.data.readingCount), detail: `intervalos de ${monitoringInterval} min`, icon: readingsIcon }, { id: "installations", label: "Instalações", value: String(state.data.installations.filter((installation) => installation.readingCount > 0).length), detail: `de ${state.data.installations.length} com leitura`, icon: installationsIcon }].map((indicator) => <article className="monitoring-card monitoring-indicator" key={indicator.id}><div className="monitoring-indicator__label"><img src={indicator.icon} alt="" /><span>{indicator.label}</span></div><div className="monitoring-indicator__value"><strong>{indicator.value}</strong>{"detail" in indicator && <small>{indicator.detail}</small>}</div></article>)}
          </section>

          <article className="monitoring-card monitoring-history"><h2>Evolução temporal · todas as instalações</h2><div className="monitoring-chart" role="img" aria-label={`Evolução do consumo em intervalos de ${monitoringInterval} minutos`}>{state.data.chart.map((period) => <div className="monitoring-chart__column" key={period.id}><div className="monitoring-chart__track"><span style={{ height: `${period.value}%` }} /></div><small>{period.label}</small></div>)}</div>{state.data.chart.length === 0 && <p className="monitoring-empty">Nenhuma leitura disponível para este intervalo.</p>}</article>

          <section className="monitoring-status" aria-labelledby="monitoring-status-title"><h2 id="monitoring-status-title">Status por instalação</h2><div className="monitoring-card monitoring-table-wrapper"><table className="monitoring-table"><caption className="sr-only">Consumo, vazão e status por instalação</caption><thead><tr><th scope="col">Instalação</th><th scope="col">Consumo na janela</th><th scope="col">Vazão média</th><th scope="col">Status</th></tr></thead><tbody>{state.data.installations.map((installation) => { const hasReading = installation.readingCount > 0; return <tr key={installation.id}><td><strong>{installation.name}</strong><small>Dados agregados da telemetria Mongo</small></td><td>{installation.consumptionLiters === null ? "Não informado" : `${liters.format(installation.consumptionLiters)} L`}</td><td>{installation.flowLpm === null ? "Não informado" : `${flow.format(installation.flowLpm)} L/min`}</td><td><span className={`monitoring-status-badge monitoring-status-badge--${hasReading ? "normal" : "warning"}`}>{hasReading ? "Com leitura" : "Sem leitura"}</span></td></tr>; })}</tbody></table></div></section>
        </>}
      </section>
    </main>
  );
}
