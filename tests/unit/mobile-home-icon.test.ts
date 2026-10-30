import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = "src/app/layout.tsx";
const metadata = readFileSync(root, "utf8");
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest","utf8"));
const pngs = [
  ["src/app/apple-icon.png",180],
  ["public/apple-touch-icon.png",180],
  ["public/icons/autonoservice-192.png",192],
  ["public/icons/autonoservice-512.png",512],
] as const;
for (const [file,size] of pngs) {
  const data = readFileSync(file);
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file+" PNG");
  assert.equal(data.readUInt32BE(16),size,file+" width");
  assert.equal(data.readUInt32BE(20),size,file+" height");
}
assert.match(metadata,/apple-touch-icon\.png/);
assert.match(metadata,/appleWebApp/);
assert.match(metadata,/manifest\.webmanifest/);
assert.equal(manifest.display,"standalone");
assert.equal(manifest.name,"AutonoService");
assert.ok(manifest.icons.some((icon:{sizes:string})=>icon.sizes==="192x192"));
assert.ok(manifest.icons.some((icon:{sizes:string})=>icon.sizes==="512x512"));
console.log("iPhone/Android installed web-app icons and manifest: OK");
