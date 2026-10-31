import assert from "node:assert/strict";
import {
  DEFAULT_PROFILE_SECTIONS,
  normalizeProfileSections,
  profileSectionPreset,
} from "../../src/lib/business-profile-layout";

assert.deepEqual(normalizeProfileSections(undefined), DEFAULT_PROFILE_SECTIONS);
assert.deepEqual(normalizeProfileSections(null), DEFAULT_PROFILE_SECTIONS);
assert.deepEqual(normalizeProfileSections([]), []);
assert.deepEqual(
  normalizeProfileSections(["posts", "services", "posts", "injected", 9, "about"]),
  ["posts", "services", "about"],
);
assert.deepEqual(profileSectionPreset("Estudio de fotografía"), [
  "portfolio", "services", "posts", "about", "locations",
]);
assert.equal(profileSectionPreset("Restaurante")[0], "services");
assert.equal(profileSectionPreset("Peluquería")[0], "services");
assert.deepEqual(profileSectionPreset("Consultoría"), DEFAULT_PROFILE_SECTIONS);
console.log("Business profile layout tests passed.");
