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
    path: "/pb_gene2.html",
    param: "query",
    value: "ADCY10",
});
assert.equal(
    buildSearchHref(resolveSearchTarget("Progressive muscle weakness [HP:0003323]", "Phenotype", genes)),
    "/pb_phenotype.html?query=Progressive%20muscle%20weakness%20%5BHP%3A0003323%5D"
);
assert.equal(resolveSearchTarget("BCH-22-44945-01", "", genes).path, "/pb_sample.html");
assert.equal(resolveSearchTarget("chr12:102912793:CA:C", "", genes).path, "/pb_variant.html");
assert.equal(resolveSearchTarget("", "", genes), null);

// PB hyperlinks must use the default Gene2 page, including legacy entry screens.
const fs = require('node:fs');
for (const file of [
    'src/views/PbFront/Template.vue',
    'src/views/PbSample/Template.vue',
    'src/views/PbGene/Template.vue',
    'src/views/PbPhenotype/Template.vue',
    'src/views/PbVariant/Template.vue',
    'src/views/KrFront/pageModel.js',
]) {
    const source = fs.readFileSync(require('node:path').join(__dirname, '..', file), 'utf8');
    assert(!/\/pb_gene\.html/i.test(source), `${file} must not generate legacy Gene hyperlinks`);
    assert(source.includes('/pb_gene2.html'), `${file} must offer the default Gene2 destination`);
}

console.log("PB_FRONT_SEARCH_TEST_PASS");
