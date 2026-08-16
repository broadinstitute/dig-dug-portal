const assert = require("node:assert/strict");
const {
    buildSearchHref,
    findSearchOptions,
    normalizeSearchValue,
    resolveSearchTarget,
} = require("../src/views/PbFront/searchModel");

const genes = new Set(["adcy10", "slc6a7"]);
const options = [
    {
        kind: "Gene",
        label: "ADCY10",
        normalizedLabel: "adcy10",
        normalizedId: "",
        searchKey: "adcy10",
        aliases: [],
    },
    {
        kind: "Phenotype",
        label: "Delayed speech and language development",
        id: "HP:0000750",
        normalizedLabel: "delayed speech and language development",
        normalizedId: "hp:0000750",
        searchKey: "delayed speech and language development hp:0000750 speech delay",
        aliases: ["speech delay"],
    },
];

assert.equal(normalizeSearchValue("  AdCy10 "), "adcy10");
assert.equal(findSearchOptions(options, "adcy")[0].label, "ADCY10");
assert.equal(findSearchOptions(options, "speech delay")[0].id, "HP:0000750");
assert.deepEqual(resolveSearchTarget("adcy10", "", genes), {
    path: "/pb_Gene.html",
    param: "query",
    value: "ADCY10",
});
assert.equal(
    buildSearchHref(resolveSearchTarget("Progressive muscle weakness [HP:0003323]", "Phenotype", genes)),
    "/krPhenotype.html?query=Progressive%20muscle%20weakness%20%5BHP%3A0003323%5D"
);
assert.equal(resolveSearchTarget("BCH-22-44945-01", "", genes).path, "/krSample.html");
assert.equal(resolveSearchTarget("chr12:102912793:CA:C", "", genes).path, "/pb_variant.html");
assert.equal(resolveSearchTarget("", "", genes), null);

console.log("PB_FRONT_SEARCH_TEST_PASS");
