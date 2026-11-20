const assert = require("assert");
const { burdenPathogenicScore, burdenScoreValue, burdenScoreSource, variantScoreExplanation } = require("./variantEvidence");

assert.deepStrictEqual(burdenPathogenicScore({ loftee: "HC", alphaMissense: "0.20", revel: "0.30" }), { display: "1.00", title: "LoFTEE HC" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "0.91", revel: "0.86" }), { display: "0.91", title: "AlphaMissense score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "0", revel: "—" }), { display: "0.00", title: "AlphaMissense score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "—", revel: "0.86" }), { display: "—*", title: "REVEL available; excluded from this score" });
assert.deepStrictEqual(burdenPathogenicScore({ loftee: "—", alphaMissense: "—", revel: "—" }), { display: "—", title: "No LoFTEE HC, AlphaMissense, or REVEL annotation" });
assert.equal(burdenScoreValue({loftee:'HC',alphaMissense:.2}),1);
assert.equal(burdenScoreValue({alphaMissense:0}),0);
assert.equal(burdenScoreValue({revel:.9}),null,'REVEL is not substituted into the Gene/Variant burden score');
assert.equal(burdenScoreSource({alphaMissense:0,revel:.8}),'AM');
assert.equal(burdenScoreSource({revel:.8}),'REVEL');
assert.equal(burdenScoreSource({alphaMissense:'Unavailable',revel:'—'}),'none');
const homozygous = {alphaMissense:.073,genotype:'1/1'};
assert.equal(burdenPathogenicScore(homozygous).display,'0.07','The variant annotation score is not doubled for a homozygous call');
assert(variantScoreExplanation(homozygous).includes('0.073 × 2 = 0.146'),'Explain full-precision annotation score separately from dosage weighting');
assert(variantScoreExplanation({alphaMissense:.073,genotype:'1|1'}).includes('0.073 × 2 = 0.146'));
assert(!variantScoreExplanation({alphaMissense:.073,genotype:'1/2'}).includes(' × '),'Do not infer exact-variant dosage for an unresolved multiallelic call');
assert(!variantScoreExplanation({alphaMissense:.073,genotype:'./.'}).includes(' × '));

console.log("PB Sample pathogenic score: PASS");
