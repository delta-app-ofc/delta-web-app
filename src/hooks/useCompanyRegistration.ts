import { useEffect, useRef, useState } from "react";
import { registerCompany } from "../services/companyRegistration";
import { ApiError } from "../services/http";
import type { CompanyRegisterData, CompanyRegistrationProgress } from "../types/companyRegister";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "success" };

export function useCompanyRegistration(data: CompanyRegisterData) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const progressRef = useRef<CompanyRegistrationProgress>({});
  const runningRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    // O React Strict Mode monta o efeito duas vezes em desenvolvimento; a trava impede criar a empresa em duplicidade.
    if (runningRef.current) return;
    runningRef.current = true;
    const controller = new AbortController();
    setState({ status: "loading" });
    void registerCompany(dataRef.current, progressRef.current, controller.signal).then(
      () => setState({ status: "success" }),
      (error: unknown) => setState({ status: "error", message: error instanceof ApiError ? error.message : "Não foi possível concluir o cadastro. Tente novamente." }),
    ).finally(() => { runningRef.current = false; });
  }, [attempt]);

  return { state, retry: () => setAttempt((value) => value + 1) };
}
