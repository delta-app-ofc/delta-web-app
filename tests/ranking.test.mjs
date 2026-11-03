import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const env = { VITE_RANKING_API_URL: "https://ranking.example.test/" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const signal = () => new AbortController().signal;
const item = (extra = {}) => ({ position: 1, propertyId: 4, name: "Loja", areaM2: 50, consumptionLiters: 1000, litersPerM2: 20, ...extra });

async function ranking(handler) {
  const calls = [];
  const app = await harness(async (url, options) => { calls.push([url, options]); return handler(new URL(url)); }, null, env);
  return { calls, service: await app.service("ranking") };
}

test("ranking lê litersPerM2 e withoutArea no formato real da API Redis", async () => {
  const { calls, service } = await ranking(() => json({ items: [item(), item({ position: 2, propertyId: 5, name: "", areaM2: null, litersPerM2: null })], withoutArea: [{ propertyId: 9, name: "Sem área" }] }));
  const result = await service.getRanking(3, "2026-11", "perm2", 10, signal());
  const url = new URL(calls[0][0]);
  assert.equal(url.host, "ranking.example.test");
  assert.equal(url.pathname, "/get-ranking");
  assert.equal(url.searchParams.get("organizationId"), "3");
  assert.equal(result.items[0].value, 20);
  assert.equal(result.items[0].id, "4");
  assert.equal(result.items[1].name, "Instalação 5");
  assert.equal(result.items[1].value, null);
  assert.equal(result.withoutArea.join(","), "9");
  assert.equal(calls[0][1].headers.Authorization, undefined);
});

test("ranking aceita resposta sem withoutArea e rejeita formatos inválidos", async () => {
  const ok = await ranking(() => json({ items: [] }));
  assert.equal((await ok.service.getRanking(3, "2026-11", "perm2", 10, signal())).withoutArea.length, 0);
  for (const body of [[], { items: "x" }, { items: [item({ propertyId: "a" })] }, { items: [item({ position: 0 })] }, { items: [], withoutArea: [{ propertyId: -1 }] }]) {
    const bad = await ranking(() => json(body));
    await assert.rejects(bad.service.getRanking(3, "2026-11", "perm2", 10, signal()), (error) => error.name === "ApiError");
  }
});

test("ranking propaga falha HTTP da API", async () => {
  const { service } = await ranking(() => json({ detail: "x" }, 500));
  await assert.rejects(service.getRanking(3, "2026-11", "perm2", 10, signal()), (error) => error.status === 500);
});
