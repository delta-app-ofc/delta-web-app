import type { Installation } from "../types/installation";

const litersFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatLiters(value: number | null): string {
  return value === null ? "Não disponível" : `${litersFormatter.format(value)} L`;
}

export function normalizeSearch(value: string): string {
  return value.replace(/_/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

const knownLocationLabels: Readonly<Record<string, string>> = {
  GRANDE_SP: "Grande São Paulo",
};

const knownAccentCorrections: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bSao Paulo\b/gi, "São Paulo"],
  [/\bSao Jose dos Campos\b/gi, "São José dos Campos"],
  [/\bTatuape\b/gi, "Tatuapé"],
  [/\bDistribuicao\b/gi, "Distribuição"],
  [/\bCaptacao\b/gi, "Captação"],
  [/\bAgua\b/gi, "Água"],
  [/\bEconomicas\b/gi, "Econômicas"],
];

export function formatInstallationLabel(value: string | null): string | null {
  const locationLabel = value?.trim().toLocaleUpperCase("pt-BR");
  if (locationLabel && knownLocationLabels[locationLabel]) return knownLocationLabels[locationLabel];
  const normalized = value?.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const formatted = normalized.toLocaleLowerCase("pt-BR").replace(/(^|[\s-])([\p{L}\p{N}])/gu, (_match, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`);
  const withAccents = knownAccentCorrections.reduce((label, [pattern, replacement]) => label.replace(pattern, replacement), formatted);
  return withAccents.replace(/\b(Sp)\b/g, "SP").replace(/\s+(Da|Das|De|Do|Dos|E)\b/g, (part) => part.toLocaleLowerCase("pt-BR"));
}

export function getCurrentReferenceMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("Não foi possível determinar o mês de referência.");
  return `${year}-${month}-01`;
}

/** Período YYYY-MM no fuso de São Paulo, formato esperado pela API de ranking. */
export function getCurrentPeriod(): string {
  return getCurrentReferenceMonth().slice(0, 7);
}

// Mês inválido ou ausente vira "—" em vez de derrubar a página (Intl lança RangeError com datas inválidas).
function monthDate(referenceMonth: string): Date | null {
  const date = new Date(`${referenceMonth}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getMonthLabel(referenceMonth: string): string {
  const date = monthDate(referenceMonth);
  return date ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date) : "—";
}

export function getShortMonthLabel(referenceMonth: string): string {
  const date = monthDate(referenceMonth);
  return date
    ? new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(date)
      .replace(". de ", "/").replace(" de ", "/").replace(/\.$/, "")
    : "—";
}

export function isInSaoPaulo(installation: Installation): boolean {
  const state = normalizeSearch(installation.state ?? "");
  return state === "sp" || state === "sao paulo";
}
