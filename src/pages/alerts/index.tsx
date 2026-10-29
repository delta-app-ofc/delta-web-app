import { useMemo, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import attentionIcon from "../../assets/alerts/attention.png";
import criticalIcon from "../../assets/alerts/critical.png";
import informationIcon from "../../assets/alerts/information.png";

import "./style.css";

type AlertType = "critical" | "warning" | "information";
type AlertFilter = "all" | AlertType;

interface AlertItem {
  id: string;
  title: string;
  description: string;
  context: string;
  type: AlertType;
}

const alertTypeContent: Record<AlertType, { icon: string; label: string }> = {
  critical: { icon: criticalIcon, label: "Crítico" },
  warning: { icon: attentionIcon, label: "Atenção" },
  information: { icon: informationIcon, label: "Informativo" },
};

const filterOptions: readonly { id: AlertFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "critical", label: "Crítico" },
  { id: "warning", label: "Atenção" },
  { id: "information", label: "Informativo" },
];

const initialAlerts: readonly AlertItem[] = [
  {
    id: "possible-leak",
    title: "Possível vazamento",
    description: "Fluxo contínuo há 47 min sem uso previsto",
    context: "Pinheiros · há 12 min",
    type: "critical",
  },
  {
    id: "limit-exceeded",
    title: "Limite ultrapassado",
    description: "Consumo mensal excedeu a meta em 12%",
    context: "Pinheiros · há 40 min",
    type: "critical",
  },
  {
    id: "high-consumption",
    title: "Consumo acima do esperado",
    description: "+22% vs. média histórica das últimas 4 semanas",
    context: "Vila Romana · há 40 min",
    type: "warning",
  },
  {
    id: "unusual-pattern",
    title: "Mudança anormal de padrão",
    description: "Pico de consumo fora do horário comercial",
    context: "Perdizes · há 3h",
    type: "warning",
  },
  {
    id: "goal-forecast",
    title: "Previsão de ultrapassagem de meta",
    description: "Ritmo atual projeta 108% da meta até o fim do mês",
    context: "Vila Romana · há 5h",
    type: "warning",
  },
  {
    id: "updated-rate",
    title: "Tarifa atualizada",
    description: "Concessionária reajustou tarifa comercial em 4,8%",
    context: "Geral · ontem",
    type: "information",
  },
  {
    id: "bill-available",
    title: "Previsão da conta disponível",
    description: "Estimativa de Setembro já pode ser consultada",
    context: "Geral · ontem",
    type: "information",
  },
];

export function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("all");
  const [alerts, setAlerts] = useState<readonly AlertItem[]>(initialAlerts);

  const visibleAlerts = useMemo(
    () => activeFilter === "all" ? alerts : alerts.filter((alert) => alert.type === activeFilter),
    [activeFilter, alerts],
  );

  function dismissAlert(alertId: string) {
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));
  }

  return (
    <main className="alerts-page">
      <div className="alerts-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="alerts-page__content" aria-labelledby="alerts-title">
        <header className="alerts-page__header">
          <h1 id="alerts-title">Alertas</h1>
        </header>

        <div className="alerts-page__toolbar">
          <div className="alerts-filters" role="group" aria-label="Filtrar alertas">
            {filterOptions.map((filter) => (
              <button
                className={`alerts-filter ${activeFilter === filter.id ? "alerts-filter--active" : ""}`}
                type="button"
                key={filter.id}
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <span className="alerts-page__count">
            {alerts.length} {alerts.length === 1 ? "alerta ativo" : "alertas ativos"}
          </span>
        </div>

        <section className="alerts-page__panel" aria-live="polite">
          {visibleAlerts.length > 0 ? (
            <ul className="alerts-page__list">
              {visibleAlerts.map((alert) => {
                const typeContent = alertTypeContent[alert.type];

                return (
                  <li key={alert.id}>
                    <span className={`alerts-page__icon alerts-page__icon--${alert.type}`} aria-hidden="true">
                      <img src={typeContent.icon} alt="" />
                    </span>

                    <div className="alerts-page__details">
                      <strong>{alert.title}</strong>
                      <span>{alert.description}</span>
                      <small>{alert.context}</small>
                    </div>

                    <span className={`alerts-page__badge alerts-page__badge--${alert.type}`}>
                      {typeContent.label}
                    </span>

                    <button
                      className="alerts-page__dismiss"
                      type="button"
                      aria-label={`Fechar alerta: ${alert.title}`}
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="alerts-page__empty">Nenhum alerta nesta categoria.</p>
          )}
        </section>
      </section>
    </main>
  );
}
