const assert = require("assert");
const { canonicalSampleId, emptyPbSample, sampleFromPatientRow } = require("./sampleRecord");

assert.strictEqual(canonicalSampleId("BCH-23-61402-01_G38"), "BCH-23-61402-01");
assert.strictEqual(sampleFromPatientRow({ patient_id: "BCH-23-61402-01" }).sampleId, "BCH-23-61402-01");
assert.strictEqual(sampleFromPatientRow({ sample_id: "BCH-23-61402-01" }).sampleId, "BCH-23-61402-01");
assert.deepStrictEqual(emptyPbSample("BCH-23-61402-01").allVariants, []);
console.log("PB Sample patient/sample ID normalization: PASS");
