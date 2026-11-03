import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const saved = () => ({ accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 86400000 });
const env = { VITE_MONGO_API_URL: "https://mongo.example.test", VITE_POSTGRES_API_URL: "https://api.example.test" };
const signal = () => new AbortController().signal;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const ID = "1234567890abcdef12345678";
const row = (extra = {}) => ({ alertKey: 7, propertyId: 3, propertyName: "LOJA SWIFT - MOEMA", deviceId: "ESP32-SP-1003", alertType: "fluxo_atipico", severity: "medium", triggeredAt: "2026-11-02T12:00:00", resolvedAt: null, ...extra });
const leak = (extra = {}) => ({ alertKey: 1, propertyId: 3, propertyName: "Loja", deviceId: "ESP", severity: "high", triggeredAt: "2026-11-02T21:40:00", resolvedAt: null, leakStatus: "ATIVO", durationMinutes: 100, estimatedLossLiters: 10.5, estimatedLossCost: 0.3, ...extra });

async function setup(handler) {
  const calls = [];
  const app = await harness(async (url, options) => { calls.push([url, options]); return handler(new URL(url), options); }, saved(), env);
  return { calls, alerts: await app.service("alerts"), rules: await app.service("../utils/alertsValidation") };
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

test("visita usa PUT autenticado e permite cancelar com null", async () => {
  const { calls, alerts } = await setup(() => json({ visit_until: null }));
  await alerts.declareVisit("device/shared", null, signal());
  assert.equal(new URL(calls[0][0]).pathname, "/api/detection/devices/device%2Fshared/visit");
  assert.equal(calls[0][1].method, "PUT");
  assert.equal(JSON.parse(calls[0][1].body).visit_until, null);
  await assert.rejects(alerts.declareVisit("  ", null, signal()));
});

test("evidências percorrem páginas, ordenam e tratam baseline ausente", async () => {
  const window = (time, liters, baseline) => ({ window_started_at: time, consumption_liters: liters, anomaly_evidence: baseline === undefined ? null : { baseline_median: baseline } });
  const { calls, alerts } = await setup((url) => url.searchParams.get("page") === "0"
    ? json({ content: [window("2026-11-02T12:10:00Z", 5, 2)], page: { totalPages: 2 } })
    : json({ content: [window("2026-11-02T12:00:00Z", 3)], page: { totalPages: 2 } }));
  const points = await alerts.listEvidence("dev-1", signal(), Date.parse("2026-11-02T13:00:00Z"));
  assert.equal(calls.length, 2);
  assert.equal(points.map((point) => point.time).join(","), "2026-11-02T12:00:00Z,2026-11-02T12:10:00Z");
  assert.equal(points[0].baseline, null);
  assert.equal(points[1].baseline, 2);
  assert.equal(new URL(calls[0][0]).searchParams.get("end"), "2026-11-02T13:00:00.000Z");
});

test("evidências rejeitam resposta inválida e séries acima do limite", async () => {
  for (const body of [[], { content: [{ consumption_liters: 1 }], page: { totalPages: 1 } }, { content: [{ window_started_at: "2026-11-02T12:00:00Z", consumption_liters: -1 }], page: { totalPages: 1 } }]) {
    const { alerts } = await setup(() => json(body));
    await assert.rejects(alerts.listEvidence("dev-1", signal()));
  }
  const endless = await setup(() => json({ content: [], page: { totalPages: 99 } }));
  await assert.rejects(endless.alerts.listEvidence("dev-1", signal()));
  assert.equal(endless.calls.length, 10);
  await assert.rejects(endless.alerts.listEvidence("", signal()));
});

test("erro HTTP da API vira ApiError sem vazar detalhes", async () => {
  const { alerts } = await setup(() => json({ detail: "segredo" }, 500));
  await assert.rejects(alerts.listAlerts(defaults, signal()), (error) => error.status === 500 && !error.message.includes("segredo"));
});

test("validação da visita devolve mensagem específica do campo", async () => {
  const { rules } = await setup(() => json({}));
  const now = Date.parse("2026-11-02T12:00:00Z");
  assert.match(rules.validateVisitUntil("", now).errors.until, /Informe quando/);
  assert.match(rules.validateVisitUntil("abc", now).errors.until, /válidas/);
  assert.match(rules.validateVisitUntil("2026-11-02T11:00:00Z", now).errors.until, /futura/);
  assert.match(rules.validateVisitUntil("2027-06-01T00:00:00Z", now).errors.until, /90 dias/);
  assert.equal(rules.validateVisitUntil("2026-11-03T12:00:00Z", now).iso, "2026-11-03T12:00:00.000Z");
  assert.equal(rules.isValidAlertId(ID), true);
  assert.equal(rules.isValidAlertId("123"), false);
  assert.equal(rules.isValidDeviceId("x".repeat(101)), false);
});
