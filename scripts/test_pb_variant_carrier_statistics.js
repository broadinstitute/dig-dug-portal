const assert = require("assert");
const fs = require("fs");
const path = require("path");
const stats = require("../src/views/PbVariant/carrierStatistics");

const records = stats.normalizeCarrierRecords([
    {
        id: "internal-a",
        affected: "Yes",
        proband: "Proband",
        sex: "F",
        ageYears: 8,
        investigator: "Cohort A",
        gt: "0/1",
        hpo: 4,
        genes: 2,
        gendx: "GENE2(Pathogenic)",
        phenotypeCategories: [{
            key: "nervous",
            label: "Nervous system",
            id: "HP:0000707",
            terms: [{ id: "HP:0001250", label: "Seizure" }],
        }],
        coGenes: [{ gene: "GENE2", note: "qualifying" }, { gene: "GENE2", note: "qualifying" }],
    },
    {
        id: "internal-b",
        affected: "No",
        proband: "non-Proband",
        sex: "M",
        ageYears: 11,
        investigator: "Cohort B",
        phenotypeCategories: [{
            key: "growth",
            label: "Growth",
            id: "HP:0001507",
            terms: [{ id: "HP:0004322", label: "Short stature" }],
        }],
    },
]);

const filters = {
    affected: ["Yes"],
    proband: [],
    sex: [],
    age: [],
    investigator: [],
    phenotype: ["term:HP:0001250"],
};
const filtered = stats.filterCarrierRecords(records, filters);
const phenotypeRows = stats.summarizePhenotypes(filtered, stats.phenotypeCatalog(records));
const coGenes = stats.summarizeCooccurrence(filtered, "coGenes", "gene", records);

assert.strictEqual(filtered.length, 1, "facet intersection must retain one matching carrier");
assert.strictEqual(phenotypeRows.find(row => row.key === "nervous").count, 1, "matching phenotype must be counted");
assert.strictEqual(phenotypeRows.find(row => row.key === "growth").count, 0, "non-matching phenotype must remain visible with zero");
assert.deepStrictEqual(coGenes.map(row => [row.gene, row.count]), [["GENE2", 1]], "co-occurrence must use the same filtered carrier subset");
assert.strictEqual(stats.normalizeCarrierRecords([{ age: "Unavailable" }])[0].ageYears, null, "missing age must not become zero");
assert.strictEqual(stats.normalizeCarrierRecords([{ id: "duplicate" }, { id: "duplicate" }]).length, 1, "carrier records must remain distinct by sample");
assert.deepStrictEqual(
    [records[0].id, records[0].genotype, records[0].hpoCount, records[0].coGeneCount, records[0].gendx],
    ["internal-a", "0/1", "4", "2", "GENE2(Pathogenic)"],
    "carrier table fields must survive normalization"
);

const joined = stats.attachSameGeneCoVariants(
    [{ id: "carrier-a" }, { id: "carrier-b" }],
    [
        { id: "chr1:1:A:G", variantEvidence: [{ label: "LOFTEE", value: "HC" }], carrierSamples: [{ id: "carrier-a" }, { id: "carrier-b" }] },
        { id: "chr1:2:C:T", classification: "SNV", variantEvidence: [{ label: "AlphaMissense", value: "0.5" }], carrierSamples: [{ id: "carrier-a" }] },
        { id: "chr1:3:G:A", classification: "SNV", carrierSamples: [{ id: "someone-else" }] },
    ],
    "chr1:1:A:G",
    "GENE1"
);
const joinedRecords = stats.normalizeCarrierRecords(joined);
assert.deepStrictEqual(joinedRecords[0].coVariants, [{ id: "chr1:2:C:T", gene: "GENE1", classification: "SNV" }], "same-gene carrier overlap must attach the other variant");
assert.deepStrictEqual(joinedRecords[1].coVariants, [], "target variant and non-overlapping carriers must be excluded");
assert.deepStrictEqual(
    joinedRecords.map(record => record.geneBurden),
    [1.5, 1],
    "carrier GRS must sum LoFTEE/AlphaMissense burden scores across carried variants"
);
assert.deepStrictEqual(
    stats.summarizeCooccurrence([joinedRecords[0]], "coVariants", "id", joinedRecords).map(row => [row.id, row.count, row.pct]),
    [["chr1:2:C:T", 1, 100]],
    "same-gene co-occurrence must recalculate against the filtered carrier denominator"
);

assert.deepStrictEqual(
    stats.exactVariantContext({
        variant_match_scores: {
            "1:1:A:G": { match_score: -0.25, carrier_count: 2, scored_carrier_count: 2, status: "ok" },
        },
    }, "chr1:1:A:G"),
    { matchScore: -0.25, carrierCount: 2, scoredCarrierCount: 2, status: "ok" },
    "complete context aggregate must retain negative residual PheRS means"
);
assert.strictEqual(
    stats.exactVariantContext({
        variant_match_scores: {
            "chr1:1:A:G": { match_score: 0.5, carrier_count: 2, scored_carrier_count: 1, status: "incomplete_scores" },
        },
    }, "1:1:A:G").matchScore,
    null,
    "partial residual PheRS means must never be displayed"
);

const variantTemplate = fs.readFileSync(path.join(__dirname, "../src/views/PbVariant/Template.vue"), "utf8");
const equalRankHeadings = [
    "<h3>Phenotype categories</h3>",
    "<h3>Carrier samples</h3>",
    "<h3>Co-occurrence among this variant's carriers</h3>",
].map(heading => variantTemplate.indexOf(heading));
assert(equalRankHeadings.every(index => index >= 0), "carrier result sections must use explicit equal-rank headings");
assert(equalRankHeadings.every((index, position) => position === 0 || index > equalRankHeadings[position - 1]), "carrier result sections must retain phenotype, samples, co-occurrence order");
assert(variantTemplate.includes("people with this exact variant"), "variant identity must label carrier counts as people");
assert(variantTemplate.includes("<h2>Carrier statistics</h2>"), "carrier workspace must use the approved standalone heading");
assert(!variantTemplate.includes("Carrier statistics — filter to explore"), "carrier workspace must not retain the old oversized compound heading");
assert(variantTemplate.includes("Carrier sample table") && variantTemplate.includes("3 rows at a time"), "carrier table must be visible with a three-row preview");
assert(variantTemplate.includes("pbv-carrier-inline-scores"), "carrier scores must stay inline with the section heading");

const variantPageModel = fs.readFileSync(path.join(__dirname, "../src/views/PbVariant/pageModel.js"), "utf8");
assert(variantPageModel.includes("const CARRIER_TABLE_LIMIT = 3;"), "carrier table must reveal three samples per increment");

const geneTemplate = fs.readFileSync(path.join(__dirname, "../src/views/PbGene/Template.vue"), "utf8");
assert(geneTemplate.includes("positions ·") && geneTemplate.includes("variants in view"), "gene locus must distinguish positions from variants");
assert(geneTemplate.includes("people in view"), "gene locus must label the visible distinct-carrier total");
assert(!geneTemplate.includes("Pathogenic variants in this gene"), "prediction annotations must not be mislabeled as pathogenic variants");
assert(geneTemplate.includes("<details class=\"pbg-context-disclosure\">"), "gene HPO Context must be collapsed by default");
assert(geneTemplate.includes("Variant ↗"), "expanded variant evidence must provide a concise variant-page action");
assert(!/class="pbg-variant-id">\s*<a/.test(geneTemplate), "variant IDs in evidence rows must expand in place instead of navigating");

const genePageModel = fs.readFileSync(path.join(__dirname, "../src/views/PbGene/pageModel.js"), "utf8");
assert(genePageModel.includes("const VARIANT_LIMIT  = 5;"), "gene variant evidence must show five rows per increment");

const geneStyle = fs.readFileSync(path.join(__dirname, "../src/views/PbGene/style.css"), "utf8");
assert(/\.pbg-ve-classification \.pbg-clinvar-badge\s*\{[^}]*background:\s*transparent;/s.test(geneStyle), "variant classifications must not use shaded boxes");
assert(/\.pbg-context-disclosure > summary::before\s*\{[^}]*content:\s*"›";/s.test(geneStyle), "HPO Context disclosures must use the shared bold chevron");

console.log("PB_VARIANT_CARRIER_STATISTICS_PASS");
