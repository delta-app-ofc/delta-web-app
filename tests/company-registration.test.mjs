import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "./helpers/service-harness.mjs";

const session = { accessToken: "t", refreshToken: "r", expiresAt: Date.now() + 600000, refreshExpiresAt: Date.now() + 900000 };
const data = { legalName: "Acme Ltda", tradeName: "Acme", cnpj: "12.345.678/0001-90", industrySegment: "Indústria têxtil", unitName: "Matriz",
  postalCode: "01001-000", state: "SP", city: "São Paulo", classification: "Comercial normal industrial", deviceId: "ESP-1" };

function reply(body, status = 200) { return { ok: status < 400, status, json: async () => body }; }

test("registerCompany cria empresa, cadastro e dispositivo", async () => {
  const calls = [];
  const h = await harness(async (url, init) => {
    calls.push({ path: new URL(url).pathname, body: JSON.parse(init.body) });
    if (url.endsWith("/organizations")) return reply({ id: 7 });
    if (url.endsWith("/complete-registration")) return reply({ property: { id: 9 } });
    return reply({ propertyId: 9, deviceId: "ESP-1" });
  }, session);
  const { registerCompany } = await h.service("companyRegistration");
  const progress = {};
  await registerCompany(data, progress, new AbortController().signal);
  assert.deepEqual(calls[0].body, { corporateName: "Acme Ltda", tradeName: "Acme", cnpj: "12345678000190", businessSegment: "INDUSTRIA", declaredUnitCount: 1 });
  assert.equal(calls[1].body.property.classification, "COMERCIAL_NORMAL_INDUSTRIAL");
  assert.equal(calls[1].body.address.cep, "01001000");
  assert.deepEqual({ ...progress }, { organizationId: 7, propertyId: 9, deviceLinked: true });
});

test("nova tentativa não recria a empresa já criada", async () => {
  let organizations = 0, failOnce = true;
  const h = await harness(async url => {
    if (url.endsWith("/organizations")) { organizations += 1; return reply({ id: 7 }); }
    if (url.endsWith("/complete-registration") && failOnce) { failOnce = false; return reply({}, 500); }
    return reply({ property: { id: 9 } });
  }, session);
  const { registerCompany } = await h.service("companyRegistration");
  const progress = {};
  await assert.rejects(registerCompany({ ...data, deviceId: "" }, progress, new AbortController().signal));
  await registerCompany({ ...data, deviceId: "" }, progress, new AbortController().signal);
  assert.equal(organizations, 1);
  assert.equal(progress.propertyId, 9);
});

test("CNPJ duplicado mostra mensagem específica", async () => {
  const h = await harness(async () => reply({}, 409), session);
  const { registerCompany } = await h.service("companyRegistration");
  await assert.rejects(registerCompany(data, {}, new AbortController().signal), /CNPJ/);
});
