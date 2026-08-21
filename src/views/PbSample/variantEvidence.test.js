const assert = require("assert");
const { burdenPathogenicScore } = require("./variantEvidence");

assert.deepStrictEqual(burdenPathogenicScore({ loftee: "HC", alphaMissense: "0.20", revel: "0.30" }), { display: "1.00", title: "LoFTEE HC" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "0.91", revel: "0.86" }), { display: "0.91", title: "AlphaMissense score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "0", revel: "—" }), { display: "0.00", title: "AlphaMissense score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "—", revel: "0.86" }), { display: "—*", title: "REVEL available; excluded from this score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "—", revel: "—" }), { display: "—", title: "No LoFTEE HC, AlphaMissense, or REVEL annotation" });

console.log("PB Sample pathogenic score: PASS");
