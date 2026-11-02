export type OrganizationResolution =
  | { status: "resolved"; organizationId: number }
  | { status: "multiple"; organizationIds: number[] }
  | { status: "none" };
