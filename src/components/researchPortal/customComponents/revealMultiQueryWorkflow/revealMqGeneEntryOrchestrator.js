/**
 * Genes-first entry point orchestration for Multi Query REVEAL.
 *
 * Flow:
 * 1. bayes_gene/phenotypes → ranked trait candidates
 * 2. Walk candidates in order until N traits return non-empty pigean-gene-phenotype data
 *    (cfde id overlap is sparse; fixed top-N often yields all-empty)
 * 3. For those traits' top factors/gene sets: pigean-joined-gene-set (batched)
 * 4. merge into canonical factorData → Data tab heatmap / KG / network
 * 5. Data-tab Continue gate (+ optional research intention) → mechanistic hypotheses
 */

import {
    DEFAULT_FETCH_CONCURRENCY,
    fetchGeneAndGeneSetScoresForPhenotypes,
    fetchGenePhenotypes,
    fetchJoinedGeneSetMembersForPairs,
} from "./revealMqGeneEntryApi.js";
import { selectTopTraits } from "./revealMqGeneEntryCrossReference.js";
import {
    DEFAULT_MAX_FACTORS,
    DEFAULT_MAX_GENE_SETS,
    buildFactorDataFromPhenotypePigean,
    fillMissingFactorWithTrait,
    selectTopFactorIds,
    selectTopGeneSetsFromRows,
} from "./revealMqGeneEntryFactorData.js";
import { requestMechanismHypotheses } from "./revealMqHypothesisOrchestrator.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";

/** How many traits with non-empty gene-phenotype data to keep. */
const TARGET_TRAITS_WITH_DATA = 10;
/** Phenotypes per score-fetch wave (each phenotype = 2 GETs; keep ~DEFAULT_FETCH_CONCURRENCY in flight). */
const TRAIT_SCAN_BATCH_SIZE = Math.max(1, Math.floor(DEFAULT_FETCH_CONCURRENCY / 2));

function emptyGeneEntryState() {
    return {
        status: "idle", // idle | loading | partial | error | ready
        inputGenes: [],
        errors: { phenotypes: null, perPhenotype: {} },
        phenotypesResponse: null,
        topTraits: [],
        progress: { message: "", detail: "" },
        researchIntention: "",
    };
}

function setGeneEntryProgress(vm, message, detail = "") {
    if (!vm.geneEntry) return;
    vm.$set(vm.geneEntry, "progress", { message: String(message || ""), detail: String(detail || "") });
}

/** Parses the raw `genes=` URL param into a normalized, deduped gene symbol list. */
function parseGenesParam(vm, rawGenesParam) {
    const withCommas = String(rawGenesParam || "").replace(/[\n;]+/g, ",");
    return vm.normalizeHelperSelectedGenes([withCommas]);
}

function traitHasGenePhenotypeData(bundle) {
    return !!(bundle && Array.isArray(bundle.geneRows) && bundle.geneRows.length > 0);
}

/** Unique gene symbols from pigean-gene-phenotype rows across bundles (sorted). */
function collectGeneNamesFromBundles(bundles) {
    const names = new Set();
    (Array.isArray(bundles) ? bundles : []).forEach((b) => {
        (b && Array.isArray(b.geneRows) ? b.geneRows : []).forEach((row) => {
            if (row && row.gene) names.add(String(row.gene));
        });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function logGenePhenotypeGenesToConsole(bundles, searchGenes) {
    const geneNames = collectGeneNamesFromBundles(bundles);
    const searchSet = new Set((Array.isArray(searchGenes) ? searchGenes : []).map((g) => String(g).toUpperCase()));
    const overlap = geneNames.filter((g) => searchSet.has(String(g).toUpperCase()));
    // eslint-disable-next-line no-console
    console.log("[genes-first] pigean-gene-phenotype gene names:", geneNames);
    // eslint-disable-next-line no-console
    console.log("[genes-first] overlap with search genes:", overlap);
    return { geneNames, overlap };
}

/**
 * Walk ranked Bayes traits until `targetCount` have non-empty pigean-gene-phenotype rows
 * (or candidates are exhausted — fewer than targetCount is OK).
 * Returns { usableBundles, usableTraits, checkedCount }.
 */
async function collectTraitsWithGenePhenotypeData(vm, candidateTraits, targetCount) {
    const usableBundles = [];
    const usableTraits = [];
    let checkedCount = 0;
    let cursor = 0;

    while (usableBundles.length < targetCount && cursor < candidateTraits.length) {
        const batch = candidateTraits.slice(cursor, cursor + TRAIT_SCAN_BATCH_SIZE);
        cursor += batch.length;
        const batchIds = batch.map((t) => t.trait);
        setGeneEntryProgress(
            vm,
            "Scanning traits for gene-phenotype data…",
            `Found ${usableBundles.length} / ${targetCount} usable · checked ${checkedCount} / ${candidateTraits.length}`
        );
        const bundles = await fetchGeneAndGeneSetScoresForPhenotypes(vm, batchIds, {
            onProgress: ({ completed, total }) => {
                setGeneEntryProgress(
                    vm,
                    "Scanning traits for gene-phenotype data…",
                    `Found ${usableBundles.length} / ${targetCount} usable · checked ${checkedCount} / ${candidateTraits.length} · batch ${completed}/${total}`
                );
            },
        });
        checkedCount += batch.length;
        // bundles are in the same order as batchIds / batch.
        for (let i = 0; i < bundles.length && usableBundles.length < targetCount; i++) {
            const b = bundles[i];
            if (!b.ok && b.error) vm.$set(vm.geneEntry.errors.perPhenotype, b.phenotypeId, b.error);
            if (!traitHasGenePhenotypeData(b)) continue;
            const traitMeta = batch[i];
            usableBundles.push(b);
            usableTraits.push({
                ...traitMeta,
                rank: usableTraits.length + 1,
            });
        }
    }

    return { usableBundles, usableTraits, checkedCount };
}

/**
 * Single entry point called from multiQueriesReveal.vue mounted() when `?genes=` is present.
 * Returns true when factorData was populated.
 */
async function runGeneEntryWorkflow(vm, rawGenesParam) {
    const genes = parseGenesParam(vm, rawGenesParam);
    if (!genes.length) return false;

    vm.geneEntry = { ...emptyGeneEntryState(), inputGenes: genes, status: "loading" };
    setGeneEntryProgress(
        vm,
        "Starting genes-first retrieval…",
        `Looking up phenotypes for ${genes.length} gene(s).`
    );

    let phenotypesResponse = null;
    try {
        setGeneEntryProgress(vm, "Finding ranked traits…", "Calling bayes_gene/phenotypes.");
        phenotypesResponse = await fetchGenePhenotypes(vm, genes);
    } catch (err) {
        vm.$set(vm.geneEntry.errors, "phenotypes", err && err.message ? err.message : "Request failed.");
        vm.geneEntry.status = "error";
        setGeneEntryProgress(vm, "Could not load phenotypes.", vm.geneEntry.errors.phenotypes);
        return false;
    }
    vm.geneEntry.phenotypesResponse = phenotypesResponse;

    const candidateTraits = selectTopTraits(phenotypesResponse, { limit: null });
    if (!candidateTraits.length) {
        vm.geneEntry.status = "error";
        setGeneEntryProgress(vm, "No traits found for these genes.", "");
        return false;
    }

    const { usableBundles, usableTraits, checkedCount } = await collectTraitsWithGenePhenotypeData(
        vm,
        candidateTraits,
        TARGET_TRAITS_WITH_DATA
    );
    vm.geneEntry.topTraits = usableTraits;

    if (!usableBundles.length) {
        vm.geneEntry.status = "partial";
        setGeneEntryProgress(
            vm,
            "No traits with gene-phenotype data.",
            `Checked ${checkedCount} ranked trait(s); none returned cfde gene-phenotype rows.`
        );
        return false;
    }

    const { overlap } = logGenePhenotypeGenesToConsole(usableBundles, genes);

    const traitCountNote = usableBundles.length < TARGET_TRAITS_WITH_DATA
        ? `Proceeding with ${usableBundles.length} trait(s) (target was ${TARGET_TRAITS_WITH_DATA}; scanned ${checkedCount}).`
        : `Using ${usableBundles.length} trait(s) with data (checked ${checkedCount}).`;
    setGeneEntryProgress(
        vm,
        "Selecting factors and gene sets…",
        `${traitCountNote} Search-gene overlap in gene-phenotype rows: ${overlap.length}.`
    );

    const membershipPairs = [];
    const bundlesForBuild = usableBundles.map((b) => {
        const filled = fillMissingFactorWithTrait(b.geneRows, b.geneSetRows, b.phenotypeId);
        const selectedFactorIds = selectTopFactorIds(filled.geneRows, filled.geneSetRows, genes, {
            limit: DEFAULT_MAX_FACTORS,
        });
        const selectedGeneSets = selectTopGeneSetsFromRows(filled.geneSetRows, {
            limit: DEFAULT_MAX_GENE_SETS,
            factorIds: selectedFactorIds,
        });
        selectedGeneSets.forEach((geneSet) => {
            membershipPairs.push({ phenotypeId: b.phenotypeId, geneSet });
        });
        return {
            phenotypeId: b.phenotypeId,
            geneRows: filled.geneRows,
            geneSetRows: filled.geneSetRows,
            selectedFactorIds,
            selectedGeneSets,
            membershipByGeneSet: {},
        };
    });

    if (membershipPairs.length) {
        setGeneEntryProgress(
            vm,
            "Fetching gene ↔ gene-set membership…",
            `0 / ${membershipPairs.length} membership requests.`
        );
        const membershipResults = await fetchJoinedGeneSetMembersForPairs(vm, membershipPairs, {
            onProgress: ({ completed, total }) => {
                setGeneEntryProgress(
                    vm,
                    "Fetching gene ↔ gene-set membership…",
                    `${completed} / ${total} membership requests.`
                );
            },
        });
        const byPhenotype = {};
        membershipResults.forEach((r) => {
            if (!byPhenotype[r.phenotypeId]) byPhenotype[r.phenotypeId] = {};
            byPhenotype[r.phenotypeId][r.geneSet] = r.ok ? r.genes : [];
        });
        bundlesForBuild.forEach((b) => {
            b.membershipByGeneSet = byPhenotype[b.phenotypeId] || {};
        });
    }

    setGeneEntryProgress(vm, "Building factor data and knowledge graph…", "Merging scores and filtering to search genes.");
    const factorData = buildFactorDataFromPhenotypePigean(bundlesForBuild, genes);
    const phenotypeCount = Object.keys(factorData).length;
    if (!phenotypeCount) {
        vm.geneEntry.status = "partial";
        setGeneEntryProgress(
            vm,
            "No overlapping factor data for these genes.",
            `${usableBundles.length} trait(s) had gene-phenotype rows, but none crossed the search gene list after filtering.`
        );
        return false;
    }

    vm.factorData = factorData;
    vm.lastKgTriples = vm.transformMergedDataToKG(vm.factorData, "factors");
    vm.snapshotFilteredSelectionBaseline();
    vm.genesAndFactorValuesLoaded = true;
    vm.searchCriteriaExtractionGateDone = true;

    const factorCount = Object.values(vm.factorData).reduce((acc, p) => acc + (p.factors || []).length, 0);
    // Tab bar + panels are gated behind steps.length — register a Data step like the text-query path.
    vm.setStep({
        id: WORKFLOW_STEP_IDS.DATA,
        title: "Gene-derived factors ready",
        substep: {
            id: "2.gene-entry",
            title: `${genes.length} input gene(s)`,
            result: {
                title: `Found ${factorCount} gene-set cluster(s) across ${phenotypeCount} phenotype(s).`,
            },
        },
    });
    vm.showTab = "data";
    vm.geneEntry.status = "ready";
    setGeneEntryProgress(
        vm,
        "Gene-derived data ready.",
        `${factorCount} cluster(s) across ${phenotypeCount} phenotype(s) (scanned ${checkedCount} ranked trait(s)).`
    );

    const approved = await vm.waitForStepApproval(
        WORKFLOW_STEP_IDS.DATA,
        "Gene-derived evidence is ready. Continue to generate mechanistic hypotheses?",
        true
    );
    if (!approved) return false;

    vm.setLoadStatus("Generating hypotheses…");
    vm.setStep({
        id: WORKFLOW_STEP_IDS.HYPOTHESES,
        title: "LLM: Generating mechanistic hypotheses",
    });
    requestMechanismHypotheses(vm, vm.factorData, vm.lastKgTriples);
    return true;
}

export { parseGenesParam, runGeneEntryWorkflow };
