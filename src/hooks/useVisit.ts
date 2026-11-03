import { useCallback, useEffect, useRef, useState } from "react";
import { declareVisit } from "../services/alerts";
import { validateVisitUntil } from "../utils/alertsValidation";
import type { VisitFormErrors } from "../types/alerts";

interface VisitState {
  busy: boolean;
  errors: VisitFormErrors;
  failure: string | null;
  success: string | null;
}

const INITIAL: VisitState = { busy: false, errors: {}, failure: null, success: null };

export function useVisit(deviceId: string) {
  const [state, setState] = useState<VisitState>(INITIAL);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  const submit = useCallback(async (until: string, cancel: boolean) => {
    const validation = cancel ? { iso: null, errors: {} } : validateVisitUntil(until);
    if (!cancel && !validation.iso) {
      setState({ ...INITIAL, errors: validation.errors });
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setState({ ...INITIAL, busy: true });
    try {
      await declareVisit(deviceId, validation.iso, controller.signal);
      if (!controller.signal.aborted) {
        setState({ ...INITIAL, success: cancel ? "Visita cancelada." : "Visita registrada. A detecção de vazamentos continua ativa." });
      }
    } catch {
      if (!controller.signal.aborted) {
        setState({ ...INITIAL, failure: "Não foi possível atualizar a visita. Use uma data futura de até 90 dias." });
      }
    }
  }, [deviceId]);

  return { ...state, submit };
}
