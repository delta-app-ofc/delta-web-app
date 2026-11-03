import { useEffect, useState } from "react";
import { listDeviceSummaries, listInvestmentImpact } from "../services/indicators";

export interface ScenarioImpact {
  savedLitersYear: number;
  tankTrucks: number;
  familyMonths: number;
}

export interface InvestmentImpactData {
  byScenario: ReadonlyMap<number, ScenarioImpact>;
  devicesLowBattery: number;
  propertiesWithoutDevice: number;
}

type State = { status: "loading" } | { status: "ready"; data: InvestmentImpactData } | { status: "unavailable" };

// Impacto ambiental por cenário (dw.vw_ft_investment_impact) e cards de dispositivos (dw.vw_ft_organization_device_summary).
export function useInvestmentImpact(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([listInvestmentImpact(controller.signal), listDeviceSummaries(controller.signal)]).then(
      ([impact, devices]) => {
        if (controller.signal.aborted) return;
        const byScenario = new Map<number, ScenarioImpact>();
        impact.forEach((item) => {
          const current = byScenario.get(item.scenarioId) ?? { savedLitersYear: 0, tankTrucks: 0, familyMonths: 0 };
          byScenario.set(item.scenarioId, {
            savedLitersYear: current.savedLitersYear + item.savedLitersYear,
            tankTrucks: current.tankTrucks + item.tankTrucksEquivalent,
            familyMonths: current.familyMonths + item.familyMonthsEquivalent,
          });
        });
        setState({
          status: "ready",
          data: {
            byScenario,
            devicesLowBattery: devices.reduce((total, item) => total + item.devicesLowBattery, 0),
            propertiesWithoutDevice: devices.reduce((total, item) => total + item.propertiesWithoutDevice, 0),
          },
        });
      },
      () => { if (!controller.signal.aborted) setState({ status: "unavailable" }); },
    );
    return () => controller.abort();
  }, []);

  return state;
}
