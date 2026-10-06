const assert = require("assert");
const fs = require("fs");
const path = require("path");
const stats = require("../src/views/PbVariant/carrierStatistics");
const { sampleMetadataFromRows, mergeCarrierMetadata } = require("../src/views/PbVariant/sampleMetadata");
const { clampPage, pageCount, pageRows } = require("../src/views/PbVariant/pagination");
const { hpoPath, hpoVersion } = require("../src/views/PbVariant/hpoHierarchy");
const { sortCarrierRows, sortCoGeneRows, sortCoVariantRows, sortPhenotypeRows } = require("../src/views/PbVariant/tableSorting");

const records = stats.normalizeCarrierRecords([
    {
        id: "internal-a",
        affected: "Yes",
        sex: "F",
        ageYears: 8,
        investigator: "Cohort A",
        project: "Project A",
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
        sex: "M",
        ageYears: 11,
        investigator: "Cohort B",
        project: "Project B",
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
    sex: [],
    age: [],
    project: [],
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
assert.strictEqual(stats.normalizeCarrierRecords([{ id: "no-age" }])[0].ageYears, null, "absent age must not become zero");
assert.strictEqual(stats.normalizeCarrierRecords([{ id: "duplicate" }, { id: "duplicate" }]).length, 1, "carrier records must remain distinct by sample");
assert.strictEqual(pageCount(122, 5), 25, "carrier page count must use five rows per page");
assert.deepStrictEqual(pageRows([1, 2, 3, 4, 5, 6, 7], 2, 5), [6, 7], "page navigation must replace the displayed rows");
assert.deepStrictEqual(pageRows([1, 2, 3, 4, 5, 6, 7], 99, 5), [6, 7], "out-of-range pages must show the last page");
assert.strictEqual(clampPage(999, 4), 4, "page jumps must stay within available pages");
assert.deepStrictEqual(
    [records[0].id, records[0].genotype, records[0].hpoCount, records[0].coGeneCount, records[0].gendx],
    ["internal-a", "0/1", "4", "2", "GENE2(Pathogenic)"],
    "carrier table fields must survive normalization"
);

const metadata = sampleMetadataFromRows([
    { SampleInVCF: "another-sample", age_at_enrollment: "99" },
    { SampleInVCF: "internal-a", age_at_enrollment: "8", gender: "Female", investigator: "Cohort A", clean_name: "Project A", initial_study_affected: "Y", GeneDx: "No Dx", genes: ["GENE1", "GENE2", "gene2", "GENE3"], phenotypes: [
        { hpo_id: "HP:0001250", is_observed: true },
        { hpo_id: "HP:0001250", is_observed: true },
        { hpo_id: "HP:0001252", is_observed: false },
    ] },
], "internal-a", "GENE1");
assert.deepStrictEqual(
    [metadata.ageYears, metadata.sex, metadata.investigator, metadata.project, metadata.affected, metadata.gendx, metadata.coGeneCount],
    [8, "F", "Cohort A", "Project A", "Yes", "No Dx", 2],
    "exact sample metadata must populate the carrier table fields"
);
assert.deepStrictEqual(metadata.coGenes.map(row => row.gene), ["GENE2", "GENE3"], "co-genes must exclude the current gene and deduplicate symbols");
assert.strictEqual(hpoVersion, "2026-09-01", "the pinned ontology release must be explicit");
assert.deepStrictEqual(hpoPath("HP:0001250"), ["HP:0000118", "HP:0000707", "HP:0012638", "HP:0001250"], "Seizure must use a real HPO parent path");
assert.strictEqual(metadata.phenotypes[0].id, "HP:0000707", "observed HPO terms must be grouped under their ontology branch");
assert.deepStrictEqual(metadata.phenotypes[0].terms.map(row => row.id), ["HP:0012638", "HP:0001250"], "observed terms must include their real HPO ancestors but exclude unobserved siblings");
assert.strictEqual(sampleMetadataFromRows([{ SampleInVCF: "internal-a", genes: [] }], "internal-a", "GENE1").coGeneCount, 0, "a known empty gene list must be zero");
assert.strictEqual(sampleMetadataFromRows([{ SampleInVCF: "internal-a" }], "internal-a", "GENE1").coGeneCount, null, "a missing gene list must remain unavailable");
assert.strictEqual(sampleMetadataFromRows([{ SampleInVCF: "another-sample" }], "internal-a"), null, "a different sample must never be joined");
const mergedMetadata = mergeCarrierMetadata(records, { "internal-a": metadata });
assert.strictEqual(mergedMetadata[0].geneBurden, records[0].geneBurden, "metadata must preserve variant carrier evidence");
assert.strictEqual(mergedMetadata[1].investigator, records[1].investigator, "unmatched carriers must retain their original values");
assert.strictEqual(mergedMetadata[0].project, "Project A", "metadata must populate project");
assert.deepStrictEqual(stats.summarizeCooccurrence(mergedMetadata, "coGenes", "gene", mergedMetadata).map(row => [row.gene, row.count]), [["GENE2", 1], ["GENE3", 1]], "co-gene summary must use joined sample genes");
assert.deepStrictEqual(stats.filterCarrierRecords(mergedMetadata, { ...filters, affected: [], phenotype: [], project: ["Project A"] }).map(row => row.id), ["internal-a"], "project filter must use joined sample project");
assert.deepStrictEqual(stats.filterCarrierRecords(mergedMetadata, { ...filters, affected: [], phenotype: ["term:HP:0001250"] }).map(row => row.id), ["internal-a"], "phenotype filter must use observed sample HPO terms");
assert.deepStrictEqual(stats.filterCarrierRecords(mergedMetadata, { ...filters, affected: [], phenotype: ["term:HP:0001252"] }).map(row => row.id), [], "unobserved sample HPO terms must not match");
assert.deepStrictEqual(stats.filterCarrierRecords(mergedMetadata, { ...filters, affected: [], phenotype: ["term:HP:0012638"] }).map(row => row.id), ["internal-a"], "ontology ancestor filters must include observed descendants");
const hierarchy = stats.phenotypeCatalog(mergedMetadata).find(row => row.id === "HP:0000707");
assert.deepStrictEqual(hierarchy.terms.map(row => [row.id, row.parentId, row.depth]), [
    ["HP:0012638", "HP:0000707", 1],
    ["HP:0001250", "HP:0012638", 2],
], "phenotype display must retain HPO parent-child nesting");
assert.deepStrictEqual(sortCarrierRows(mergedMetadata, { key: "age", dir: "desc" }, {}).map(row => row.id), ["internal-b", "internal-a"], "carrier age sort must be numeric");
assert.deepStrictEqual(sortCarrierRows(mergedMetadata, { key: "project", dir: "desc" }, {}).map(row => row.id), ["internal-b", "internal-a"], "carrier project sort must work");
assert.deepStrictEqual(sortCarrierRows(mergedMetadata, { key: "residual", dir: "desc" }, {}, { "internal-a": -0.5, "internal-b": 1.25 }).map(row => row.id), ["internal-b", "internal-a"], "individual residual PheRS sort must be numeric");
assert.deepStrictEqual(sortCoGeneRows([{ gene: "A", count: 2 }, { gene: "B", count: 10 }], { key: "count", dir: "desc" }).map(row => row.gene), ["B", "A"], "co-gene counts must sort numerically");
assert.deepStrictEqual(sortCoVariantRows([{ id: "chr1:2", clinvar: null }, { id: "chr1:1", clinvar: "Benign" }], { key: "clinvar", dir: "asc" }).map(row => row.id), ["chr1:1", "chr1:2"], "missing ClinVar annotations must sort last");
assert.deepStrictEqual(sortCoVariantRows([{ id: "chr1:2", variantScore: 0.9 }, { id: "chr1:1", variantScore: 0.22 }], { key: "variantScore", dir: "desc" }).map(row => row.id), ["chr1:2", "chr1:1"], "co-variant scores must sort numerically");
assert.strictEqual(pageCount(12, 5), 3, "co-occurrence pages must contain five rows");
const twentyTwoPhenotypes = Array.from({ length: 22 }, (_, index) => ({ key: `category-${index}`, count: index + 1, pct: index + 1 }));
assert.strictEqual(pageCount(twentyTwoPhenotypes.length, 11), 2, "22 phenotype categories must use two pages");
assert.deepStrictEqual(pageRows(twentyTwoPhenotypes, 2, 11).map(row => row.count), Array.from({ length: 11 }, (_, index) => index + 12), "second phenotype page must contain the remaining 11 categories");
assert.deepStrictEqual(sortPhenotypeRows(twentyTwoPhenotypes, { key: "count", dir: "desc" }).slice(0, 2).map(row => row.count), [22, 21], "phenotype count sorting must be numeric");

const joined = stats.attachSameGeneCoVariants(
    [{ id: "carrier-a" }, { id: "carrier-b" }],
    [
        { id: "chr1:1:A:G", variantEvidence: [{ label: "LOFTEE", value: "HC" }], carrierSamples: [{ id: "carrier-a" }, { id: "carrier-b" }] },
        { id: "chr1:2:C:T", classification: "SNV", clinvar: "Benign", variantEvidence: [{ label: "AlphaMissense", value: "0.5" }], carrierSamples: [{ id: "carrier-a" }] },
        { id: "chr1:3:G:A", classification: "SNV", carrierSamples: [{ id: "someone-else" }] },
    ],
    "chr1:1:A:G",
    "GENE1"
);
const joinedRecords = stats.normalizeCarrierRecords(joined);
assert.deepStrictEqual(joinedRecords[0].coVariants, [{ id: "chr1:2:C:T", gene: "GENE1", clinvar: "Benign", variantScore: 0.5 }], "same-gene carrier overlap must attach the other variant's score and ClinVar, not its generic class");
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
const lofteeOverlap = stats.attachSameGeneCoVariants(
    [{ id: "carrier-a" }],
    [
        { id: "chr1:1:A:G", carrierSamples: [{ id: "carrier-a" }] },
        { id: "chr1:2:C:T", clinvar: "Pathogenic", variantEvidence: [{ label: "LOFTEE", value: "HC" }], carrierSamples: [{ id: "carrier-a" }] },
    ],
    "chr1:1:A:G", "GENE1"
);
assert.deepStrictEqual(stats.normalizeCarrierRecords(lofteeOverlap)[0].coVariants, [
    { id: "chr1:2:C:T", gene: "GENE1", clinvar: "Pathogenic", variantScore: 1 },
], "LoFTEE HC co-variants must show score 1 with their ClinVar result");

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
assert.deepStrictEqual(
    stats.exactVariantAssociation({ variant_associations: {
        "1:1:A:G": { beta: -0.24, p_value: 0.004, n_carriers: 12, n_samples: 100, low_carrier_count: false, status: "ok" },
    } }, "chr1:1:A:G"),
    { beta: -0.24, pValue: 0.004, carrierCount: 12, sampleCount: 100, lowCarrierCount: false, modelVersion: null, status: "ok" },
    "variant association must match the exact variant ID and retain cohort-wide effect"
);
assert.strictEqual(stats.exactVariantAssociation({ variant_associations: {
    "chr1:1:A:G": { beta: 9, p_value: 0.001, status: "constant_outcome" },
} }, "1:1:A:G").beta, null, "unsupported association must not display a beta");
assert.strictEqual(stats.variantPathogenicScore("HC", "0.2"), 1, "LoFTEE HC takes priority over AlphaMissense");
assert.strictEqual(stats.variantPathogenicScore("Unavailable", "0.2229"), 0.2229, "AlphaMissense supplies the variant score otherwise");
assert.deepStrictEqual(stats.exactVariantCarrierResiduals({ variant_carrier_residuals: {
    variant_id: "1:1:A:G", sample_scores: { "Sample-A": -0.125, "Sample-B": 0.25 },
} }, "chr1:1:A:G"), { "sample-a": -0.125, "sample-b": 0.25 }, "carrier residuals must remain individual and match the exact variant");
assert.deepStrictEqual(stats.exactVariantCarrierResiduals({ variant_carrier_residuals: {
    variant_id: "chr1:2:A:G", sample_scores: { "Sample-A": 1 },
} }, "chr1:1:A:G"), {}, "unrelated variant residuals must not be displayed");

const variantTemplate = fs.readFileSync(path.join(__dirname, "../src/views/PbVariant/Template.vue"), "utf8");
const equalRankHeadings = [
    "<h3>Observed phenotypes</h3>",
    "<h3>Carrier samples</h3>",
    "<h3>Co-occurrence among this variant's carriers</h3>",
].map(heading => variantTemplate.indexOf(heading));
assert(equalRankHeadings.every(index => index >= 0), "carrier result sections must use explicit equal-rank headings");
assert(equalRankHeadings.every((index, position) => position === 0 || index > equalRankHeadings[position - 1]), "carrier result sections must retain phenotype, samples, co-occurrence order");
assert(variantTemplate.includes("people with this exact variant"), "variant identity must label carrier counts as people");
assert(variantTemplate.includes("<h2>Carrier statistics <abbr") && variantTemplate.includes("Filter this variant's carriers. Phenotype, sample, and co-occurrence results update together."), "carrier workspace must show the heading and help tooltip");
assert(!variantTemplate.includes("Carrier statistics — filter to explore"), "carrier workspace must not retain the old oversized compound heading");
assert(variantTemplate.includes("Carrier sample table") && !variantTemplate.includes("5 rows per page"), "carrier table must avoid redundant page-size copy");
assert.strictEqual((variantTemplate.match(/<SummaryPager class="pbv-result-pagination"/g) || []).length, 4, "phenotypes and all three result tables must use numbered pagination");
assert(variantTemplate.includes("Count (%)") && variantTemplate.includes("visiblePhenotypeRows"), "phenotype count header and paginated rows must be present");
assert(!variantTemplate.includes("sortTableColumn('carriers', 'coGenes')") && !variantTemplate.includes("carrierCoGeneCount(carrier)"), "carrier sample table must omit numeric co-gene column");
const contextResultMarkup = variantTemplate.slice(variantTemplate.indexOf('class="pbg-context-results"'), variantTemplate.indexOf('class="pbv-context-crossref"'));
const carrierTableMarkup = variantTemplate.slice(variantTemplate.indexOf('class="pbv-carrier-table"'), variantTemplate.indexOf('class="pbv-result-block"', variantTemplate.indexOf('class="pbv-carrier-table"')));
assert(["Effect Score (β)", "p-value"].every(label => contextResultMarkup.includes(label)), "HPO Context must show exact-variant association results");
assert(carrierTableMarkup.includes("rPheRS") && carrierTableMarkup.includes("What is rPheRS?"), "carrier table must explain individual residual PheRS");
assert(!carrierTableMarkup.includes("Variant Score"), "carrier table must not repeat the exact-variant score");
assert(!carrierTableMarkup.includes("Effect Score (β)") && !carrierTableMarkup.includes("p-value"), "carrier rows must not repeat exact-variant association results");
assert(variantTemplate.includes("variantScoreSource === 'loftee'") && variantTemplate.includes("variantScoreSource === 'alphaMissense'"), "identity must mark the selected variant-score source");
assert(variantTemplate.includes("pbv-variant-score-highlight"), "identity must highlight the selected score value");
assert(!variantTemplate.includes("displayVariantMatch(contextMatch.matchScore)"), "carrier rows must not repeat the aggregate Match Score as an individual residual");
assert(variantTemplate.includes("carrierResidualScore(carrier)"), "carrier table must show each carrier's individual residual when returned by the private Context API");
assert(!variantTemplate.includes("+3 more") && !variantTemplate.includes("+10 more"), "incremental show-more controls must be removed");
assert(variantTemplate.includes("pbv-carrier-inline-scores"), "carrier scores must stay inline with the section heading");
assert(!variantTemplate.includes(">Proband<"), "Variant filters and carrier table must not expose Proband");
assert(!variantTemplate.includes('class="pbv-add-btn"'), "facet selection must not require a separate plus button");
assert(variantTemplate.includes('@change="addFacet(facet.key)"') && variantTemplate.includes('@change="addFacet(\'age\')"'), "selecting a facet must add it immediately");
assert(!variantTemplate.includes("<span>Investigator</span>"), "carrier statistics table must show project instead of investigator");

const variantPageModel = fs.readFileSync(path.join(__dirname, "../src/views/PbVariant/pageModel.js"), "utf8");
assert(variantPageModel.includes("const CARRIER_TABLE_LIMIT = 5;"), "carrier table must show five samples per page");
assert(variantPageModel.includes("const COOCCURRENCE_LIMIT = 5;"), "both co-occurrence tables must show five rows per page");
assert(variantTemplate.includes("Variant Score") && variantTemplate.includes("ClinVar"), "co-variant table must label score and ClinVar");
const coGeneMarkup = variantTemplate.slice(variantTemplate.indexOf("<h3>Different-gene co-carriers"), variantTemplate.indexOf("<h3>Other {{ variantIdentity.gene }} variants"));
assert(coGeneMarkup.includes("pbv-cooccur-row--target") && coGeneMarkup.includes("visibleCooccurGeneRows"), "target gene must stay fixed above five paginated co-genes");
assert(coGeneMarkup.includes("Carrier overlap uses the current filters.") && !coGeneMarkup.includes("coGeneScoreType") && !variantTemplate.includes("5 rows per page"), "co-occurrence help must be in the heading without redundant option or row-count copy");
assert(["'beta'", "'pValue'", "'fdr'"].every(key => coGeneMarkup.includes(key)), "gene association columns must be sortable");
assert(variantTemplate.includes('v-model="contextScoreTypeInput"') && variantTemplate.includes('v-model="contextAnalysisSetInput"'), "HPO Go form must offer max/sum and all/affected controls");
assert(variantTemplate.includes('class="pbg-context-disclosure" open'), "HPO Context must start expanded");
assert(variantTemplate.includes('<hpo-term-input v-model="contextInput"') && variantPageModel.includes("resolveHpoTerms(this.contextInput)"), "Variant HPO context must reuse Gene phenotype search and name resolution");
assert(variantPageModel.includes("contextApiError(response)"), "Variant HPO context must show the API's specific validation error");
assert(!coGeneMarkup.includes("sortTableColumn('coGenes', 'pct')") && !coGeneMarkup.includes("sortTableColumn('coGenes', 'note')"), "co-gene overlap and note must not occupy separate columns");
assert.deepStrictEqual(sortCoGeneRows([
    { gene: "A", beta: -0.2, pValue: 0.01, fdr: 0.02 },
    { gene: "B", beta: 0.1, pValue: 0.04, fdr: 0.04 },
], { key: "fdr", dir: "asc" }).map(row => row.gene), ["A", "B"], "co-gene FDR must sort numerically");
const coVariantMarkup = variantTemplate.slice(variantTemplate.indexOf("<h3>Other {{ variantIdentity.gene }} variants"), variantTemplate.indexOf('label="Other same-gene variant pages"'));
assert(!coVariantMarkup.includes("sortTableColumn('coVariants', 'pct')") && coVariantMarkup.includes("{{ row.count }} / {{ matchCount }} ({{ row.pct }}%)"), "co-variant carriers and overlap percentage must share one column");
assert(variantPageModel.includes("emptyResultMessage"), "missing BioIndex carrier data must use the neutral empty-result state");
assert(variantTemplate.includes("Search this variant in ClinVar ↗"), "empty variant results must retain a public reference path");
assert(!variantPageModel.includes('key: "proband"'), "Variant filter state must not expose Proband");

console.log("PB_VARIANT_CARRIER_STATISTICS_PASS");
