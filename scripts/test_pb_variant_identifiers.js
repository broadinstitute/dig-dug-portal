const assert = require("node:assert/strict");
const {
    buildTranscriptIdentity,
    canonicalVariantId,
    gnomadVariantHref,
    isRsid,
    isVariantId,
    resolveRsidReference,
    resolveVariantReference,
} = require("../src/views/PbVariant/variantIdentifiers");

assert.equal(canonicalVariantId("chr1:167,845,562:ct:c"), "1:167845562:CT:C");
assert.equal(isVariantId("chr1:167845562:CT:C"), true);
assert.equal(isRsid("rs1558177664"), true);
assert.equal(resolveRsidReference("RS1558177664").variantId, "chr1:167845562:CT:C");
assert.equal(resolveVariantReference("1:167845562:CT:C").rsid, "rs1558177664");
assert.equal(
    gnomadVariantHref("chr1:167845562:CT:C"),
    "https://gnomad.broadinstitute.org/variant/1-167845562-CT-C?dataset=gnomad_r4"
);

const transcript = buildTranscriptIdentity([
    {
        symbol: "ADCY10",
        Feature: "ENST00000367848",
        hgvsc: "ENST00000367848.1:c.2731del",
        hgvsp: "ENSP00000356822.1:p.Thr911LeufsTer28",
    },
    {
        symbol: "ADCY10",
        Feature: "ENST00000367851",
        hgvsc: "ENST00000367851.9:c.3007del",
        hgvsp: "ENSP00000356825.4:p.Thr1003LeufsTer28",
        pick: "1",
    },
], {
    symbol: "ADCY10",
    refseqAccession: "NM_018417",
    maneSelect: "ENST00000367851.9|NM_018417.6",
});

assert.deepEqual(transcript, {
    hgvsc: "c.3007del",
    hgvsp: "p.Thr1003LeufsTer28",
    ensemblTranscript: "ENST00000367851.9",
    ensemblProtein: "ENSP00000356825.4",
    refseqTranscript: "NM_018417.6",
    rsid: null,
});

console.log("PB_VARIANT_IDENTIFIERS_PASS");
