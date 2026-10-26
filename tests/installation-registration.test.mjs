import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const context = vm.createContext({});
const modules = new Map();
function load(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  const pending = (async () => {
    const source = await readFile(url, "utf8");
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
    const module = new vm.SourceTextModule(outputText, { context, identifier: url.href });
    await module.link((specifier, parent) => load(new URL(`${specifier}.ts`, parent.identifier)));
    return module;
  })();
  modules.set(url.href, pending);
  return pending;
}
const module = await load(new URL("../src/utils/installationRegistration.ts", import.meta.url));
await module.evaluate();
const { formatCep, normalizeState, parseCubicMeters, validateRegistration } = module.namespace;
const data = { name: "Unidade Centro", type: "PRÉDIO", cep: "01001-000", city: "São Paulo", state: "SP", monthlyConsumption: "12,5", monthlyGoal: "10", deviceId: "DELTA-ESP32-000184" };

test("cadastro aceita dados válidos, consumo zero e valores decimais em português", () => {
  assert.equal(Object.keys(validateRegistration(data)).length, 0);
  assert.equal(Object.keys(validateRegistration({ ...data, monthlyConsumption: "0" })).length, 0);
  assert.equal(parseCubicMeters("12,345"), 12.345);
});
test("cadastro exige os campos obrigatórios sem aceitar somente espaços", () => {
  const errors = validateRegistration(Object.fromEntries(Object.keys(data).map((field) => [field, " "])));
  assert.equal(Object.keys(errors).length, 7);
  assert.equal(errors.monthlyConsumption, undefined);
});
test("consumo mensal pode ficar em branco quando a unidade ainda não tem leituras", () => {
  for (const monthlyConsumption of ["", "   "]) {
    assert.equal(Object.keys(validateRegistration({ ...data, monthlyConsumption })).length, 0);
  }
  assert.ok(validateRegistration({ ...data, monthlyConsumption: "-1" }).monthlyConsumption);
});
test("valores monetários, negativos, notação exponencial e infinito não viram consumo", () => {
  for (const value of ["-2", "1.000,50", "1e3", "Infinity", "1,2,3", "", "0x10"]) assert.equal(parseCubicMeters(value), null);
  assert.ok(validateRegistration({ ...data, monthlyGoal: "0" }).monthlyGoal);
});
test("CEP e estado são validados antes do salvamento", () => {
  assert.equal(formatCep("01001000"), "01001-000");
  assert.equal(formatCep("01001-000xyz"), "01001-000");
  const errors = validateRegistration({ ...data, cep: "12345", state: "XX", type: "OUTRO" });
  assert.ok(errors.cep && errors.state && errors.type);
});
test("identidade do hidrômetro mantém caixa e conteúdo originais", () => {
  const candidate = { ...data, deviceId: "Delta-ESP32-001" };
  validateRegistration(candidate);
  assert.equal(candidate.deviceId, "Delta-ESP32-001");
});

test("edição não exige meta ausente da tela nem inventa vínculo de hidrômetro", () => {
  const editing = { ...data, monthlyGoal: "", deviceId: "" };
  assert.equal(Object.keys(validateRegistration(editing, "edit")).length, 0);
  const invalid = validateRegistration({ ...editing, cep: "123", name: " ", monthlyConsumption: "-1" }, "edit");
  assert.ok(invalid.cep && invalid.name && invalid.monthlyConsumption);
  assert.ok(validateRegistration(editing).monthlyGoal);
  assert.ok(validateRegistration(editing).deviceId);
  assert.equal(validateRegistration({ ...editing, monthlyConsumption: "0,0005" }, "edit").monthlyConsumption, undefined);
});

test("edição reconhece UF e nome de estado sem inventar um estado desconhecido", () => {
  assert.equal(normalizeState("São Paulo"), "SP");
  assert.equal(normalizeState(" sp "), "SP");
  assert.equal(normalizeState("Mato Grosso do Sul"), "MS");
  assert.equal(normalizeState(""), "");
  assert.equal(normalizeState("outro"), "");
  assert.equal(normalizeState("__proto__"), "");
});
