export type OrganizationResolution =
  | { status: "resolved"; organizationId: number }
  | { status: "multiple"; organizationIds: number[] }
  | { status: "none" };

export interface Organization {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  businessSegment: "VAREJO" | "INDUSTRIA" | "CONDOMINIO" | "FACILITIES" | null;
  declaredUnitCount: number | null;
  registrationDate: string | null;
}
