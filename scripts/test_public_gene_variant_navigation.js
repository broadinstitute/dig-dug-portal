// Run: node scripts/test_public_gene_variant_navigation.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const babel = require("@babel/core");
const Vue = require("vue");
const compiler = require("vue-template-compiler");

const root = path.resolve(__dirname, "..");
const window = { location: { search: "?query=GC" } };
let contextRequest;

function load(source, filename, imports) {
    const code = babel.transformSync(source, {
        filename,
        babelrc: false,
        configFile: false,
        plugins: ["@babel/plugin-transform-modules-commonjs"],
    }).code;
    const exports = {};
    vm.runInNewContext(code, {
        exports,
        require(name) {
            assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
            return imports[name];
        },
        window, URLSearchParams, process: { env: {} },
        fetch: async (url, options) => {
            contextRequest = { url, body: JSON.parse(options.body) };
            return {
                ok: true,
                json: async () => ({
                    gene_association: { status: "ok", model: "lm", score_type: "sum", affected_only: true, beta: 0.42, p_value: 0.01 },
                    variant_associations: { "CHR4:71741650:A:T": { status: "ok", beta: -0.2, p_value: 0.03 } },
                    variant_match_scores: { "CHR4:71741650:A:T": { match_score: 0.125 } },
                }),
            };
        },
    });
    return exports;
}

function loadFile(relative, imports = {}) {
    const filename = path.join(root, relative);
    return load(fs.readFileSync(filename, "utf8"), filename, imports);
}

const navigation = loadFile("src/views/PbGene/variantTableNavigation.js");
const carrierAge = loadFile("src/views/PbGene/carrierAge.js");
const clinvarBadge = loadFile("src/views/PbGene/clinvarBadge.js");
const hgvsNotation = loadFile("src/views/PbGene/hgvsNotation.js");
const hpoSearch = loadFile("src/views/PbGene/hpoContextSearch.js", {
    "../KrClinicalFocus/clinicalContextReference.generated": loadFile("src/views/KrClinicalFocus/clinicalContextReference.generated.js"),
    "../PbFront/searchModel": require("../src/views/PbFront/searchModel"),
});
const model = loadFile("src/views/PublicGene/pageModel.js", {
    "../PbGene/hpoContextSearch": hpoSearch,
    "./publicReference": {
        publicGeneReference: gene => ({
            known: true,
            geneInfo: { symbol: gene, chromosome: "4", location: "chr4:71,741,600-71,741,900" },
            genomeWindow: { exons: [] },
        }),
    },
    "../PbGene/geneHpoDisplay": { displayGeneHpoAssociations: rows => rows },
    "../PbGene/variantTableNavigation": navigation,
    "../PbGene/carrierAge": carrierAge,
});
const filename = path.join(root, "src/views/PublicGene/Template.vue");
const script = compiler.parseComponent(fs.readFileSync(filename, "utf8")).script.content;
const component = load(script, filename, {
    "../PbGene/GeneIdentityPanel": {},
    "../PbGene/HpoTermInput": {},
    "../PbGene/locusFilters": loadFile("src/views/PbGene/locusFilters.js"),
    "../PbGene/summaryTable": loadFile("src/views/PbGene/summaryTable.js"),
    "../PbGene/SummaryPager": {},
    "../PbGene/CarrierSummaryKpis": {},
    "./pageModel": model,
    "../PbGene/variantTableNavigation": navigation,
    "../PbGene/carrierAge": carrierAge,
    "../PbGene/clinvarBadge": clinvarBadge,
    "../PbGene/hgvsNotation": hgvsNotation,
    "../PbGene/style.css": {},
    "./public.css": {},
}).default;
const page = new Vue({ data: component.data, computed: component.computed, methods: component.methods });
assert.equal(page.publicGnomadHref("chr1:173904007:G:A"), "https://gnomad.broadinstitute.org/variant/1-173904007-G-A");
assert.equal(page.publicClinvarHref("chr1:173904007:G:A"), "https://www.ncbi.nlm.nih.gov/clinvar/?term=chr1%3A173904007%3AG%3AA");
assert.equal(page.hgvsNotation("ENST00000367698.4:c.1277C>T"), "c.1277C>T");

page.variantRows = Array.from({ length: 12 }, (_, index) => ({
    id: `chr4:${71741650 + index * 10}:A:T`,
    position: 71741650 + index * 10,
    clinvar: "",
    alphaMissense: "",
    loftee: "",
}));
page.genomeWindow.exons = [{ start: 71741600, end: 71741900 }];
assert.equal(page.locusPositionCount, 12);
page.variantRows.push({ ...page.variantRows[0], id: "chr4:71741650:A:G" });
assert.equal(page.locusVariantMarkers.length, 13);
assert.equal(page.locusPositionCount, 12, "Two alleles at one position count as one coordinate");
page.variantRows.pop();
assert.equal(page.variantPageCount, 3);
assert.equal(page.visibleVariantRows.length, 5);
page.goToVariantPage(2);
assert.equal(page.visibleVariantRows[0].position, 71741700);

page.variantPositionQuery = "71741722";
page.searchVariantPosition();
assert.equal(page.visibleVariantRows[2].position, 71741720);
assert.equal(page.variantSearchResultId, "chr4:71741720:A:T");
const beforeInvalid = page.visibleVariantRows.map(row => row.id).join(",");
page.variantPositionQuery = "chr5:71741722";
page.searchVariantPosition();
assert.equal(page.variantPositionError, "Invalid position");
assert.equal(page.visibleVariantRows.map(row => row.id).join(","), beforeInvalid);

page.goToVariantPage(3);
assert.equal(page.variantSearchStart, null);
assert.equal(page.visibleVariantRows.length, 2);
assert.equal(page.variantPositionError, "");
page.variantPageJump = "2";
page.jumpToVariantPage();
assert.equal(page.variantPage, 2);
page.variantPageJump = "80";
page.jumpToVariantPage();
assert.equal(page.variantPageJumpError, "Invalid page");
assert.equal(page.variantPage, 2);
async function testContext() {
    page.publicContextScoreType = "sum";
    page.publicContextAnalysisSet = "affected";
    page.publicContextInput = "HP:0001250; hp:0000133 HP:0001250";
    await page.selectPublicHpoContext();
    assert.equal(contextRequest.body.score_type, "sum");
    assert.equal(contextRequest.body.affected_only, true);
    assert.deepEqual(Array.from(page.publicContextTerms), ["HP:0001250", "HP:0000133"]);
    assert.equal(page.publicContextError, "");
    assert.equal(page.publicGeneAssociation.beta, 0.42);
    assert.equal(page.variantRows[0].variantEffectBeta, -0.2);
    assert.equal(page.variantRows[0].variantEffectPValue, 0.03);
    assert.equal(page.variantRows[0].phenotypeMatchScore, 0.125);
    assert.equal(page.variantRows[1].phenotypeMatchScore, null);
    assert.equal(page.variantRows[1].variantEffectBeta, null);
    page.publicContextInput = "HP:123";
    await page.selectPublicHpoContext();
    assert.equal(page.publicContextError, "HP:123 is not a valid HPO ID.");
    assert.deepEqual(Array.from(page.publicContextTerms), ["HP:0001250", "HP:0000133"]);
    page.$destroy();
    console.log("PUBLIC_GENE_VARIANT_NAVIGATION_TEST_PASS");
}

testContext().catch(error => { console.error(error); process.exitCode = 1; });
