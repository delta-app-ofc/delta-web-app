import { useCallback, useEffect, useState } from "react";
import { getLeakSummary, listAlerts } from "../services/alerts";
import type { AlertPage, AlertQuery, LeakSummary } from "../types/alerts";

type Status = "loading" | "success" | "error";

const EMPTY_PAGE: AlertPage = { content: [], totalElements: 0, totalPages: 0 };

/** Lista alertas (lidos das views SQL); erro e carregamento são independentes do resumo de vazamentos. */
export function useAlerts(query: AlertQuery) {
  const [data, setData] = useState<AlertPage>(EMPTY_PAGE);
  const [status, setStatus] = useState<Status>("loading");
  const [version, setVersion] = useState(0);
  const { severity, alertType, onlyActive, page, size } = query;

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    listAlerts({ severity, alertType, onlyActive, page, size }, controller.signal)
      .then((result) => { setData(result); setStatus("success"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [severity, alertType, onlyActive, page, size, version]);

  const retry = useCallback(() => setVersion((current) => current + 1), []);

  return { data, status, retry };
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
