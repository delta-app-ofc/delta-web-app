export interface InstallationRecord {
  id: number;
  name: string;
  addressId: number | null;
  builtAreaM2: number | null;
  type: "CASA" | "PRÉDIO" | null;
  classification?: string | null;
  organizationId?: number | null;
}

export interface Installation {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  monthlyLiters: number | null;
  litersPerM2: number | null;
}

export type InstallationSort = "consumption" | "litersPerM2";

export interface InstallationFilters {
  query: string;
  sort: InstallationSort;
}

export interface InstallationsResult {
  installations: Installation[];
  warnings: string[];
}
