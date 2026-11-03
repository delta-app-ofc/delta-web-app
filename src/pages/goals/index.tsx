import type { CSSProperties } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { useGoals } from "../../hooks/useGoals";
import type { GoalStatus } from "../../types/indicators";
import complyIcon from "../../assets/goals/comply.png";
import exportIcon from "../../assets/goals/export.png";
import informationIcon from "../../assets/goals/information.png";
import potentialIcon from "../../assets/goals/potential.png";
import criticalUnitsIcon from "../../assets/goals/units-critical.png";
import unitsIcon from "../../assets/goals/units.png";

import "./style.css";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

const statusView: Record<GoalStatus, { label: string; type: "normal" | "warning" | "critical" }> = {
  OK: { label: "Normal", type: "normal" },
  ATENCAO: { label: "Atenção", type: "warning" },
  CRITICO: { label: "Crítico", type: "critical" },
  SEM_META: { label: "Sem meta", type: "normal" },
};

export function GoalsPage() {
  const { state, retry } = useGoals();
  const data = state.status === "success" ? state.data : null;

  const indicators = data ? [
    { id: "average", label: "Cumprimento médio", value: data.averageGoalPct === null ? "—" : `${number.format(data.averageGoalPct)}%`, icon: complyIcon },
    { id: "on-target", label: "Unidades na meta", value: `${data.unitsOnTarget} de ${data.units.length}`, icon: unitsIcon },
    { id: "critical", label: "Unidades críticas", value: String(data.unitsCritical), icon: criticalUnitsIcon },
    { id: "potential", label: "Potencial Econômico", value: `${currency.format(data.annualSavingsPotential)}/ano`, detail: "mantendo a economia do mês", icon: potentialIcon },
  ] : [];

  return (
    <main className="goals-page">
      <div className="goals-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="goals-page__content" aria-labelledby="goals-title">
        <header className="goals-header">
          <h1 id="goals-title">Metas</h1>
          <button className="goals-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando metas…" />}
        {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}
        {state.status === "success" && !data && <p className="goals-empty">Ainda não há consumo consolidado para calcular as metas.</p>}

        {data && <>
          <section className="goals-indicators" aria-label="Resumo das metas">
            {indicators.map((indicator) => (
              <article className="goals-card goals-indicator" key={indicator.id}>
                <div className="goals-indicator__label">
                  <img src={indicator.icon} alt="" />
                  <span>{indicator.label}</span>
                </div>
                <strong>{indicator.value}</strong>
                {"detail" in indicator && <small className="goals-indicator__detail--positive">{indicator.detail}</small>}
              </article>
            ))}
          </section>

          <aside className="goals-information" aria-label="Como as metas são calculadas">
            <img src={informationIcon} alt="" />
            <p>
              <strong>O que é a “meta” aqui?</strong> Não é dinheiro, é volume de água. Cada unidade tem uma
              meta mensal em litros; o percentual mostra quanto dela foi consumido em{" "}
              {monthFormat.format(new Date(`${data.referenceMonth}T00:00:00Z`))}. Até 85% a unidade está normal,
              até 100% em atenção e acima de 100% crítica.
            </p>
          </aside>

          <section className="goals-units" aria-labelledby="goals-units-title">
            <h2 id="goals-units-title">Visualização por unidade</h2>

            <div className="goals-units__grid">
              {data.units.map((unit) => {
                const view = statusView[unit.goalStatus];
                const percentage = unit.goalPct === null ? null : Math.round(unit.goalPct);
                return (
                  <article className="goals-card goal-unit" key={unit.propertyId}>
                    <header>
                      <div>
                        <h3>{unit.propertyName}</h3>
                        <p>{unit.builtAreaM2 === null ? "Área não informada" : `${number.format(unit.builtAreaM2)} m²`} · {number.format(unit.totalLiters)} L consumidos</p>
                      </div>
                      <span className={`goal-unit__status goal-unit__status--${view.type}`}>{view.label}</span>
                    </header>

                    <div className="goal-unit__content">
                      <div
                        className={`goal-unit__progress goal-unit__progress--${view.type}`}
                        style={{ "--goal-progress": `${Math.min(percentage ?? 0, 100) * 3.6}deg` } as CSSProperties}
                        role="img"
                        aria-label={percentage === null ? "Sem meta definida" : `${percentage}% da meta de consumo`}
                      >
                        <span>{percentage === null ? "—" : `${percentage}%`}</span>
                      </div>

                      <dl>
                        <div>
                          <dt>Meta mensal</dt>
                          <dd>{unit.monthlyTargetLiters === null ? "Não definida" : `${number.format(unit.monthlyTargetLiters)} L/mês`}</dd>
                        </div>
                        <div>
                          <dt>Consumo por m²</dt>
                          <dd>{unit.litersPerM2 === null ? "—" : `${number.format(unit.litersPerM2)} L/m²`}</dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>}
      </section>
    </main>
  );
}
