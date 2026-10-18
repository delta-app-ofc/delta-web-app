import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Executa os services reais com transporte e armazenamento isolados, sem credenciais reais.
async function harness(fetch, saved = null) {
  const storage = new Map(saved ? [["delta.session", JSON.stringify(saved)]] : []);
  const context = vm.createContext({
    fetch, Date, AbortController,
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  });
  const modules = new Map();
  function load(url) {
    if (modules.has(url.href)) return modules.get(url.href);
    const pending = (async () => {
    const source = await readFile(url, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    });
    const module = new vm.SourceTextModule(outputText, {
      context, identifier: url.href,
      initializeImportMeta: (meta) => { meta.env = { VITE_POSTGRES_API_URL: "https://api.example.test" }; },
    });
    await module.link((specifier, parent) => load(new URL(`${specifier}.ts`, parent.identifier)));
    return module;
    })();
    // Imports paralelos devem compartilhar a mesma instância de cada módulo.
    modules.set(url.href, pending);
    return pending;
  }
  const auth = await load(new URL("../src/services/auth.ts", import.meta.url));
  await auth.evaluate();
  const session = (await modules.get(new URL("../src/services/session.ts", import.meta.url).href)).namespace;
  const http = (await modules.get(new URL("../src/services/http.ts", import.meta.url).href)).namespace;
  return {
    auth: auth.namespace, session, http, storage,
    async service(name) {
      const module = await load(new URL(`../src/services/${name}.ts`, import.meta.url));
      await module.evaluate();
      return module.namespace;
    },
  };
}

const tokens = {
  accessToken: "access-original", refreshToken: "refresh-original", tokenType: "Bearer",
  expiresIn: 900, refreshExpiresIn: 86400,
};
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const signal = () => new AbortController().signal;
const validSession = () => ({
  accessToken: tokens.accessToken, refreshToken: tokens.refreshToken,
  expiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 86400000,
});

test("login envia as credenciais, mantém a senha intacta e persiste somente a sessão", async () => {
  let call;
  const app = await harness(async (url, options) => { call = { url, options }; return response(tokens); });
  await app.auth.login("  pessoa@example.test  ", " password with spaces ", signal());
  assert.equal(call.url, "https://api.example.test/delta/auth/login");
  assert.equal(call.options.method, "POST");
  assert.deepEqual(JSON.parse(call.options.body), { email: "pessoa@example.test", password: " password with spaces " });
  assert.equal(call.options.headers["Content-Type"], "application/json");
  assert.equal(app.session.getSession().accessToken, tokens.accessToken);
  assert.ok(!app.storage.get("delta.session").includes("password"));
});

test("credenciais recusadas e resposta inválida não criam sessão", async () => {
  for (const result of [() => response({}, 401), () => response({ ...tokens, accessToken: "" })]) {
    const app = await harness(async () => result());
    await assert.rejects(app.auth.login("pessoa@example.test", "wrong", signal()), /inválid/);
    assert.equal(app.session.getSession(), null);
  }
});

test("cancelar o login impede a gravação dos tokens", async () => {
  const controller = new AbortController();
  const app = await harness(async () => { controller.abort(); return response(tokens); });
  await assert.rejects(app.auth.login("pessoa@example.test", "password", controller.signal));
  assert.equal(app.session.getSession(), null);
});

test("perfil usa o bearer token e interpreta o usuário do backend", async () => {
  const user = { id: 7, name: "Pessoa", email: "pessoa@example.test" };
  const app = await harness(async (url, options) => {
    assert.equal(url, "https://api.example.test/delta/auth/me");
    assert.equal(options.headers.Authorization, `Bearer ${tokens.accessToken}`);
    return response(user);
  }, validSession());
  assert.equal(JSON.stringify(await app.auth.getCurrentUser(signal())), JSON.stringify(user));
});

test("requisições simultâneas compartilham uma renovação e usam o novo token", async () => {
  let refreshes = 0;
  let reads = 0;
  const app = await harness(async (url, options) => {
    if (url.endsWith("/refresh")) {
      refreshes++;
      assert.deepEqual(JSON.parse(options.body), { refreshToken: tokens.refreshToken });
      await new Promise((resolve) => setTimeout(resolve, 10));
      return response({ accessToken: "access-renewed", expiresIn: 900 });
    }
    reads++;
    assert.equal(options.headers.Authorization, "Bearer access-renewed");
    return response([]);
  }, { ...validSession(), expiresAt: Date.now() - 1000 });
  await Promise.all(Array.from({ length: 6 }, () => app.http.getJson("/delta/property", signal())));
  assert.equal(refreshes, 1);
  assert.equal(reads, 6);
});

test("401 renova o token e repete a consulta uma única vez", async () => {
  let reads = 0;
  const app = await harness(async (url, options) => {
    if (url.endsWith("/refresh")) return response({ accessToken: "access-renewed", expiresIn: 900 });
    reads++;
    return options.headers.Authorization === "Bearer access-renewed" ? response([]) : response({}, 401);
  }, validSession());
  await app.http.getJson("/delta/property", signal());
  assert.equal(reads, 2);
});

test("refresh rejeitado encerra a sessão e notifica a proteção de rotas", async () => {
  const app = await harness(async () => response({}, 401), { ...validSession(), expiresAt: 0 });
  let notifications = 0;
  app.session.subscribeSession(() => notifications++);
  await assert.rejects(app.http.getJson("/delta/property", signal()));
  assert.equal(app.session.getSession(), null);
  assert.equal(app.storage.has("delta.session"), false);
  assert.equal(notifications, 1);
});

test("falha temporária na renovação mantém a sessão para tentar novamente", async () => {
  const app = await harness(async () => response({}, 503), { ...validSession(), expiresAt: 0 });
  await assert.rejects(app.http.getJson("/delta/property", signal()));
  assert.ok(app.session.getSession());
});

test("sessão expirada ou ausente não envia consultas protegidas", async () => {
  let requests = 0;
  const app = await harness(async () => { requests++; return response([]); }, { ...validSession(), refreshExpiresAt: 0 });
  await assert.rejects(app.http.getJson("/delta/property", signal()), /Entre na sua conta/);
  assert.equal(requests, 0);
});
