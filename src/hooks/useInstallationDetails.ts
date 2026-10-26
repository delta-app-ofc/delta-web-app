import { useEffect, useState } from "react";
import { getInstallationDetails } from "../services/installationDetails";
import type { InstallationDetails } from "../types/installationDetails";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: InstallationDetails };

export function useInstallationDetails(id: string | undefined) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    if (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      setState({ status: "error", message: "Instalação não encontrada." });
      return () => controller.abort();
    }
    void getInstallationDetails(Number(id), controller.signal).then(
      data => { if (!controller.signal.aborted) setState({ status: "success", data }); },
      error => { if (!controller.signal.aborted) setState({ status: "error", message: error instanceof Error ? error.message : "Não foi possível carregar a instalação." }); },
    );
    return () => controller.abort();
  }, [id, version]);
  return { state, retry: () => setVersion(value => value + 1) };
}
