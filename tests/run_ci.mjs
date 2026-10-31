import { spawnSync } from "node:child_process";
import { mkdirSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
// Realpath evita que o c8 perca os módulos VM quando o worktree é acessado
// pelo alias OneDrive-local no Windows.
const root = realpathSync(resolve(scriptDirectory, ".."));
mkdirSync(join(root, "reports"), { recursive: true });
const coverageCli = join(root, "node_modules", "c8", "bin", "c8.js");

const result = spawnSync(
  process.execPath,
  [
    coverageCli,
    "--all",
    "--include=src/**/*.ts",
    "--include=src/**/*.tsx",
    "--extension=.ts",
    "--extension=.tsx",
    "--reporter=lcovonly",
    "--reporter=text-summary",
    "--reports-dir=reports",
    "--temp-directory=.nyc_output",
    process.execPath,
    "--experimental-vm-modules",
    "--test",
    "--test-reporter=junit",
    "--test-reporter-destination=reports/junit.xml",
    "tests/run.mjs",
  ],
  { cwd: root, encoding: "utf8" },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) {
  console.error(`Não foi possível iniciar a suíte: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
