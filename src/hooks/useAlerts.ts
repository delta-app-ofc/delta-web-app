import { useCallback, useEffect, useRef, useState } from "react";
import { dismissAlert, getLeakSummary, listAlerts } from "../services/alerts";
import type { AlertPage, AlertQuery, LeakSummary } from "../types/alerts";

type Status = "loading" | "success" | "error";

const EMPTY_PAGE: AlertPage = { content: [], totalElements: 0, totalPages: 0 };

/** Lista alertas paginados; erro e carregamento são independentes do resumo de vazamentos. */
export function useAlerts(query: AlertQuery, onEmptyPage: () => void) {
  const [data, setData] = useState<AlertPage>(EMPTY_PAGE);
  const [status, setStatus] = useState<Status>("loading");
  const [actionError, setActionError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const writes = useRef(new Set<AbortController>());
  const { severity, alertType, includeDismissed, page, size } = query;

  useEffect(() => {
    const pending = writes.current;
    return () => pending.forEach((controller) => controller.abort());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    listAlerts({ severity, alertType, includeDismissed, page, size }, controller.signal)
      .then((result) => { setData(result); setStatus("success"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [severity, alertType, includeDismissed, page, size, version]);

  const retry = useCallback(() => setVersion((current) => current + 1), []);

  const dismiss = useCallback(async (id: string, isLastOnPage: boolean) => {
    const controller = new AbortController();
    writes.current.add(controller);
    setDismissing(id);
    setActionError(null);
    try {
      await dismissAlert(id, controller.signal);
      if (controller.signal.aborted) return;
      if (isLastOnPage) onEmptyPage();
      retry();
    } catch {
      if (!controller.signal.aborted) setActionError("Não foi possível dispensar o alerta.");
    } finally {
      writes.current.delete(controller);
      if (!controller.signal.aborted) setDismissing(null);
    }
  }, [onEmptyPage, retry]);

  return { data, status, actionError, dismissing, retry, dismiss };
}

export function useLeakSummary() {
  const [summary, setSummary] = useState<LeakSummary | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    getLeakSummary(controller.signal)
      .then((result) => { setSummary(result); setStatus("success"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [version]);

  return { summary, status, retry: useCallback(() => setVersion((current) => current + 1), []) };
}
