/**
 * Mechanism hypothesis phase orchestration for Multi Query REVEAL.
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

import {
    flattenKGData,
    transformMergedDataToKG,
} from "./revealMqKgTransform.js";
import { WORKFLOW_STEP_IDS } from "./revealMqStepGates.js";
import {
    classifyAndReportError,
    getOrBuildKgTriples,
    isLlmTimeoutError,
    runLlmWithRetry,
} from "./revealMqOrchestratorShared.js";
import { filterFactorDataByAssociationFilters, DEFAULT_ASSOCIATION_FILTERS, ASSOCIATION_TIER_IDS } from "./revealMqAssociationScore.js";
import {
    GENE_SET_ENTRY_LLM_FEED_SCOPE,
    buildGeneSetEntryHypothesesUserPrompt,
    buildGeneSetEntryLlmFeed,
} from "./revealMqGeneSetEntryLlmFeed.js";
import {
    FREE_TEXT_LLM_FEED_SCOPE,
    buildFreeTextHypothesesUserPrompt,
    buildFreeTextLlmFeed,
    scopeFreeTextFactorDataForLlm,
} from "./revealMqFreeTextLlmFeed.js";
import {
    GENE_SET_MECHANISM_HYPOTHESIS_SYSTEM_PROMPT,
    GENE_SET_MECHANISM_HYPOTHESIS_EXPLORATORY_MODE_SUFFIX,
} from "./revealMqPrompts.js";

const DEFAULT_HYPOTHESIS_MAX_ATTEMPTS = 3;

const HYPOTHESIS_ERROR_BUCKETS = [
    { test: () => true, stepTitle: () => "Mechanistic hypothesis generation failed." },
];

function beginMechanismHypothesisGeneration(vm) {
    if (!vm) return;
    vm.revealResultsTabUnlocked = true;
    vm.loadComplete = false;
    vm.switchRevealTab("results");
    if (typeof vm.restartMechanismHypothesisStepTimer === "function") {
        vm.restartMechanismHypothesisStepTimer();
    }
}

function getResearchContextFromSession(vm) {
    const fromCriteria =
        vm.searchCriteria && vm.searchCriteria[1] && vm.searchCriteria[1].values != null
            ? String(vm.searchCriteria[1].values).trim()
            : "";
    if (fromCriteria) return fromCriteria;
    const fromShared =
        vm.sharedResearchContextTerm != null ? String(vm.sharedResearchContextTerm).trim() : "";
    if (fromShared) return fromShared;
    const fromGeneSetEntry =
        vm.geneSetEntry && vm.geneSetEntry.researchIntention != null
            ? String(vm.geneSetEntry.researchIntention).trim()
            : "";
    return fromGeneSetEntry;
}

function collectAssociatedPairsForPrompt(vm) {
    const hasHeatmapScope = Array.isArray(vm.heatmapSelectedNodes) && vm.heatmapSelectedNodes.length > 0;
    const scopeRows = hasHeatmapScope
        ? vm.factorDataTableRowsHeatmapScoped || []
        : vm.factorDataTableRowsFiltered || [];
    return scopeRows
        .map((r) => ({
            phenotype: String(r.phenotype || "").trim(),
            factor: String(
                r.factorLabel != null && String(r.factorLabel).trim() !== "" ? r.factorLabel : r.factor || ""
            ).trim(),
        }))
        .filter((p) => p.phenotype && p.factor);
}

function buildHypothesesUserPrompt(vm, { feed, researchContext }) {
    const modeLine =
        vm.hypothesisGenerationMode === "relaxed"
            ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply the relaxed overrides in your system prompt; set diagnostic_assessment.exploratory_mode to true.\n"
            : "";
    return `${buildFreeTextHypothesesUserPrompt(feed, researchContext)}${modeLine}`;
}

function applyMechanismHypothesisFailure(vm, lastFailed) {
    classifyAndReportError(vm, lastFailed, {
        buckets: HYPOTHESIS_ERROR_BUCKETS,
        errorFlag: "error_mechanisms",
        errorMessageField: "error_msg_mechanisms",
        errorMessageFallback: "Mechanistic hypothesis generation failed.",
        reportLoadStatus: () => "Ready",
        markLoadComplete: true,
        onBeforeReport: (v) => {
            v.hypothesisLastRunMode = null;
        },
    });
}

function applyMechanismHypothesisSuccess(vm, parsed, modeSnapshot) {
    vm.hypothesisLastRunMode = modeSnapshot;

    const diag =
        parsed.diagnostic_assessment != null && typeof parsed.diagnostic_assessment === "object"
            ? parsed.diagnostic_assessment
            : null;
    vm.mechanismDiagnosticAssessment = diag;

    if (parsed && typeof parsed.overall_summary === "string") {
        vm.mechanisms_summary = parsed.overall_summary;
    } else {
        vm.mechanisms_summary = null;
    }

    const hypotheses = Array.isArray(parsed.hypotheses)
        ? parsed.hypotheses
        : parsed.hypothesis && typeof parsed.hypothesis === "object"
          ? [parsed.hypothesis]
          : [];

    if (!hypotheses.length) {
        if (diag && diag.can_generate_hypothesis === false) {
            vm.mechanisms = [];
            if (
                !vm.mechanisms_summary &&
                typeof diag.rejection_reason === "string" &&
                diag.rejection_reason.trim()
            ) {
                vm.mechanisms_summary = diag.rejection_reason.trim();
            }
            if (!vm.mechanisms_summary) {
                vm.mechanisms_summary = vm.getReportSessionSummary();
            }
            vm.setLoadStatus("Ready", true);
            vm.setStep(
                {
                    id: WORKFLOW_STEP_IDS.HYPOTHESES,
                    substep: {
                        id: "4.9",
                        title: "Complete (no hypothesis; diagnostics).",
                    },
                },
                true
            );
            vm.loadComplete = true;
            vm.showTab = "results";
            return;
        }
        vm.error_mechanisms = true;
        vm.error_msg_mechanisms = "No hypotheses were returned.";
        vm.setStep({
            type: "error",
            title: "No mechanistic hypotheses returned.",
        });
        vm.setLoadStatus("Ready", true);
        vm.loadComplete = true;
        return;
    }

    vm.mechanisms = vm.normalizeMechanismHypotheses(hypotheses);
    if (!vm.mechanisms_summary) {
        vm.mechanisms_summary = vm.getReportSessionSummary();
    }
    vm.$nextTick(() => {
        void vm.autoMapAllMechanismsToBiolink();
    });
    vm.setLoadStatus("Ready", true);
    vm.setStep(
        {
            id: WORKFLOW_STEP_IDS.HYPOTHESES,
            substep: {
                id: "4.9",
                title: "Complete.",
            },
        },
        true
    );
    vm.loadComplete = true;
    vm.showTab = "results";
}

function requestMechanismHypotheses(vm, factorData, kgTriples, routeEvidenceBundles = null) {
    if (!vm) return;
    beginMechanismHypothesisGeneration(vm);
    vm.error_mechanisms = false;
    vm.error_msg_mechanisms = "";
    vm.mechanismDiagnosticAssessment = null;

    const researchContext = getResearchContextFromSession(vm);

    // Gene-set entry path: slim JSON feed (scoped before format). No CSV KG.
    if (vm.searchPath === "genes") {
        const scopeMode = vm.geneSetEntryLlmFeedScope || GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER;
        const inputGenes =
            vm.geneSetEntry && Array.isArray(vm.geneSetEntry.inputGenes) ? vm.geneSetEntry.inputGenes : [];
        const built = buildGeneSetEntryLlmFeed(factorData, {
            scopeMode,
            selectedNodes: vm.heatmapSelectedNodes || [],
            viewFilters: vm.heatmapViewFilters || {},
            inputGenes,
            source: "bayes_gene/pigean",
            searchPath: "genes",
        });
        if (!built.feed) {
            vm.error_mechanisms = true;
            vm.error_msg_mechanisms = built.emptyReason || "No gene-set evidence in the chosen LLM scope.";
            vm.setLoadStatus("Ready", true);
            vm.loadComplete = true;
            return;
        }
        vm.lastGeneSetEntryLlmFeed = built.feed;
        vm.lastFlattenedKG = [];
        const hypothesesUserPrompt = buildGeneSetEntryHypothesesUserPrompt(built.feed, researchContext);
        let systemPromptForRun = GENE_SET_MECHANISM_HYPOTHESIS_SYSTEM_PROMPT;
        if (vm.hypothesisGenerationMode === "relaxed") {
            systemPromptForRun = `${systemPromptForRun}\n\n${GENE_SET_MECHANISM_HYPOTHESIS_EXPLORATORY_MODE_SUFFIX}`;
        }
        const maxAttempts = DEFAULT_HYPOTHESIS_MAX_ATTEMPTS;
        (async () => {
            const result = await runLlmWithRetry(vm, {
                caller: vm.llmAnalyze,
                maxAttempts,
                sendArgs: { systemPrompt: systemPromptForRun, userPrompt: hypothesesUserPrompt },
                isRetryableError: isLlmTimeoutError,
                incompleteMessage: "Incomplete LLM response.",
                parseResponse: (raw) => {
                    console.log("FactorBaseReveal: gene-set hypotheses LLM raw response", raw);
                    return vm.parseLLMResponse(raw);
                },
                onAttemptStart: (attempt, max) =>
                    vm.setLoadStatus(`Generating mechanistic hypotheses… (attempt ${attempt}/${max})`),
            });
            if (!result.ok) {
                applyMechanismHypothesisFailure(vm, result.err);
                return;
            }
            applyMechanismHypothesisSuccess(vm, result.json, vm.hypothesisGenerationMode);
        })();
        return;
    }

    // Free-text Data scope (selected / selected+GOI / full), then association legend filters.
    const freeTextScopeMode = vm.freeTextLlmFeedScope || FREE_TEXT_LLM_FEED_SCOPE.FULL;
    const genesOfInterest = [
        ...(Array.isArray(vm.lastGenesOfInterest) ? vm.lastGenesOfInterest : []),
        ...(Array.isArray(vm.lastExplicitUserGenes) ? vm.lastExplicitUserGenes : []),
    ];
    const freeTextScoped = scopeFreeTextFactorDataForLlm(factorData, {
        scopeMode: freeTextScopeMode,
        selectedNodes: vm.heatmapSelectedNodes || [],
        genesOfInterest,
    });
    if (freeTextScoped.emptyReason) {
        vm.error_mechanisms = true;
        vm.error_msg_mechanisms = freeTextScoped.emptyReason;
        vm.setLoadStatus("Ready", true);
        vm.loadComplete = true;
        return;
    }

    // Honor phenotype-association legend checkboxes: only visible-tier genes go to the LLM.
    const associationFilters = {
        ...DEFAULT_ASSOCIATION_FILTERS,
        ...(vm.phenotypeAssociationFilters || {}),
    };
    const associationFilterActive = ASSOCIATION_TIER_IDS.some((id) => associationFilters[id] === false);
    const scopedFactorData = associationFilterActive
        ? filterFactorDataByAssociationFilters(freeTextScoped.factorData, associationFilters)
        : freeTextScoped.factorData;

    // Local KG for post-LLM evidence networks / candidate-gene scores (not sent in the slim LLM feed).
    // Keep scores (forHypothesisPrompt: false) so Results Combined/GWAS/Functional columns populate.
    const scopedKgTriples = transformMergedDataToKG(scopedFactorData, "factors");
    vm.lastFlattenedKG = flattenKGData(scopedKgTriples);

    const built = buildFreeTextLlmFeed(scopedFactorData, {
        genesOfInterest,
        hybridMeta: vm.lastHybridSearchMeta,
        routeBundles: routeEvidenceBundles,
        associatedPairs: collectAssociatedPairsForPrompt(vm),
    });
    if (!built.feed) {
        vm.error_mechanisms = true;
        vm.error_msg_mechanisms = built.emptyReason || "No evidence in the chosen LLM scope.";
        vm.setLoadStatus("Ready", true);
        vm.loadComplete = true;
        return;
    }
    vm.lastFreeTextLlmFeed = built.feed;

    const hypothesesUserPrompt = buildHypothesesUserPrompt(vm, {
        feed: built.feed,
        researchContext,
    });
    const maxAttempts = DEFAULT_HYPOTHESIS_MAX_ATTEMPTS;
    const systemPromptForRun = vm.mechanismHypothesisSystemPromptEffective;

    (async () => {
        const result = await runLlmWithRetry(vm, {
            caller: vm.llmAnalyze,
            maxAttempts,
            sendArgs: { systemPrompt: systemPromptForRun, userPrompt: hypothesesUserPrompt },
            isRetryableError: isLlmTimeoutError,
            incompleteMessage: "Incomplete LLM response.",
            parseResponse: (raw) => {
                console.log("FactorBaseReveal: hypotheses LLM raw response", raw);
                return vm.parseLLMResponse(raw);
            },
            onAttemptStart: (attempt, max) =>
                vm.setLoadStatus(`Generating mechanistic hypotheses… (attempt ${attempt}/${max})`),
        });

        if (!result.ok) {
            applyMechanismHypothesisFailure(vm, result.err);
            return;
        }

        applyMechanismHypothesisSuccess(vm, result.json, vm.hypothesisGenerationMode);
    })();
}

function retryMechanismHypotheses(vm) {
    if (!vm) return;
    vm.error_mechanisms = false;
    vm.error_msg_mechanisms = "";
    vm.mechanismDiagnosticAssessment = null;
    vm.setLoadStatus("Generating hypotheses…");
    beginMechanismHypothesisGeneration(vm);
    vm.setStep({
        id: WORKFLOW_STEP_IDS.HYPOTHESES,
        title: "LLM: Generating mechanistic hypotheses",
    });
    const triples = getOrBuildKgTriples(vm, vm.factorData);
    requestMechanismHypotheses(vm, vm.factorData, triples, vm.multiQueryEvidenceBundles);
}

function retryMechanismHypothesesRelaxed(vm) {
    if (!vm) return;
    vm.hypothesisGenerationMode = "relaxed";
    retryMechanismHypotheses(vm);
}

function resumeImportedWorkflowAfterDataGate(vm) {
    if (!vm) return;
    const kgTriples = getOrBuildKgTriples(vm, vm.factorData);
    vm.setLoadStatus("Generating hypotheses…");
    vm.setStep({
        id: WORKFLOW_STEP_IDS.HYPOTHESES,
        title: "LLM: Generating mechanistic hypotheses",
    });
    requestMechanismHypotheses(vm, vm.factorData, kgTriples);
}

/**
 * Generate mechanistic hypothesis for one remaining phenotype-factor pair (same LLM step as main
 * run, subset data only, single attempt, no retry — merges into vm.mechanisms rather than replacing it).
 */
function generateHypothesisForRemainingPair(vm, row) {
    if (!row || row.phenotype == null || row.factor == null) return;
    const pairKey = vm.getRowKey(row);
    vm.remainingPairGenerateError = "";
    const subset = vm.buildSinglePairFactorData(row);
    if (!subset) {
        vm.remainingPairGenerateError = "Could not build data for this pair.";
        return;
    }
    // Scored KG for normalize / candidate table (slim LLM feed stays score-free separately).
    const kgTriples = transformMergedDataToKG(subset, "factors");
    if (!kgTriples || !kgTriples.length) {
        vm.remainingPairGenerateError = "No knowledge graph triples for this pair.";
        return;
    }
    vm.generatingRemainingRowKey = pairKey;
    vm.startRemainingGenerateTimer();
    const flattened = flattenKGData(kgTriples);
    const researchContext =
        (vm.searchCriteria && vm.searchCriteria[1] && vm.searchCriteria[1].values) != null
            ? String(vm.searchCriteria[1].values)
            : "";
    const factorLabelForKg =
        row.factorLabel != null && String(row.factorLabel).trim() !== ""
            ? String(row.factorLabel).trim()
            : row.factor != null
              ? String(row.factor).trim()
              : "";
    const genesOfInterest = [
        ...(Array.isArray(vm.lastGenesOfInterest) ? vm.lastGenesOfInterest : []),
        ...(Array.isArray(vm.lastExplicitUserGenes) ? vm.lastExplicitUserGenes : []),
    ];
    const built = buildFreeTextLlmFeed(subset, {
        genesOfInterest,
        hybridMeta: vm.lastHybridSearchMeta,
        routeBundles: vm.multiQueryEvidenceBundles,
        associatedPairs: [
            {
                phenotype: String(row.phenotype).trim(),
                factor: factorLabelForKg,
            },
        ],
    });
    if (!built.feed) {
        vm.remainingPairGenerateError = built.emptyReason || "Could not build slim evidence for this pair.";
        vm.generatingRemainingRowKey = "";
        vm.stopRemainingGenerateTimer();
        return;
    }
    const pairModeLine =
        vm.hypothesisGenerationMode === "relaxed"
            ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply relaxed system-prompt overrides; set diagnostic_assessment.exploratory_mode to true.\n"
            : "";
    const fullPrompt = `${buildFreeTextHypothesesUserPrompt(built.feed, researchContext)}${pairModeLine}\n\n**Fixed phenotype-factor request:** return exactly one hypothesis for this pair when can_generate_hypothesis is true.`;
    const systemPromptForPair = vm.mechanismHypothesisSystemPromptEffective;

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        vm.generatingRemainingRowKey = "";
        vm.stopRemainingGenerateTimer();
    };

    vm.llmAnalyze.sendPrompt({
        systemPrompt: systemPromptForPair,
        userPrompt: fullPrompt,
        onResponse: (response) => {
            console.log("FactorBaseReveal: hypotheses LLM raw response", response);
            const json = vm.parseLLMResponse(response);
            if (!json) {
                vm.remainingPairGenerateError = "Could not parse LLM response.";
                return;
            }
            if (!Array.isArray(json.hypotheses) || !json.hypotheses.length) {
                const rd = json.diagnostic_assessment;
                if (rd && rd.can_generate_hypothesis === false && typeof rd.rejection_reason === "string" && rd.rejection_reason.trim()) {
                    let msg = rd.rejection_reason.trim();
                    if (typeof rd.suggested_optimized_query === "string" && rd.suggested_optimized_query.trim()) {
                        msg += ` Suggested query: ${rd.suggested_optimized_query.trim()}`;
                    }
                    vm.remainingPairGenerateError = msg;
                    return;
                }
                vm.remainingPairGenerateError =
                    typeof json.error === "string" && json.error
                        ? json.error
                        : "No hypotheses in response.";
                return;
            }
            const p = String(row.phenotype).trim();
            const fl = row.factorLabel != null ? String(row.factorLabel).trim() : "";
            const fid = row.factor != null ? String(row.factor).trim() : "";
            const coverKeys = [];
            if (fl) coverKeys.push(`${p}|${vm.collapseWsLower(fl)}`);
            if (fid) coverKeys.push(`${p}|${vm.collapseWsLower(fid)}`);
            const normalized = vm.normalizeMechanismHypotheses(json.hypotheses, flattened).map((m) => ({
                ...m,
                _fromRemainingPair: true,
                _remainingPairCoverKeys: [...new Set(coverKeys)],
            }));
            const prev = Array.isArray(vm.mechanisms) ? vm.mechanisms : [];
            vm.mechanisms = [...prev, ...normalized];
            vm.$nextTick(() => {
                void vm.autoMapAllMechanismsToBiolink();
            });
            if (!vm.adHocCoveredRowKeys.includes(pairKey)) {
                vm.adHocCoveredRowKeys = [...vm.adHocCoveredRowKeys, pairKey];
            }
        },
        onError: (err) => {
            vm.remainingPairGenerateError =
                err && err.message ? err.message : "Request failed or timed out.";
            finish();
        },
        onEnd: finish,
    });
}

export {
    beginMechanismHypothesisGeneration,
    buildHypothesesUserPrompt,
    generateHypothesisForRemainingPair,
    requestMechanismHypotheses,
    resumeImportedWorkflowAfterDataGate,
    retryMechanismHypotheses,
    retryMechanismHypothesesRelaxed,
};
