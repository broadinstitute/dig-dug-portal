/**
 * Genes-first entry point orchestration for Multi Query REVEAL.
 *
 * Flow (aligned with factorization.html / bayes_gene/pigean):
 * 1. POST bayes_gene/pigean for the search gene list → factors, gene↔factor, gene-set↔factor
 * 2. buildFactorDataFromBayesPigean → canonical factorData for heatmap / table / KG
 * 3. Data-tab Continue gate (+ optional research intention) → mechanistic hypotheses
 */

import { fetchBayesGenePigean } from "./revealMqGeneEntryApi.js";
import { buildFactorDataFromBayesPigean } from "./revealMqGeneEntryFactorData.js";
import { requestMechanismHypotheses } from "./revealMqHypothesisOrchestrator.js";
import { markGeneEntryCannotProceed } from "./revealMqGeneEntryFallback.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";

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
        `Looking up factors for ${genes.length} gene(s). [simulated failure]`
    );
    await delayMs(450);
    setGeneEntryProgress(vm, "Calling bayes_gene/pigean…", "Factorization request. [simulated]");
    await delayMs(450);
    if (mode === "insufficient_data") {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No factorization factors returned. [simulated]",
            detail:
                "Simulated empty results (geneEntryFail=empty). No real API calls were made. " +
                "Use Switch to text-query search to exercise the main-path fallback.",
        });
        return false;
    }
    markGeneEntryCannotProceed(vm, {
        reason: "api_error",
        message: "Could not load factorization (bayes_gene/pigean). [simulated]",
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
        errors: { phenotypes: null, perPhenotype: {}, pigean: null },
        phenotypesResponse: null,
        pigeanResponse: null,
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
                    title: `Looking up factors for ${(genes || []).length} gene(s).`,
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
        `Looking up factors for ${genes.length} gene(s).`
    );

    const failMode =
        options.failMode != null
            ? resolveGeneEntryFailMode(options.failMode)
            : resolveGeneEntryFailMode(options.geneEntryFail);
    if (failMode) {
        return runSimulatedGeneEntryFailure(vm, genes, failMode);
    }

    let pigeanResponse = null;
    try {
        setGeneEntryProgress(
            vm,
            "Running gene-set factorization…",
            "Calling bayes_gene/pigean with CFDE gene sets."
        );
        pigeanResponse = await fetchBayesGenePigean(vm, genes, {
            geneSets: options.geneSets || "cfde",
            maxNumberPhenotypes:
                options.maxNumberPhenotypes != null ? options.maxNumberPhenotypes : 100,
        });
    } catch (err) {
        const errMsg = err && err.message ? err.message : "Request failed.";
        vm.$set(vm.geneEntry.errors, "pigean", errMsg);
        markGeneEntryCannotProceed(vm, {
            reason: "api_error",
            message: "Could not load factorization (bayes_gene/pigean).",
            detail: errMsg,
        });
        return false;
    }
    vm.geneEntry.pigeanResponse = pigeanResponse;
    if (Array.isArray(pigeanResponse.input_genes) && pigeanResponse.input_genes.length) {
        vm.geneEntry.inputGenes = pigeanResponse.input_genes.map((g) => String(g));
    }

    setGeneEntryProgress(vm, "Building factor × gene / gene-set matrix…", "Merging factorization loadings.");
    const factorData = buildFactorDataFromBayesPigean(pigeanResponse, vm.geneEntry.inputGenes);
    const factorCount = Object.keys(factorData).length;
    if (!factorCount) {
        markGeneEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No factors returned for these genes.",
            detail: "bayes_gene/pigean completed but produced no Factor0… gene/gene-set loadings.",
        });
        return false;
    }

    vm.factorData = factorData;
    vm.lastKgTriples = vm.transformMergedDataToKG(vm.factorData, "factors");
    vm.snapshotFilteredSelectionBaseline();
    vm.genesAndFactorValuesLoaded = true;
    vm.searchCriteriaExtractionGateDone = true;

    const geneColEstimate = Object.values(vm.factorData).reduce((acc, p) => {
        const f = (p.factors || [])[0];
        return acc + (f && f.genes ? Object.keys(f.genes).length : 0);
    }, 0);
    const geneSetColEstimate = Object.values(vm.factorData).reduce((acc, p) => {
        const f = (p.factors || [])[0];
        const top = f && typeof f.top_gene_sets === "string" ? f.top_gene_sets : "";
        return acc + (top ? top.split(";").filter(Boolean).length : 0);
    }, 0);

    vm.setStep({
        id: WORKFLOW_STEP_IDS.DATA,
        title: "Gene-derived factors ready",
        substep: {
            id: "2.gene-entry",
            title: `${vm.geneEntry.inputGenes.length} input gene(s)`,
            result: {
                title: `Found ${factorCount} factor(s) · ~${geneSetColEstimate} gene-set / ~${geneColEstimate} gene loadings.`,
            },
        },
    });
    vm.showTab = "data";
    vm.geneEntry.status = "ready";
    setGeneEntryProgress(
        vm,
        "Gene-derived data ready.",
        `${factorCount} factor(s) from bayes_gene/pigean.`
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

export { emptyGeneEntryState, parseGenesParam, resolveGeneEntryFailMode, runGeneEntryWorkflow };
