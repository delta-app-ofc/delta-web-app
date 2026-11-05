export type OrganizationResolution =
  | { status: "resolved"; organizationId: number }
  | { status: "multiple"; organizationIds: number[] }
  | { status: "none" };

export type OrganizationSegment = "VAREJO" | "INDUSTRIA" | "CONDOMINIO" | "FACILITIES";

export interface Organization {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  businessSegment: OrganizationSegment | null;
  declaredUnitCount: number | null;
  registrationDate: string | null;
}
