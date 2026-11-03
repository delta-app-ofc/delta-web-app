import { useEffect, useState } from "react";
import { listDeviceSummaries, listOrganizationEsg } from "../services/indicators";
import { pickReferenceMonth } from "../utils/indicators";

export interface InvestmentImpact {
  savedLitersYear: number;
  tankTrucks: number;
  familyMonths: number;
  devicesLowBattery: number;
  propertiesWithoutDevice: number;
}

type State = { status: "loading" } | { status: "ready"; data: InvestmentImpact | null } | { status: "unavailable" };

// Impacto ambiental e cards de dispositivos vêm das views dw.vw_ft_organization_esg e dw.vw_ft_organization_device_summary.
export function useInvestmentImpact(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([listOrganizationEsg(controller.signal), listDeviceSummaries(controller.signal)]).then(
      ([esg, devices]) => {
        if (controller.signal.aborted) return;
        const month = pickReferenceMonth(esg.map((item) => ({ referenceMonth: item.referenceMonth, isComplete: item.isCompleteMonth })));
        const rows = esg.filter((item) => item.referenceMonth === month);
        if (rows.length === 0) { setState({ status: "ready", data: null }); return; }
        setState({
          status: "ready",
          data: {
            savedLitersYear: rows.reduce((total, item) => total + item.savedLitersYearProjection, 0),
            tankTrucks: rows.reduce((total, item) => total + item.tankTrucksEquivalent, 0),
            familyMonths: rows.reduce((total, item) => total + item.familyMonthsEquivalent, 0),
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
