/**
 * Mechanism hypothesis phase orchestration for Multi Query REVEAL.
 * Operates on the shell component instance (`vm`) for session mutation and step UI.
 */

import {
    buildMechanismLlmContextBlock,
    flattenKGData,
    flattenedKGToCSV,
} from "./revealMqKgTransform.js";
import { isExtractionTimeoutError } from "./revealMqWorkflowOrchestrator.js";

const DEFAULT_HYPOTHESIS_MAX_ATTEMPTS = 3;

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
    return (vm.searchCriteria && vm.searchCriteria[1] && vm.searchCriteria[1].values) != null
        ? String(vm.searchCriteria[1].values)
        : "";
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
    vm.hypothesisLastRunMode = null;
    vm.error_mechanisms = true;
    vm.error_msg_mechanisms =
        lastFailed && lastFailed.message ? lastFailed.message : "Mechanistic hypothesis generation failed.";
    vm.setStep({
        type: "error",
        title: "Mechanistic hypothesis generation failed.",
    });
    vm.setLoadStatus("Ready", true);
    vm.loadComplete = true;
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
                    id: "4",
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
            id: "4",
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
    const flattened = flattenKGData(kgTriples);
    vm.lastFlattenedKG = flattened;
    const kgBlock = flattenedKGToCSV(flattened);
    const phenoSummary = vm.serializeFactorDataForPrompt(factorData);
    const hypothesesUserPrompt = buildHypothesesUserPrompt(vm, {
        kgBlock,
        phenoSummary,
        researchContext,
        routeEvidenceBundles,
    });
    const maxAttempts = DEFAULT_HYPOTHESIS_MAX_ATTEMPTS;
    const systemPromptForRun = vm.mechanismHypothesisSystemPromptEffective;

    (async () => {
        let parsed = null;
        let lastFailed = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            vm.setLoadStatus(`Generating mechanistic hypotheses… (attempt ${attempt}/${maxAttempts})`);
            const res = await new Promise((resolve) => {
                let done = false;
                const finish = (payload) => {
                    if (done) return;
                    done = true;
                    resolve(payload);
                };
                vm.llmAnalyze.sendPrompt({
                    systemPrompt: systemPromptForRun,
                    userPrompt: hypothesesUserPrompt,
                    onResponse: (response) => {
                        console.log("FactorBaseReveal: hypotheses LLM raw response", response);
                        const json = vm.parseLLMResponse(response);
                        if (!json) {
                            finish({ retry: false, failed: true, err: new Error("Could not parse LLM JSON.") });
                            return;
                        }
                        finish({ retry: false, failed: false, err: null, json });
                    },
                    onError: (err) => {
                        const isTimeout = isExtractionTimeoutError(err);
                        if (isTimeout && attempt < maxAttempts) {
                            finish({ retry: true, failed: false, err });
                        } else {
                            finish({ retry: false, failed: true, err });
                        }
                    },
                    onEnd: () => {
                        if (done) return;
                        finish({ retry: false, failed: true, err: new Error("Incomplete LLM response.") });
                    },
                });
            });
            if (res.retry) continue;
            if (res.failed) {
                lastFailed = res.err;
                break;
            }
            parsed = res.json;
            break;
        }

        if (!parsed) {
            applyMechanismHypothesisFailure(vm, lastFailed);
            return;
        }

        applyMechanismHypothesisSuccess(vm, parsed, vm.hypothesisGenerationMode);
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
        id: "4",
        title: "LLM: Generating mechanistic hypotheses",
    });
    const triples =
        vm.lastKgTriples && vm.lastKgTriples.length
            ? vm.lastKgTriples
            : vm.transformMergedDataToKG(vm.factorData, "factors");
    if (triples.length) vm.lastKgTriples = triples;
    requestMechanismHypotheses(vm, vm.factorData, triples, vm.multiQueryEvidenceBundles);
}

function retryMechanismHypothesesRelaxed(vm) {
    if (!vm) return;
    vm.hypothesisGenerationMode = "relaxed";
    retryMechanismHypotheses(vm);
}

function resumeImportedWorkflowAfterDataGate(vm) {
    if (!vm) return;
    const kgTriples =
        Array.isArray(vm.lastKgTriples) && vm.lastKgTriples.length
            ? vm.lastKgTriples
            : vm.transformMergedDataToKG(vm.factorData, "factors");
    vm.lastKgTriples = kgTriples;
    vm.setLoadStatus("Generating hypotheses…");
    vm.setStep({
        id: "4",
        title: "LLM: Generating mechanistic hypotheses",
    });
    requestMechanismHypotheses(vm, vm.factorData, kgTriples);
}

export {
    beginMechanismHypothesisGeneration,
    buildHypothesesUserPrompt,
    requestMechanismHypotheses,
    resumeImportedWorkflowAfterDataGate,
    retryMechanismHypotheses,
    retryMechanismHypothesesRelaxed,
};
