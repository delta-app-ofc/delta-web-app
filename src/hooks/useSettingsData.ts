import { useEffect, useState } from "react";
import { getCurrentUser, type CurrentUser } from "../services/auth";
import { ApiError } from "../services/http";
import { listOrganizations } from "../services/organizations";
import type { Organization } from "../types/organization";

type State =
  | { status: "loading" }
  | { status: "success"; user: CurrentUser; organizations: Organization[]; warnings: string[] }
  | { status: "error"; error: string };

export function useSettingsData(requestVersion: number) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void Promise.all([
      getCurrentUser(controller.signal),
      listOrganizations(controller.signal).catch(() => null),
    ]).then(([user, organizations]) => {
      if (controller.signal.aborted) return;
      setState({
        status: "success",
        user,
        organizations: organizations ?? [],
        warnings: organizations === null ? ["Não foi possível carregar os dados da organização."] : [],
      });
    }, (error: unknown) => {
      if (!controller.signal.aborted) setState({ status: "error", error: error instanceof ApiError ? error.message : "Não foi possível carregar as configurações." });
    });
    return () => controller.abort();
  }, [requestVersion]);

  return state;
}
