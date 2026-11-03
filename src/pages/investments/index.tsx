import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import exportIcon from "../../assets/investments/export.png";
import investmentIcon from "../../assets/investments/investment.png";
import monthsIcon from "../../assets/investments/months.png";
import noLinkIcon from "../../assets/investments/no-link.png";
import pipeTrucksIcon from "../../assets/investments/pipe-trucks.png";
import sceneryIcon from "../../assets/investments/scenery.png";
import waterIcon from "../../assets/investments/water.png";
import lowBatteryIcon from "../../assets/investments/low-battery.png";
import { ApiError } from "../../services/http";
import { useInvestmentImpact } from "../../hooks/useInvestmentImpact";
import { listCapexComparisons } from "../../services/investments";
import type { CapexComparison } from "../../types/investment";

import "./style.css";

type ImpactTab = "consumption" | "financial" | "environmental";
const impactTabs: readonly { id: ImpactTab; label: string }[] = [
  { id: "consumption", label: "Redução de Consumo" },
  { id: "financial", label: "Impacto Financeiro" },
  { id: "environmental", label: "Impacto Ambiental" },
];
const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type LoadingState =
  | { status: "loading" }
  | { status: "success"; data: CapexComparison[] }
  | { status: "error"; error: string };

function formatCurrency(value: number | null): string {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatNumber(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${numberFormatter.format(value)}${suffix}`;
}

function formatPayback(value: number | null): string {
  return value === null ? "—" : `${numberFormatter.format(value)} meses`;
}

export function InvestmentsPage() {
  const [state, setState] = useState<LoadingState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ImpactTab>("consumption");
  const impact = useInvestmentImpact();
  const impactData = impact.status === "ready" ? impact.data : null;
  const impactNote = impact.status === "loading" ? "Carregando…" : impact.status === "unavailable" ? "Indicador indisponível no momento" : "Sem dados consolidados";

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void listCapexComparisons(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ status: "success", data }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error: error instanceof ApiError ? error.message : "Não foi possível carregar os investimentos." });
      },
    );
    return () => controller.abort();
  }, [requestVersion]);

  const scenarios = useMemo(() => state.status === "success" ? state.data : [], [state]);
  const selectedScenario = scenarios.find((scenario) => scenario.scenarioId === selectedScenarioId) ?? scenarios[0];
  const maxAnnualSavings = useMemo(() => Math.max(0, ...scenarios.map((scenario) => scenario.annualSavingsValue ?? 0)), [scenarios]);

  useEffect(() => {
    if (selectedScenario && selectedScenario.scenarioId !== selectedScenarioId) setSelectedScenarioId(selectedScenario.scenarioId);
  }, [selectedScenario, selectedScenarioId]);

  return (
    <main className="investments-page">
      <div className="investments-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>
      <section id="page-content" tabIndex={-1} className="investments-page__content" aria-labelledby="investments-title">
        <header className="investments-header">
          <h1 id="investments-title">Simulador de Investimentos</h1>
          <button className="investments-export" type="button" onClick={() => window.print()}><img src={exportIcon} alt="" /><span>Exportar para PDF</span></button>
        </header>

        <section className="investments-step" aria-labelledby="investment-step-one">
          <div className="investments-step__heading"><span aria-hidden="true">1</span><div><h2 id="investment-step-one">Escolha o cenário de investimento</h2><p>Compare as opções retornadas pelo backend e clique em uma para ver os impactos disponíveis.</p></div></div>
          {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando cenários de investimento…" />}
          {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={() => setRequestVersion((version) => version + 1)} />}
          {state.status === "success" && scenarios.length === 0 && <p className="investments-empty" role="status">Nenhum cenário de investimento foi retornado pela API.</p>}
          {state.status === "success" && scenarios.length > 0 && <div className="investment-scenarios" role="radiogroup" aria-label="Cenário de investimento">
            {scenarios.map((scenario) => {
              const isSelected = scenario.scenarioId === selectedScenario?.scenarioId;
              return <button className={`investment-scenario ${isSelected ? "investment-scenario--selected" : ""}`} type="button" role="radio" aria-checked={isSelected} key={scenario.scenarioId} onClick={() => setSelectedScenarioId(scenario.scenarioId)}>
                <span className="investment-scenario__radio" aria-hidden="true" /><strong>{scenario.name}</strong><p>Investimento, redução e payback do cenário.</p>
                <dl><div><dt>Investimento</dt><dd>{formatCurrency(scenario.investmentValue)}</dd></div><div><dt>Redução</dt><dd className="investment-scenario__positive">{formatNumber(scenario.reductionPct, "%")}</dd></div><div><dt>Payback</dt><dd>{formatPayback(scenario.paybackMonths)}</dd></div></dl>
              </button>;
            })}
          </div>}
        </section>

        {selectedScenario && <section className="investments-step investments-results" aria-labelledby="investment-step-two">
          <div className="investments-step__heading"><span aria-hidden="true">2</span><div><h2 id="investment-step-two">Impactos projetados</h2><p>Resultado do cenário selecionado, limitado aos dados fornecidos pela API.</p></div></div>
          <div className="investment-indicators" role="region" aria-label="Resumo do cenário selecionado">
            <article className="investments-card investment-indicator"><div><img src={sceneryIcon} alt="" /><span>Cenário selecionado</span></div><strong>{selectedScenario.name}</strong></article>
            <article className="investments-card investment-indicator"><div><img src={investmentIcon} alt="" /><span>Investimento</span></div><strong>{formatCurrency(selectedScenario.investmentValue)}</strong></article>
            <article className="investments-card investment-indicator"><div><img src={lowBatteryIcon} alt="" /><span>Bateria baixa</span></div><strong>{impactData ? formatNumber(impactData.devicesLowBattery) : "—"}</strong><small>{impactData ? "dispositivos com bateria até 20%" : impactNote}</small></article>
            <article className="investments-card investment-indicator"><div><img src={noLinkIcon} alt="" /><span>Sem vínculo</span></div><strong>{impactData ? formatNumber(impactData.propertiesWithoutDevice) : "—"}</strong><small>{impactData ? "instalações sem dispositivo" : impactNote}</small></article>
          </div>

          <section className="investments-card investment-impact" aria-label="Detalhamento dos impactos">
            <div className="investment-impact__tabs" role="tablist" aria-label="Tipo de impacto">
              {impactTabs.map((tab) => <button className={activeTab === tab.id ? "investment-impact__tab--active" : ""} type="button" role="tab" aria-selected={activeTab === tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
            </div>
            {activeTab === "consumption" && <div className="consumption-impact" role="tabpanel"><h3>Redução de consumo informada pela API</h3><div className="consumption-impact__unavailable" role="status"><strong>{formatNumber(selectedScenario.reductionPct, "%")}</strong><small>A API não informa a projeção de consumo em litros.</small></div><p>O cenário informa a redução percentual, mas não fornece uma linha de base em litros.</p></div>}
            {activeTab === "financial" && <div className="financial-impact" role="tabpanel"><h3>Economia anual por cenário</h3><div className="financial-impact__chart">{scenarios.map((scenario) => <button type="button" className={scenario.scenarioId === selectedScenario.scenarioId ? "financial-impact__scenario--selected" : ""} key={scenario.scenarioId} onClick={() => setSelectedScenarioId(scenario.scenarioId)}><strong>{formatCurrency(scenario.annualSavingsValue)}</strong><span style={{ height: `${maxAnnualSavings > 0 ? Math.max(34, (scenario.annualSavingsValue ?? 0) / maxAnnualSavings * 100) : 34}%` }} aria-hidden="true" /><small>{scenario.name}</small></button>)}</div><p>Clique numa barra para trocar o cenário selecionado.</p></div>}
            {activeTab === "environmental" && <div className="environmental-impact" role="tabpanel">
              <article><div><img src={waterIcon} alt="" /><span>Água economizada/ano</span></div><strong>{impactData ? formatNumber(Math.round(impactData.savedLitersYear), " L") : "—"}</strong><small>{impactData ? "projeção mantendo a economia do mês" : impactNote}</small></article>
              <article><div><img src={pipeTrucksIcon} alt="" /><span>Equiv. em caminhões-pipa</span></div><strong>{impactData ? formatNumber(Math.round(impactData.tankTrucks * 10) / 10) : "—"}</strong><small>{impactData ? "caminhões de 10.000 L" : impactNote}</small></article>
              <article><div><img src={monthsIcon} alt="" /><span>Meses de consumo de 1 família</span></div><strong>{impactData ? formatNumber(Math.round(impactData.familyMonths * 10) / 10) : "—"}</strong><small>{impactData ? "família de 4 pessoas, 15.000 L/mês" : impactNote}</small></article>
            </div>}
          </section>
        </section>}
      </section>
    </main>
  );
}
