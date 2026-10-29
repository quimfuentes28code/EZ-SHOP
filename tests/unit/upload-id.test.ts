import assert from "node:assert/strict";
import { test } from "node:test";
import { createUploadId } from "../../src/lib/upload-id";

test("las subidas funcionan en HTTP local sin randomUUID y requieren una fuente aleatoria", () => {
  const source = {getRandomValues:(bytes:Uint8Array)=>globalThis.crypto.getRandomValues(bytes)};
  const ids = Array.from({length:20},()=>createUploadId(source));
  assert.equal(new Set(ids).size,ids.length);
  for (const id of ids) assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.throws(()=>createUploadId(null),/HTTPS/);
});
