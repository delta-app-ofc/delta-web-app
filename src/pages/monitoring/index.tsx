import { useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import consumptionIcon from "../../assets/monitoring/consumption.png";
import exportIcon from "../../assets/monitoring/export.png";
import flowIcon from "../../assets/monitoring/flow.png";
import installationsIcon from "../../assets/monitoring/installations.png";
import readingsIcon from "../../assets/monitoring/readings.png";

import "./style.css";

const indicators = [
  {
    id: "consumption",
    label: "Consumo (hoje)",
    value: "2.340 L",
    icon: consumptionIcon,
  },
  {
    id: "flow",
    label: "Vazão média",
    value: "3,4 L/min",
    icon: flowIcon,
  },
  {
    id: "readings",
    label: "Leituras recentes",
    value: "+42",
    detail: "nas últimas 2h",
    icon: readingsIcon,
  },
  {
    id: "installations",
    label: "Instalações",
    value: "5",
    detail: "todas online",
    icon: installationsIcon,
  },
] as const;

type MonitoringInterval = 5 | 10 | 15;

const monitoringIntervals: readonly MonitoringInterval[] = [5, 10, 15];

const chartDataByInterval: Record<MonitoringInterval, readonly { id: string; label: string; value: number }[]> = {
  5: [
    { id: "5-0800", label: "08:00", value: 67 },
    { id: "5-0805", label: "08:05", value: 80 },
    { id: "5-0810", label: "08:10", value: 52 },
    { id: "5-0815", label: "08:15", value: 82 },
    { id: "5-0820", label: "08:20", value: 100 },
    { id: "5-0825", label: "08:25", value: 88 },
    { id: "5-0830", label: "08:30", value: 67 },
    { id: "5-0835", label: "08:35", value: 80 },
    { id: "5-0840", label: "08:40", value: 52 },
    { id: "5-0845", label: "08:45", value: 82 },
    { id: "5-0850", label: "08:50", value: 100 },
    { id: "5-0855", label: "08:55", value: 88 },
  ],
  10: [
    { id: "10-0800", label: "08:00", value: 58 },
    { id: "10-0810", label: "08:10", value: 72 },
    { id: "10-0820", label: "08:20", value: 64 },
    { id: "10-0830", label: "08:30", value: 90 },
    { id: "10-0840", label: "08:40", value: 78 },
    { id: "10-0850", label: "08:50", value: 85 },
    { id: "10-0900", label: "09:00", value: 61 },
    { id: "10-0910", label: "09:10", value: 74 },
    { id: "10-0920", label: "09:20", value: 69 },
    { id: "10-0930", label: "09:30", value: 88 },
    { id: "10-0940", label: "09:40", value: 76 },
    { id: "10-0950", label: "09:50", value: 92 },
  ],
  15: [
    { id: "15-0800", label: "08:00", value: 46 },
    { id: "15-0815", label: "08:15", value: 68 },
    { id: "15-0830", label: "08:30", value: 79 },
    { id: "15-0845", label: "08:45", value: 57 },
    { id: "15-0900", label: "09:00", value: 86 },
    { id: "15-0915", label: "09:15", value: 73 },
    { id: "15-0930", label: "09:30", value: 95 },
    { id: "15-0945", label: "09:45", value: 81 },
    { id: "15-1000", label: "10:00", value: 65 },
    { id: "15-1015", label: "10:15", value: 89 },
    { id: "15-1030", label: "10:30", value: 77 },
    { id: "15-1045", label: "10:45", value: 84 },
  ],
};

const installations = [
  {
    id: "leopoldina",
    name: "Loja swift - Vila Leopoldina",
    location: "São Paulo - SP",
    consumption: "4.680 L",
    flow: "1,6 L/min",
    status: "Normal",
    statusType: "normal",
  },
  {
    id: "vila-romana",
    name: "Loja swift - Vila Romana",
    location: "São Paulo - SP",
    consumption: "8.420 L",
    flow: "2,6 L/min",
    status: "Atenção",
    statusType: "warning",
  },
  {
    id: "perdizes",
    name: "Loja swift - Perdizes",
    location: "São Paulo - SP",
    consumption: "6.150 L",
    flow: "3,8 L/min",
    status: "Normal",
    statusType: "normal",
  },
  {
    id: "pinheiros",
    name: "Loja swift - Pinheiros",
    location: "São Paulo - SP",
    consumption: "12.300 L",
    flow: "1,2 L/min",
    status: "Crítico",
    statusType: "critical",
  },
  {
    id: "moema",
    name: "Loja swift - Moema",
    location: "São Paulo - SP",
    consumption: "3.920 L",
    flow: "2,0 L/min",
    status: "Normal",
    statusType: "normal",
  },
] as const;

export function MonitoringPage() {
  const [monitoringInterval, setMonitoringInterval] = useState<MonitoringInterval>(5);
  const chartData = chartDataByInterval[monitoringInterval];

  return (
    <main className="monitoring-page">
      <div className="monitoring-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="monitoring-page__content" aria-labelledby="monitoring-title">
        <header className="monitoring-header">
          <div className="monitoring-header__heading">
            <h1 id="monitoring-title">Monitoramento</h1>
            <div className="monitoring-intervals" role="group" aria-label="Intervalo de monitoramento">
              {monitoringIntervals.map((interval) => (
                <button
                  className={`monitoring-interval ${monitoringInterval === interval ? "monitoring-interval--active" : ""}`}
                  type="button"
                  key={interval}
                  aria-pressed={monitoringInterval === interval}
                  onClick={() => setMonitoringInterval(interval)}
                >
                  {interval} min
                </button>
              ))}
            </div>
          </div>
          <button className="monitoring-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        <section className="monitoring-indicators" aria-label="Resumo do monitoramento">
          {indicators.map((indicator) => (
            <article className="monitoring-card monitoring-indicator" key={indicator.id}>
              <div className="monitoring-indicator__label">
                <img src={indicator.icon} alt="" />
                <span>{indicator.label}</span>
              </div>
              <div className="monitoring-indicator__value">
                <strong>{indicator.value}</strong>
                {"detail" in indicator && <small>{indicator.detail}</small>}
              </div>
            </article>
          ))}
        </section>

        <article className="monitoring-card monitoring-history">
          <h2>Evolução temporal · todas as instalações</h2>
          <div
            className="monitoring-chart"
            role="img"
            aria-label={`Evolução do consumo em intervalos de ${monitoringInterval} minutos`}
          >
            {chartData.map((period) => (
              <div className="monitoring-chart__column" key={period.id}>
                <div className="monitoring-chart__track">
                  <span style={{ height: `${period.value}%` }} />
                </div>
                <small>{period.label}</small>
              </div>
            ))}
          </div>
        </article>

        <section className="monitoring-status" aria-labelledby="monitoring-status-title">
          <h2 id="monitoring-status-title">Status por instalação</h2>

          <div className="monitoring-card monitoring-table-wrapper">
            <table className="monitoring-table">
              <caption className="sr-only">Consumo, vazão e status por instalação</caption>
              <thead>
                <tr>
                  <th scope="col">Instalação</th>
                  <th scope="col">Consumo mensal</th>
                  <th scope="col">Vazão atual</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => (
                  <tr key={installation.id}>
                    <td>
                      <strong>{installation.name}</strong>
                      <small>{installation.location}</small>
                    </td>
                    <td>{installation.consumption}</td>
                    <td>{installation.flow}</td>
                    <td>
                      <span className={`monitoring-status-badge monitoring-status-badge--${installation.statusType}`}>
                        {installation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
