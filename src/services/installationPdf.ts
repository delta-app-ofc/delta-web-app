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
  let y = 36;
  function table(head: string[], body: string[][], plain = false) {
    autoTable(doc, {
      startY: y, head: head.length ? [head] : undefined, body,
      theme: plain ? "plain" : "striped", margin: { top: 36, bottom: 20, left: 14, right: 14 },
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
      doc.text("DELTA", 14, 17);
      doc.setTextColor(28, 36, 50).setFontSize(14);
      doc.text(title, 14, 27);
      doc.setDrawColor(210, 220, 238).line(14, 32, 196, 32);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(90, 105, 125);
      doc.text(`Gerado em ${timestamp} (São Paulo)`, 14, 284);
      doc.text(`${page} / ${pages}`, 196, 284, { align: "right" });
    }
    return doc;
  }
  return { table, finish };
}

export function buildInstallationsPdf(installations: Installation[], referenceMonth: string, filters: InstallationFilters, warnings: string[], generatedAt = new Date()) {
  const title = "Instalações";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const drawnPages = new Set<number>();
  const timestamp = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
  }).format(generatedAt);
  const orderLabel = filters.sort === "litersPerM2" ? "Consumo por área" : "Consumo mensal";
  const statusLabel = {
    OK: "Normal",
    ATENCAO: "Atenção",
    CRITICO: "Crítico",
    SEM_META: "Sem meta",
  } as const;

  doc.setProperties({ title: "Relatório de instalações", author: "Delta", creator: "Delta" });

  function drawPageHeader(pageNumber: number) {
    if (drawnPages.has(pageNumber)) return;
    drawnPages.add(pageNumber);
    doc.setFillColor(25, 27, 28).rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFillColor(30, 43, 63).rect(0, 0, pageWidth, 31, "F");
    doc.setTextColor(238, 245, 255).setFont("helvetica", "bold").setFontSize(15);
    doc.text("DELTA", margin, 14);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(171, 194, 229);
    doc.text("Ambiente Industrial", margin, 20);
    doc.setTextColor(221, 232, 250).setFontSize(8);
    doc.text(timestamp, pageWidth - margin, 17, { align: "right" });
  }

  drawPageHeader(1);
  doc.setTextColor(245, 248, 255).setFont("helvetica", "bold").setFontSize(20);
  doc.text(title, margin, 43);
  doc.setTextColor(160, 184, 220).setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Consumo e metas · ${getMonthLabel(referenceMonth)}`, margin, 50);

  const cardY = 58;
  const cardGap = 4;
  const cardWidth = (pageWidth - margin * 2 - cardGap * 2) / 3;
  const cards = [
    { label: "Instalações exibidas", value: String(installations.length) },
    { label: "Ordenação", value: orderLabel },
    { label: "Filtro", value: filters.query.trim() || "Todas as unidades" },
  ];
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.setFillColor(32, 42, 56).setDrawColor(66, 89, 120);
    doc.roundedRect(x, cardY, cardWidth, 21, 3, 3, "FD");
    doc.setTextColor(157, 186, 230).setFont("helvetica", "normal").setFontSize(7);
    doc.text(card.label, x + 4, cardY + 7);
    doc.setTextColor(245, 248, 255).setFont("helvetica", "bold").setFontSize(9);
    const lines = doc.splitTextToSize(card.value, cardWidth - 8) as string[];
    doc.text(lines.slice(0, 2), x + 4, cardY + 14);
  });

  const body = installations.length ? installations.map(row => [
    row.name,
    [row.city, row.state].filter(Boolean).join(" / ") || unavailable,
    formatLiters(row.monthlyLiters),
    row.goalPct === null || row.goalStatus === "SEM_META" ? unavailable : `${Math.round(row.goalPct)}%`,
    row.goalStatus === null ? unavailable : statusLabel[row.goalStatus],
    row.litersPerM2 === null ? unavailable : `${decimal.format(row.litersPerM2)} L/m²`,
  ]) : [["Nenhuma instalação corresponde aos filtros.", "", "", "", "", ""]];

  autoTable(doc, {
    startY: 86,
    head: [["Instalação", "Cidade / UF", "Consumo mensal", "Meta", "Situação", "Consumo / área"]],
    body,
    theme: "grid",
    margin: { top: 39, bottom: 22, left: margin, right: margin },
    styles: {
      font: "helvetica", fontSize: 8, cellPadding: 2.8, overflow: "linebreak",
      textColor: [235, 242, 252], fillColor: [29, 34, 42], lineColor: [55, 70, 91],
      lineWidth: 0.15, valign: "middle",
    },
    headStyles: { fillColor: [44, 95, 208], textColor: [255, 255, 255], fontStyle: "bold", minCellHeight: 10 },
    alternateRowStyles: { fillColor: [35, 43, 54] },
    columnStyles: {
      0: { cellWidth: 47 }, 1: { cellWidth: 34 }, 2: { cellWidth: 31 },
      3: { cellWidth: 16 }, 4: { cellWidth: 24 }, 5: { cellWidth: 30 },
    },
    didParseCell: data => {
      if (data.section === "body" && data.column.index === 4) {
        const color: [number, number, number] = data.cell.raw === "Normal" ? [68, 208, 146] : data.cell.raw === "Atenção" ? [246, 203, 73] : data.cell.raw === "Crítico" ? [255, 107, 107] : [171, 194, 229];
        data.cell.styles.textColor = color;
        data.cell.styles.fontStyle = "bold";
      }
    },
    willDrawPage: data => drawPageHeader(data.pageNumber),
  });

  if (warnings.length > 0) {
    const lastY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
    autoTable(doc, {
      startY: lastY + 6,
      head: [["Observações"]],
      body: warnings.map(warning => [warning]),
      theme: "grid",
      margin: { top: 39, bottom: 22, left: margin, right: margin },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, overflow: "linebreak", textColor: [235, 242, 252], fillColor: [29, 34, 42], lineColor: [55, 70, 91] },
      headStyles: { fillColor: [44, 95, 208], textColor: 255, fontStyle: "bold" },
      willDrawPage: data => drawPageHeader(data.pageNumber),
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(66, 89, 120).line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    doc.setTextColor(157, 186, 230).setFont("helvetica", "normal").setFontSize(8);
    doc.text("Delta · Transformando hábitos, gota por gota.", margin, pageHeight - 10);
    doc.text(`${page} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }
  return doc;
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
