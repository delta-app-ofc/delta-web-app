import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const context = vm.createContext({ Date });

async function loadUtility(name) {
  const url = new URL(`../src/utils/${name}.ts`, import.meta.url);
  const source = await readFile(url, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  });
  const module = new vm.SourceTextModule(outputText, { context, identifier: url.href });
  await module.link(() => { throw new Error(`O utilitário ${name} não deve importar módulos em tempo de execução.`); });
  await module.evaluate();
  return module.namespace;
}

const auth = await loadUtility("authValidation");
const register = await loadUtility("registerValidation");
const settings = await loadUtility("settingsValidation");

test("login valida e-mail e limites antes de chamar o serviço", () => {
  assert.equal(auth.validateLogin({ email: "gestor@delta.com.br", password: "segura" }), null);
  assert.match(auth.validateLogin({ email: "invalido", password: "segura" }), /e-mail válido/);
  assert.match(auth.validateLogin({ email: "gestor@delta.com.br", password: "x".repeat(257) }), /máximo/);
});

test("cadastro valida perfil e credenciais com mensagens específicas", () => {
  const data = {
    name: "Talita",
    birthDate: "27/10/1995",
    phone: "(11) 95064-6508",
    email: "talita@delta.com.br",
    password: "senha-segura",
    confirmPassword: "senha-segura",
  };
  assert.deepEqual({ ...register.validateRegisterProfile(data) }, {});
  assert.deepEqual({ ...register.validateRegisterCredentials(data) }, {});
  assert.ok(register.validateRegisterProfile({ ...data, birthDate: "31/02/2020" }).birthDate);
  assert.ok(register.validateRegisterCredentials({ ...data, confirmPassword: "diferente" }).confirmPassword);
});

test("configurações validam perfil, senha, organização e destinatários", () => {
  assert.equal(settings.validateProfile({ name: "Talita", email: "talita@delta.com.br", phone: "(11) 95064-6508" }), null);
  assert.equal(settings.validateOrganization({ legalName: "Delta Ltda", tradeName: "Delta", cnpj: "12.345.678/0001-90", segment: "Varejo" }), null);
  assert.equal(settings.validatePasswordChange({ current: "atual", next: "nova-segura", confirmation: "nova-segura" }), null);
  assert.equal(settings.validateRecipients("gestor@delta.com.br; regional@delta.com.br"), null);
  assert.match(settings.validateRecipients("destinatario-invalido"), /e-mails válidos/);
});
