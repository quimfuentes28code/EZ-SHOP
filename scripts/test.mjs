import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Execute every TypeScript unit suite on Windows and Unix without shell globs.
const directory = resolve("tests/unit");
const suites = readdirSync(directory)
  .filter((name) => name.endsWith(".test.ts"))
  .sort();
if (!suites.length) throw new Error("No se encontraron pruebas unitarias.");
let failed = false;
for (const suite of suites) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", resolve(directory, suite)],
    { stdio: "inherit" },
  );
  if (result.error) console.error(result.error);
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
