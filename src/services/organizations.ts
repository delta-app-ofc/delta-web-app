import type { Organization } from "../types/organization";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson, writeJson } from "./http";
import type { OrganizationSegment } from "../types/organization";

const segments = new Set(["VAREJO", "INDUSTRIA", "CONDOMINIO", "FACILITIES"]);

function parseOrganization(value: unknown): Organization {
  if (!isRecord(value)) throw new Error("A API retornou uma organização inválida.");
  const businessSegment = value.businessSegment == null ? null : readText(value.businessSegment, 30);
  return {
    id: readId(value.id),
    corporateName: readText(value.corporateName, 150),
    tradeName: readText(value.tradeName, 150),
    cnpj: readText(value.cnpj, 14),
    businessSegment: businessSegment && segments.has(businessSegment) ? businessSegment as Organization["businessSegment"] : null,
    declaredUnitCount: readOptionalNumber(value.declaredUnitCount),
    registrationDate: value.registrationDate == null ? null : readText(value.registrationDate, 10),
  };
}

export async function listOrganizations(signal: AbortSignal): Promise<Organization[]> {
  try {
    return readArray(await getJson("/delta/organizations", signal), parseOrganization);
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de organização inválidos.");
  }
}

export async function updateOrganization(
  id: number,
  data: { corporateName: string; tradeName: string; cnpj: string; businessSegment: OrganizationSegment; declaredUnitCount: number | null },
  signal: AbortSignal,
): Promise<Organization> {
  try {
    return parseOrganization(await writeJson("PUT", `/delta/organizations/${id}`, {
      ...data,
      corporateName: data.corporateName.trim(),
      tradeName: data.tradeName.trim(),
      cnpj: data.cnpj.replace(/\D/g, ""),
    }, signal));
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("A API retornou dados de organização inválidos.");
  }
}
