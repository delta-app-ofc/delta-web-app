import type { VisitFormErrors } from "../types/alerts";

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const MAX_VISIT_DAYS = 90;
const DAY_MS = 86_400_000;

export const MAX_DEVICE_ID_LENGTH = 100;

export function isValidAlertId(id: string): boolean {
  return OBJECT_ID.test(id);
}

export function isValidDeviceId(deviceId: string): boolean {
  return deviceId.trim().length > 0 && deviceId.length <= MAX_DEVICE_ID_LENGTH;
}

/** Valida o término da visita e devolve a data em ISO, ou a mensagem do campo. */
export function validateVisitUntil(value: string, now = Date.now()): { iso: string | null; errors: VisitFormErrors } {
  if (!value.trim()) return { iso: null, errors: { until: "Informe quando a visita termina." } };
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return { iso: null, errors: { until: "Informe uma data e hora válidas." } };
  if (timestamp <= now) return { iso: null, errors: { until: "A visita deve terminar em uma data futura." } };
  if (timestamp > now + MAX_VISIT_DAYS * DAY_MS) return { iso: null, errors: { until: `A visita pode durar no máximo ${MAX_VISIT_DAYS} dias.` } };
  return { iso: new Date(timestamp).toISOString(), errors: {} };
}
