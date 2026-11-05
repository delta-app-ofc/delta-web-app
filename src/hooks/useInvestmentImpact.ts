import { useEffect, useState } from "react";
import { listInvestmentImpact } from "../services/indicators";

export interface ScenarioImpact {
  baselineAnnualLiters: number;
  savedLitersYear: number;
  tankTrucks: number;
  familyMonths: number;
}

export interface InvestmentImpactData {
  byScenario: ReadonlyMap<number, ScenarioImpact>;
}

type State = { status: "loading" } | { status: "ready"; data: InvestmentImpactData } | { status: "unavailable" };

// Impacto ambiental por cenário (dw.vw_ft_investment_impact).
export function useInvestmentImpact(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    listInvestmentImpact(controller.signal).then(
      (impact) => {
        if (controller.signal.aborted) return;
        const byScenario = new Map<number, ScenarioImpact>();
        impact.forEach((item) => {
          const current = byScenario.get(item.scenarioId) ?? { baselineAnnualLiters: 0, savedLitersYear: 0, tankTrucks: 0, familyMonths: 0 };
          const baselineAnnualLiters = current.baselineAnnualLiters + item.baselineAnnualLiters;
          const savedLitersYear = current.savedLitersYear + item.savedLitersYear;
          byScenario.set(item.scenarioId, {
            baselineAnnualLiters,
            savedLitersYear,
            // Equivalências são derivadas do total agregado. Somar os valores
            // arredondados por organização acumula erro de arredondamento.
            tankTrucks: savedLitersYear / 10_000,
            familyMonths: savedLitersYear / 18_000,
          });
        });
        setState({
          status: "ready",
          data: {
            byScenario,
          },
        });
      },
      () => { if (!controller.signal.aborted) setState({ status: "unavailable" }); },
    );
    return () => controller.abort();
  }, []);

  return state;
}
