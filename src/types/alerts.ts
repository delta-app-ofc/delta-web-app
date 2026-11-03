export type Severity = "high" | "medium" | "low";

/** Tipo de alerta que a API Mongo grava para vazamento contínuo. */
export const LEAK_ALERT_TYPE = "vazamento_continuo";

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  alertType: string | null;
  propertyId: number | null;
  deviceId: string | null;
  triggeredAt: string;
  resolvedAt: string | null;
}

export interface AlertPage {
  content: Alert[];
  totalElements: number;
  totalPages: number;
}

export interface AlertQuery {
  severity: Severity | null;
  alertType: string | null;
  onlyActive: boolean;
  page: number;
  size: number;
}

export interface LeakSummary {
  activeCount: number;
  lossLiters: number;
  lossCost: number;
}
