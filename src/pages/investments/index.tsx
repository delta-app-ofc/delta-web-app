import { useState, type CSSProperties } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import exportIcon from "../../assets/investments/export.png";
import investmentIcon from "../../assets/investments/investment.png";
import lowBatteryIcon from "../../assets/investments/low-battery.png";
import monthsIcon from "../../assets/investments/months.png";
import noLinkIcon from "../../assets/investments/no-link.png";
import pipeTrucksIcon from "../../assets/investments/pipe-trucks.png";
import sceneryIcon from "../../assets/investments/scenery.png";
import waterIcon from "../../assets/investments/water.png";

import "./style.css";

type ScenarioId = "current" | "faucets" | "reuse" | "rain";
type ImpactTab = "consumption" | "financial" | "environmental";

interface Scenario {
  id: ScenarioId;
  name: string;
  shortName: string;
  description: string;
  investment: string;
  investmentValue: number;
  reduction: number;
  payback: string;
  projectedConsumption: number;
  annualSavings: number;
  waterSaved: number;
  trucks: number;
  familyMonths: number;
}

const scenarios: readonly Scenario[] = [
  {
    id: "current",
    name: "Situação atual",
    shortName: "Situação atual",
    description: "Baseline: nenhuma intervenção adicional.",
    investment: "R$ 0",
    investmentValue: 0,
    reduction: 0,
    payback: "—",
    projectedConsumption: 1022353,
    annualSavings: 0,
    waterSaved: 0,
    trucks: 0,
    familyMonths: 0,
  },
  {
    id: "faucets",
    name: "Torneiras econômicas",
    shortName: "Com torneiras econômicas",
    description: "Troca de torneiras e válvulas por modelos de fechamento automático: baixo risco em todas as unidades da rede.",
    investment: "R$ 18 mil",
    investmentValue: 18000,
    reduction: 12,
    payback: "9,7 meses",
    projectedConsumption: 899546,
    annualSavings: 22200,
    waterSaved: 1472149,
    trucks: 147,
    familyMonths: 98,
  },
  {
    id: "reuse",
    name: "Reuso de água",
    shortName: "Reuso de água",
    description: "Estação de tratamento e reaproveitamento de água cinza para limpeza e descargas sanitárias.",
    investment: "R$ 75 mil",
    investmentValue: 75000,
    reduction: 28,
    payback: "17,3 meses",
    projectedConsumption: 736094,
    annualSavings: 51800,
    waterSaved: 3435015,
    trucks: 344,
    familyMonths: 229,
  },
  {
    id: "rain",
    name: "Captação de chuva",
    shortName: "Captação da chuva",
    description: "Captação e reservação de água de chuva para uso não potável: limpeza externa, irrigação e apoio operacional.",
    investment: "R$ 42 mil",
    investmentValue: 42000,
    reduction: 19,
    payback: "14,2 meses",
    projectedConsumption: 828106,
    annualSavings: 35200,
    waterSaved: 2330903,
    trucks: 233,
    familyMonths: 155,
  },
];

const impactTabs: readonly { id: ImpactTab; label: string }[] = [
  { id: "consumption", label: "Redução de Consumo" },
  { id: "financial", label: "Impacto Financeiro" },
  { id: "environmental", label: "Impacto Ambiental" },
];

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function InvestmentsPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>("faucets");
  const [activeTab, setActiveTab] = useState<ImpactTab>("consumption");
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[1];
  const investmentScenarios = scenarios.filter((scenario) => scenario.id !== "current");
  const maxAnnualSavings = Math.max(...investmentScenarios.map((scenario) => scenario.annualSavings));

  return (
    <main className="investments-page">
      <div className="investments-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="investments-page__content" aria-labelledby="investments-title">
        <header className="investments-header">
          <h1 id="investments-title">Simulador de Investimentos</h1>
          <button className="investments-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        <section className="investments-step" aria-labelledby="investment-step-one">
          <div className="investments-step__heading">
            <span aria-hidden="true">1</span>
            <div>
              <h2 id="investment-step-one">Escolha o cenário de investimento</h2>
              <p>Compare as opções e clique em uma para ver o impacto projetado na rede completa.</p>
            </div>
          </div>

          <div className="investment-scenarios" role="radiogroup" aria-label="Cenário de investimento">
            {scenarios.map((scenario) => {
              const isSelected = scenario.id === selectedScenarioId;

              return (
                <button
                  className={`investment-scenario ${isSelected ? "investment-scenario--selected" : ""}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  <span className="investment-scenario__radio" aria-hidden="true" />
                  <strong>{scenario.name}</strong>
                  <p>{scenario.description}</p>
                  <dl>
                    <div>
                      <dt>Investimento</dt>
                      <dd>{scenario.investment}</dd>
                    </div>
                    <div>
                      <dt>Redução</dt>
                      <dd className="investment-scenario__positive">{scenario.reduction}%</dd>
                    </div>
                    <div>
                      <dt>Payback</dt>
                      <dd>{scenario.payback}</dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        </section>

        <section className="investments-step investments-results" aria-labelledby="investment-step-two">
          <div className="investments-step__heading">
            <span aria-hidden="true">2</span>
            <div>
              <h2 id="investment-step-two">Impactos projetados</h2>
              <p>Resultado do cenário selecionado acima, para toda a rede.</p>
            </div>
          </div>

          <div className="investment-indicators" aria-label="Resumo do cenário selecionado">
            <article className="investments-card investment-indicator">
              <div><img src={sceneryIcon} alt="" /><span>Cenário selecionado</span></div>
              <strong>{selectedScenario.name}</strong>
            </article>
            <article className="investments-card investment-indicator">
              <div><img src={investmentIcon} alt="" /><span>Investimento</span></div>
              <strong>{selectedScenario.investmentValue === 0 ? "R$ 0" : `R$ ${numberFormatter.format(selectedScenario.investmentValue)}`}</strong>
            </article>
            <article className="investments-card investment-indicator">
              <div><img src={lowBatteryIcon} alt="" /><span>Bateria baixa</span></div>
              <strong>2</strong>
              <small>Trocar em breve</small>
            </article>
            <article className="investments-card investment-indicator">
              <div><img src={noLinkIcon} alt="" /><span>Sem vínculo</span></div>
              <strong>2 de 10</strong>
            </article>
          </div>

          <section className="investments-card investment-impact" aria-label="Detalhamento dos impactos">
            <div className="investment-impact__tabs" role="tablist" aria-label="Tipo de impacto">
              {impactTabs.map((tab) => (
                <button
                  className={activeTab === tab.id ? "investment-impact__tab--active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "consumption" && (
              <div className="consumption-impact" role="tabpanel">
                <h3>Projeção para a rede completa</h3>
                <div className="consumption-impact__chart">
                  <div>
                    <strong>{numberFormatter.format(scenarios[0].projectedConsumption)} L</strong>
                    <span className="consumption-impact__bar consumption-impact__bar--current" />
                    <small>Situação atual</small>
                  </div>
                  <div>
                    <strong>{numberFormatter.format(selectedScenario.projectedConsumption)} L</strong>
                    <span
                      className="consumption-impact__bar consumption-impact__bar--projected"
                      style={{ "--bar-height": `${Math.max(22, selectedScenario.projectedConsumption / scenarios[0].projectedConsumption * 100)}%` } as CSSProperties}
                    />
                    <small>{selectedScenario.shortName}</small>
                  </div>
                </div>
                <p>Redução de {selectedScenario.reduction}% no consumo total da rede com torneiras econômicas.</p>
              </div>
            )}

            {activeTab === "financial" && (
              <div className="financial-impact" role="tabpanel">
                <h3>Economia anual por cenário</h3>
                <div className="financial-impact__chart">
                  {investmentScenarios.map((scenario) => (
                    <button
                      type="button"
                      className={scenario.id === selectedScenarioId ? "financial-impact__scenario--selected" : ""}
                      key={scenario.id}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <strong>R$ {(scenario.annualSavings / 1000).toFixed(1)} mil</strong>
                      <span
                        style={{ height: `${Math.max(34, scenario.annualSavings / maxAnnualSavings * 100)}%` }}
                        aria-hidden="true"
                      />
                      <small>{scenario.shortName}</small>
                    </button>
                  ))}
                </div>
                <p>Clique numa barra para trocar o cenário selecionado no passo 1.</p>
              </div>
            )}

            {activeTab === "environmental" && (
              <div className="environmental-impact" role="tabpanel">
                <article>
                  <div><img src={waterIcon} alt="" /><span>Água economizada/ano</span></div>
                  <strong>{numberFormatter.format(selectedScenario.waterSaved)} L</strong>
                </article>
                <article>
                  <div><img src={pipeTrucksIcon} alt="" /><span>Equiv. em caminhões-pipa</span></div>
                  <strong>{numberFormatter.format(selectedScenario.trucks)} caminhões</strong>
                </article>
                <article>
                  <div><img src={monthsIcon} alt="" /><span>Meses de consumo de 1 família</span></div>
                  <strong>{numberFormatter.format(selectedScenario.familyMonths)} meses</strong>
                </article>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

