import type { Organization } from "../types/organization";
import { isRecord, readArray, readId, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

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
