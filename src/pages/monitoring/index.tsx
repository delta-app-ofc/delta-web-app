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

const chartData = [
  { id: "08h", label: "08h", value: 67 },
  { id: "09h", label: "09h", value: 80 },
  { id: "10h", label: "10h", value: 52 },
  { id: "11h", label: "11h", value: 82 },
  { id: "12h", label: "12h", value: 100 },
  { id: "13h", label: "13h", value: 88 },
  { id: "14h", label: "14h", value: 67 },
  { id: "15h", label: "15h", value: 80 },
  { id: "16h", label: "16h", value: 52 },
  { id: "17h", label: "17h", value: 82 },
  { id: "18h", label: "18h", value: 100 },
  { id: "19h", label: "19h", value: 88 },
] as const;

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
  return (
    <main className="monitoring-page">
      <div className="monitoring-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="monitoring-page__content" aria-labelledby="monitoring-title">
        <header className="monitoring-header">
          <h1 id="monitoring-title">Monitoramento</h1>
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
          <div className="monitoring-chart" aria-label="Evolução do consumo das 08h às 19h">
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
