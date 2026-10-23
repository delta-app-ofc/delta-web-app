import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const signal = () => new AbortController().signal;
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const session = () => ({ accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 600000 });
const form = { name: "Unidade", type: "PRÉDIO", cep: "02940-013", city: "São Paulo", state: "SP", regionId: "1", classification: "COMERCIAL_NORMAL_INDUSTRIAL", deviceId: "Delta-001", monthlyConsumption: "", monthlyGoal: "" };

async function backend(options = {}) {
  const calls = [];
  const properties = new Map(options.existing ? [[15, { id: 15, name: form.name, type: form.type, classification: form.classification, addressId: 3, organizationId: 9, builtAreaM2: 120 }]] : []);
  const addresses = new Map([[3, { id: 3, regionId: 1, cep: "02940013", city: form.city, state: "SP", latitude: -23, longitude: -46 }]]);
  let addressId = 3;
  let deviceAttempts = 0;
  const app = await harness(async (url, init) => {
    const path = new URL(url).pathname;
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ path, method, body });
    assert.equal(init.headers.Authorization, "Bearer access");
    if (path === "/delta/auth/me") return response({ id: 7, name: "Pessoa", email: "pessoa@example.test" });
    if (path === "/delta/user-properties/7") return response(options.denied ? [] : [...properties.keys()].map(propertyId => ({ userId: 7, propertyId })));
    if (path.startsWith("/delta/region-rate/")) return response(options.noRates ? [] : [{ id: 25, regionName: "GRANDE_SP" }]);
    if (path === "/delta/address" && method === "POST") {
      const row = { id: ++addressId, ...body };
      addresses.set(row.id, row);
      return response(row, 201);
    }
    if (path.startsWith("/delta/address/") && method === "GET") return response(addresses.get(Number(path.split("/").at(-1))));
    if (path === "/delta/property" && method === "POST") {
      if (options.propertyTimeout) throw new TypeError("Failed to fetch");
      const row = { id: 15, ...body };
      properties.set(15, row);
      return response(row, 201);
    }
    if (path === "/delta/property/15") {
      if (method === "PUT") properties.set(15, { ...properties.get(15), ...body });
      return response(properties.get(15));
    }
    if (path === "/delta/device" && method === "POST") {
      deviceAttempts++;
      if (options.deviceTimeout) throw new TypeError("Failed to fetch");
      if (options.conflictOnce && deviceAttempts === 1) return response({}, 409);
      return response({ id: 31, ...body }, 201);
    }
    assert.fail(`Requisição indevida: ${method} ${path}`);
  }, session());
  return { service: await app.service("installationSaving"), calls, properties, addresses };
}

test("cadastro grava endereço, propriedade associada ao usuário e identidade exata do dispositivo", async () => {
  const { service, calls, properties } = await backend();
  const save = service.createInstallationWorkflow();
  assert.equal(await save({ ...form, userId: 99 }, signal()), 15);
  const writes = calls.filter(call => call.method === "POST");
  assert.deepEqual(writes.map(call => call.path), ["/delta/address", "/delta/property", "/delta/device"]);
  assert.equal(writes[0].body.cep, "02940013");
  assert.equal(writes[1].body.userId, 7);
  assert.equal(writes[1].body.addressId, writes[0].body.id ?? 4);
  assert.equal(writes[2].body.deviceId, "Delta-001");
  assert.equal(properties.size, 1);
  assert.ok(writes.every(call => !("monthlyGoal" in call.body) && !("monthlyConsumption" in call.body)));
});

test("falha de dispositivo permite corrigir o ID sem duplicar endereço e instalação", async () => {
  const { service, calls } = await backend({ conflictOnce: true });
  const save = service.createInstallationWorkflow();
  await assert.rejects(save(form, signal()), error => error.field === "deviceId" && error.installationId === 15);
  assert.equal(await save({ ...form, deviceId: "Delta-002" }, signal()), 15);
  assert.equal(calls.filter(call => call.path === "/delta/property" && call.method === "POST").length, 1);
  assert.equal(calls.filter(call => call.path === "/delta/address" && call.method === "POST").length, 1);
});

test("POST com resultado desconhecido não é repetido automaticamente", async () => {
  const { service, calls } = await backend({ propertyTimeout: true });
  const save = service.createInstallationWorkflow();
  await assert.rejects(save(form, signal()));
  const count = calls.length;
  await assert.rejects(save(form, signal()), /tentativa anterior/);
  assert.equal(calls.length, count);
});

test("falha de conexão no dispositivo não repete o mesmo cadastro no retry", async () => {
  const { service, calls } = await backend({ deviceTimeout: true });
  const save = service.createInstallationWorkflow();
  await assert.rejects(save(form, signal()));
  await assert.rejects(save(form, signal()));
  assert.equal(calls.filter(call => call.path === "/delta/device").length, 1);
});

test("edição preserva organização e área construída e mantém dispositivos ao deixar o campo vazio", async () => {
  const { service, calls, properties } = await backend({ existing: true });
  const save = service.createInstallationEditor(15, { ...form, deviceId: "" });
  await save({ ...form, name: "Unidade alterada", deviceId: "" }, signal());
  assert.equal(properties.get(15).name, "Unidade alterada");
  const update = calls.find(call => call.method === "PUT");
  assert.equal(update.body.organizationId, 9);
  assert.equal(update.body.builtAreaM2, 120);
  assert.equal(update.body.addressId, 3);
  assert.equal(calls.filter(call => call.path === "/delta/device").length, 0);
});

test("alterar o endereço cria outro registro e não modifica endereço compartilhado", async () => {
  const { service, calls, properties, addresses } = await backend({ existing: true });
  const save = service.createInstallationEditor(15, form);
  await save({ ...form, city: "Lins", state: "SP", regionId: "2", deviceId: "" }, signal());
  assert.equal(addresses.get(3).city, "São Paulo");
  assert.notEqual(properties.get(15).addressId, 3);
  assert.ok(!calls.some(call => call.path === "/delta/address/3" && call.method === "PUT"));
});

test("edição não sobrescreve alterações concorrentes e não grava instalação sem associação", async () => {
  const concurrent = await backend({ existing: true });
  concurrent.properties.get(15).name = "Alterada por outro usuário";
  const save = concurrent.service.createInstallationEditor(15, form);
  await assert.rejects(save({ ...form, name: "Minha alteração", deviceId: "" }, signal()), /foram alterados/);
  assert.ok(!concurrent.calls.some(call => call.method !== "GET"));
  const denied = await backend({ existing: true, denied: true });
  await assert.rejects(denied.service.createInstallationEditor(15, form)(form, signal()));
  assert.ok(!denied.calls.some(call => call.method !== "GET"));
});

test("escrita renova token após 401 e mantém corpo e método na repetição", async () => {
  let writes = 0;
  const app = await harness(async (url, init) => {
    if (url.endsWith("/refresh")) return response({ accessToken: "new-access", expiresIn: 900 });
    writes++;
    assert.equal(init.method, "POST");
    assert.equal(init.body, '{"name":"Unidade"}');
    assert.equal(init.headers.Authorization, writes === 1 ? "Bearer access" : "Bearer new-access");
    return response({ id: 15 }, writes === 1 ? 401 : 201);
  }, session());
  assert.equal((await app.http.writeJson("POST", "/delta/property", { name: "Unidade" }, signal())).id, 15);
  assert.equal(writes, 2);
});

test("dados inválidos são recusados antes de qualquer gravação", async () => {
  const { service, calls } = await backend();
  await assert.rejects(service.createInstallationWorkflow()({ ...form, regionId: "0" }, signal()), error => error.field === "regionId");
  assert.equal(calls.length, 0);
});

test("região sem tarifa é sinalizada no campo antes de criar endereço", async () => {
  const { service, calls } = await backend({ noRates: true });
  await assert.rejects(service.createInstallationWorkflow()(form, signal()), error => error.field === "regionId");
  assert.ok(calls.every(call => call.method === "GET"));
});

test("erro de dispositivo na edição não repete a atualização dos dados gerais", async () => {
  const { service, calls } = await backend({ existing: true, conflictOnce: true });
  const save = service.createInstallationEditor(15, form);
  const changes = { ...form, name: "Nova denominação" };
  await assert.rejects(save(changes, signal()), error => error.field === "deviceId" && error.installationId === 15);
  await save({ ...changes, deviceId: "Delta-002" }, signal());
  assert.equal(calls.filter(call => call.method === "PUT").length, 1);
});

test("edição preserva área zero sem substituí-la por um valor ausente", async () => {
  const { service, properties } = await backend({ existing: true });
  properties.get(15).builtAreaM2 = 0;
  const save = service.createInstallationEditor(15, form);
  await save({ ...form, name: "Nome atualizado", deviceId: "" }, signal());
  assert.equal(properties.get(15).builtAreaM2, 0);
});
