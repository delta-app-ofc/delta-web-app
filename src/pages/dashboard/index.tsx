import { Link } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import type { SidebarNavigationItem } from "../../components/AppSidebar";
import alertsIcon from "../../assets/installations/alerts.svg";
import { AsyncFeedback } from "../../components/AsyncFeedback";
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
import { useDashboard } from "../../hooks/useDashboard";
import { getMonthLabel } from "../../utils/installations";

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
  return value === null ? "—" : `${numberFormatter.format(value)} L`;
}

function formatCurrency(value: number | null): string {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatVariation(current: number | null, previous: number | null): string {
  if (current === null || previous === null || previous === 0) return "Variação indisponível";
  const variation = ((current - previous) / previous) * 100;
  return `${variation >= 0 ? "+" : ""}${numberFormatter.format(variation)}% vs mês anterior`;
}

export function DashboardPage() {
  const { state, retry } = useDashboard();

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
              <small className="metric-card__change metric-card__change--negative">{formatVariation(state.data.currentLiters, state.data.previousLiters)}</small>
            </article>
            <article className="dashboard-card metric-card">
              <div className="metric-card__label"><img src={investmentsIcon} alt="" /><span>Custo estimado</span></div>
              <strong>{formatCurrency(state.data.estimatedCost)}</strong>
              <small className="metric-card__change">Calculado pela tarifa vigente</small>
            </article>
            <article className="dashboard-card metric-card dashboard-card--unavailable">
              <div className="metric-card__label"><img src={goalsIcon} alt="" /><span>Meta geral</span></div>
              <strong>—</strong>
              <small className="metric-card__change">Não disponível na API</small>
            </article>
          </section>

          <div className="dashboard-grid dashboard-grid--primary">
            <article className="dashboard-card history-card">
              <header className="dashboard-card__header"><h2>Evolução histórica</h2><span>Meses disponíveis · litros</span></header>
              <div className="history-chart" role="img" aria-label="Consumo mensal atual e anterior">
                {[{ label: getMonthLabel(state.data.previousMonth), value: state.data.previousLiters }, { label: getMonthLabel(state.data.referenceMonth), value: state.data.currentLiters }].map((month) => {
                  const max = Math.max(state.data.currentLiters ?? 0, state.data.previousLiters ?? 0, 1);
                  return <div className="history-chart__column" key={month.label}><div className="history-chart__track"><span style={{ height: `${month.value === null ? 0 : month.value / max * 100}%` }} /></div><small>{month.label}</small></div>;
                })}
              </div>
              <p className="dashboard-card__note">O contrato atual fornece o mês corrente e o anterior para esta composição.</p>
            </article>

            <article className="dashboard-card ranking-card dashboard-card--unavailable">
              <header className="dashboard-card__header"><h2>Ranking rápido</h2><Link className="dashboard-card__link" to="/ranking">Ver tudo</Link></header>
              <p className="dashboard-unavailable">Aguardando dados da Ranking API.</p>
            </article>
          </div>

          <div className="dashboard-grid dashboard-grid--secondary">
            <article className="dashboard-card alerts-card dashboard-card--unavailable">
              <header className="dashboard-card__header"><h2>Alertas ativos</h2><Link className="dashboard-card__link" to="/alertas">Ver tudo</Link></header>
              <p className="dashboard-unavailable">Alertas ainda não estão disponíveis no contrato REST.</p>
            </article>
            <div className="dashboard-summary-stack">
              <article className="dashboard-card forecast-card dashboard-card--unavailable"><h2>Previsão financeira</h2><p className="dashboard-unavailable">Não disponível na API.</p></article>
              <article className="dashboard-card weather-card dashboard-card--unavailable"><div><h2>Clima agora</h2><p className="dashboard-unavailable">Não disponível na API.</p></div></article>
            </div>
          </div>
        </>}
      </section>
    </main>
  );
}
