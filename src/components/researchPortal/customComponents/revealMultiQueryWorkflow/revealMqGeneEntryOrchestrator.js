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
    filterSignificantGeneSetRows,
    selectTopFactorIds,
    selectTopGeneSetsFromRows,
} from "./revealMqGeneEntryFactorData.js";
import { requestMechanismHypotheses } from "./revealMqHypothesisOrchestrator.js";
import { markGeneEntryCannotProceed } from "./revealMqGeneEntryFallback.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";

/** How many traits with non-empty gene-phenotype data to keep. */
const TARGET_TRAITS_WITH_DATA = 10;
/** Phenotypes per score-fetch wave (each phenotype = 2 GETs; keep ~DEFAULT_FETCH_CONCURRENCY in flight). */
const TRAIT_SCAN_BATCH_SIZE = Math.max(1, Math.floor(DEFAULT_FETCH_CONCURRENCY / 2));

/**
 * Dev/QA: `?geneEntryFail=api|empty|1` forces genes-first to fail before real fetches.
 * @returns {"api_error"|"insufficient_data"|null}
 */
function resolveGeneEntryFailMode(raw) {
    const v = String(raw == null ? "" : raw)
        .trim()
        .toLowerCase();
    if (!v || v === "0" || v === "false" || v === "no" || v === "off") return null;
    if (v === "empty" || v === "insufficient" || v === "insufficient_data" || v === "data") {
        return "insufficient_data";
    }
    return "api_error";
}

function delayMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Brief fake progress then surface the fallback modal (no real API calls).
 */
async function runSimulatedGeneEntryFailure(vm, genes, mode) {
    ensureGeneEntryDataTab(vm, genes);
    setGeneEntryProgress(
        vm,
        "Starting genes-first retrieval…",
        `Looking up phenotypes for ${genes.length} gene(s). [simulated failure]`
    );
    await delayMs(450);
    setGeneEntryProgress(vm, "Finding ranked traits…", "Calling bayes_gene/phenotypes. [simulated]");
    await delayMs(450);
    if (mode === "insufficient_data") {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No traits with gene-phenotype data. [simulated]",
            detail:
                "Simulated empty results (geneEntryFail=empty). No real API calls were made. " +
                "Use Switch to text-query search to exercise the main-path fallback.",
        });
        return false;
    }
    markGeneEntryCannotProceed(vm, {
        reason: "api_error",
        message: "Could not load phenotypes (bayes_gene/phenotypes). [simulated]",
        detail:
            "Simulated API failure (geneEntryFail=api). No real API calls were made. " +
            "Use Switch to text-query search to exercise the main-path fallback.",
    });
    return false;
}

function emptyGeneEntryState() {
    return {
        status: "idle", // idle | loading | partial | error | ready
        inputGenes: [],
        errors: { phenotypes: null, perPhenotype: {} },
        phenotypesResponse: null,
        topTraits: [],
        progress: { message: "", detail: "" },
        researchIntention: "",
        offerMainPathFallback: false,
        failureReason: null,
    };
}

function setGeneEntryProgress(vm, message, detail = "") {
    if (!vm.geneEntry) return;
    const msg = String(message || "");
    const det = String(detail || "");
    vm.$set(vm.geneEntry, "progress", { message: msg, detail: det });
    if (typeof vm.setLoadStatus === "function" && vm.geneEntry.status === "loading") {
        vm.setLoadStatus(msg);
    }
    if (typeof vm.setStep === "function") {
        vm.setStep({
            id: WORKFLOW_STEP_IDS.DATA,
            substep: {
                id: "2.gene-entry-live",
                title: msg || "Working…",
                result: det ? { title: det } : { title: "" },
            },
        });
    }
}

/** Ensure Data tab + step timeline exist so live progress is visible under Data. */
function ensureGeneEntryDataTab(vm, genes) {
    if (typeof vm.setStep === "function") {
        vm.setStep({
            id: WORKFLOW_STEP_IDS.DATA,
            title: "Retrieving gene-derived data",
            substep: {
                id: "2.gene-entry-live",
                title: "Starting genes-first retrieval…",
                result: {
                    title: `Looking up phenotypes for ${(genes || []).length} gene(s).`,
                },
            },
        });
    }
    if (typeof vm.switchRevealTab === "function") {
        vm.switchRevealTab("data");
    }
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
 * Returns { usableBundles, usableTraits, checkedCount, apiErrorCount }.
 */
async function collectTraitsWithGenePhenotypeData(vm, candidateTraits, targetCount) {
    const usableBundles = [];
    const usableTraits = [];
    let checkedCount = 0;
    let apiErrorCount = 0;
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
            if (!b.ok && b.error) {
                apiErrorCount += 1;
                vm.$set(vm.geneEntry.errors.perPhenotype, b.phenotypeId, b.error);
            }
            if (!traitHasGenePhenotypeData(b)) continue;
            const traitMeta = batch[i];
            usableBundles.push(b);
            usableTraits.push({
                ...traitMeta,
                rank: usableTraits.length + 1,
            });
        }
    }

    return { usableBundles, usableTraits, checkedCount, apiErrorCount };
}

/**
 * Single entry point called from multiQueriesReveal.vue mounted() when `?genes=` is present.
 * Returns true when factorData was populated.
 *
 * Options:
 * - `failMode`: force simulated failure (`api_error` | `insufficient_data`) without calling APIs.
 *   Also honored from URL `?geneEntryFail=api|empty|1` when passed as `failMode` from the shell.
 */
async function runGeneEntryWorkflow(vm, rawGenesParam, options = {}) {
    const genes = parseGenesParam(vm, rawGenesParam);
    if (!genes.length) return false;

    vm.geneEntry = { ...emptyGeneEntryState(), inputGenes: genes, status: "loading" };
    ensureGeneEntryDataTab(vm, genes);
    setGeneEntryProgress(
        vm,
        "Starting genes-first retrieval…",
        `Looking up phenotypes for ${genes.length} gene(s).`
    );

    const failMode =
        options.failMode != null
            ? resolveGeneEntryFailMode(options.failMode)
            : resolveGeneEntryFailMode(options.geneEntryFail);
    if (failMode) {
        return runSimulatedGeneEntryFailure(vm, genes, failMode);
    }

    let phenotypesResponse = null;
    try {
        setGeneEntryProgress(vm, "Finding ranked traits…", "Calling bayes_gene/phenotypes.");
        phenotypesResponse = await fetchGenePhenotypes(vm, genes);
    } catch (err) {
        const errMsg = err && err.message ? err.message : "Request failed.";
        vm.$set(vm.geneEntry.errors, "phenotypes", errMsg);
        markGeneEntryCannotProceed(vm, {
            reason: "api_error",
            message: "Could not load phenotypes (bayes_gene/phenotypes).",
            detail: errMsg,
        });
        return false;
    }
    vm.geneEntry.phenotypesResponse = phenotypesResponse;

    const candidateTraits = selectTopTraits(phenotypesResponse, { limit: null });
    if (!candidateTraits.length) {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No traits found for these genes.",
            detail: "bayes_gene/phenotypes returned an empty phenotype list.",
        });
        return false;
    }

    const { usableBundles, usableTraits, checkedCount, apiErrorCount } =
        await collectTraitsWithGenePhenotypeData(vm, candidateTraits, TARGET_TRAITS_WITH_DATA);
    vm.geneEntry.topTraits = usableTraits;

    if (!usableBundles.length) {
        const apiDown = apiErrorCount > 0 && apiErrorCount >= checkedCount;
        markGeneEntryCannotProceed(vm, {
            reason: apiDown || apiErrorCount > 0 ? "api_error" : "insufficient_data",
            message: apiDown
                ? "Gene / gene-set phenotype APIs did not respond with usable data."
                : "No traits with gene-phenotype data.",
            detail: apiErrorCount
                ? `Checked ${checkedCount} ranked trait(s); ${apiErrorCount} had API errors and none returned gene-phenotype rows.`
                : `Checked ${checkedCount} ranked trait(s); none returned cfde gene-phenotype rows.`,
        });
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
    const bundlesForBuild = [];
    let traitsDroppedForBeta = 0;
    usableBundles.forEach((b) => {
        const filled = fillMissingFactorWithTrait(b.geneRows, b.geneSetRows, b.phenotypeId);
        // beta ≤ 0.01 (or missing) → non-significant; membership only for beta > 0.01.
        const significantGeneSetRows = filterSignificantGeneSetRows(filled.geneSetRows);
        if (!significantGeneSetRows.length) {
            traitsDroppedForBeta += 1;
            return;
        }
        const selectedFactorIds = selectTopFactorIds(filled.geneRows, significantGeneSetRows, genes, {
            limit: DEFAULT_MAX_FACTORS,
        });
        const selectedGeneSets = selectTopGeneSetsFromRows(significantGeneSetRows, {
            limit: DEFAULT_MAX_GENE_SETS,
            factorIds: selectedFactorIds,
        });
        if (!selectedGeneSets.length) {
            traitsDroppedForBeta += 1;
            return;
        }
        selectedGeneSets.forEach((geneSet) => {
            membershipPairs.push({ phenotypeId: b.phenotypeId, geneSet });
        });
        bundlesForBuild.push({
            phenotypeId: b.phenotypeId,
            geneRows: filled.geneRows,
            geneSetRows: significantGeneSetRows,
            selectedFactorIds,
            selectedGeneSets,
            membershipByGeneSet: {},
        });
    });

    if (!bundlesForBuild.length) {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No traits with significant gene-set associations.",
            detail:
                `${usableBundles.length} trait(s) had gene–phenotype scores for your input genes, but none had a gene set with a significant PIGEAN joint effect on the trait (beta > 0.01).\n\n` +
                "In PIGEAN, beta is the estimated joint effect of a gene set on the probability that its member genes are involved in the phenotype. " +
                "Values at or below 0.01 are treated as non-significant, so those traits were excluded from further analysis.",
        });
        return false;
    }

    if (traitsDroppedForBeta > 0) {
        setGeneEntryProgress(
            vm,
            "Selecting factors and gene sets…",
            `Skipped ${traitsDroppedForBeta} trait(s) with no gene sets showing a significant PIGEAN joint effect (beta > 0.01). ` +
                `Continuing with ${bundlesForBuild.length} trait(s).`
        );
    }

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
        let membershipOk = 0;
        let membershipErr = 0;
        membershipResults.forEach((r) => {
            if (!byPhenotype[r.phenotypeId]) byPhenotype[r.phenotypeId] = {};
            byPhenotype[r.phenotypeId][r.geneSet] = r.ok ? r.genes : [];
            if (r.ok) membershipOk += 1;
            else membershipErr += 1;
        });
        // Membership is required to attach gene-set members / context genes. If every call fails, stop.
        if (membershipPairs.length && membershipOk === 0 && membershipErr > 0) {
            const sampleErr =
                (membershipResults.find((r) => r && r.error) || {}).error || "Request failed.";
            markGeneEntryCannotProceed(vm, {
                reason: "api_error",
                message: "Gene ↔ gene-set membership API did not return data.",
                detail: `All ${membershipErr} membership request(s) failed. Example: ${sampleErr}`,
            });
            return false;
        }
        bundlesForBuild.forEach((b) => {
            b.membershipByGeneSet = byPhenotype[b.phenotypeId] || {};
        });
    }

    setGeneEntryProgress(vm, "Building factor data and knowledge graph…", "Merging scores and filtering to search genes.");
    const factorData = buildFactorDataFromPhenotypePigean(bundlesForBuild, genes);
    const phenotypeCount = Object.keys(factorData).length;
    if (!phenotypeCount) {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No overlapping factor data for these genes.",
            detail: `${usableBundles.length} trait(s) had gene-phenotype rows, but none crossed the search gene list after filtering.`,
        });
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

export { parseGenesParam, resolveGeneEntryFailMode, runGeneEntryWorkflow };
