import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Static regression guard: the real browser interaction still requires an
// authenticated cross-company E2E test with two fixture organizations.
const tools=readFileSync("src/components/business-home.tsx","utf8");
const shell=readFileSync("src/components/real-experience.tsx","utf8");

assert.match(tools,/setEnabled\(\[\]\);\s*setSaved\(false\);/);
assert.match(tools,/if\(!active\)return;/);
assert.match(tools,/return \(\)=>\{active=false;\};/);
assert.match(shell,/<BusinessTools key=\{selectedOrg\}/);
assert.match(shell,/const changeActiveOrganization=\(next:string\)=>\{/);
assert.match(shell,/setServices\(\[\]\);\s*setContacts\(\[\]\);/);
assert.equal((shell.match(/onChange=\{e=>changeActiveOrganization\(e\.target\.value\)\}/g)||[]).length,3);

console.log("Static organization-context guards: OK; authenticated E2E remains required.");
