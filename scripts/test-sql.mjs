import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

// This runner never accepts a database URL: all SQL runs inside a new local,
// network-isolated container that is removed when the process exits.
const root = resolve(import.meta.dirname, "..");
const container = `autonoservice-sql-${process.pid}-${Date.now()}`;
const endpoint = process.platform === "win32"
  ? "npipe:////./pipe/docker_engine"
  : "unix:///var/run/docker.sock";
const image = "postgres:17-alpine";
const environment = { ...process.env };
for (const name of ["DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) {
  delete environment[name];
}
const docker = (args, options = {}) => spawnSync("docker", [`--host=${endpoint}`, ...args], {
  cwd: root, env: environment, encoding: "utf8", ...options,
});
const checked = (args, options) => {
  const result = docker(args, options);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n") || `Docker exited with ${result.status}`);
  return result.stdout;
};
const sql = (source) => checked([
  "exec", "-i", container, "psql", "-X", "-qAt", "--set", "ON_ERROR_STOP=1",
  "--username", "postgres", "--dbname", "autonoservice_test",
], { input: source });
let started = false;
try {
  checked(["info", "--format", "{{.ServerVersion}}"]);
  checked([
    "run", "--rm", "--detach", "--name", container, "--network", "none",
    "--tmpfs", "/var/lib/postgresql/data:rw", "--env", "POSTGRES_HOST_AUTH_METHOD=trust",
    "--env", "POSTGRES_DB=autonoservice_test", image,
  ]);
  started = true;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    // The entrypoint briefly starts a Unix-socket-only bootstrap server.
    // TCP loopback becomes ready only after initialization has finished.
    if (docker(["exec", container, "pg_isready", "--host", "127.0.0.1", "--username", "postgres", "--dbname", "autonoservice_test"]).status === 0) {
      ready = true;
      break;
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  if (!ready) throw new Error("PostgreSQL did not become ready in the disposable container.");
  process.stdout.write(sql("select version();"));
  sql(readFileSync(resolve(root, "tests/sql/bootstrap.sql"), "utf8"));
  const migrations = readdirSync(resolve(root, "supabase/migrations"))
    .filter((name) => name.endsWith(".sql")).sort();
  for (const migration of migrations) {
    sql(readFileSync(resolve(root, "supabase/migrations", migration), "utf8"));
    console.log(`Applied ${migration}`);
  }
  let assertions = 0;
  for (const suite of readdirSync(resolve(root, "tests/sql")).filter((name) => name.endsWith(".sql") && name !== "bootstrap.sql").sort()) {
    const output = sql(readFileSync(resolve(root, "tests/sql", suite), "utf8"));
    assertions += (output.match(/^ok - /gm) || []).length;
    process.stdout.write(output);
  }
  console.log(`${assertions} SQL policy assertions passed across ${migrations.length} migrations.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (started) docker(["rm", "--force", container]);
}
