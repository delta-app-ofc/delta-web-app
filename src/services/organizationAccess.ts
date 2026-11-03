import type { OrganizationResolution } from "../types/organization";
import { listInstallations } from "./installations";

/**
 * Resolve a organização ativa somente a partir das propriedades que a API
 * REST já confirmou como associadas ao usuário autenticado.
 */
export async function resolveAccessibleOrganization(signal: AbortSignal): Promise<OrganizationResolution> {
  const records = await listInstallations(signal);
  const organizationIds = [...new Set(
    records.flatMap((record) => record.organizationId == null ? [] : [record.organizationId]),
  )].sort((first, second) => first - second);

  if (organizationIds.length === 1) return { status: "resolved", organizationId: organizationIds[0] };
  if (organizationIds.length > 1) return { status: "multiple", organizationIds };
  return { status: "none" };
}
