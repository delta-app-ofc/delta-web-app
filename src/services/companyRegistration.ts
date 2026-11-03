import { ApiError, writeJson } from "./http";
import { createOrganization } from "./organizations";
import { isRecord, readId } from "../utils/apiValidation";
import { isValidCnpjLength, onlyDigits } from "../utils/companyValidation";
import type {
  CompanyRegisterData,
  CompanyRegistrationProgress,
  OrganizationSegment,
  PropertyClassificationCode,
} from "../types/companyRegister";

const classificationCodes: Record<string, PropertyClassificationCode> = {
  "Comercial normal industrial": "COMERCIAL_NORMAL_INDUSTRIAL",
  "Comercial entidade assistência social": "COMERCIAL_ENTIDADE_ASSISTENCIA_SOCIAL",
  "Pública com contrato": "PUBLICA_COM_CONTRATO",
  "Comercial especial": "COMERCIAL_ESPECIAL",
};

// O cadastro pede o segmento em texto livre; a API só aceita quatro valores.
export function toOrganizationSegment(value: string): OrganizationSegment {
  const text = value.toLowerCase();
  if (text.includes("varej")) return "VAREJO";
  if (text.includes("condom")) return "CONDOMINIO";
  if (text.includes("facilit")) return "FACILITIES";
  return "INDUSTRIA";
}

// Executa as etapas pendentes e registra cada uma em `progress`, para que uma nova tentativa não duplique o que já foi criado.
export async function registerCompany(
  data: CompanyRegisterData,
  progress: CompanyRegistrationProgress,
  signal: AbortSignal,
): Promise<void> {
  const classification = classificationCodes[data.classification];
  if (!classification) throw new ApiError("Selecione o tipo da indústria.");
  if (!isValidCnpjLength(data.cnpj)) throw new ApiError("O CNPJ deve ter 14 números.");
  const cep = onlyDigits(data.postalCode);
  if (cep.length !== 8) throw new ApiError("O CEP deve ter 8 números.");
  if (progress.organizationId === undefined) {
    progress.organizationId = await createOrganization({
      corporateName: data.legalName.trim(), tradeName: data.tradeName.trim(), cnpj: onlyDigits(data.cnpj),
      businessSegment: toOrganizationSegment(data.industrySegment), declaredUnitCount: 1,
    }, signal);
  }
  if (progress.propertyId === undefined) {
    const result = await writeJson("POST", "/delta/auth/complete-registration", {
      address: { cep, city: data.city.trim(), state: data.state.trim() },
      property: { name: data.unitName.trim(), type: "PRÉDIO", classification, organizationId: progress.organizationId },
      habits: [],
    }, signal);
    if (!isRecord(result) || !isRecord(result.property)) throw new ApiError("O serviço retornou um cadastro inválido.");
    progress.propertyId = readId(result.property.id);
  }
  if (data.deviceId.trim() && !progress.deviceLinked) {
    await writeJson("POST", "/delta/device", { propertyId: progress.propertyId, deviceId: data.deviceId.trim(), isActive: true }, signal);
    progress.deviceLinked = true;
  }
}
