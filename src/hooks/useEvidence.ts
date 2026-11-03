import { useEffect, useState } from "react";
import { listEvidence } from "../services/alerts";
import type { EvidencePoint } from "../types/alerts";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; points: EvidencePoint[] }
  | { status: "error" };

/** Só consulta a API quando `enabled`; cancela a requisição ao fechar, trocar de dispositivo ou desmontar. */
export function useEvidence(deviceId: string, enabled: boolean): State {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ status: "loading" });
    listEvidence(deviceId, controller.signal)
      .then((points) => { if (!controller.signal.aborted) setState({ status: "success", points }); })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [deviceId, enabled]);

  return state;
}
