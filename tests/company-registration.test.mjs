import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "./helpers/service-harness.mjs";

const session = { accessToken: "t", refreshToken: "r", expiresAt: Date.now() + 600000, refreshExpiresAt: Date.now() + 900000 };
const data = { legalName: "Acme Ltda", tradeName: "Acme", cnpj: "12.345.678/0001-90", industrySegment: "Indústria têxtil", unitName: "Matriz",
  postalCode: "01001-000", state: "SP", city: "São Paulo", classification: "Comercial normal industrial", deviceId: "ESP-1" };
const places = { results: [
  { latitude: -22.1, longitude: -43.2, admin1: "Rio de Janeiro" },
  { latitude: -23.55, longitude: -46.63, admin1: "São Paulo" },
] };

function reply(body, status = 200) { return { ok: status < 400, status, json: async () => body }; }

// Responde ao geocoding público e às rotas da API; `onApi` recebe só as chamadas à API do delta.
function backend(onApi, calls = []) {
  return async (url, init) => {
    const target = new URL(url);
    if (target.host === "geocoding-api.open-meteo.com") { calls.push({ path: "geocoding", search: target.search }); return reply(places); }
    calls.push({ path: target.pathname, body: JSON.parse(init.body) });
    return onApi(target.pathname);
  };
}

test("registerCompany cria empresa e unidade numa só chamada e depois vincula o dispositivo", async () => {
  const calls = [];
  const h = await harness(backend((path) => path.endsWith("/complete-registration") ? reply({ property: { id: 9, organizationId: 5 } }) : reply({ propertyId: 9, deviceId: "ESP-1" }), calls), session);
  const { registerCompany } = await h.service("companyRegistration");
  const progress = {};
  await registerCompany(data, progress, new AbortController().signal);
  assert.equal(calls.some((call) => call.path === "/delta/organizations"), false);
  const registration = calls.find((call) => call.path === "/delta/auth/complete-registration").body;
  assert.deepEqual(registration.organization, { corporateName: "Acme Ltda", tradeName: "Acme", cnpj: "12345678000190", businessSegment: "INDUSTRIA", declaredUnitCount: 1 });
  assert.equal(registration.property.classification, "COMERCIAL_NORMAL_INDUSTRIAL");
  assert.equal(registration.property.organizationId, undefined);
  assert.deepEqual({ ...registration.address }, { cep: "01001000", city: "São Paulo", state: "SP", latitude: -23.55, longitude: -46.63 });
  assert.deepEqual({ ...progress, coordinates: undefined }, { coordinates: undefined, propertyId: 9, deviceLinked: true });
});

test("nova tentativa reaproveita as coordenadas e não repete o que já foi criado", async () => {
  let registrations = 0, failOnce = true;
  const calls = [];
  const h = await harness(backend((path) => {
    if (path.endsWith("/complete-registration")) { registrations += 1; if (failOnce) { failOnce = false; return reply({}, 500); } }
    return reply({ property: { id: 9 } });
  }, calls), session);
  const { registerCompany } = await h.service("companyRegistration");
  const progress = {};
  await assert.rejects(registerCompany({ ...data, deviceId: "" }, progress, new AbortController().signal));
  await registerCompany({ ...data, deviceId: "" }, progress, new AbortController().signal);
  assert.equal(registrations, 2);
  assert.equal(calls.filter((call) => call.path === "geocoding").length, 1);
  assert.equal(progress.propertyId, 9);
  await registerCompany({ ...data, deviceId: "" }, progress, new AbortController().signal);
  assert.equal(registrations, 2);
});

test("CNPJ duplicado e cidade fora da área atendida mostram o motivo informado pela API", async () => {
  const duplicate = await harness(backend(() => reply({ message: "Já existe uma organização cadastrada com esse CNPJ" }, 409)), session);
  await assert.rejects((await duplicate.service("companyRegistration")).registerCompany(data, {}, new AbortController().signal), /esse CNPJ/);
  const refused = await harness(backend(() => reply({ message: "O Delta atende apenas cidades de São Paulo cobertas pela Sabesp." }, 400)), session);
  await assert.rejects((await refused.service("companyRegistration")).registerCompany(data, {}, new AbortController().signal), /Sabesp/);
  const silent = await harness(backend(() => reply({}, 400)), session);
  await assert.rejects((await silent.service("companyRegistration")).registerCompany(data, {}, new AbortController().signal), /Confira as informações/);
  const server = await harness(backend(() => reply({ message: "segredo interno" }, 500)), session);
  await assert.rejects((await server.service("companyRegistration")).registerCompany(data, {}, new AbortController().signal), (error) => !error.message.includes("segredo"));
});

test("geocoding prefere a cidade do estado informado e falha com mensagem clara", async () => {
  const h = await harness(async () => reply(places), session);
  const { geocodeCity } = await h.service("geocoding");
  assert.deepEqual({ ...(await geocodeCity("Niterói", "RJ", new AbortController().signal)) }, { latitude: -22.1, longitude: -43.2 });
  assert.deepEqual({ ...(await geocodeCity("Cidade", "SP", new AbortController().signal)) }, { latitude: -23.55, longitude: -46.63 });
  assert.deepEqual({ ...(await geocodeCity("Cidade", "XX", new AbortController().signal)) }, { latitude: -22.1, longitude: -43.2 });
  await assert.rejects(geocodeCity("  ", "SP", new AbortController().signal), /cidade/);
  const empty = await harness(async () => reply({}), session);
  await assert.rejects((await empty.service("geocoding")).geocodeCity("Nenhuma", "SP", new AbortController().signal), /Não encontramos/);
  const down = await harness(async () => reply({}, 500), session);
  await assert.rejects((await down.service("geocoding")).geocodeCity("Cidade", "SP", new AbortController().signal), /Não foi possível localizar/);
});

test("registerCompany recusa CNPJ e CEP incompletos sem chamar nenhum serviço", async () => {
  const h = await harness(async () => { throw new Error("não deveria chamar"); }, session);
  const { registerCompany } = await h.service("companyRegistration");
  await assert.rejects(registerCompany({ ...data, cnpj: "123" }, {}, new AbortController().signal), /14 números/);
  await assert.rejects(registerCompany({ ...data, postalCode: "1" }, {}, new AbortController().signal), /8 números/);
  await assert.rejects(registerCompany({ ...data, classification: "" }, {}, new AbortController().signal), /tipo da indústria/);
});
