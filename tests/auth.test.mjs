import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

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

function currentReferenceMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  return `${year}-${month}-01`;
}

async function detailHarness(overrides = {}, associations = [{ userId: 7, propertyId: 15 }], serviceName = "installationDetails") {
  const paths = [];
  const routes = {
    "/delta/auth/me": { id: 7, name: "Pessoa", email: "pessoa@example.test" },
    "/delta/user-properties/7": associations,
    "/delta/property/15": { id: 15, name: "Loja", addressId: 3, builtAreaM2: 120 },
    "/delta/address/3": { id: 3, city: "São Paulo", state: "SP" },
    "/delta/analytics/monthly-variation/15": [{ propertyId: 15, referenceMonth: "2026-10-01", totalLiters: 1500 }],
    "/delta/analytics/consumption-daily/15": [
      { propertyId: 15, fullDate: "2026-10-02", totalLiters: 500, costValue: 4 },
      { propertyId: 15, fullDate: "2026-10-01", totalLiters: 1000, costValue: null },
    ],
    ...overrides,
  };
  const app = await harness(async url => {
    const path = new URL(url).pathname;
    paths.push(path);
    assert.ok(Object.hasOwn(routes, path), `Consulta indevida: ${path}`);
    return routes[path] instanceof Response ? routes[path] : response(routes[path]);
  }, validSession());
  return { service: await app.service(serviceName), paths };
}

test("edição preenche tipo, CEP e UF e converte o consumo de litros para m³", async () => {
  const month = currentReferenceMonth();
  const { service, paths } = await detailHarness({
    "/delta/property/15": { id: 15, name: "Loja", type: "PRÉDIO", addressId: 3 },
    "/delta/address/3": { id: 3, cep: "02940013", city: "São Paulo", state: "São Paulo" },
    "/delta/analytics/monthly-variation/15": [{ propertyId: 15, referenceMonth: month, totalLiters: 1500 }],
  }, undefined, "installationEditing");
  const data = await service.getInstallationForEditing(15, signal());
  assert.equal(data.formData.name, "Loja");
  assert.equal(data.formData.type, "PRÉDIO");
  assert.equal(data.formData.cep, "02940-013");
  assert.equal(data.formData.state, "SP");
  assert.equal(data.formData.monthlyConsumption, "1,5");
  assert.equal(data.formData.deviceId, "");
  assert.equal(data.warnings.length, 0);
  assert.ok(paths.every(path => !path.includes("/device") && !path.includes("/internal")));
});

test("edição não carrega imóvel nem endereço quando não há associação ao usuário", async () => {
  const { service, paths } = await detailHarness({}, [], "installationEditing");
  await assert.rejects(service.getInstallationForEditing(15, signal()), error => error.status === 404);
  assert.equal(paths.length, 2);
});

test("edição diferencia consumo zero de ausência de leitura no mês atual", async () => {
  const month = currentReferenceMonth();
  for (const [rows, expected] of [
    [[{ propertyId: 15, referenceMonth: month, totalLiters: 0 }], "0"],
    [[], ""],
  ]) {
    const { service } = await detailHarness({ "/delta/analytics/monthly-variation/15": rows }, undefined, "installationEditing");
    const data = await service.getInstallationForEditing(15, signal());
    assert.equal(data.formData.monthlyConsumption, expected);
  }
});

test("edição mantém consumo desconhecido em branco e sinaliza falhas parciais", async () => {
  const { service } = await detailHarness({
    "/delta/address/3": response({}, 503),
    "/delta/analytics/monthly-variation/15": response({}, 503),
  }, undefined, "installationEditing");
  const data = await service.getInstallationForEditing(15, signal());
  assert.equal(data.formData.name, "Loja");
  assert.equal(data.formData.cep, "");
  assert.equal(data.formData.monthlyConsumption, "");
  assert.equal(data.warnings.length, 2);
});

test("edição descarta consumo de outra instalação e interrompe no acesso negado", async () => {
  const { service } = await detailHarness({
    "/delta/analytics/monthly-variation/15": [{ propertyId: 99, referenceMonth: "2026-10-01", totalLiters: 999 }],
  }, undefined, "installationEditing");
  const data = await service.getInstallationForEditing(15, signal());
  assert.equal(data.formData.monthlyConsumption, "");
  assert.equal(data.warnings.length, 1);
  const denied = await detailHarness({ "/delta/address/3": response({}, 403) }, undefined, "installationEditing");
  await assert.rejects(denied.service.getInstallationForEditing(15, signal()), error => error.status === 403);
});

test("detalhe autoriza a instalação antes de consultar o endereço e as leituras", async () => {
  const { service, paths } = await detailHarness();
  const data = await service.getInstallationDetails(15, signal());
  assert.equal(data.installation.name, "Loja");
  assert.equal(data.address.city, "São Paulo");
  assert.equal(data.monthly[0].totalLiters, 1500);
  assert.equal(data.daily[0].fullDate, "2026-10-01");
  assert.equal(data.daily[0].costValue, null);
  assert.equal(data.warnings.length, 0);
  assert.deepEqual(paths.slice(0, 3), ["/delta/auth/me", "/delta/user-properties/7", "/delta/property/15"]);
  assert.equal(paths.length, 6);
});

test("URL de instalação sem associação não consulta propriedade, endereço ou analytics", async () => {
  const { service, paths } = await detailHarness({}, []);
  await assert.rejects(service.getInstallationDetails(15, signal()), error => error.status === 404);
  assert.deepEqual(paths, ["/delta/auth/me", "/delta/user-properties/7"]);
});

test("ID inválido não dispara consultas no detalhe", async () => {
  const { service, paths } = await detailHarness();
  for (const id of [0, -1, 1.5, NaN, "15", Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(service.getInstallationDetails(id, signal()));
  }
  assert.equal(paths.length, 0);
});

test("detalhe recusa associação de outro usuário e propriedade com ID diferente", async () => {
  for (const [overrides, associations] of [
    [{}, [{ userId: 8, propertyId: 15 }]],
    [{ "/delta/property/15": { id: 99, name: "Outra" } }, [{ userId: 7, propertyId: 15 }]],
  ]) {
    const { service, paths } = await detailHarness(overrides, associations);
    await assert.rejects(service.getInstallationDetails(15, signal()));
    assert.ok(paths.every(path => !path.includes("analytics") && !path.includes("address")));
  }
});

test("falha parcial mantém histórico mensal e sinaliza custos indisponíveis", async () => {
  const { service } = await detailHarness({ "/delta/analytics/consumption-daily/15": response({}, 503) });
  const data = await service.getInstallationDetails(15, signal());
  assert.equal(data.monthly.length, 1);
  assert.equal(data.daily.length, 0);
  assert.equal(data.warnings.length, 1);
});

test("leituras de outra instalação, datas inválidas e duplicatas não chegam à tela", async () => {
  for (const daily of [
    [{ propertyId: 99, fullDate: "2026-10-01", totalLiters: 10 }],
    [{ propertyId: 15, fullDate: "2026-02-30", totalLiters: 10 }],
    [{ propertyId: 15, fullDate: "2026-10-01", totalLiters: -1 }],
    Array(2).fill({ propertyId: 15, fullDate: "2026-10-01", totalLiters: 10 }),
  ]) {
    const { service } = await detailHarness({ "/delta/analytics/consumption-daily/15": daily });
    const data = await service.getInstallationDetails(15, signal());
    assert.equal(data.daily.length, 0);
    assert.equal(data.warnings.length, 1);
  }
});

test("histórico mensal de outra instalação é descartado e acesso negado interrompe a página", async () => {
  const { service } = await detailHarness({ "/delta/analytics/monthly-variation/15": [{ propertyId: 99, referenceMonth: "2026-10-01", totalLiters: 10 }] });
  const data = await service.getInstallationDetails(15, signal());
  assert.equal(data.monthly.length, 0);
  assert.equal(data.warnings.length, 1);
  const denied = await detailHarness({ "/delta/analytics/monthly-variation/15": response({}, 403) });
  await assert.rejects(denied.service.getInstallationDetails(15, signal()), error => error.status === 403);
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

test("cada usuário carrega somente os detalhes das instalações associadas, sem lista geral", async () => {
  for (const [userId, propertyId] of [[7, 15], [8, 29]]) {
    const paths = [];
    const app = await harness(async (url, options) => {
      const path = new URL(url).pathname;
      paths.push(path);
      assert.equal(options.headers.Authorization, `Bearer ${tokens.accessToken}`);
      if (path === "/delta/auth/me") return response({ id: userId, name: "Pessoa", email: "pessoa@example.test" });
      if (path === `/delta/user-properties/${userId}`) return response([
        { id: 100, userId, propertyId }, { id: 101, userId, propertyId },
      ]);
      if (path === `/delta/property/${propertyId}`) return response({ id: propertyId, name: "Instalação", addressId: 3, builtAreaM2: 120 });
      assert.fail(`Consulta indevida: ${path}`);
    }, validSession());
    const service = await app.service("installations");
    const records = await service.listInstallations(signal());
    assert.equal(records.length, 1);
    assert.equal(records[0].id, propertyId);
    assert.deepEqual(paths, ["/delta/auth/me", `/delta/user-properties/${userId}`, `/delta/property/${propertyId}`]);
  }
});

test("conta sem associações retorna lista vazia sem consultar outras instalações", async () => {
  const paths = [];
  const app = await harness(async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path === "/delta/auth/me") return response({ id: 7, name: "Pessoa", email: "pessoa@example.test" });
    if (path === "/delta/user-properties/7") return response([]);
    assert.fail(`Consulta indevida: ${path}`);
  }, validSession());
  const service = await app.service("installations");
  assert.equal((await service.listInstallations(signal())).length, 0);
  assert.equal(paths.length, 2);
});

test("associação de outro usuário ou identificador inválido interrompe o carregamento", async () => {
  for (const association of [{ userId: 8, propertyId: 99 }, { userId: 7, propertyId: "99" }]) {
    const app = await harness(async (url) => {
      const path = new URL(url).pathname;
      if (path === "/delta/auth/me") return response({ id: 7, name: "Pessoa", email: "pessoa@example.test" });
      if (path === "/delta/user-properties/7") return response([association]);
      assert.fail(`Consulta indevida: ${path}`);
    }, validSession());
    const service = await app.service("installations");
    await assert.rejects(service.listInstallations(signal()), /dados de instalação inválidos/);
  }
});

test("falha nas associações não recorre à lista geral", async () => {
  const app = await harness(async (url) => {
    const path = new URL(url).pathname;
    if (path === "/delta/auth/me") return response({ id: 7, name: "Pessoa", email: "pessoa@example.test" });
    if (path === "/delta/user-properties/7") return response({}, 403);
    assert.fail(`Consulta indevida: ${path}`);
  }, validSession());
  const service = await app.service("installations");
  await assert.rejects(service.listInstallations(signal()), (error) => error.status === 403);
});

test("detalhes com ID diferente do solicitado são recusados", async () => {
  const app = await harness(async (url) => {
    const path = new URL(url).pathname;
    if (path === "/delta/auth/me") return response({ id: 7, name: "Pessoa", email: "pessoa@example.test" });
    if (path === "/delta/user-properties/7") return response([{ userId: 7, propertyId: 15 }]);
    if (path === "/delta/property/15") return response({ id: 99, name: "Outra instalação" });
    assert.fail(`Consulta indevida: ${path}`);
  }, validSession());
  const service = await app.service("installations");
  await assert.rejects(service.listInstallations(signal()), /dados de instalação inválidos/);
});

test("endereços são consultados somente pelos IDs necessários, sem duplicatas ou lista geral", async () => {
  const paths = [];
  const app = await harness(async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path === "/delta/address/3") return response({ id: 3, city: "São Paulo", state: "SP" });
    assert.fail(`Consulta indevida: ${path}`);
  }, validSession());
  const service = await app.service("addresses");
  assert.equal((await service.listAddresses([], signal())).length, 0);
  const addresses = await service.listAddresses([3, 3], signal());
  assert.equal(addresses.length, 1);
  assert.equal(addresses[0].id, 3);
  assert.deepEqual(paths, ["/delta/address/3"]);
});
