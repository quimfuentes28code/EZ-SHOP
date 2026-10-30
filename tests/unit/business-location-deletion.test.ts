import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const locations=readFileSync("src/components/business-locations.tsx","utf8");
const styles=readFileSync("src/app/real/real.css","utf8");
const policy=readFileSync("supabase/migrations/20261030_0005_allow_owned_location_deletion.sql","utf8");

// The button exists on the actual "Tiendas y sedes" cards.
assert.match(locations,/aria-label=\{"Eliminar tienda "\+l\.name\}/);
assert.match(locations,/const startDelete=/);
assert.match(locations,/const deleteLocation=async/);

// Two-step confirmation protects against accidental taps on mobile.
assert.match(locations,/value=\{deleteConfirmation\}/);
assert.match(locations,/deleteConfirmation\.trim\(\)!==deleting\.name/);
assert.match(locations,/Eliminar definitivamente/);
assert.match(locations,/cancelDelete/);

// Only delete the exact selected location inside the active organization,
// and require proof of a deleted row (RLS may silently filter the deletion).
assert.match(locations,/db\.from\("organization_locations"\)/);
assert.match(locations,/\.delete\(\)\.eq\("id",target\.id\)\.eq\("organization_id",organizationId\)/);
assert.match(locations,/\.select\("id"\)\.maybeSingle\(\)/);
assert.match(locations,/if\(!data\)throw Error/);
assert.doesNotMatch(locations,/db\.from\("organizations"\)\.delete\(\)/);

// Database authorization must be scoped to the authenticated business owner.
assert.match(policy,/revoke delete on table public\.organization_locations from anon/);
assert.match(policy,/grant delete on table public\.organization_locations to authenticated/);
assert.match(policy,/for delete to authenticated/);
assert.match(policy,/o\.owner_id = \(select auth\.uid\(\)\)/);
assert.match(policy,/o\.id = organization_locations\.organization_id/);
assert.match(styles,/\.location-delete-confirmation/);
assert.match(styles,/@media\(max-width:600px\)/);

console.log("Owner-only confirmed deletion of location cards: OK");
