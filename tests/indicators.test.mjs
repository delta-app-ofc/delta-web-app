import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const env = { VITE_POSTGRES_API_URL: "https://api.example.test" };
const session = { accessToken: "t", refreshToken: "r", expiresAt: Date.now() + 600000, refreshExpiresAt: Date.now() + 900000 };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const signal = () => new AbortController().signal;

async function indicators(handler) {
  const calls = [];
  const app = await harness(async (url, options) => { calls.push([url, options]); return handler(new URL(url)); }, session, env);
  return { calls, service: await app.service("indicators") };
}

const kpi = (extra = {}) => ({
  organizationId: 1, referenceMonth: "2026-10-01", totalLiters: 81188.09, totalCost: 1948.16, previousMonthLiters: 75732.74,
  variationPct: 7.2, projectedLiters: 86643.4, projectedCost: 2079.06, unitsTotal: 10, unitsOnTarget: 5, unitsAttention: 3,
  unitsCritical: 2, avgGoalPct: 86.1, estimatedSavingsValue: 97.5, savedLiters: 3421.5, isCompleteMonth: true, ...extra,
});

test("organization-kpi usa o endpoint SQL com JWT e valida os campos", async () => {
  const { calls, service } = await indicators(() => json([kpi(), kpi({ variationPct: null, projectedCost: null, isCompleteMonth: false })]));
  const result = await service.listOrganizationKpis(signal());
  assert.equal(new URL(calls[0][0]).pathname, "/delta/analytics/organization-kpi");
  assert.equal(calls[0][1].headers.Authorization, "Bearer t");
  assert.equal(result[0].variationPct, 7.2);
  assert.equal(result[1].variationPct, null);
  assert.equal(result[1].isCompleteMonth, false);
});

test("property-monthly envia o mês escolhido e valida goalStatus", async () => {
  const row = { propertyId: 3, propertyName: "Loja", organizationId: 1, builtAreaM2: 650, referenceMonth: "2026-10-01", totalLiters: 4026.5, litersPerM2: 6.2, variationPct: -18, monthlyTargetLiters: 7538.5, goalPct: 53.4, goalStatus: "OK", estimatedSavingsValue: 27, isCompleteMonth: true };
  const { calls, service } = await indicators(() => json([row]));
  const [item] = await service.listPropertyMonthly("2026-10-01", signal());
  assert.equal(new URL(calls[0][0]).searchParams.get("month"), "2026-10-01");
  assert.equal(item.goalStatus, "OK");
  const bad = await indicators(() => json([{ ...row, goalStatus: "QUALQUER" }]));
  await assert.rejects(bad.service.listPropertyMonthly(null, signal()), (error) => error.name === "ApiError");
});

test("monitoring-hourly repassa janela e horas", async () => {
  const { calls, service } = await indicators(() => json([{ propertyId: 3, propertyName: "Loja", windowMinutes: 10, readingHour: "2026-11-02T12:00:00", totalLiters: 10, avgFlowLmin: 0.2, readingsCount: 6 }]));
  const [item] = await service.listMonitoringHourly(24, 10, signal());
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, "/delta/analytics/monitoring-hourly");
  assert.equal(url.searchParams.get("hours"), "24");
  assert.equal(url.searchParams.get("windowMinutes"), "10");
  assert.equal(item.readingsCount, 6);
});

test("vazamentos mapeiam ATIVO/RESOLVIDO e rejeitam outros status", async () => {
  const leak = { alertKey: 1, propertyId: 3, propertyName: "Loja", deviceId: "ESP", severity: "high", triggeredAt: "2026-11-02T21:40:00", resolvedAt: null, leakStatus: "ATIVO", durationMinutes: 827.9, estimatedLossLiters: 10.2, estimatedLossCost: 0.31 };
  const { service } = await indicators(() => json([leak, { ...leak, alertKey: 2, leakStatus: "RESOLVIDO", resolvedAt: "2026-11-02T23:00:00" }]));
  const result = await service.listLeakIndicators(signal());
  assert.deepEqual(result.map((item) => item.isActive), [true, false]);
  const bad = await indicators(() => json([{ ...leak, leakStatus: "X" }]));
  await assert.rejects(bad.service.listLeakIndicators(signal()), (error) => error.name === "ApiError");
});

test("dispositivos e resumo exigem booleanos e números válidos", async () => {
  const device = { propertyId: 3, propertyName: "Loja", regionName: "GRANDE_SP", deviceId: "ESP", isActive: true, connectivityStatus: "online", isOnline: true, batteryLevel: 15, isLowBattery: true, wifiSignalRssi: "-60", firmwareVersion: "1.4.2", lastPingAt: "2026-11-03T10:00:00" };
  const { service } = await indicators((url) => json(url.pathname.endsWith("/summary")
    ? [{ organizationId: 1, propertiesTotal: 10, devicesPaired: 10, devicesOnline: 9, devicesLowBattery: 2, propertiesWithoutDevice: 0 }]
    : [device, { ...device, regionName: null, batteryLevel: null, lastPingAt: null }]));
  const devices = await service.listDeviceIndicators(signal());
  assert.equal(devices[0].isLowBattery, true);
  assert.equal(devices[1].lastPingAt, null);
  assert.equal((await service.listDeviceSummaries(signal()))[0].devicesOnline, 9);
  const bad = await indicators(() => json([{ ...device, isOnline: "sim" }]));
  await assert.rejects(bad.service.listDeviceIndicators(signal()), (error) => error.name === "ApiError");
});

test("mês de referência prefere o último mês fechado", async () => {
  const app = await harness(async () => json([]), session, env);
  const { pickReferenceMonth } = await app.service("../utils/indicators");
  const months = [
    { referenceMonth: "2026-09-01", isComplete: true },
    { referenceMonth: "2026-10-01", isComplete: true },
    { referenceMonth: "2026-11-01", isComplete: false },
  ];
  assert.equal(pickReferenceMonth(months), "2026-10-01");
  assert.equal(pickReferenceMonth([{ referenceMonth: "2026-11-01", isComplete: false }]), "2026-11-01");
  assert.equal(pickReferenceMonth([]), null);
});

test("esg e erro HTTP da API", async () => {
  const esg = { organizationId: 1, referenceMonth: "2026-10-01", savedLitersMonth: 3421.5, savedLitersYearProjection: 41058, tankTrucksEquivalent: 4.1, familyMonthsEquivalent: 2.7, unitsTotal: 10, unitsOnTarget: 5, avgGoalPct: 86.1, estimatedSavingsValue: 97.5, isCompleteMonth: true };
  const ok = await indicators(() => json([esg]));
  const [parsed] = await ok.service.listOrganizationEsg(signal());
  assert.equal(parsed.tankTrucksEquivalent, 4.1);
  assert.equal(parsed.isCompleteMonth, true);
  const down = await indicators(() => json({}, 500));
  await assert.rejects(down.service.listOrganizationEsg(signal()), (error) => error.name === "ApiError");
});
