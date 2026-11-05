// Node 18 no Windows não expande globs do npm e o executor concorrente pode
// interpretar incorretamente caracteres UTF-8 no protocolo TAP. Importar os
// arquivos mantém a suíte multiplataforma e preserva a saída do node:test.
await import("./auth.test.mjs");
await import("./http-errors.test.mjs");
await import("./form-validation.test.mjs");
await import("./installation-pdf.test.mjs");
await import("./installation-registration.test.mjs");
await import("./installation-saving.test.mjs");
await import("./alerts.test.mjs");
await import("./ranking.test.mjs");
await import("./indicators.test.mjs");
await import("./registration.test.mjs");
await import("./company-registration.test.mjs");
