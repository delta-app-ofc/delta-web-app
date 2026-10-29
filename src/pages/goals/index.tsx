import { useState, type CSSProperties, type FormEvent } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import adjustIcon from "../../assets/goals/adjust.png";
import complyIcon from "../../assets/goals/comply.png";
import exportIcon from "../../assets/goals/export.png";
import informationIcon from "../../assets/goals/information.png";
import potentialIcon from "../../assets/goals/potential.png";
import criticalUnitsIcon from "../../assets/goals/units-critical.png";
import unitsIcon from "../../assets/goals/units.png";

import "./style.css";

const indicators = [
  {
    id: "average",
    label: "Cumprimento médio",
    value: "84%",
    detail: "Dentro do esperado",
    type: "positive",
    icon: complyIcon,
  },
  {
    id: "on-target",
    label: "Unidades na meta",
    value: "5 de 10",
    icon: unitsIcon,
  },
  {
    id: "critical",
    label: "Unidades críticas",
    value: "2",
    icon: criticalUnitsIcon,
  },
  {
    id: "potential",
    label: "Potencial Econômico",
    value: "R$ 2145/ano",
    detail: "com 18% de redução",
    type: "positive",
    icon: potentialIcon,
  },
] as const;

const units = [
  {
    id: "vila-romana",
    name: "Loja Swift - Vila Romana",
    summary: "850 m² · 5430 L consumidos",
    percentage: 78,
    reference: "4000 L/mês",
    consumption: "4.5 L/m²",
    status: "Normal",
    type: "normal",
  },
  {
    id: "vila-leopoldina",
    name: "Loja Swift - Vila Leopoldina",
    summary: "450 m² · 9301 L consumidos",
    percentage: 112,
    reference: "4000 L/mês",
    consumption: "2.5 L/m²",
    status: "Crítico",
    type: "critical",
  },
  {
    id: "vila-matilde",
    name: "Loja Swift - Vila Matilde",
    summary: "67 m² · 456 L consumidos",
    percentage: 91,
    reference: "8000 L/mês",
    consumption: "8.5 L/m²",
    status: "Atenção",
    type: "warning",
  },
  {
    id: "moema",
    name: "Loja Swift - Vila Romana",
    summary: "850 m² · 5403 L consumidos",
    percentage: 78,
    reference: "6000 L/mês",
    consumption: "4.5 L/m²",
    status: "Normal",
    type: "normal",
  },
] as const;

export function GoalsPage() {
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [draftGoal, setDraftGoal] = useState("");
  const [goalValues, setGoalValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(units.map((unit) => [unit.id, unit.percentage])),
  );

  function startEditing(unitId: string) {
    setEditingUnitId(unitId);
    setDraftGoal(String(goalValues[unitId]));
  }

  function cancelEditing() {
    setEditingUnitId(null);
    setDraftGoal("");
  }

  function saveGoal(event: FormEvent<HTMLFormElement>, unitId: string) {
    event.preventDefault();

    const newGoal = Number(draftGoal);

    if (!Number.isFinite(newGoal) || newGoal < 1 || newGoal > 200) {
      return;
    }

    setGoalValues((currentValues) => ({
      ...currentValues,
      [unitId]: newGoal,
    }));
    cancelEditing();
  }

  return (
    <main className="goals-page">
      <div className="goals-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="goals-page__content" aria-labelledby="goals-title">
        <header className="goals-header">
          <h1 id="goals-title">Metas</h1>
          <button className="goals-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        <section className="goals-indicators" aria-label="Resumo das metas">
          {indicators.map((indicator) => (
            <article className="goals-card goals-indicator" key={indicator.id}>
              <div className="goals-indicator__label">
                <img src={indicator.icon} alt="" />
                <span>{indicator.label}</span>
              </div>
              <strong>{indicator.value}</strong>
              {"detail" in indicator && (
                <small className={indicator.type === "positive" ? "goals-indicator__detail--positive" : ""}>
                  {indicator.detail}
                </small>
              )}
            </article>
          ))}
        </section>

        <aside className="goals-information" aria-label="Como as metas são calculadas">
          <img src={informationIcon} alt="" />
          <p>
            <strong>O que é a “meta” aqui?</strong> Não é dinheiro, é volume de água. Cada unidade tem uma
            capacidade de referência (um consumo mensal esperado para ela, em litros). A meta em % mostra o
            quanto a unidade pode consumir em relação a essa referência: 100% = consumindo exatamente o
            esperado, menos de 100% é economia, mais de 100% é consumo acima do esperado (por isso unidades
            acima de 85% aparecem em atenção/crítico). Reduzir a meta % significa pedir que a unidade consuma
            menos água no mês.
          </p>
        </aside>

        <section className="goals-units" aria-labelledby="goals-units-title">
          <h2 id="goals-units-title">Visualização por unidade</h2>

          <div className="goals-units__grid">
            {units.map((unit) => {
              const percentage = goalValues[unit.id] ?? unit.percentage;
              const isEditing = editingUnitId === unit.id;

              return (
              <article className={`goals-card goal-unit ${isEditing ? "goal-unit--editing" : ""}`} key={unit.id}>
                <header>
                  <div>
                    <h3>{unit.name}</h3>
                    <p>{unit.summary}</p>
                  </div>
                  <span className={`goal-unit__status goal-unit__status--${unit.type}`}>
                    {unit.status}
                  </span>
                </header>

                {isEditing ? (
                  <form className="goal-unit__editor" onSubmit={(event) => saveGoal(event, unit.id)}>
                    <label htmlFor={`goal-${unit.id}`}>Nova meta (% da capacidade de referência)</label>
                    <div className="goal-unit__field">
                      <input
                        id={`goal-${unit.id}`}
                        type="number"
                        min="1"
                        max="200"
                        step="1"
                        inputMode="numeric"
                        value={draftGoal}
                        onChange={(event) => setDraftGoal(event.target.value)}
                        autoFocus
                        required
                      />
                      <span aria-hidden="true">%</span>
                    </div>

                    <p>
                      A capacidade de referência desta unidade é {unit.reference}. A meta define o limite de
                      consumo como % dessa referência — diminua a % para pedir menos consumo de água à unidade.
                    </p>

                    <div className="goal-unit__editor-actions">
                      <button type="button" onClick={cancelEditing}>Cancelar</button>
                      <button type="submit">Salvar meta</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="goal-unit__content">
                      <div
                        className={`goal-unit__progress goal-unit__progress--${unit.type}`}
                        style={{ "--goal-progress": `${Math.min(percentage, 100) * 3.6}deg` } as CSSProperties}
                        role="img"
                        aria-label={`${percentage}% da meta de consumo`}
                      >
                        <span>{percentage}%</span>
                      </div>

                      <dl>
                        <div>
                          <dt>Capacidade de referência</dt>
                          <dd>{unit.reference}</dd>
                        </div>
                        <div>
                          <dt>Consumo por m²</dt>
                          <dd>{unit.consumption}</dd>
                        </div>
                      </dl>
                    </div>

                    <button
                      className="goal-unit__adjust"
                      type="button"
                      aria-label={`Ajustar meta de ${unit.name}`}
                      onClick={() => startEditing(unit.id)}
                    >
                      <img src={adjustIcon} alt="" />
                      <span>Ajustar meta</span>
                    </button>
                  </>
                )}
              </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
