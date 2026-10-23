import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { harness } from "./helpers/service-harness.mjs";

const app = await harness(() => { throw new Error("Exportar não deve consultar a API."); });
const pdf = await app.service("installationPdf");
const now = new Date("2026-10-23T12:00:00Z");
async function snapshot(doc, filename) {
  if (!process.env.DELTA_PDF_QA_DIRECTORY) return;
  await mkdir(process.env.DELTA_PDF_QA_DIRECTORY, { recursive: true });
  await writeFile(join(process.env.DELTA_PDF_QA_DIRECTORY, filename), new Uint8Array(doc.output("arraybuffer")));
}

test("PDF da listagem pagina nomes longos sem perder a última instalação", async () => {
  const rows = Array.from({ length: 180 }, (_, i) => ({ id: i + 1, name: `Unidade-${i + 1} São Paulo · Água e eficiência industrial com nome longo`, city: "São Paulo", state: "SP", monthlyLiters: i === 0 ? 0 : i * 1500, litersPerM2: i === 0 ? null : i / 2 }));
  const doc = pdf.buildInstallationsPdf(rows, "2026-10-01", { query: "São Paulo", sort: "consumption" }, ["Parte dos dados está indisponível."], now);
  assert.ok(doc.getNumberOfPages() > 3);
  assert.ok(doc.output().startsWith("%PDF-"));
  assert.ok(doc.output().includes("Unidade-180"));
  assert.ok(doc.output().includes("0 L"));
  assert.ok(doc.output().includes("09:00"));
  await snapshot(doc, "instalacoes-lista-qa.pdf");
});

test("PDF dos detalhes exporta histórico diário completo e diferencia zero de valor ausente", async () => {
  const data = {
    installation: { id: 15, name: "Loja Água · Unidade de São Paulo" },
    address: { city: "São Paulo", state: "SP" },
    monthly: [{ propertyId: 15, referenceMonth: "2026-10-01", totalLiters: 0 }],
    daily: Array.from({ length: 150 }, (_, i) => ({ propertyId: 15, fullDate: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10), totalLiters: i === 0 ? 0 : 1500, costValue: i === 0 ? 0 : null })),
    warnings: [],
  };
  const doc = pdf.buildInstallationDetailsPdf(data, "2026-10-01", now);
  assert.ok(doc.getNumberOfPages() > 3);
  assert.ok(doc.output().includes("01/06/2026"));
  assert.ok(doc.output().includes("0,00"));
  assert.ok(doc.output().includes("0 L"));
  await snapshot(doc, "instalacao-detalhes-qa.pdf");
});

test("PDF pode representar uma busca vazia sem inventar instalação ou consumo", () => {
  const doc = pdf.buildInstallationsPdf([], "2026-10-01", { query: "Nenhuma", sort: "litersPerM2" }, [], now);
  assert.equal(doc.getNumberOfPages(), 1);
  assert.ok(doc.output().includes("Nenhuma"));
  assert.ok(!doc.output().includes("Unidade-"));
});
