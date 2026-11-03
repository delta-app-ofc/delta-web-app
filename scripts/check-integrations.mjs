// Verifica, contra os serviços reais, o que o front consome. Uso:
//   node --env-file=.env.local scripts/check-integrations.mjs
// Opcional: DELTA_CHECK_EMAIL e DELTA_CHECK_PASSWORD para testar rotas autenticadas (nunca versione).
const env = process.env;
const urls = {
  postgres: env.VITE_POSTGRES_API_URL,
  ranking: env.VITE_RANKING_API_URL,
  ai: env.VITE_AI_API_URL,
  mongo: env.VITE_MONGO_API_URL,
};
const results = [];

async function check(name, run) {
  try {
    const detail = await run();
    results.push({ name, ok: true, detail });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

async function call(base, path, options = {}) {
  if (!base) throw new Error("URL não configurada");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`, { signal: AbortSignal.timeout(60000), ...options });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* corpo não JSON */ }
  return { status: response.status, body, headers: response.headers };
}

function expectStatus(result, allowed) {
  if (!allowed.includes(result.status)) throw new Error(`HTTP ${result.status}`);
  return `HTTP ${result.status}`;
}

async function login() {
  if (!env.DELTA_CHECK_EMAIL || !env.DELTA_CHECK_PASSWORD) return null;
  const result = await call(urls.postgres, "/delta/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.DELTA_CHECK_EMAIL, password: env.DELTA_CHECK_PASSWORD }),
  });
  return result.status === 200 && typeof result.body?.accessToken === "string" ? result.body.accessToken : null;
}

await check("mongo /health", async () => expectStatus(await call(urls.mongo, "/health"), [200]));
await check("redis /health", async () => expectStatus(await call(urls.ranking, "/health"), [200]));
await check("ia /health", async () => expectStatus(await call(urls.ai, "/health"), [200]));
await check("postgres /health", async () => expectStatus(await call(urls.postgres, "/health"), [200]));
await check("mongo telemetria pública", async () => expectStatus(await call(urls.mongo, "/api/telemetry/device-status?device_id=check"), [200, 404]));
await check("mongo alertas exigem JWT", async () => expectStatus(await call(urls.mongo, "/api/alerts"), [401]));
await check("ia exige JWT", async () => expectStatus(await call(urls.ai, "/sessions"), [401, 403]));
await check("ranking contrato", async () => {
  const result = await call(urls.ranking, "/get-ranking?organizationId=1&period=2026-11&criterion=perm2&limit=1");
  expectStatus(result, [200]);
  if (!Array.isArray(result.body?.items)) throw new Error("resposta sem items");
  return `HTTP 200, ${result.body.items.length} item(ns)`;
});
for (const [name, base] of [["mongo", urls.mongo], ["redis", urls.ranking], ["ia", urls.ai]]) {
  await check(`CORS ${name} (origem ${env.CHECK_ORIGIN ?? "http://localhost:5173"})`, async () => {
    const origin = env.CHECK_ORIGIN ?? "http://localhost:5173";
    const result = await call(base, "/health", { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "GET" } });
    const allowed = result.headers.get("access-control-allow-origin");
    if (allowed !== "*" && allowed !== origin) throw new Error(`origem não permitida (${allowed ?? "sem cabeçalho"})`);
    return `allow-origin: ${allowed}`;
  });
}

const token = await login();
if (token) {
  const auth = { Authorization: `Bearer ${token}` };
  await check("mongo alertas com JWT", async () => expectStatus(await call(urls.mongo, "/api/alerts?size=1", { headers: auth }), [200]));
  await check("mongo leak-summary com JWT", async () => expectStatus(await call(urls.mongo, "/api/alerts/leak-summary", { headers: auth }), [200]));
  await check("ia sessões com JWT", async () => expectStatus(await call(urls.ai, "/sessions?limit=1", { headers: auth }), [200]));
} else {
  results.push({ name: "rotas autenticadas", ok: true, detail: "ignoradas (defina DELTA_CHECK_EMAIL e DELTA_CHECK_PASSWORD)" });
}

for (const { name, ok, detail } of results) console.log(`${ok ? "OK  " : "FALHA"} ${name}: ${detail}`);
process.exit(results.some((result) => !result.ok) ? 1 : 0);
