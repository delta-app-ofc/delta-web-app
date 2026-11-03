import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const saved = () => ({ accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 86400000 });
const env = { VITE_POSTGRES_API_URL: "https://api.example.test" };
const signal = () => new AbortController().signal;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const row = (extra = {}) => ({ alertKey: 7, propertyId: 3, propertyName: "LOJA SWIFT - MOEMA", deviceId: "ESP32-SP-1003", alertType: "fluxo_atipico", severity: "medium", triggeredAt: "2026-11-02T12:00:00", resolvedAt: null, ...extra });
const leak = (extra = {}) => ({ alertKey: 1, propertyId: 3, propertyName: "Loja", deviceId: "ESP", severity: "high", triggeredAt: "2026-11-02T21:40:00", resolvedAt: null, leakStatus: "ATIVO", durationMinutes: 100, estimatedLossLiters: 10.5, estimatedLossCost: 0.3, ...extra });

async function setup(handler) {
  const calls = [];
  const app = await harness(async (url, options) => { calls.push([url, options]); return handler(new URL(url), options); }, saved(), env);
  return { calls, alerts: await app.service("alerts") };
}
const defaults = { severity: null, alertType: null, onlyActive: false, page: 0, size: 20 };

test("alertas vêm da view SQL com JWT, filtros e título derivado do tipo", async () => {
  const { calls, alerts } = await setup(() => json([row()]));
  const result = await alerts.listAlerts({ ...defaults, severity: "medium", alertType: "fluxo_atipico", onlyActive: true }, signal());
  const url = new URL(calls[0][0]);
  assert.equal(url.host, "api.example.test");
  assert.equal(url.pathname, "/delta/analytics/alerts");
  assert.equal(url.searchParams.get("severity"), "medium");
  assert.equal(url.searchParams.get("alertType"), "fluxo_atipico");
  assert.equal(url.searchParams.get("onlyActive"), "true");
  assert.equal(calls[0][1].headers.Authorization, "Bearer access");
  assert.equal(result.content[0].title, "Consumo acima do esperado");
  assert.equal(result.content[0].id, "7");
  assert.equal(result.content[0].resolvedAt, null);
});

test("lista pagina no cliente e informa total de páginas", async () => {
  const rows = Array.from({ length: 45 }, (_, index) => row({ alertKey: index + 1 }));
  const { alerts } = await setup(() => json(rows));
  const last = await alerts.listAlerts({ ...defaults, page: 2 }, signal());
  assert.equal(last.content.length, 5);
  assert.equal(last.totalElements, 45);
  assert.equal(last.totalPages, 3);
  const empty = await (await setup(() => json([]))).alerts.listAlerts(defaults, signal());
  assert.equal(empty.totalPages, 0);
});

test("lista rejeita alerta sem chave, data ou com severidade inválida", async () => {
  for (const body of [[row({ alertKey: undefined })], [row({ triggeredAt: "ontem" })], [row({ triggeredAt: undefined })], [row({ severity: "critical" })], { content: [] }, ["x"]]) {
    const { alerts } = await setup(() => json(body));
    await assert.rejects(alerts.listAlerts(defaults, signal()));
  }
});

test("alerta sem severidade vira informativo e tipo desconhecido usa título padrão", async () => {
  const { alerts } = await setup(() => json([row({ severity: null, alertType: "novo_tipo", propertyId: null })]));
  const [alert] = (await alerts.listAlerts(defaults, signal())).content;
  assert.equal(alert.severity, "low");
  assert.equal(alert.title, "Alerta de consumo");
  assert.equal(alert.propertyId, null);
});

test("resumo de vazamentos soma perda dos ativos e custo do histórico", async () => {
  const ok = await setup(() => json([leak(), leak({ alertKey: 2, estimatedLossLiters: 4, estimatedLossCost: 0.2 }), leak({ alertKey: 3, leakStatus: "RESOLVIDO", resolvedAt: "2026-11-02T23:00:00", estimatedLossLiters: 99, estimatedLossCost: 1 })]));
  const summary = await ok.alerts.getLeakSummary(signal());
  assert.equal(new URL(ok.calls[0][0]).pathname, "/delta/analytics/leaks");
  assert.equal(summary.activeCount, 2);
  assert.equal(summary.lossLiters, 14.5);
  assert.ok(Math.abs(summary.lossCost - 1.5) < 1e-9);
  const bad = await setup(() => json([leak({ leakStatus: "X" })]));
  await assert.rejects(bad.alerts.getLeakSummary(signal()));
});

test("erro HTTP da API vira ApiError sem vazar detalhes", async () => {
  const { alerts } = await setup(() => json({ detail: "segredo" }, 500));
  await assert.rejects(alerts.listAlerts(defaults, signal()), (error) => error.status === 500 && !error.message.includes("segredo"));
});
