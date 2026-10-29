import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Compile against the same synthetic origin intercepted by the browser fixtures.
// Variables are scoped to child processes and never saved to .env files.
const root = resolve(import.meta.dirname, "..");
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "https://autonoservice-test.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "autonoservice-e2e-public-placeholder",
  AUTONOSERVICE_E2E: "1",
};

console.log("Comprobación con datos ficticios. Detén cualquier servidor en el puerto 3000 antes de continuar.");
for (const args of [
  [resolve(root, "node_modules/next/dist/bin/next"), "build"],
  [resolve(root, "node_modules/@playwright/test/cli.js"), "test", ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}
console.log("La carpeta out/ contiene una compilación para pruebas con backend ficticio. Ejecuta npm run build para volver a generar tu vista previa habitual.");
