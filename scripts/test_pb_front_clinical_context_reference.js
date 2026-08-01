const assert = require("node:assert/strict");
const fs = require("fs");
const vm = require("vm");

const source = fs
    .readFileSync("src/views/KrClinicalFocus/clinicalContextReference.generated.js", "utf8")
    .replace(/export const /g, "globalThis.");
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

assert.ok(context.hpoTerms.some(([id, name]) => id === "HP:0000118" && name === "Phenotypic abnormality"));
assert.ok(context.orphanetProfiles.length > 4000);
assert.ok(context.orphanetProfiles.every(([, , hpoIds]) => hpoIds.length));
assert.ok(context.mondoProfiles.length > 1000);
assert.ok(context.mondoProfiles.every(([, , hpoIds, orphaIds]) => hpoIds.length && orphaIds.length));

console.log("PB_FRONT_CONTEXT_REFERENCE_TEST_PASS");
