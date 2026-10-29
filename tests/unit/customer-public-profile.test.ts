import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const customer=readFileSync("src/components/customer-social.tsx","utf8");
const editor=readFileSync("src/components/business-social-editor.tsx","utf8");
const css=readFileSync("src/components/customer-social.css","utf8");

// The Client must access complete published profiles through the REAL
// customer area; /negocio/<slug> remains reserved for static demo profiles.
assert.match(customer,/searchParams\.set\("negocio",id\)/);
assert.match(customer,/as-social-full-profile/);
assert.match(customer,/window\.addEventListener\("popstate",sync\)/);
assert.doesNotMatch(customer,/className="as-social-modal-backdrop"/);
assert.match(customer,/\.eq\("published",true\)\.order\("name"\)/);
assert.match(customer,/directoryLoading/);
assert.match(customer,/setOrganizations\(\(o\.data\|\|\[\]\) as Organization\[\]\)/);
assert.match(customer,/secondaryErrors/);

assert.match(editor,/Tu perfil es público/);
assert.match(editor,/Tu perfil es privado/);
assert.match(editor,/Publicar mi empresa/);
assert.match(editor,/organiza/ === "nothere" ? /never/ : /\.update\(\{published:next\}\)/);
assert.match(editor,/\.eq\("id",organizationId\)/);
assert.match(editor,/\?negocio=/);

assert.match(css,/\.as-social-full-profile/);
console.log("Customer public profile navigation, reload, owner publication and full-screen styles: OK");
