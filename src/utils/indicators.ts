// Mês exibido nos indicadores: o mais recente já fechado; sem mês fechado, o mais recente disponível.
// Mês parcial não é comparável com o anterior, por isso só entra quando é o único disponível.
export function pickReferenceMonth(months: readonly { referenceMonth: string; isComplete: boolean }[]): string | null {
  if (months.length === 0) return null;
  const sorted = [...new Set(months.map((item) => item.referenceMonth))].sort();
  const closed = sorted.filter((month) => months.filter((item) => item.referenceMonth === month).every((item) => item.isComplete));
  return (closed.length ? closed : sorted).slice(-1)[0];
}
