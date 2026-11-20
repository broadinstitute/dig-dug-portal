const assert = require("assert");
const { canonicalSampleId, emptyPbSample, sampleFromPatientRow } = require("./sampleRecord");

assert.strictEqual(canonicalSampleId("BCH-00-00001-01_G38"), "BCH-00-00001-01");
assert.strictEqual(canonicalSampleId("BCH-00-00002-01_E38"), "BCH-00-00002-01");
assert.strictEqual(canonicalSampleId(" BCH-00-00002-01_e38 "), "BCH-00-00002-01");
assert.strictEqual(canonicalSampleId("BCH-00-00002-01_OTHER"), "BCH-00-00002-01_OTHER");
assert.strictEqual(sampleFromPatientRow({ patient_id: "BCH-00-00001-01" }).sampleId, "BCH-00-00001-01");
assert.strictEqual(sampleFromPatientRow({ sample_id: "BCH-00-00001-01" }).sampleId, "BCH-00-00001-01");
assert.deepStrictEqual(emptyPbSample("BCH-00-00001-01").allVariants, []);
console.log("PB Sample patient/sample ID normalization: PASS");
