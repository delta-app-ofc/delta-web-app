import { AppSidebar } from "../../components/AppSidebar";
import type { SidebarNavigationItem } from "../../components/AppSidebar";
import alertsIcon from "../../assets/installations/alerts.svg";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { DashboardAlertsCard } from "../../components/DashboardAlertsCard";
import { DashboardRankingCard } from "../../components/DashboardRankingCard";
import { WeatherIcon } from "../../components/WeatherIcon";
import dashboardIcon from "../../assets/installations/dashboard.svg";
import devicesIcon from "../../assets/installations/devices.svg";
import goalsIcon from "../../assets/installations/goals.svg";
import gluhIcon from "../../assets/installations/gluh.svg";
import installationsIcon from "../../assets/installations/installations.svg";
import investmentsIcon from "../../assets/installations/investments.svg";
import leaksIcon from "../../assets/installations/leaks.svg";
import monitoringIcon from "../../assets/installations/monitoring.svg";
import rankingIcon from "../../assets/installations/ranking.svg";
import settingsIcon from "../../assets/installations/menu-settings.svg";
import { useDashboard } from "../../hooks/useDashboard";
import { getMonthLabel, getShortMonthLabel } from "../../utils/installations";

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

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatLiters(value: number | null): string {
  return value === null ? "Sem medições" : `${numberFormatter.format(value)} L`;
}

function formatCurrency(value: number | null): string {
  return value === null ? "Sem dados de consumo" : currencyFormatter.format(value);
}

function formatTemperature(value: number | null): string {
  return value === null ? "—" : `${numberFormatter.format(value)} °C`;
}

function formatVariation(variation: number | null): string {
  if (variation === null) return "Variação indisponível";
  return `${variation >= 0 ? "+" : ""}${numberFormatter.format(variation)}% vs mês anterior`;
}

export function DashboardPage() {
  const { state, retry } = useDashboard();
  const maxMonthlyLiters = state.status === "success"
    ? Math.max(...state.data.monthlyHistory.map((month) => month.totalLiters ?? 0), 1)
    : 1;

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__sidebar">
        <AppSidebar label="Navegação principal" navigationItems={navigationItems} profile={state.status === "success" ? state.data.user ?? undefined : undefined} />
      </div>

      <section id="page-content" tabIndex={-1} className="dashboard-page__content" aria-labelledby="dashboard-title">
        <header className="dashboard-header">
          <h1 id="dashboard-title">Dashboard</h1>
          <p>{state.status === "success" ? `Visão Geral - ${getMonthLabel(state.data.referenceMonth)}` : "Visão geral"}</p>
        </header>

        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando dados do Dashboard…" />}
        {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}

        {state.status === "success" && <>
          {state.data.warnings.length > 0 && <div className="dashboard-warning" role="alert">{state.data.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}

          <section className="dashboard-metrics" aria-label="Indicadores gerais">
            <article className="dashboard-card metric-card">
              <div className="metric-card__label"><img src={leaksIcon} alt="" /><span>Consumo mensal</span></div>
              <strong>{formatLiters(state.data.currentLiters)}</strong>
              <small className="metric-card__change metric-card__change--negative">{formatVariation(state.data.variationPct)}</small>
            </article>
            <article className="dashboard-card metric-card">
              <div className="metric-card__label"><img src={investmentsIcon} alt="" /><span>Custo estimado</span></div>
              <strong>{formatCurrency(state.data.estimatedCost)}</strong>
              <small className="metric-card__change">Calculado pela tarifa vigente</small>
            </article>
          </section>

          <div className="dashboard-grid dashboard-grid--primary">
            <article className="dashboard-card history-card">
              <header className="dashboard-card__header"><h2>Evolução histórica</h2><span>Últimos 6 meses · litros</span></header>
              <div className="history-chart" role="img" aria-label="Consumo mensal da organização nos últimos seis meses">
                {state.data.monthlyHistory.map((month) => {
                  const hasData = month.totalLiters !== null;
                  return <div className="history-chart__column" key={month.referenceMonth}>
                    <div className={`history-chart__track${hasData ? "" : " history-chart__track--empty"}`} title={hasData ? `${getShortMonthLabel(month.referenceMonth)}: ${numberFormatter.format(month.totalLiters ?? 0)} L` : `${getShortMonthLabel(month.referenceMonth)}: sem dados`}>
                      {hasData && <span style={{ height: `${(month.totalLiters ?? 0) / maxMonthlyLiters * 100}%` }} />}
                    </div>
                    <small>{getShortMonthLabel(month.referenceMonth)}</small>
                  </div>;
                })}
              </div>
              <p className="dashboard-card__note">Cada coluna mostra o consumo consolidado; meses sem registros ficam vazios.</p>
            </article>

            <DashboardRankingCard />
          </div>

          <div className="dashboard-grid dashboard-grid--secondary">
            <DashboardAlertsCard />
            <div className="dashboard-summary-stack">
              <article className="dashboard-card forecast-card" aria-labelledby="dashboard-financial-forecast">
                <h2 id="dashboard-financial-forecast">Previsão financeira</h2>
                <strong>{formatCurrency(state.data.projectedCost)}</strong>
                <small>Estimativa para o próximo mês, baseada no consumo recente e no custo médio da água.</small>
              </article>
              <article className={`dashboard-card weather-card${state.data.weather ? "" : " dashboard-card--unavailable"}`}>
                {state.data.weather ? <>
                  <div className="weather-card__main">
                    <h2>Clima agora</h2>
                    <strong>{formatTemperature(state.data.weather.temperatureC)}</strong>
                    <small>{state.data.weather.condition} · {state.data.weather.city}</small>
                  </div>
                  <div className="weather-card__condition">
                    <WeatherIcon code={state.data.weather.weatherCode} />
                    {state.data.weather.precipitationMm !== null && <small>{numberFormatter.format(state.data.weather.precipitationMm)} mm de chuva hoje</small>}
                  </div>
                </> : <div className="weather-card__unavailable"><h2>Clima agora</h2><p className="dashboard-unavailable">Localização sem coordenadas ou clima indisponível.</p></div>}
              </article>
            </div>
          </div>
        </>}
      </section>
    </main>
  );
}
