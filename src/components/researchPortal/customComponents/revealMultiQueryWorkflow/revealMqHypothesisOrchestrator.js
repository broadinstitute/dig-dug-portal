/**
 * Mechanism hypothesis phase orchestration for Multi Query REVEAL.
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

import {
    buildMechanismLlmContextBlock,
    flattenKGData,
    flattenedKGToCSV,
    serializeFactorDataForHypothesisPrompt,
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
    const fromGeneEntry =
        vm.geneEntry && vm.geneEntry.researchIntention != null
            ? String(vm.geneEntry.researchIntention).trim()
            : "";
    return fromGeneEntry;
}

function buildHypothesesUserPrompt(vm, { kgBlock, phenoSummary, researchContext, routeEvidenceBundles = null }) {
    const baseContextSuffix = buildMechanismLlmContextBlock(kgBlock, phenoSummary, researchContext);
    const hasHeatmapScope = Array.isArray(vm.heatmapSelectedNodes) && vm.heatmapSelectedNodes.length > 0;
    const scopeRows = hasHeatmapScope
        ? vm.factorDataTableRowsHeatmapScoped || []
        : vm.factorDataTableRowsFiltered || [];
    const selectedPairs = scopeRows
        .map((r) => ({
            phenotype: String(r.phenotype || "").trim(),
            factor: String(
                r.factorLabel != null && String(r.factorLabel).trim() !== "" ? r.factorLabel : r.factor || ""
            ).trim(),
        }))
        .filter((p) => p.phenotype && p.factor);
    const hybridMetaJson = JSON.stringify(vm.lastHybridSearchMeta || {}, null, 2);
    const routeEvidenceJson =
        Array.isArray(routeEvidenceBundles) && routeEvidenceBundles.length
            ? JSON.stringify(routeEvidenceBundles, null, 2)
            : "";
    const routeEvidenceBlock = routeEvidenceJson
        ? `\n\n**Compact multi-direction evidence bundles (use these to compare retrieval directions; do not assume omitted raw rows are negative evidence):**\n\`\`\`json\n${routeEvidenceJson}\n\`\`\`\n`
        : "";
    const routeCount = Array.isArray(routeEvidenceBundles) ? routeEvidenceBundles.length : 0;
    const multiRouteInstruction =
        routeCount >= 3
            ? `\n\n**Multi-route requirement:** ${routeCount} route bundles are attached. You MUST populate a non-null \`cross_route_crosstalk_model\` on each hypothesis comparing the route axes. Also populate \`overall_summary\` at the top level.\n`
            : routeCount >= 2
              ? `\n\n**Multi-route note:** ${routeCount} route bundles are attached. Compare route axes in \`cross_route_crosstalk_model\` when supported.\n`
              : "";
    const modeLine =
        vm.hypothesisGenerationMode === "relaxed"
            ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply the relaxed overrides in your system prompt; set diagnostic_assessment.exploratory_mode to true.\n"
            : "";
    return `**UI-selected phenotype–gene-set-cluster rows (grouping / associated_pairs must match these labels; the CSV graph has phenotypes, gene sets, and genes only):**\n\`\`\`json\n${JSON.stringify(selectedPairs, null, 2)}\n\`\`\`\n\n**Hybrid retrieval meta (use for diagnostic_assessment / Case 1–4):**\n\`\`\`json\n${hybridMetaJson}\n\`\`\`\n${routeEvidenceBlock}${multiRouteInstruction}${baseContextSuffix}\n${modeLine}\nGenerate hypotheses per your system instructions. Return ONLY JSON including diagnostic_assessment and overall_summary. The hypotheses array must be non-empty only when can_generate_hypothesis is true; otherwise leave hypotheses empty and follow rejection / warning / suggested_optimized_query rules.`;
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
    if (vm.multiQueryEvidenceBundles.length >= 2) {
        vm.mechanisms = vm.mechanisms.map((m) => {
            if (m.cross_route_crosstalk_model) return m;
            const fb = vm.buildCrossRouteCrosstalkFallback(vm.multiQueryEvidenceBundles);
            return fb ? { ...m, cross_route_crosstalk_model: fb } : m;
        });
    }
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
    // Honor phenotype-association legend checkboxes: only visible-tier genes go to the LLM.
    const associationFilters = {
        ...DEFAULT_ASSOCIATION_FILTERS,
        ...(vm.phenotypeAssociationFilters || {}),
    };
    const associationFilterActive = ASSOCIATION_TIER_IDS.some((id) => associationFilters[id] === false);
    const scopedFactorData = associationFilterActive
        ? filterFactorDataByAssociationFilters(factorData, associationFilters)
        : factorData;
    // Always rebuild a slim KG for the LLM (topology + search/context roles; no score columns).
    const scopedKgTriples = transformMergedDataToKG(scopedFactorData, "factors", {
        forHypothesisPrompt: true,
    });
    const flattened = flattenKGData(scopedKgTriples);
    vm.lastFlattenedKG = flattened;
    const kgBlock = flattenedKGToCSV(flattened);
    const phenoSummary = serializeFactorDataForHypothesisPrompt(scopedFactorData);
    const hypothesesUserPrompt = buildHypothesesUserPrompt(vm, {
        kgBlock,
        phenoSummary,
        researchContext,
        routeEvidenceBundles,
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
    const kgTriples = transformMergedDataToKG(subset, "factors", { forHypothesisPrompt: true });
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
    const factorSummary = serializeFactorDataForHypothesisPrompt(subset);
    const kgBlock = flattenedKGToCSV(flattened);
    const baseCtx = `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Factor data summary:**\n\`\`\`json\n${factorSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
    const factorLabelForKg =
        row.factorLabel != null && String(row.factorLabel).trim() !== ""
            ? String(row.factorLabel).trim()
            : row.factor != null
              ? String(row.factor).trim()
              : "";
    const singlePairRequest = {
        group_name: factorLabelForKg ? `${factorLabelForKg} × ${row.phenotype}` : `Remaining pair ${pairKey}`,
        associated_pairs: [
            {
                phenotype: String(row.phenotype).trim(),
                factor: factorLabelForKg,
            },
        ],
    };
    const hybridMetaJson = JSON.stringify(vm.lastHybridSearchMeta || {}, null, 2);
    const pairModeLine =
        vm.hypothesisGenerationMode === "relaxed"
            ? "\n\n**Mode:** EXPLORATORY (RELAXED) — apply relaxed system-prompt overrides; set diagnostic_assessment.exploratory_mode to true.\n"
            : "";
    const fullPrompt = `**Fixed phenotype-factor request (single pair):**\n\`\`\`json\n${JSON.stringify(singlePairRequest, null, 2)}\n\`\`\`\n\n**Hybrid retrieval meta (diagnostic_assessment / Case 1–4):**\n\`\`\`json\n${hybridMetaJson}\n\`\`\`\n\n${baseCtx}${pairModeLine}\n\nReturn ONLY JSON per your system instructions: include diagnostic_assessment. When can_generate_hypothesis is true, the "hypotheses" array must contain exactly one element for this pair. When false, hypotheses must be empty and rejection fields populated. Include warning_flag / suggested_optimized_query whenever required by the prompt.`;
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
