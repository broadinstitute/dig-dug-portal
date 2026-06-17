/**
 * Multi Query REVEAL workflow orchestration (extraction phase).
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

const DEFAULT_EXTRACTION_MAX_ATTEMPTS = 3;
const DEFAULT_EXTRACTION_TIMEOUT_MS = 120000;

function isExtractionTimeoutError(err) {
    if (!err) return false;
    const status = err.status;
    if (status === 504) return true;
    const msg = (err.message || "").toString();
    return /504|Gateway Timeout|timeout|Timeout|Failed to fetch|Load failed|net::ERR_FAILED|CORS|Access-Control/i.test(
        msg
    );
}

function resetWorkflowStateForNewRun(vm) {
    vm.loadComplete = false;
    vm.searchCriteria = null;
    vm.mechanisms = null;
    vm.mechanisms_summary = null;
    vm.mechanismDiagnosticAssessment = null;
    vm.hypothesisLastRunMode = null;
    vm.lastAlternativeQueries = [];
    vm.extractionAmbiguityCheck = null;
    vm.extractionAmbiguityDismissed = false;
    vm.multiQueryRoutes = [];
    vm.multiQueryRouteResults = [];
    vm.multiQueryEvidenceBundles = [];
    vm.multiQueryRouteErrors = [];
    vm.multiQueryRouteEditRows = [];
    vm.multiQueryRouteEditRowsDefault = [];
    vm.routeTermsEditAccordionOpen = {};
    vm.lastExplicitUserGenes = [];
    vm.lastGenesOfInterest = [];
    vm.lastHybridSearchMeta = {};
    vm.lastHybridSearchResponse = null;
    vm.searchCriteriaEditRows = [];
    vm.searchCriteriaEditRowsDefault = [];
    vm.searchCriteriaExtractionGateDone = false;
    vm.heatmapSelectedNodes = [];
    vm.selectedNodesExplanations = [];
    vm.selectedNodesProvenanceRuns = [];
    vm.pairSelectionOverrides = {};
    vm.llmFilteredPairKeysBaseline = [];
    vm.expandedFactorRowKeys = {};
    vm.factorConnectivityNetworks = {};
    vm.loadingGenesForFactor = {};
    vm.subtableCurrentPages = {};
    vm.factorConnectivityPopupOpen = false;
    vm.factorConnectivityPopupRow = null;
    vm.factorConnectivityPopupNetwork = null;
    vm.error_search_criteria = false;
    vm.mainTableCurrentPage = 1;
    vm.remainingTableCurrentPage = 1;
    vm.steps = [];
    vm.stepsTime = null;
    vm.stepsTimer = null;
    vm.stepsPausedAt = null;
    vm.now = Date.now();
    vm.switchRevealTab("terms");
    vm.revealResultsTabUnlocked = false;
    vm.importedWorkflowPendingHypothesisRun = false;
    vm.importedWorkflowPendingResearchRun = false;
    vm.get_set_sources = [];
}

function beginExtractionFlow(vm, options = {}) {
    const maxAttempts = options.maxAttempts != null ? options.maxAttempts : DEFAULT_EXTRACTION_MAX_ATTEMPTS;
    const timeoutMs = options.timeoutMs != null ? options.timeoutMs : DEFAULT_EXTRACTION_TIMEOUT_MS;

    vm.loading_search_criteria = true;
    vm.error_search_criteria = false;
    vm.allow_retry = true;
    vm.setStep(
        {
            id: "1",
            title: "LLM: Extracting search terms from user query",
            substep: {
                id: "1.1",
                title: `${vm.userQuery.trim()}`,
            },
        },
        true
    );
    const query = vm.userQuery.trim();

    (async () => {
        let lastError = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const result = await new Promise((resolve) => {
                let done = false;
                const finish = (payload) => {
                    if (done) return;
                    done = true;
                    clearTimeout(timerId);
                    resolve(payload);
                };
                const timerId = setTimeout(() => {
                    try {
                        vm.llmExtract.abort();
                    } catch {
                        /* ignore */
                    }
                    const timeoutErr = new Error(`Extraction timed out after ${Math.round(timeoutMs / 1000)}s.`);
                    timeoutErr.status = 504;
                    finish({
                        ok: false,
                        retry: attempt < maxAttempts,
                        err: timeoutErr,
                    });
                }, timeoutMs);
                vm.llmExtract.sendPrompt({
                    userPrompt: query,
                    onResponse: (resp) => finish({ ok: true, response: resp }),
                    onError: (err) => {
                        const retry = isExtractionTimeoutError(err) && attempt < maxAttempts;
                        finish({ ok: false, retry, err });
                    },
                    onEnd: () => {
                        if (done) return;
                        finish({
                            ok: false,
                            retry: false,
                            err: new Error("Incomplete extraction response."),
                        });
                    },
                    onState: vm.onExtractState,
                });
            });
            if (result.ok) {
                await processExtractionResponse(vm, result.response);
                return;
            }
            lastError = result.err || new Error("Extraction failed.");
            if (result.retry) {
                vm.setStep({
                    type: "info",
                    title: `Extraction timed out. Retrying (${attempt + 1}/${maxAttempts})…`,
                });
                continue;
            }
            break;
        }
        handleExtractionError(vm, lastError);
    })();
}

async function processExtractionResponse(vm, response) {
    const extractRunId = vm.workflowRunId;
    vm.loading_search_criteria = false;
    if (!response) return;
    const json = vm.parseLLMResponse(response);
    if (!json) {
        vm.error_search_criteria = true;
        vm.error_msg_search_criteria = "Could not parse extraction result.";
        return;
    }
    if (json.error) {
        vm.error_search_criteria = true;
        vm.error_msg_search_criteria = json.error;
        vm.allow_retry = false;
        return;
    }

    const phenotypeTerms = vm.normalizeLlmTermList(json.phenotype_terms);
    const mechanismTerms = vm.normalizeLlmTermList(json.mechanism_terms);
    const genesOfInterest = vm.normalizeLlmTermList(json.genes_of_interest);
    const explicitUserGenes = vm.normalizeLlmTermList(json.explicit_user_genes);
    const antiAnchorTermsDetected = vm.detectAntiAnchorTerms(vm.userQuery);
    let extractionAmbiguity = vm.normalizeExtractionAmbiguity(json.ambiguity_check);
    let alternativeQueries = vm.mergeAlternativeQueries(
        json.suggested_queries != null
            ? json.suggested_queries
            : json.alternative_queries != null
              ? json.alternative_queries
              : json.alternativeQueries,
        extractionAmbiguity && extractionAmbiguity.alternative_queries
    );
    const antiAnchorTermsFromLlm =
        extractionAmbiguity && Array.isArray(extractionAmbiguity.anti_anchor_terms)
            ? extractionAmbiguity.anti_anchor_terms
            : [];
    const antiAnchorTerms = vm.mergeAlternativeQueries(antiAnchorTermsDetected, antiAnchorTermsFromLlm);
    if (antiAnchorTerms.length && (!extractionAmbiguity || !extractionAmbiguity.has_ambiguity)) {
        extractionAmbiguity = {
            has_ambiguity: true,
            warning_message:
                "Your query includes an anti-anchor exclusion. Semantic retrieval works better with positive mechanism anchors.",
            alternative_queries: [],
            anti_anchor_terms: antiAnchorTerms,
        };
    }

    if (antiAnchorTerms.length) {
        const fallbackAntiAnchorAlts = vm.buildAntiAnchorFallbackAlternatives({
            antiAnchorTerms,
            mechanismTerms,
            researchContext: typeof json.research_context === "string" ? json.research_context : "",
        });
        alternativeQueries = vm.mergeAlternativeQueries(alternativeQueries, fallbackAntiAnchorAlts).slice(0, 3);
        if (extractionAmbiguity) {
            extractionAmbiguity.anti_anchor_terms = antiAnchorTerms;
            extractionAmbiguity.warning_message = vm.ensureAntiAnchorWarningMessage(
                extractionAmbiguity.warning_message,
                antiAnchorTerms,
                alternativeQueries
            );
        }
    } else {
        alternativeQueries = alternativeQueries.slice(0, 3);
    }

    const searchTerms = [...phenotypeTerms, ...mechanismTerms];
    const selectedRoutes = vm.normalizeMultiQueryRoutes(
        json.selected_routes != null ? json.selected_routes : json.routes,
        json
    );

    const researchContext = typeof json.research_context === "string" ? json.research_context : "";
    const hasMultiRoutes = selectedRoutes.length > 0;

    vm.searchCriteria = [
        {
            search_criteria: "Search Terms",
            values: hasMultiRoutes
                ? ["(per direction — see below)"]
                : searchTerms.length
                  ? searchTerms
                  : ["(none extracted)"],
            why: hasMultiRoutes
                ? "Each retrieval direction uses its own extracted terms."
                : "We extracted this from your search query.",
            purpose: hasMultiRoutes
                ? "Route-specific terms drive hybrid search for tissue expression, perturbations, and genetics."
                : "These terms will be used to search for related phenotype↔signature associations via semantic search.",
        },
        {
            search_criteria: "Research Context",
            values: researchContext || "(none extracted)",
            why: "We inferred this from your search query.",
            purpose: "This context will be used to tailor mechanistic hypotheses to your research.",
        },
    ];

    vm.searchTerm = hasMultiRoutes
        ? selectedRoutes.map((r) => r.category).filter(Boolean).join(", ")
        : searchTerms.join(", ");

    vm.lastPhenotypeTerms = phenotypeTerms;
    vm.lastMechanismTerms = mechanismTerms;
    vm.lastExplicitUserGenes = explicitUserGenes.length ? explicitUserGenes : vm.inferExplicitUserGenes(genesOfInterest);
    vm.lastGenesOfInterest = genesOfInterest;
    vm.lastAlternativeQueries = alternativeQueries;
    vm.extractionAmbiguityCheck = extractionAmbiguity;
    vm.extractionAmbiguityDismissed = false;
    vm.multiQueryRoutes = selectedRoutes;
    vm.multiQueryRouteResults = [];
    vm.multiQueryEvidenceBundles = [];
    vm.multiQueryRouteErrors = [];
    if (hasMultiRoutes) {
        vm.syncUnionTermsFromMultiQueryRoutes();
        if (!vm.lastPhenotypeTerms.length && phenotypeTerms.length) {
            vm.lastPhenotypeTerms = phenotypeTerms;
        }
    }

    vm.setStep({
        id: "1",
        substep: {
            id: "1.1",
            result: {
                title: "Extracted search terms and research context. Review terms, then continue.",
                result: {
                    phenotypeTerms,
                    mechanismTerms,
                    genesOfInterest,
                    researchContext,
                    alternativeQueries,
                    selectedRoutes,
                },
            },
        },
    });
    vm.buildSearchCriteriaEditRows();

    const approved = await vm.waitForStepApproval("1", "Review terms and continue when ready.", true);
    if (!approved) return;
    if (vm.workflowRunIdStale(extractRunId)) return;

    if (vm.searchMode === "auto") {
        vm.onResearch();
    }
}

function handleExtractionError(vm, err) {
    vm.loading_search_criteria = false;
    vm.error_search_criteria = true;
    vm.error_msg_search_criteria = err && err.message ? err.message : "An error occurred.";
    vm.setStep({
        type: "error",
        title: "Request failed or timed out.",
    });
}

async function startWorkflowFromExtractedTerms(vm, options = {}) {
    const {
        queryText = "",
        phenotypeTerms = [],
        mechanismTerms = [],
        genesOfInterest = [],
        researchContext = "",
        alternativeQueries = [],
        retrievalPhenotypeTerms = null,
        helperConstraintSpec = null,
    } = options;

    const q = String(queryText || "").trim();
    if (!q) return;
    const extractRunId = vm.workflowRunId;
    if (vm.stepApprovalGateActive) {
        vm.cancelStepGate(false);
    }
    vm.userQuery = q;
    resetWorkflowStateForNewRun(vm);
    vm.loading_search_criteria = false;
    vm.allow_retry = true;

    const phen = vm.normalizeLlmTermList(phenotypeTerms);
    const mech = vm.normalizeLlmTermList(mechanismTerms);
    const goi = vm.normalizeLlmTermList(genesOfInterest);
    const alt = vm.normalizeAlternativeQueries(alternativeQueries);
    const ctx = String(researchContext || "").trim();
    const searchTerms = [...phen, ...mech];
    const retrievalPhenotypeList = vm.normalizeLlmTermList(retrievalPhenotypeTerms);

    vm.setStep(
        {
            id: "1",
            title: "LLM: Extracting search terms from user query",
            substep: {
                id: "1.1",
                title: q,
            },
        },
        true
    );
    vm.searchCriteria = [
        {
            search_criteria: "Search Terms",
            values: searchTerms.length ? searchTerms : ["(none extracted)"],
            why: "Built from your helper selections.",
            purpose:
                "These terms will be used to search for related phenotype↔signature associations via semantic search.",
        },
        {
            search_criteria: "Research Context",
            values: ctx || "(none extracted)",
            why: "Built from your helper selections.",
            purpose: "This context will be used to tailor mechanistic hypotheses to your research.",
        },
    ];
    vm.searchTerm = searchTerms.join(", ");
    vm.lastPhenotypeTerms = phen;
    vm.lastMechanismTerms = mech;
    vm.lastGenesOfInterest = goi;
    vm.lastAlternativeQueries = alt;
    vm.setStep({
        id: "1",
        substep: {
            id: "1.1",
            result: {
                title: "Extracted search terms and research context. Review terms, then continue.",
                result: {
                    phenotypeTerms: phen,
                    mechanismTerms: mech,
                    genesOfInterest: goi,
                    researchContext: ctx,
                    alternativeQueries: alt,
                },
            },
        },
    });
    vm.buildSearchCriteriaEditRows();
    const approved = await vm.waitForStepApproval("1", "Review terms and continue when ready.", true);
    if (!approved) return;
    if (vm.workflowRunIdStale(extractRunId)) return;

    if (vm.searchMode === "auto") {
        vm.onResearch(
            retrievalPhenotypeList.length ? retrievalPhenotypeList : undefined,
            helperConstraintSpec != null ? { helperConstraintSpec } : undefined
        );
    }
}

export {
    beginExtractionFlow,
    DEFAULT_EXTRACTION_MAX_ATTEMPTS,
    DEFAULT_EXTRACTION_TIMEOUT_MS,
    handleExtractionError,
    isExtractionTimeoutError,
    processExtractionResponse,
    resetWorkflowStateForNewRun,
    startWorkflowFromExtractedTerms,
};
