/**
 * Gene-set entry point orchestration for Multi Query REVEAL.
 *
 * Flow (aligned with factorization.html / bayes_gene/pigean):
 * 1. POST bayes_gene/pigean for the search gene list → factors, gene↔factor, gene-set↔factor
 * 2. buildFactorDataFromBayesPigean → canonical factorData for heatmap / table / KG
 * 3. Data-tab Continue gate (+ optional research intention) → mechanistic hypotheses
 */

import { fetchBayesGenePigean } from "./revealMqGeneSetEntryApi.js";
import { buildFactorDataFromBayesPigean } from "./revealMqGeneSetEntryFactorData.js";
import { requestMechanismHypotheses } from "./revealMqHypothesisOrchestrator.js";
import { markGeneSetEntryCannotProceed } from "./revealMqGeneSetEntryFallback.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";

/**
 * Dev/QA: `?geneSetEntryFail=api|empty|1` forces gene-set entry to fail before real fetches.
 * @returns {"api_error"|"insufficient_data"|null}
 */
function resolveGeneSetEntryFailMode(raw) {
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
async function runSimulatedGeneSetEntryFailure(vm, genes, mode) {
    ensureGeneSetEntryDataTab(vm, genes);
    setGeneSetEntryProgress(
        vm,
        "Starting gene-set entry retrieval…",
        `Looking up factors for ${genes.length} gene(s). [simulated failure]`
    );
    await delayMs(450);
    setGeneSetEntryProgress(vm, "Calling bayes_gene/pigean…", "Factorization request. [simulated]");
    await delayMs(450);
    if (mode === "insufficient_data") {
        markGeneSetEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No factorization factors returned. [simulated]",
            detail:
                "Simulated empty results (geneSetEntryFail=empty). No real API calls were made. " +
                "Use Switch to text-query search to exercise the main-path fallback.",
        });
        return false;
    }
    markGeneSetEntryCannotProceed(vm, {
        reason: "api_error",
        message: "Could not load factorization (bayes_gene/pigean). [simulated]",
        detail:
            "Simulated API failure (geneSetEntryFail=api). No real API calls were made. " +
            "Use Switch to text-query search to exercise the main-path fallback.",
    });
    return false;
}

function emptyGeneSetEntryState() {
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

function setGeneSetEntryProgress(vm, message, detail = "") {
    if (!vm.geneSetEntry) return;
    const msg = String(message || "");
    const det = String(detail || "");
    vm.$set(vm.geneSetEntry, "progress", { message: msg, detail: det });
    if (typeof vm.setLoadStatus === "function" && vm.geneSetEntry.status === "loading") {
        vm.setLoadStatus(msg);
    }
    if (typeof vm.setStep === "function") {
        vm.setStep({
            id: WORKFLOW_STEP_IDS.DATA,
            substep: {
                id: "2.gene-set-entry-live",
                title: msg || "Working…",
                result: det ? { title: det } : { title: "" },
            },
        });
    }
}

/** Ensure Data tab + step timeline exist so live progress is visible under Data. */
function ensureGeneSetEntryDataTab(vm, genes) {
    if (typeof vm.setStep === "function") {
        vm.setStep({
            id: WORKFLOW_STEP_IDS.DATA,
            title: "Retrieving gene-derived data",
            substep: {
                id: "2.gene-set-entry-live",
                title: "Starting gene-set entry retrieval…",
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
 *   Also honored from URL `?geneSetEntryFail=api|empty|1` when passed as `failMode` from the shell.
 */
async function runGeneSetEntryWorkflow(vm, rawGenesParam, options = {}) {
    const genes = parseGenesParam(vm, rawGenesParam);
    if (!genes.length) return false;

    // Gene-set entry path: keep the gene list visible in the main query box.
    if (Object.prototype.hasOwnProperty.call(vm, "searchPath") || vm.searchPath !== undefined) {
        vm.searchPath = "genes";
    }
    if (!String(vm.userQuery || "").trim()) {
        vm.userQuery = genes.join(", ");
    }
    if (typeof vm.placeholderRotationPaused !== "undefined") {
        vm.placeholderRotationPaused = true;
    }

    vm.geneSetEntry = { ...emptyGeneSetEntryState(), inputGenes: genes, status: "loading" };
    ensureGeneSetEntryDataTab(vm, genes);
    setGeneSetEntryProgress(
        vm,
        "Starting gene-set entry retrieval…",
        `Looking up factors for ${genes.length} gene(s).`
    );

    const failMode =
        options.failMode != null
            ? resolveGeneSetEntryFailMode(options.failMode)
            : resolveGeneSetEntryFailMode(options.geneSetEntryFail);
    if (failMode) {
        return runSimulatedGeneSetEntryFailure(vm, genes, failMode);
    }

    let pigeanResponse = null;
    try {
        setGeneSetEntryProgress(
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
        vm.$set(vm.geneSetEntry.errors, "pigean", errMsg);
        markGeneSetEntryCannotProceed(vm, {
            reason: "api_error",
            message: "Could not load factorization (bayes_gene/pigean).",
            detail: errMsg,
        });
        return false;
    }
    vm.geneSetEntry.pigeanResponse = pigeanResponse;
    if (Array.isArray(pigeanResponse.input_genes) && pigeanResponse.input_genes.length) {
        vm.geneSetEntry.inputGenes = pigeanResponse.input_genes.map((g) => String(g));
        // Prefer API-normalized symbols in the query box when still showing the URL list.
        if (vm.searchPath === "genes") {
            vm.userQuery = vm.geneSetEntry.inputGenes.join(", ");
        }
    }

    setGeneSetEntryProgress(vm, "Building gene set cluster × gene / gene-set matrix…", "Merging factorization loadings.");
    const factorData = buildFactorDataFromBayesPigean(pigeanResponse, vm.geneSetEntry.inputGenes);
    const factorCount = Object.keys(factorData).length;
    if (!factorCount) {
        markGeneSetEntryCannotProceed(vm, {
            reason: "insufficient_data",
            message: "No gene set clusters returned for these genes.",
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
            id: "2.gene-set-entry",
            title: `${vm.geneSetEntry.inputGenes.length} input gene(s)`,
            result: {
                title: `Found ${factorCount} factor(s) · ~${geneSetColEstimate} gene-set / ~${geneColEstimate} gene loadings.`,
            },
        },
    });
    vm.showTab = "data";
    vm.geneSetEntry.status = "ready";
    setGeneSetEntryProgress(
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

export { emptyGeneSetEntryState, parseGenesParam, resolveGeneSetEntryFailMode, runGeneSetEntryWorkflow };
