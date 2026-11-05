import { useCallback, useEffect, useState } from "react";
import { listMonitoringHourly } from "../services/indicators";
import { ApiError } from "../services/http";
import type { MonitoringHourlyPoint } from "../types/indicators";

type LeakHourlyState =
  | { status: "loading" }
  | { status: "success"; points: MonitoringHourlyPoint[] }
  | { status: "error"; error: string };

export function useLeakHourly() {
  const [state, setState] = useState<LeakHourlyState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    listMonitoringHourly(24, 10, controller.signal).then(
      (points) => { if (!controller.signal.aborted) setState({ status: "success", points }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({
          status: "error",
          error: error instanceof ApiError ? error.message : "Não foi possível carregar a série horária.",
        });
      },
    );
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return { state, retry };
}
