/**
 * Genes-first entry point orchestration for Multi Query REVEAL: given a raw gene list (from the
 * `genes=` URL param), fetches gene-set/factor/trait data from the Broad Translator Bayes-gene
 * API family, cross-references it (populating `vm.geneEntry`), and builds `vm.factorData` for the
 * existing Data-tab/KG/heatmap/network pipeline.
 *
 * factorData is built by (1) calling hybrid-search with genes_of_interest only (no phenotype_terms
 * needed -- verified live that the server accepts a research_context-only query), which gives real
 * phenotype names and real per-gene combined/gwas/functional scores, then (2) fetching each
 * discovered phenotype's real gene-set-cluster breakdown via the per-phenotype pigean-factor
 * endpoint and merging it in (revealMqGeneEntryFactorData.js's mergePigeanFactorRowsIntoFactorData).
 * Falls back to the whole-gene-list bayes_gene/pigean response alone if hybrid-search fails.
 */

import {
    fetchGenePhenotypes,
    fetchGenePigeanFactors,
    fetchGeneScoresFlat,
    fetchPigeanFactorsForTraits,
} from "./revealMqGeneEntryApi.js";
import {
    buildGeneDerivedFactorSummary,
    crossReferenceGeneSetToFactors,
    crossReferenceRecurringTraitFactors,
    selectTopGeneSets,
    selectTopTraits,
} from "./revealMqGeneEntryCrossReference.js";
import {
    buildFactorDataFromGeneEntry,
    mergePigeanFactorRowsIntoFactorData,
} from "./revealMqGeneEntryFactorData.js";
import { normalizeHybridFactorsToFactorData } from "./revealMqHybridSearch.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";

const TOP_TRAITS_LIMIT = 15;
const TOP_GENE_SETS_LIMIT = 50;

function emptyGeneEntryState() {
    return {
        status: "idle", // idle | loading | partial | error | ready
        inputGenes: [],
        errors: { pigean: null, phenotypes: null, geneScores: null, hybridSearch: null, perTrait: {} },
        pigeanResponse: null,
        phenotypesResponse: null,
        geneScoresFlatResponse: null,
        hybridSearchResponse: null,
        topTraits: [],
        topGeneSets: [],
        perTraitFactors: {},
        geneDerivedFactorSummary: [],
        crossReference: { recurringTraitFactors: [], geneSetToFactors: [] },
    };
}

/**
 * Primary factorData path: hybrid-search (real phenotypes + real per-gene evidence) enriched with
 * each phenotype's real gene-set-cluster breakdown from the per-phenotype pigean-factor endpoint.
 * Returns null if hybrid-search itself fails (caller falls back to the pigean-only builder).
 */
async function buildFactorDataFromHybridSearch(vm, genes) {
    let hybridJson;
    try {
        hybridJson = await vm.callHybridRevealSearch({
            phenotypeTerms: [],
            mechanismTerms: [],
            researchContext: `Gene-list-driven retrieval for: ${genes.join(", ")}.`,
            genesOfInterest: genes,
        });
    } catch (err) {
        vm.$set(vm.geneEntry.errors, "hybridSearch", err && err.message ? err.message : "Request failed.");
        return null;
    }
    vm.geneEntry.hybridSearchResponse = hybridJson;

    let factorData = normalizeHybridFactorsToFactorData(hybridJson, []);
    const phenotypes = Object.keys(factorData);
    if (!phenotypes.length) return factorData;

    const perPhenotypeResults = await fetchPigeanFactorsForTraits(vm, phenotypes);
    const perPhenotypeFactorRows = {};
    perPhenotypeResults.forEach((r) => {
        perPhenotypeFactorRows[r.traitId] = { ok: r.ok, factors: r.factors };
    });
    factorData = mergePigeanFactorRowsIntoFactorData(factorData, perPhenotypeFactorRows, genes);
    return factorData;
}

/** Parses the raw `genes=` URL param into a normalized, deduped gene symbol list. */
function parseGenesParam(vm, rawGenesParam) {
    const withCommas = String(rawGenesParam || "").replace(/[\n;]+/g, ",");
    return vm.normalizeHelperSelectedGenes([withCommas]);
}

function settledValueOrError(vm, settledResult, errorKey) {
    if (settledResult.status === "fulfilled") return settledResult.value;
    const message = settledResult.reason && settledResult.reason.message
        ? settledResult.reason.message
        : "Request failed.";
    vm.$set(vm.geneEntry.errors, errorKey, message);
    return null;
}

/**
 * Single entry point: fetch all 3 top-level endpoints + per-trait factors for the top traits,
 * cross-reference, and assign onto vm.geneEntry. Returns true if at least one top-level fetch
 * succeeded (false = nothing usable to show).
 */
async function runGeneEntryWorkflow(vm, rawGenesParam) {
    const genes = parseGenesParam(vm, rawGenesParam);
    if (!genes.length) return false;

    vm.geneEntry = { ...emptyGeneEntryState(), inputGenes: genes, status: "loading" };

    const [pigeanSettled, phenotypesSettled, geneScoresSettled] = await Promise.allSettled([
        fetchGenePigeanFactors(vm, genes),
        fetchGenePhenotypes(vm, genes),
        fetchGeneScoresFlat(vm, genes),
    ]);

    vm.geneEntry.pigeanResponse = settledValueOrError(vm, pigeanSettled, "pigean");
    vm.geneEntry.phenotypesResponse = settledValueOrError(vm, phenotypesSettled, "phenotypes");
    vm.geneEntry.geneScoresFlatResponse = settledValueOrError(vm, geneScoresSettled, "geneScores");

    vm.geneEntry.topTraits = vm.geneEntry.phenotypesResponse
        ? selectTopTraits(vm.geneEntry.phenotypesResponse, { limit: TOP_TRAITS_LIMIT })
        : [];

    if (vm.geneEntry.topTraits.length) {
        const perTraitResults = await fetchPigeanFactorsForTraits(
            vm,
            vm.geneEntry.topTraits.map((t) => t.trait)
        );
        perTraitResults.forEach((r) => {
            vm.$set(vm.geneEntry.perTraitFactors, r.traitId, { ok: r.ok, error: r.error, factors: r.factors });
            if (!r.ok && r.error) vm.$set(vm.geneEntry.errors.perTrait, r.traitId, r.error);
        });
    }

    vm.geneEntry.topGeneSets = selectTopGeneSets(
        vm.geneEntry.geneScoresFlatResponse,
        vm.geneEntry.pigeanResponse,
        { limit: TOP_GENE_SETS_LIMIT }
    );
    vm.geneEntry.geneDerivedFactorSummary = buildGeneDerivedFactorSummary(vm.geneEntry.pigeanResponse);
    vm.geneEntry.crossReference.recurringTraitFactors = crossReferenceRecurringTraitFactors(
        vm.geneEntry.perTraitFactors
    );
    vm.geneEntry.crossReference.geneSetToFactors = crossReferenceGeneSetToFactors(
        vm.geneEntry.topGeneSets,
        vm.geneEntry.geneDerivedFactorSummary,
        vm.geneEntry.perTraitFactors
    );

    const anyOk = !!(vm.geneEntry.pigeanResponse || vm.geneEntry.phenotypesResponse || vm.geneEntry.geneScoresFlatResponse);
    vm.geneEntry.status = !anyOk ? "error" : (vm.geneEntry.pigeanResponse ? "ready" : "partial");

    let factorData = await buildFactorDataFromHybridSearch(vm, genes);
    let factorDataSource = "hybrid_search";
    if (!factorData && vm.geneEntry.pigeanResponse) {
        factorData = buildFactorDataFromGeneEntry(vm.geneEntry.pigeanResponse, genes);
        factorDataSource = "pigean_only";
    }

    if (factorData && Object.keys(factorData).length) {
        vm.factorData = factorData;
        vm.lastKgTriples = vm.transformMergedDataToKG(vm.factorData, "factors");
        vm.snapshotFilteredSelectionBaseline();
        vm.genesAndFactorValuesLoaded = true;
        vm.searchCriteriaExtractionGateDone = true;
        const phenotypeCount = Object.keys(vm.factorData).length;
        const factorCount = Object.values(vm.factorData).reduce((acc, p) => acc + (p.factors || []).length, 0);
        // The tab bar + all tab panels are gated behind `steps.length` in the shell's template
        // (there's no dedicated "genes-first" flag) -- register a Data-step entry the same way
        // the normal extraction/retrieval flow does, so that gate opens.
        vm.setStep({
            id: WORKFLOW_STEP_IDS.DATA,
            title: "Gene-derived factors ready",
            substep: {
                id: "2.gene-entry",
                title: `${genes.length} input gene(s)`,
                result: {
                    title: `Found ${factorCount} gene-set cluster(s) across ${phenotypeCount} phenotype(s) (source: ${factorDataSource}).`,
                },
            },
        });
        vm.showTab = "data";
    }

    return anyOk;
}

export { parseGenesParam, runGeneEntryWorkflow };
