/**
 * Hybrid retrieval orchestration for Multi Query REVEAL (single- and multi-route).
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

import { callHybridRevealSearch, fetchHybridQueryEmbedding } from "./revealMqHybridSearchApi.js";
import { normalizeHybridFactorsToFactorData } from "./revealMqHybridSearch.js";
import { normalizeLlmTermList } from "./revealMqExtraction.js";
import {
    annotateFactorDataWithFetchedDirection,
    buildCompactRouteEvidence,
    isConstraintValidationError,
    mergeRouteFactorData,
    resolveHybridPhenotypeFilterTerms,
    resolveMultiRouteHybridPhenotypeFilterTerms,
    routeGenesOfInterestForFetch,
    routeResearchContextForFetch,
    sanitizeEmbeddingText,
    setMultiQueryRouteStatus,
} from "./revealMqMultiRoute.js";
import { requestMechanismHypotheses } from "./revealMqHypothesisOrchestrator.js";

function handleHybridRetrievalError(vm, err) {
    const msg = err && err.message ? String(err.message) : "";
    const isNoResults = /(^|\s)404(\s|$)|no phenotype.?factor results|no results found|no phenotype matches/i.test(
        msg
    );
    const isValidation = /(^|\s)422(\s|$)/.test(msg);
    const isTimeout = /(^|\s)504(\s|$)|timed out|AbortError/i.test(msg);
    if (isNoResults) {
        vm.setLoadStatus("No exact matches found for those terms.", true);
        vm.setStep({
            type: "error",
            title: "No results found. Try rephrasing your phenotype (e.g., 'Heart Disease' instead of 'CAD') or using broader terms.",
        });
    } else if (isValidation) {
        vm.setLoadStatus("Request could not be validated. Check phenotype terms and research context.", true);
        vm.setStep({
            type: "error",
            title: msg.replace(/^\s*422\s*/, "") || "Invalid hybrid search request (422).",
        });
    } else if (isTimeout) {
        vm.setLoadStatus("Hybrid search timed out. Try again in a moment.", true);
        vm.setStep({
            type: "error",
            title: "Hybrid search timed out (504). The database or embedding service may be busy.",
        });
    } else {
        vm.setLoadStatus("Error: " + (err && err.message ? err.message : "hybrid retrieval failed"), true);
        vm.setStep({
            type: "error",
            title: "Hybrid retrieval failed due to a server error.",
        });
    }
    vm.loadComplete = true;
}

async function fetchMultiQueryRouteEvidence(vm, route, index) {
    const routeId = route.route_id || `route-${index + 1}`;
    setMultiQueryRouteStatus(vm, routeId, "loading");
    const terms = route.extracted_terms || {};
    const phenotypeTerms = normalizeLlmTermList(terms.phenotype_terms);
    const mechanismTerms = normalizeLlmTermList(terms.mechanism_terms);
    const tissueTerms = normalizeLlmTermList(terms.tissues);
    const cellTypeTerms = normalizeLlmTermList(terms.cell_types);
    const sharedResearchContext =
        vm.searchCriteria && vm.searchCriteria[1] && vm.searchCriteria[1].values != null
            ? String(vm.searchCriteria[1].values)
            : "";
    const ctx = routeResearchContextForFetch(route, sharedResearchContext);
    const phenos = resolveMultiRouteHybridPhenotypeFilterTerms(route, vm.lastPhenotypeTerms);
    if (!phenos.length) {
        throw new Error(
            `No phenotype terms for ${route.category || routeId}. Add route-specific phenotype terms before retrieval.`
        );
    }
    const genesOfInterest = routeGenesOfInterestForFetch(route, vm.lastExplicitUserGenes);

    let queryEmbedding = null;
    if (vm.hybridSearchUseClientEmbedding) {
        let queryText = vm.buildHybridQueryText({
            phenotypeTerms: phenos,
            mechanismTerms: [...mechanismTerms, ...tissueTerms, ...cellTypeTerms],
            researchContext: ctx,
        });
        queryText = sanitizeEmbeddingText(queryText || ctx);
        queryEmbedding = await fetchHybridQueryEmbedding(vm, queryText);
    }

    let constraintUsed = route.constraint_spec || null;
    let hybridJson;
    const mechanismForFetch = [...mechanismTerms, ...tissueTerms, ...cellTypeTerms];
    try {
        hybridJson = await callHybridRevealSearch(vm, {
            queryEmbedding,
            phenotypeTerms: phenos,
            mechanismTerms: mechanismForFetch,
            researchContext: ctx,
            genesOfInterest,
            constraintSpec: constraintUsed,
        });
    } catch (err) {
        if (!constraintUsed || !isConstraintValidationError(err)) throw err;
        constraintUsed = null;
        hybridJson = await callHybridRevealSearch(vm, {
            queryEmbedding,
            phenotypeTerms: phenos,
            mechanismTerms: mechanismForFetch,
            researchContext: ctx,
            genesOfInterest,
            constraintSpec: null,
        });
    }
    const routeForEvidence = { ...route, constraint_spec: constraintUsed };
    const factorData = annotateFactorDataWithFetchedDirection(
        normalizeHybridFactorsToFactorData(hybridJson, phenos),
        routeForEvidence
    );
    const phenotypes = Object.keys(factorData).filter((p) => (factorData[p].factors || []).length > 0);
    if (!phenotypes.length) {
        throw new Error(`No phenotype-factor results for ${route.category || routeId}.`);
    }
    const evidenceBundle = buildCompactRouteEvidence({
        route: routeForEvidence,
        factorData,
        hybridJson,
        evidenceLimits: vm.multiQueryEvidenceLimits,
        lastExplicitUserGenes: vm.lastExplicitUserGenes,
    });
    setMultiQueryRouteStatus(vm, routeId, "complete", {
        phenotype_count: phenotypes.length,
        factor_count: phenotypes.reduce((acc, p) => acc + ((factorData[p].factors || []).length), 0),
    });
    vm.setStep({
        id: "2",
        substep: {
            id: `2.${routeId}`,
            title: `${route.category || routeId}: retrieved ${evidenceBundle.top_hits.length} evidence hit${evidenceBundle.top_hits.length !== 1 ? "s" : ""}`,
            result: {
                result: {
                    query: route.sanitized_query,
                    phenotype_terms: phenos,
                    mechanism_terms: mechanismForFetch,
                    genes_of_interest: genesOfInterest,
                    research_context: ctx,
                    phenotype_count: phenotypes.length,
                    factor_count: phenotypes.reduce((acc, p) => acc + ((factorData[p].factors || []).length), 0),
                    constraint_mode: constraintUsed && constraintUsed.constraint_mode,
                    constraint_fallback:
                        route.constraint_spec && !constraintUsed ? "retried_without_constraint_after_422" : null,
                },
            },
        },
    });
    return { route: routeForEvidence, factorData, hybridJson, evidenceBundle };
}

async function runHybridRetrievalWorkflow(
    vm,
    { phenotypeTerms = [], mechanismTerms = [], researchContext = "", constraintSpec = null } = {}
) {
    const NONE = "(none extracted)";
    let ctx = researchContext != null ? String(researchContext).trim() : "";
    if (ctx === NONE) ctx = "";

    const rawPhenos = normalizeLlmTermList(phenotypeTerms);
    const mechs = normalizeLlmTermList(mechanismTerms);

    const phenos = resolveHybridPhenotypeFilterTerms(rawPhenos, mechs, ctx, vm.userQuery);
    if (!phenos.length) return false;

    vm.setStep({
        id: "2",
        title: "Retrieving data",
    });

    let queryEmbedding = null;
    if (vm.hybridSearchUseClientEmbedding) {
        let queryText = vm.buildHybridQueryText({
            phenotypeTerms: phenos,
            mechanismTerms: mechs,
            researchContext: ctx,
        });
        if (!queryText) queryText = String(vm.userQuery || "").trim();
        if (!queryText) return false;
        vm.setLoadStatus("Hybrid retrieval: generating embedding (client)…");
        queryEmbedding = await fetchHybridQueryEmbedding(vm, queryText);
        vm.setStep({
            id: "2",
            substep: {
                id: "2.h1",
                title: "Client embedding",
                result: {
                    result: {
                        dims: queryEmbedding.length,
                        model: vm.hybridEmbedModel,
                        embedding_provider_used: "client",
                    },
                },
            },
        });
    } else {
        vm.setLoadStatus("Hybrid retrieval: calling API (server-side embedding)…");
    }

    vm.setLoadStatus("Hybrid retrieval: searching factors and gene sets…");
    const hybridJson = await callHybridRevealSearch(vm, {
        queryEmbedding,
        phenotypeTerms: phenos,
        mechanismTerms: mechs,
        researchContext: ctx,
        genesOfInterest: normalizeLlmTermList(vm.lastGenesOfInterest),
        constraintSpec,
    });
    const normalized = normalizeHybridFactorsToFactorData(hybridJson, phenos);
    const phenotypes = Object.keys(normalized).filter((p) => (normalized[p].factors || []).length > 0);
    if (!phenotypes.length) return false;

    vm.factorData = normalized;
    const data = hybridJson && hybridJson.data ? hybridJson.data : {};
    const meta = hybridJson && hybridJson.meta ? hybridJson.meta : {};
    vm.lastHybridSearchMeta = meta && typeof meta === "object" ? { ...meta } : {};
    vm.lastHybridSearchResponse =
        hybridJson != null && typeof hybridJson === "object" ? JSON.parse(JSON.stringify(hybridJson)) : null;
    vm.setStep({
        id: "2",
        substep: {
            id: "2.h2",
            title: "Retrieved result",
            result: {
                result: {
                    phenotype: data.phenotype != null ? data.phenotype : phenotypes[0],
                    queried_phenotypes: data.queried_phenotypes,
                    phenotype_count: phenotypes.length,
                    factor_count: phenotypes.reduce((acc, p) => acc + ((normalized[p].factors || []).length), 0),
                    meta,
                },
            },
        },
    });

    vm.snapshotFilteredSelectionBaseline();
    vm.genesAndFactorValuesLoaded = true;
    vm.setLoadStatus("Building knowledge graph from hybrid results…");
    const kgTriples = vm.transformMergedDataToKG(vm.factorData, "factors");
    vm.lastKgTriples = kgTriples;
    const approved = await vm.waitForStepApproval(
        "2",
        "Knowledge graph is ready. Continue to generate mechanistic hypotheses?",
        true
    );
    if (!approved) return false;
    vm.setLoadStatus("Generating hypotheses…");
    vm.setStep({
        id: "4",
        title: "LLM: Generating mechanistic hypotheses",
    });
    requestMechanismHypotheses(vm, vm.factorData, kgTriples);
    return true;
}

async function runMultiQueryRetrievalWorkflow(vm, routes = []) {
    if (vm.usePerRouteSearchTermsEditor) {
        vm.applyRouteEditRowsToMultiQueryRoutes();
    }
    const routeList = (
        Array.isArray(vm.multiQueryRoutes) && vm.multiQueryRoutes.length ? vm.multiQueryRoutes : routes
    ).slice(0, vm.multiQueryEvidenceLimits.maxRoutes || 3);
    if (!routeList.length) return false;
    vm.setStep({
        id: "2",
        title: "Retrieving data across selected directions",
    });
    vm.setLoadStatus("Hybrid retrieval: searching selected biological directions…");
    const successes = [];
    const errors = [];
    for (let idx = 0; idx < routeList.length; idx += 1) {
        const route = routeList[idx] || {};
        try {
            const result = await fetchMultiQueryRouteEvidence(vm, route, idx);
            successes.push(result);
        } catch (err) {
            const message = err && err.message ? err.message : "Route retrieval failed.";
            errors.push({ route_id: route.route_id, category: route.category, message });
            setMultiQueryRouteStatus(vm, route.route_id, "error", { error: message });
            vm.setStep({
                id: "2",
                substep: {
                    id: `2.${route.route_id || idx}.error`,
                    title: `${route.category || "Route"} failed: ${message}`,
                },
            });
        }
    }
    vm.multiQueryRouteResults = successes;
    vm.multiQueryRouteErrors = errors;
    vm.multiQueryEvidenceBundles = successes.map((r) => r.evidenceBundle);
    if (!successes.length) return false;

    vm.factorData = mergeRouteFactorData(successes);
    vm.lastHybridSearchMeta = {
        routes: successes.map((r) => ({
            route_id: r.route.route_id,
            category: r.route.category,
            meta: r.hybridJson && r.hybridJson.meta ? r.hybridJson.meta : {},
        })),
        failed_routes: errors,
    };
    vm.lastHybridSearchResponse = {
        routes: successes.map((r) => ({
            route_id: r.route.route_id,
            category: r.route.category,
            response: r.hybridJson,
        })),
        failed_routes: errors,
    };

    vm.snapshotFilteredSelectionBaseline();
    vm.genesAndFactorValuesLoaded = true;
    vm.setLoadStatus("Building knowledge graph from multi-route hybrid results…");
    const kgTriples = vm.transformMergedDataToKG(vm.factorData, "factors");
    vm.lastKgTriples = kgTriples;
    const approved = await vm.waitForStepApproval(
        "2",
        "Multi-route evidence is ready. Continue to generate mechanistic hypotheses?",
        true
    );
    if (!approved) return false;
    vm.setLoadStatus("Generating hypotheses from compact route evidence…");
    vm.setStep({
        id: "4",
        title: "LLM: Generating mechanistic hypotheses",
    });
    requestMechanismHypotheses(vm, vm.factorData, kgTriples, vm.multiQueryEvidenceBundles);
    return true;
}

async function onResearch(vm, phenotypeTermsFromExtract, options = {}) {
    const runId = vm.workflowRunId;
    const opts = options && typeof options === "object" ? options : {};
    const rawPhenotype =
        phenotypeTermsFromExtract != null
            ? phenotypeTermsFromExtract
            : vm.lastPhenotypeTerms && vm.lastPhenotypeTerms.length
              ? vm.lastPhenotypeTerms
              : vm.searchCriteria && vm.searchCriteria[0] && vm.searchCriteria[0].values
                ? vm.searchCriteria[0].values.filter((v) => v && String(v) !== "(none extracted)")
                : [];
    const phenotypeTerms = normalizeLlmTermList(rawPhenotype);
    try {
        vm.genesAndFactorValuesLoaded = false;
        vm.factorData = {};
        vm.lastHybridSearchMeta = {};
        vm.lastHybridSearchResponse = null;
        vm.lastKgTriples = [];
        vm.mechanisms = null;
        vm.mechanismDiagnosticAssessment = null;
        vm.hypothesisLastRunMode = null;
        vm.phenotypeDescriptionById = {};
        vm.lastRunUsedHardConstraint = !!opts.helperConstraintSpec;
        if (!vm.lastRunUsedHardConstraint) {
            vm.lastHardConstraintFactorLabelByPair = {};
        }
        const researchContext =
            vm.searchCriteria && vm.searchCriteria[1] && vm.searchCriteria[1].values != null
                ? String(vm.searchCriteria[1].values)
                : "";
        const useMultiRoute =
            Array.isArray(vm.multiQueryRoutes) &&
            vm.multiQueryRoutes.length > 1 &&
            opts.helperConstraintSpec == null;
        const usedHybrid = useMultiRoute
            ? await runMultiQueryRetrievalWorkflow(vm, vm.multiQueryRoutes)
            : await runHybridRetrievalWorkflow(vm, {
                  phenotypeTerms,
                  mechanismTerms: normalizeLlmTermList(vm.lastMechanismTerms),
                  researchContext,
                  constraintSpec: opts.helperConstraintSpec != null ? opts.helperConstraintSpec : null,
              });
        if (vm.workflowRunIdStale(runId)) return;
        if (!usedHybrid) {
            throw new Error("Hybrid retrieval returned no phenotype–factor results.");
        }
    } catch (err) {
        if (vm.workflowRunIdStale(runId)) return;
        handleHybridRetrievalError(vm, err);
    }
}

export {
    fetchMultiQueryRouteEvidence,
    handleHybridRetrievalError,
    onResearch,
    runHybridRetrievalWorkflow,
    runMultiQueryRetrievalWorkflow,
};
