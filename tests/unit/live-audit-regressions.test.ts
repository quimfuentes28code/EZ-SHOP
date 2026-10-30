import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const storageRls = readFileSync("supabase/migrations/20261030_0001_fix_business_media_rls.sql", "utf8");
const branding = readFileSync("supabase/migrations/20261030_0002_grant_business_branding_columns.sql", "utf8");
const demoRouter = readFileSync("src/components/experience-switcher.tsx","utf8");

for(const policy of ["autonoservice_media_owner_insert","autonoservice_media_owner_select"]){
  assert.match(storageRls,new RegExp("create policy "+policy));
}
assert.match(storageRls,/split_part\(storage\.objects\.name/);
assert.doesNotMatch(storageRls,/split_part\(o\.name/);
assert.match(storageRls,/and o\.owner_id=\(select auth\.uid\(\)\)/);
for(const col of ["tagline","accent_color","avatar_url","cover_url"]){
  assert.ok(branding.includes(col), "missing branding column: "+col);
}
assert.ok(demoRouter.includes('"/demo/empresa"'),"demo switch must stay in demo mode");
assert.ok(demoRouter.includes('"/demo/cliente"'),"demo switch must stay in demo mode");
console.log("Storage-policy shadowing, owner restriction, branding grants and demo routing: OK");
