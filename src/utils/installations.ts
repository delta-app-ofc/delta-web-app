import type { Installation } from "../types/installation";

const litersFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatLiters(value: number | null): string {
  return value === null ? "Não disponível" : `${litersFormatter.format(value)} L`;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
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

export function getMonthLabel(referenceMonth: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${referenceMonth}T00:00:00Z`));
}

export function isInSaoPaulo(installation: Installation): boolean {
  const state = normalizeSearch(installation.state ?? "");
  return state === "sp" || state === "sao paulo";
}
