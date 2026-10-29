import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function inside(root, path) {
  const local = relative(root, path);
  return local === "" || (!isAbsolute(local) && local !== ".." && !local.startsWith(`..${sep}`));
}

// Resolve both Next's /page.html exports and directory-style /page/index.html.
// Check the raw path before URL normalization can remove traversal segments.
export async function resolveStaticFile(directory, requestTarget) {
  const root = await realpath(directory);
  let pathname;
  try {
    pathname = decodeURIComponent(requestTarget.split(/[?#]/, 1)[0]);
  } catch {
    return null;
  }
  if (!pathname.startsWith("/") || pathname.includes("\\") || pathname.includes("\0")) return null;
  const parts = pathname.split("/");
  if (parts.some((part) => part === ".." || part === "." || part.startsWith("."))) return null;
  const path = resolve(root, `.${pathname}`);
  if (!inside(root, path)) return null;
  const candidates = pathname.endsWith("/")
    ? [resolve(path, "index.html"), `${path}.html`]
    : [path, `${path}.html`, resolve(path, "index.html")];
  for (const candidate of candidates) {
    try {
      const actual = await realpath(candidate);
      if (!inside(root, actual)) continue;
      const info = await stat(actual);
      if (info.isFile()) return { path: actual, size: info.size };
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }
  }
  return null;
}

export function createStaticServer(directory = resolve("out")) {
  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (!["GET", "HEAD"].includes(request.method || "")) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    try {
      const found = await resolveStaticFile(directory, request.url || "/");
      const file = found || await resolveStaticFile(directory, "/404.html");
      response.statusCode = found ? 200 : 404;
      response.setHeader("Cache-Control", found?.path.includes(`${sep}_next${sep}static${sep}`)
        ? "public, max-age=31536000, immutable" : "no-cache");
      if (!file) {
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(request.method === "HEAD" ? undefined : "Página no encontrada.");
        return;
      }
      response.setHeader("Content-Type", mimeTypes[extname(file.path)] || "application/octet-stream");
      response.setHeader("Content-Length", file.size);
      if (request.method === "HEAD") response.end();
      else createReadStream(file.path).on("error", () => response.destroy()).pipe(response);
    } catch {
      response.statusCode = 500;
      response.end("No se pudo servir la página.");
    }
  });
}

async function start() {
  const args = process.argv.slice(2);
  const option = (names, fallback) => {
    const index = args.findIndex((arg) => names.includes(arg));
    return index < 0 ? fallback : args[index + 1];
  };
  const host = option(["--hostname", "-H"], "localhost");
  const port = Number(option(["--port", "-p"], process.env.PORT || "3000"));
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("Utiliza --hostname <dirección> y --port <1-65535>.");
    process.exitCode = 1;
  } else {
    try {
      await stat(resolve("out/index.html"));
      const server = createStaticServer();
      server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
      server.listen(port, host, () => console.log(`AutonoService: http://${host}:${port}`));
    } catch {
      console.error("Falta la exportación out/. Ejecuta npm run build antes de npm start.");
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void start();
