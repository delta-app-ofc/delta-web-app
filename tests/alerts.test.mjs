import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const saved = () => ({ accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 86400000 });
const env = { VITE_MONGO_API_URL: "https://mongo.example.test" };
const signal = () => new AbortController().signal;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const ID = "1234567890abcdef12345678";
const rawAlert = (extra = {}) => ({ _id: ID, severity: "medium", triggered_at: "2026-11-02T12:00:00Z", title: "Meta", device_id: null, ...extra });

async function setup(handler) {
  const calls = [];
  const app = await harness(async (url, options) => { calls.push([url, options]); return handler(new URL(url), options); }, saved(), env);
  return { calls, alerts: await app.service("alerts"), rules: await app.service("../utils/alertsValidation") };
}
const page = (content) => ({ content, page: { totalElements: content.length, totalPages: 1 } });
const defaults = { severity: null, alertType: null, includeDismissed: false, page: 0, size: 20 };

test("alertas usam JWT no Mongo, filtros de severidade e aceitam alerta geral", async () => {
  const { calls, alerts } = await setup(() => json(page([rawAlert()])));
  const result = await alerts.listAlerts({ ...defaults, severity: "medium", includeDismissed: true }, signal());
  const url = new URL(calls[0][0]);
  assert.equal(result.content[0].deviceId, null);
  assert.equal(url.host, "mongo.example.test");
  assert.equal(url.searchParams.get("severity"), "medium");
  assert.equal(url.searchParams.get("include_dismissed"), "true");
  assert.equal(calls[0][1].headers.Authorization, "Bearer access");
});

test("lista filtra vazamentos por alert_type e converte datas de encerramento", async () => {
  const { alerts } = await setup(() => json(page([
    rawAlert({ alert_type: "vazamento_continuo", resolved_at: "2026-11-02T13:00:00Z" }),
    rawAlert({ _id: "abcdef1234567890abcdef12", alert_type: "meta" }),
  ])));
  const result = await alerts.listAlerts({ ...defaults, alertType: "vazamento_continuo" }, signal());
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].resolvedAt, "2026-11-02T13:00:00Z");
  assert.equal(result.content[0].dismissedAt, null);
});

test("lista rejeita alerta com id, data, severidade ou paginação inválidos", async () => {
  for (const body of [
    page([rawAlert({ _id: "x" })]),
    page([rawAlert({ triggered_at: "ontem" })]),
    page([rawAlert({ triggered_at: undefined })]),
    page([rawAlert({ severity: "critical" })]),
    { content: [rawAlert()] },
    { content: [rawAlert()], page: { totalElements: -1, totalPages: 1 } },
    { content: "x", page: { totalElements: 0, totalPages: 0 } },
  ]) {
    const { alerts } = await setup(() => json(body));
    await assert.rejects(alerts.listAlerts(defaults, signal()));
  }
});

test("alerta usa valores padrão quando título e mensagem faltam", async () => {
  const { alerts } = await setup(() => json(page([{ _id: ID, triggered_at: "2026-11-02T12:00:00Z" }])));
  const [alert] = (await alerts.listAlerts(defaults, signal())).content;
  assert.equal(alert.severity, "low");
  assert.equal(alert.title, "Alerta de consumo");
  assert.equal(alert.message, "Consulte as evidências do alerta.");
});

test("resumo de vazamentos valida números", async () => {
  const ok = await setup(() => json({ liters_per_day: 120, points: 2, window_hours: 24 }));
  assert.deepEqual({ ...(await ok.alerts.getLeakSummary(signal())) }, { litersPerDay: 120, points: 2, windowHours: 24 });
  assert.equal(new URL(ok.calls[0][0]).pathname, "/api/alerts/leak-summary");
  for (const body of [{ liters_per_day: -1, points: 1, window_hours: 24 }, { liters_per_day: 1, points: "a", window_hours: 24 }, []]) {
    const bad = await setup(() => json(body));
    await assert.rejects(bad.alerts.getLeakSummary(signal()));
  }
});

test("dispensar usa PATCH autenticado e recusa id inválido sem chamar a API", async () => {
  const { calls, alerts } = await setup(() => json({}));
  await alerts.dismissAlert(ID, signal());
  assert.equal(calls[0][1].method, "PATCH");
  assert.equal(new URL(calls[0][0]).pathname, `/api/alerts/${ID}/dismiss`);
  assert.equal(calls[0][1].headers.Authorization, "Bearer access");
  await assert.rejects(alerts.dismissAlert("../etc", signal()));
  assert.equal(calls.length, 1);
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
