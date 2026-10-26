import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

export async function harness(fetch, saved = null, env = {}) {
  const storage = new Map(saved ? [["delta.session", JSON.stringify(saved)]] : []);
  const context = vm.createContext({ fetch, Date, AbortController, sessionStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  } });
  const modules = new Map();
  function load(url) {
    const key = typeof url === "string" ? url : url.href;
    if (modules.has(key)) return modules.get(key);
    const pending = (async () => {
      if (typeof url === "string") {
        const namespace = await import(url);
        return new vm.SyntheticModule(Object.keys(namespace), function () {
          for (const [name, value] of Object.entries(namespace)) this.setExport(name, value);
        }, { context, identifier: url });
      }
      const source = await readFile(url, "utf8");
      const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
      const module = new vm.SourceTextModule(outputText, {
        context, identifier: url.href,
        initializeImportMeta: meta => { meta.env = { VITE_POSTGRES_API_URL: "https://api.example.test", ...env }; },
      });
      await module.link((specifier, parent) => load(specifier.startsWith(".") ? new URL(`${specifier}.ts`, parent.identifier) : specifier));
      return module;
    })();
    modules.set(key, pending);
    return pending;
  }
  const auth = await load(new URL("../../src/services/auth.ts", import.meta.url));
  await auth.evaluate();
  const session = (await modules.get(new URL("../../src/services/session.ts", import.meta.url).href)).namespace;
  const http = (await modules.get(new URL("../../src/services/http.ts", import.meta.url).href)).namespace;
  return { auth: auth.namespace, session, http, storage, async service(name) {
    const module = await load(new URL(`../../src/services/${name}.ts`, import.meta.url));
    await module.evaluate();
    return module.namespace;
  } };
}
