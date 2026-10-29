import { Link } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import type { SidebarNavigationItem } from "../../components/AppSidebar";
import alertsIcon from "../../assets/installations/alerts.svg";
import dashboardIcon from "../../assets/installations/dashboard.svg";
import devicesIcon from "../../assets/installations/devices.svg";
import gluhIcon from "../../assets/installations/gluh.svg";
import goalsIcon from "../../assets/installations/goals.svg";
import installationsIcon from "../../assets/installations/installations.svg";
import investmentsIcon from "../../assets/installations/investments.svg";
import leaksIcon from "../../assets/installations/leaks.svg";
import monitoringIcon from "../../assets/installations/monitoring.svg";
import rankingIcon from "../../assets/installations/ranking.svg";
import settingsIcon from "../../assets/installations/menu-settings.svg";
import attentionIcon from "../../assets/dashboard/attention.png";
import climateIcon from "../../assets/dashboard/climate.png";
import criticalIcon from "../../assets/dashboard/critical.png";

import "./style.css";

const navigationItems: readonly SidebarNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, path: "/dashboard" },
  { id: "installations", label: "Instalações", icon: installationsIcon, path: "/instalacoes" },
  { id: "monitoring", label: "Monitoramento", icon: monitoringIcon, path: "/monitoramento" },
  { id: "alerts", label: "Alertas", icon: alertsIcon, path: "/alertas" },
  { id: "leaks", label: "Vazamentos", icon: leaksIcon, path: "/vazamentos" },
  { id: "ranking", label: "Ranking", icon: rankingIcon, path: "/ranking" },
  { id: "goals", label: "Metas", icon: goalsIcon, path: "/metas" },
  { id: "investments", label: "Investimentos", icon: investmentsIcon, path: "/investimentos" },
  { id: "devices", label: "Dispositivos", icon: devicesIcon, path: "/dispositivos" },
  { id: "gluh", label: "Gluh", icon: gluhIcon, path: "/gluh" },
  { id: "settings", label: "Configurações", icon: settingsIcon, path: "/configuracoes" },
];

const chartData = [
  { id: "apr", label: "Abr", value: 60 },
  { id: "may", label: "Mai", value: 72 },
  { id: "jun", label: "Jun", value: 46 },
  { id: "jul", label: "Jul", value: 74 },
  { id: "aug", label: "Ago", value: 100 },
  { id: "sep", label: "Set", value: 81 },
] as const;

const ranking = [
  { id: "leopoldina", name: "Loja swift - Vila Leopoldina", position: "Mais eficiente", value: "4.680 L" },
  { id: "moema", name: "Loja swift - Moema", position: "2º lugar", value: "3.920 L" },
  { id: "perdizes", name: "Loja swift - Perdizes", position: "3º lugar", value: "6.150 L" },
] as const;

export function DashboardPage() {
  return (
    <main className="dashboard-page">
      <div className="dashboard-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          navigationItems={navigationItems}
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="dashboard-page__content" aria-labelledby="dashboard-title">
        <header className="dashboard-header">
          <h1 id="dashboard-title">Dashboard</h1>
          <p>Visão Geral - Setembro/2026</p>
        </header>

        <section className="dashboard-metrics" aria-label="Indicadores gerais">
          <article className="dashboard-card metric-card">
            <div className="metric-card__label">
              <img src={leaksIcon} alt="" />
              <span>Consumo mensal</span>
            </div>
            <strong>35.470 L</strong>
            <small className="metric-card__change metric-card__change--negative">+8% vs mês anterior</small>
          </article>

          <article className="dashboard-card metric-card">
            <div className="metric-card__label">
              <img src={investmentsIcon} alt="" />
              <span>Custo estimado</span>
            </div>
            <strong>R$ 1.284,00</strong>
            <small className="metric-card__change metric-card__change--negative">+5,2%</small>
          </article>

          <article className="dashboard-card metric-card">
            <div className="metric-card__label">
              <img src={goalsIcon} alt="" />
              <span>Meta geral</span>
            </div>
            <strong>79%</strong>
            <small className="metric-card__change metric-card__change--positive">Dentro do esperado</small>
          </article>
        </section>

        <div className="dashboard-grid dashboard-grid--primary">
          <article className="dashboard-card history-card">
            <header className="dashboard-card__header">
              <h2>Evolução histórica</h2>
              <span>Últimos 6 meses · m³</span>
            </header>

            <div className="history-chart" role="img" aria-label="Gráfico do consumo dos últimos seis meses">
              {chartData.map((month) => (
                <div className="history-chart__column" key={month.id}>
                  <div className="history-chart__track">
                    <span style={{ height: `${month.value}%` }} />
                  </div>
                  <small>{month.label}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card ranking-card">
            <header className="dashboard-card__header">
              <h2>Ranking rápido</h2>
              <Link className="dashboard-card__link" to="/ranking">
                Ver tudo
              </Link>
            </header>

            <ol className="ranking-card__list">
              {ranking.map((item) => (
                <li key={item.id}>
                  <span className="ranking-card__icon" aria-hidden="true">
                    <img src={rankingIcon} alt="" />
                  </span>
                  <span className="ranking-card__details">
                    <strong>{item.name}</strong>
                    <small>{item.position}</small>
                  </span>
                  <span className="ranking-card__value">{item.value}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="dashboard-grid dashboard-grid--secondary">
          <article className="dashboard-card alerts-card">
            <header className="dashboard-card__header">
              <h2>Alertas ativos</h2>
              <Link className="dashboard-card__link" to="/alertas">
                Ver tudo
              </Link>
            </header>

            <ul className="alerts-card__list">
              <li>
                <span className="alerts-card__icon alerts-card__icon--critical" aria-hidden="true">
                  <img src={criticalIcon} alt="" />
                </span>
                <span className="alerts-card__details">
                  <strong>Possível vazamento</strong>
                  <small>Fluxo contínuo há 47 min · Vila Romana</small>
                </span>
                <span className="status-badge status-badge--critical">Crítico</span>
              </li>
              <li>
                <span className="alerts-card__icon alerts-card__icon--warning" aria-hidden="true">
                  <img src={attentionIcon} alt="" />
                </span>
                <span className="alerts-card__details">
                  <strong>Consumo elevado</strong>
                  <small>+22% vs. média histórica há 1h · Perdizes</small>
                </span>
                <span className="status-badge status-badge--warning">Atenção</span>
              </li>
            </ul>
          </article>

          <div className="dashboard-summary-stack">
            <article className="dashboard-card forecast-card">
              <h2>Previsão financeira</h2>
              <strong>R$ 1.284,00</strong>
              <small>Faixa esperada: R$ 1.180 - R$ 1.350</small>
              <div className="forecast-card__progress" role="progressbar" aria-label="Ciclo de faturamento decorrido" aria-valuemin={0} aria-valuemax={100} aria-valuenow={62}>
                <span />
              </div>
              <small>62% do ciclo de faturamento decorrido</small>
            </article>

            <article className="dashboard-card weather-card">
              <div>
                <h2>Clima agora</h2>
                <strong>24°C</strong>
                <small>Parcialmente nublado</small>
              </div>
              <div className="weather-card__condition">
                <img src={climateIcon} alt="Parcialmente nublado" width="42" height="42" />
                <small>68% chuva</small>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
