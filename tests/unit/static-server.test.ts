import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { resolveStaticFile } from "../../scripts/serve-static.mjs";

test("la vista estática resuelve exportaciones, consultas y rutas anidadas", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "autonoservice-static-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "registro"));
  await writeFile(join(directory, "index.html"), "inicio");
  await writeFile(join(directory, "registro", "empresa.html"), "empresa");
  assert.equal((await resolveStaticFile(directory, "/"))?.path, join(directory, "index.html"));
  for (const path of ["/registro/empresa", "/registro/empresa/", "/registro/empresa?origen=inicio", "/registro/empresa.html"]) {
    assert.equal((await resolveStaticFile(directory, path))?.path, join(directory, "registro", "empresa.html"));
  }
  assert.equal(await resolveStaticFile(directory, "/ruta-inexistente"), null);
});

test("el servidor estático bloquea escapes, dotfiles y enlaces fuera de out", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "autonoservice-static-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, "out");
  await mkdir(root);
  await writeFile(join(directory, "secret.txt"), "fuera de la exportación");
  await writeFile(join(root, ".env"), "no publicar");
  await symlink(directory, join(root, "escape"), "junction");
  for (const path of ["/../secret.txt", "/%2e%2e/secret.txt", "/.env", "/%2eenv", "/escape/secret.txt", "/bad%", "/%00", "/..%5csecret.txt"]) {
    assert.equal(await resolveStaticFile(root, path), null, path);
  }
});
