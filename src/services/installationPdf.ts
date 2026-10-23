import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Installation, InstallationFilters } from "../types/installation";
import type { InstallationDetails } from "../types/installationDetails";
import { formatLiters, getMonthLabel } from "../utils/installations";

const unavailable = "Não disponível";
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function report(title: string, generatedAt: Date) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title, author: "Delta", creator: "Delta" });
  let y = 40;
  function table(head: string[], body: string[][], plain = false) {
    autoTable(doc, {
      startY: y, head: head.length ? [head] : undefined, body,
      theme: plain ? "plain" : "striped", margin: { top: 40, bottom: 22, left: 16, right: 16 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [28, 36, 50] },
      headStyles: { fillColor: [44, 95, 208], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: plain ? undefined : { fillColor: [241, 245, 252] },
      didDrawPage: data => { y = (data.cursor?.y ?? 40) + 10; },
    });
  }
  function finish() {
    const pages = doc.getNumberOfPages();
    const timestamp = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(generatedAt);
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setTextColor(44, 95, 208).setFont("helvetica", "bold").setFontSize(18);
      doc.text("DELTA", 16, 17);
      doc.setTextColor(28, 36, 50).setFontSize(14);
      doc.text(title, 16, 27);
      doc.setDrawColor(210, 220, 238).line(16, 32, 194, 32);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(90, 105, 125);
      doc.text(`Gerado em ${timestamp} (São Paulo)`, 16, 284);
      doc.text(`${page} / ${pages}`, 194, 284, { align: "right" });
    }
    return doc;
  }
  return { table, finish };
}

export function buildInstallationsPdf(installations: Installation[], referenceMonth: string, filters: InstallationFilters, warnings: string[], generatedAt = new Date()) {
  const { table, finish } = report("Relatório de instalações", generatedAt);
  table([], [
    ["Período", getMonthLabel(referenceMonth)],
    ["Instalações exibidas", String(installations.length)],
    ["Busca aplicada", filters.query.trim() || "Todas as instalações associadas à conta"],
    ["Ordenação", filters.sort === "litersPerM2" ? "Consumo por área (L/m²), decrescente" : "Consumo mensal, decrescente"],
  ], true);
  table(["Instalação", "Cidade / UF", "Consumo mensal", "Consumo por área"], installations.length ? installations.map(row => [
    row.name, [row.city, row.state].filter(Boolean).join(" / ") || unavailable,
    formatLiters(row.monthlyLiters), row.litersPerM2 === null ? unavailable : `${decimal.format(row.litersPerM2)} L/m²`,
  ]) : [["Nenhuma instalação corresponde aos filtros.", "", "", ""]]);
  table([], [["Observações", [...warnings, "Valores ausentes não representam consumo zero. Metas e status ainda não estão disponíveis."].join(" ")]], true);
  return finish();
}

export function buildInstallationDetailsPdf(data: InstallationDetails, referenceMonth: string, generatedAt = new Date()) {
  const { table, finish } = report("Detalhes da instalação", generatedAt);
  const monthly = data.monthly.find(row => row.referenceMonth === referenceMonth);
  const currentDays = data.daily.filter(row => row.fullDate.slice(0, 7) === referenceMonth.slice(0, 7));
  const cost = currentDays.length && currentDays.every(row => row.costValue !== null)
    ? currency.format(currentDays.reduce((sum, row) => sum + (row.costValue ?? 0), 0)) : unavailable;
  table([], [
    ["Instalação", data.installation.name],
    ["Localização", [data.address?.city, data.address?.state].filter(Boolean).join(" / ") || unavailable],
    ["Período atual", getMonthLabel(referenceMonth)],
    ["Consumo no mês", formatLiters(monthly?.totalLiters ?? null)],
    ["Custo das leituras disponíveis no mês", cost],
  ], true);
  table(["Histórico mensal", "Consumo (m³)"], data.monthly.length ? [...data.monthly].sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth)).map(row => [getMonthLabel(row.referenceMonth), decimal.format(row.totalLiters / 1000)]) : [["Nenhuma leitura mensal disponível.", ""]]);
  table(["Histórico diário", "Consumo", "Custo"], data.daily.length ? [...data.daily].sort((a, b) => b.fullDate.localeCompare(a.fullDate)).map(row => [
    date.format(new Date(`${row.fullDate}T00:00:00Z`)), formatLiters(row.totalLiters), row.costValue === null ? unavailable : currency.format(row.costValue),
  ]) : [["Nenhuma leitura diária disponível.", "", ""]]);
  table([], [["Observações", [...data.warnings, "Valores ausentes não representam consumo zero. Vazão, metas, alertas e clima ainda não estão disponíveis."].join(" ")]], true);
  return finish();
}
