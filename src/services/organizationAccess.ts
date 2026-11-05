import type { OrganizationResolution } from "../types/organization";
import { listInstallations } from "./installations";

/**
 * Resolve a organização ativa somente a partir das propriedades que a API
 * REST já confirmou como associadas ao usuário autenticado.
 */
export async function resolveAccessibleOrganization(signal: AbortSignal): Promise<OrganizationResolution> {
  const records = await listInstallations(signal);
  const unitCounts = new Map<number, number>();
  records.forEach((record) => {
    if (record.organizationId != null) unitCounts.set(record.organizationId, (unitCounts.get(record.organizationId) ?? 0) + 1);
  });
  const organizations = [...unitCounts].sort((first, second) => second[1] - first[1] || first[0] - second[0]);

  if (organizations.length === 1) return { status: "resolved", organizationId: organizations[0][0] };
  if (organizations.length > 1) {
    if (organizations[0][1] > organizations[1][1]) return { status: "resolved", organizationId: organizations[0][0] };
    return { status: "multiple", organizationIds: organizations.map(([id]) => id).sort((first, second) => first - second) };
  }
  return { status: "none" };
}
