import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

// Public provenance only: never expose environment variables or credentials.
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
mkdirSync("public", { recursive: true });
writeFileSync("public/version.json", JSON.stringify({ commit, builtAt: new Date().toISOString() }) + "\n");
