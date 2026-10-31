import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers/service-harness.mjs";

const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
const signal = () => new AbortController().signal;

test("login converte respostas HTTP públicas em mensagens seguras por status", async () => {
  const expected = new Map([
    [400, "Confira o e-mail e a senha informados."],
    [401, "E-mail ou senha inválidos, ou conta inativa."],
    [429, "Muitas tentativas. Aguarde um pouco e tente novamente."],
    [503, "Não foi possível entrar. Tente novamente."],
  ]);

  for (const [status, message] of expected) {
    const app = await harness(async () => response({ internal: "database details" }, status));
    await assert.rejects(
      app.http.postPublicJson("/delta/auth/login", {}, signal()),
      (error) => error.status === status && error.message === message,
    );
  }
});

test("resposta pública que não é JSON produz erro sanitizado", async () => {
  const app = await harness(async () => new Response("<html>internal trace</html>", { status: 200 }));

  await assert.rejects(
    app.http.postPublicJson("/delta/auth/login", {}, signal()),
    (error) => error.message === "O serviço retornou uma resposta inválida." &&
      !error.message.includes("internal trace"),
  );
});

test("falha de rede não vaza detalhes e escrita não repete POST automaticamente", async () => {
  let requests = 0;
  const app = await harness(async () => {
    requests++;
    throw new Error("Authorization: Bearer private-token");
  }, {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60_000,
    refreshExpiresAt: Date.now() + 60_000,
  });

  await assert.rejects(
    app.http.writeJson("POST", "/delta/property", { name: "Loja" }, signal()),
    (error) => error.status === null && !error.message.includes("private-token"),
  );

  assert.equal(requests, 1);
});

test("resposta inválida de refresh preserva apenas a sessão anterior", async () => {
  const previous = {
    accessToken: "old-access",
    refreshToken: "refresh-token",
    expiresAt: Date.now() - 1,
    refreshExpiresAt: Date.now() + 60_000,
  };
  const app = await harness(async (url) => {
    assert.ok(url.endsWith("/delta/auth/refresh"));
    return response({ accessToken: " ", expiresIn: 0 });
  }, previous);

  await assert.rejects(
    app.http.getJson("/delta/property", signal()),
    (error) => error.message === "O serviço retornou uma sessão inválida.",
  );
  assert.equal(app.session.getSession().accessToken, "old-access");
});

test("configuração de API ausente falha antes de chamar fetch", async () => {
  let requests = 0;
  const app = await harness(async () => {
    requests++;
    return response({});
  }, null, { VITE_POSTGRES_API_URL: " " });

  await assert.rejects(
    app.http.postPublicJson("/delta/auth/login", {}, signal()),
    (error) => error.message === "O serviço ainda não foi configurado.",
  );
  assert.equal(requests, 0);
});
