import assert from "node:assert/strict";
import test from "node:test";
import { harness } from "./helpers/service-harness.mjs";

const data = { name: " Ana ", birthDate: "05/03/1990", phone: "(11) 91234-5678", email: "ana@x.com", password: "senha1234", confirmPassword: "senha1234" };
const tokens = { accessToken: "a", refreshToken: "r", expiresIn: 60, refreshExpiresIn: 600, tokenType: "Bearer" };

test("createAccount envia o corpo da API e guarda a sessão", async () => {
  let call;
  const h = await harness(async (url, init) => { call = { url, init }; return { ok: true, status: 201, json: async () => tokens }; });
  const { createAccount } = await h.service("registration");
  await createAccount(data, new AbortController().signal);
  assert.equal(call.url, "https://api.example.test/delta/auth/create-account");
  assert.deepEqual(JSON.parse(call.init.body), { name: "Ana", email: "ana@x.com", password: "senha1234", phone: "11912345678", birthDate: "1990-03-05" });
  assert.equal(h.session.getSession().accessToken, "a");
});

test("createAccount informa e-mail duplicado (409)", async () => {
  const h = await harness(async () => ({ ok: false, status: 409, json: async () => ({}) }));
  const { createAccount } = await h.service("registration");
  await assert.rejects(createAccount(data, new AbortController().signal), /Já existe uma conta/);
});

test("createAccount rejeita data inválida sem chamar a API", async () => {
  const h = await harness(async () => { throw new Error("não deveria chamar"); });
  const { createAccount } = await h.service("registration");
  await assert.rejects(createAccount({ ...data, birthDate: "31/02/1990" }, new AbortController().signal), /data de nascimento/);
});
