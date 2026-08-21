const assert = require("assert");
const { familyIdFromSampleId, sortFamilyMembers } = require("./familyModel");

assert.strictEqual(familyIdFromSampleId("BCH-22-12345-01"), "BCH-22-12345");
assert.strictEqual(familyIdFromSampleId("CRDC-000184"), "");

const ordered = sortFamilyMembers([
    { sampleId: "BCH-22-12345-12", role: "father" },
    { sampleId: "BCH-22-12345-03", role: "sibling" },
    { sampleId: "BCH-22-12345-02", role: "twin" },
    { sampleId: "BCH-22-12345-11", role: "mother" },
    { sampleId: "BCH-22-12345-01", role: "case" },
]);

assert.deepStrictEqual(ordered.map((member) => member.role), ["case", "twin", "sibling", "mother", "father"]);
console.log("PB Sample family ordering: PASS");
