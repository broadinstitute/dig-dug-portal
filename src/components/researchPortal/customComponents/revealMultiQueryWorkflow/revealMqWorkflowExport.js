import userUtils from "@/utils/userUtils";

const REVEAL_MQ_WORKFLOW_EXPORT_KIND = "reveal-mq-workflow-export";
const REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION = 2;

function cloneJson(value, fallback) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function assignVmState(vm, key, value) {
    if (vm && typeof vm.$set === "function") {
        vm.$set(vm, key, value);
    } else if (vm) {
        vm[key] = value;
    }
}

function slugFromQuery(query) {
    return String(query || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}

function defaultWorkflowExportFilename(userQuery) {
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = slugFromQuery(userQuery) || "workflow";
    return `reveal-mq-workflow-${slug}-${stamp}.json`;
}

function hasFactorDataLoaded(workflow) {
    const factorData = workflow && workflow.factorData;
    return !!(
        factorData &&
        typeof factorData === "object" &&
        Object.keys(factorData).length > 0 &&
        workflow.genesAndFactorValuesLoaded
    );
}

function nonErrorWorkflowSteps(steps) {
    return (Array.isArray(steps) ? steps : []).filter((s) => s && s.type !== "error");
}

/** True when an export includes completed or attempted Results / hypothesis generation. */
function hasWorkflowResults(workflow) {
    if (!workflow || typeof workflow !== "object") return false;
    if (workflow.loadComplete) return true;
    if (Array.isArray(workflow.mechanisms) && workflow.mechanisms.length > 0) return true;
    const diag = workflow.mechanismDiagnosticAssessment;
    if (diag && diag.can_generate_hypothesis === false) return true;
    if (workflow.error_mechanisms) return true;
    return false;
}

function hasExportableWorkflowState(vm) {
    if (!vm) return false;
    if (String(vm.userQuery || "").trim()) return true;
    if (vm.searchCriteria) return true;
    if ((vm.multiQueryRoutes || []).length) return true;
    if ((vm.steps || []).some((s) => s && s.id && s.type !== "error")) return true;
    if (vm.factorData && Object.keys(vm.factorData).length) return true;
    return false;
}

function resolvePendingStepGateForExport(vm) {
    if (vm.stepApprovalGateActive && vm.stepApprovalGateStepId) {
        return String(vm.stepApprovalGateStepId);
    }
    if (hasWorkflowResults(vm)) return null;
    if (hasFactorDataLoaded(vm) && !vm.loadComplete && !vm.mechanisms) {
        return "2";
    }
    return null;
}

/**
 * Snapshot REVEAL Multi Query workflow state including Results / hypotheses when present.
 * @param {object} vm - multiQueriesReveal component instance
 */
function collectMultiQueryRevealWorkflowState(vm) {
    return {
        userQuery: String(vm.userQuery || ""),
        searchMode: vm.searchMode || "auto",
        searchCriteria: cloneJson(vm.searchCriteria, null),
        searchCriteriaEditRows: cloneJson(vm.searchCriteriaEditRows, []),
        searchCriteriaEditRowsDefault: cloneJson(vm.searchCriteriaEditRowsDefault, []),
        searchCriteriaExtractionGateDone: !!vm.searchCriteriaExtractionGateDone,
        lastAlternativeQueries: cloneJson(vm.lastAlternativeQueries, []),
        extractionAmbiguityCheck: cloneJson(vm.extractionAmbiguityCheck, null),
        extractionAmbiguityDismissed: !!vm.extractionAmbiguityDismissed,
        multiQueryRoutes: cloneJson(vm.multiQueryRoutes, []),
        multiQueryRouteEditRows: cloneJson(vm.multiQueryRouteEditRows, []),
        multiQueryRouteEditRowsDefault: cloneJson(vm.multiQueryRouteEditRowsDefault, []),
        routeTermsEditAccordionOpen: cloneJson(vm.routeTermsEditAccordionOpen, {}),
        multiQueryRouteResults: cloneJson(vm.multiQueryRouteResults, []),
        multiQueryEvidenceBundles: cloneJson(vm.multiQueryEvidenceBundles, []),
        multiQueryRouteErrors: cloneJson(vm.multiQueryRouteErrors, []),
        lastExplicitUserGenes: cloneJson(vm.lastExplicitUserGenes, []),
        lastGenesOfInterest: cloneJson(vm.lastGenesOfInterest, []),
        lastPhenotypeTerms: cloneJson(vm.lastPhenotypeTerms, []),
        lastMechanismTerms: cloneJson(vm.lastMechanismTerms, []),
        phenotypeDescriptionById: cloneJson(vm.phenotypeDescriptionById, {}),
        lastHybridSearchMeta: cloneJson(vm.lastHybridSearchMeta, {}),
        lastHybridSearchResponse: cloneJson(vm.lastHybridSearchResponse, null),
        lastRunUsedHardConstraint: !!vm.lastRunUsedHardConstraint,
        lastHardConstraintFactorLabelByPair: cloneJson(vm.lastHardConstraintFactorLabelByPair, {}),
        factorData: cloneJson(vm.factorData, {}),
        pairSelectionOverrides: cloneJson(vm.pairSelectionOverrides, {}),
        llmFilteredPairKeysBaseline: cloneJson(vm.llmFilteredPairKeysBaseline, []),
        adHocCoveredRowKeys: cloneJson(vm.adHocCoveredRowKeys, []),
        lastKgTriples: cloneJson(vm.lastKgTriples, []),
        lastFlattenedKG: cloneJson(vm.lastFlattenedKG, null),
        genesAndFactorValuesLoaded: !!vm.genesAndFactorValuesLoaded,
        hypothesisGenerationMode: vm.hypothesisGenerationMode || "strict",
        hypothesisLastRunMode: vm.hypothesisLastRunMode || null,
        loadComplete: !!vm.loadComplete,
        mechanisms: cloneJson(vm.mechanisms, null),
        mechanisms_summary: cloneJson(vm.mechanisms_summary, null),
        mechanismDiagnosticAssessment: cloneJson(vm.mechanismDiagnosticAssessment, null),
        error_mechanisms: !!vm.error_mechanisms,
        error_msg_mechanisms: String(vm.error_msg_mechanisms || ""),
        revealResultsTabUnlocked: !!vm.revealResultsTabUnlocked,
        display_mechanisms: vm.display_mechanisms !== false,
        steps: cloneJson(nonErrorWorkflowSteps(vm.steps), []),
        loadStatus: String(vm.loadStatus || ""),
        pendingStepGate: resolvePendingStepGateForExport(vm),
    };
}

function canExportMultiQueryRevealWorkflow(vm) {
    return hasExportableWorkflowState(vm);
}

function buildMultiQueryRevealExportBundle(vm, { label, filename } = {}) {
    if (!canExportMultiQueryRevealWorkflow(vm)) {
        return null;
    }
    const workflow = collectMultiQueryRevealWorkflowState(vm);
    const exportLabel =
        String(label !== undefined ? label : workflow.userQuery || "").trim() ||
        "REVEAL workflow";
    return {
        bundle: {
            kind: REVEAL_MQ_WORKFLOW_EXPORT_KIND,
            schemaVersion: REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            label: exportLabel,
            workflow,
        },
        filename: userUtils.normalizeExportFilename(
            filename || defaultWorkflowExportFilename(workflow.userQuery)
        ),
    };
}

function workflowPayloadFromImport(record) {
    if (!record || typeof record !== "object") {
        return null;
    }
    if (record.kind === REVEAL_MQ_WORKFLOW_EXPORT_KIND && record.workflow) {
        return record.workflow;
    }
    if (record.workflow && typeof record.workflow === "object") {
        return record.workflow;
    }
    if (
        record.userQuery ||
        record.searchCriteria ||
        record.factorData ||
        (Array.isArray(record.steps) && record.steps.length)
    ) {
        return record;
    }
    return null;
}

function hasImportableWorkflowContent(workflow) {
    if (!workflow || typeof workflow !== "object") return false;
    if (String(workflow.userQuery || "").trim()) return true;
    if (workflow.searchCriteria) return true;
    if ((workflow.multiQueryRoutes || []).length) return true;
    if (workflow.factorData && Object.keys(workflow.factorData).length) return true;
    if ((workflow.steps || []).some((s) => s && s.id && s.type !== "error")) return true;
    return false;
}

function parseMultiQueryRevealWorkflowImport(parsed) {
    const workflow = workflowPayloadFromImport(parsed);
    if (!hasImportableWorkflowContent(workflow)) {
        return null;
    }
    return cloneJson(workflow, {});
}

function parseMultiQueryRevealWorkflowImportFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file selected."));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || ""));
                const workflow = parseMultiQueryRevealWorkflowImport(parsed);
                if (!workflow) {
                    reject(
                        new Error("File is not a valid REVEAL Multi Query workflow export.")
                    );
                    return;
                }
                resolve({
                    workflow,
                    label:
                        String(parsed?.label || workflow.userQuery || "").trim() ||
                        "Imported workflow",
                });
            } catch (e) {
                reject(
                    e?.message === "File is not a valid REVEAL Multi Query workflow export."
                        ? e
                        : new Error("File is not valid JSON.")
                );
            }
        };
        reader.onerror = () => {
            reject(new Error("Could not read the selected file."));
        };
        reader.readAsText(file);
    });
}

async function saveJsonBundle(filename, bundle) {
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    if (
        typeof window !== "undefined" &&
        typeof window.showSaveFilePicker === "function"
    ) {
        try {
            const resolvedFilename = userUtils.normalizeExportFilename(filename);
            const handle = await window.showSaveFilePicker({
                suggestedName: resolvedFilename,
                types: [
                    {
                        description: "JSON",
                        accept: { "application/json": [".json"] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return {
                ok: true,
                filename: handle.name || resolvedFilename,
                usedSavePicker: true,
            };
        } catch (error) {
            if (error?.name === "AbortError") {
                return { ok: false, reason: "cancelled" };
            }
        }
    }

    const resolvedFilename = userUtils.normalizeExportFilename(filename);
    if (typeof document === "undefined") {
        return { ok: false, reason: "no_document" };
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolvedFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return { ok: true, filename: resolvedFilename, usedSavePicker: false };
}

async function exportMultiQueryRevealWorkflow(vm, { label, filename } = {}) {
    const built = buildMultiQueryRevealExportBundle(vm, { label, filename });
    if (!built) {
        return { ok: false, reason: "nothing_to_export" };
    }
    const saveResult = await saveJsonBundle(built.filename, built.bundle);
    if (!saveResult.ok) {
        return saveResult;
    }
    return {
        ok: true,
        label: built.bundle.label,
        filename: saveResult.filename,
        usedSavePicker: saveResult.usedSavePicker,
    };
}

const WORKFLOW_IMPORT_FIELDS = [
    "userQuery",
    "searchMode",
    "searchCriteria",
    "searchCriteriaEditRows",
    "searchCriteriaEditRowsDefault",
    "searchCriteriaExtractionGateDone",
    "lastAlternativeQueries",
    "extractionAmbiguityCheck",
    "extractionAmbiguityDismissed",
    "multiQueryRoutes",
    "multiQueryRouteEditRows",
    "multiQueryRouteEditRowsDefault",
    "routeTermsEditAccordionOpen",
    "multiQueryRouteResults",
    "multiQueryEvidenceBundles",
    "multiQueryRouteErrors",
    "lastExplicitUserGenes",
    "lastGenesOfInterest",
    "lastPhenotypeTerms",
    "lastMechanismTerms",
    "phenotypeDescriptionById",
    "lastHybridSearchMeta",
    "lastHybridSearchResponse",
    "lastRunUsedHardConstraint",
    "lastHardConstraintFactorLabelByPair",
    "factorData",
    "pairSelectionOverrides",
    "llmFilteredPairKeysBaseline",
    "adHocCoveredRowKeys",
    "lastKgTriples",
    "lastFlattenedKG",
    "genesAndFactorValuesLoaded",
    "hypothesisGenerationMode",
    "hypothesisLastRunMode",
    "loadComplete",
    "mechanisms",
    "mechanisms_summary",
    "mechanismDiagnosticAssessment",
    "error_mechanisms",
    "error_msg_mechanisms",
    "revealResultsTabUnlocked",
    "display_mechanisms",
    "steps",
    "loadStatus",
];

function restoreImportedStepGate(vm, workflow) {
    const hasData = hasFactorDataLoaded(workflow);
    const hasResults = hasWorkflowResults(workflow);
    const pending = workflow.pendingStepGate ? String(workflow.pendingStepGate) : null;

    vm.importedWorkflowPendingHypothesisRun = false;
    vm.importedWorkflowPendingResearchRun = false;
    vm.stepApprovalGateActive = false;
    vm.stepApprovalGateStepId = "";
    vm.stepApprovalGateMessage = "";
    vm.stepApprovalGateResolver = null;

    if (hasResults) {
        return;
    }

    if (pending === "1" && !workflow.searchCriteriaExtractionGateDone) {
        vm.stepApprovalGateActive = true;
        vm.stepApprovalGateStepId = "1";
        vm.stepApprovalGateMessage = "Review terms and continue when ready.";
        vm.importedWorkflowPendingResearchRun = true;
        if (typeof vm.pauseStepsElapsedForReview === "function") {
            vm.pauseStepsElapsedForReview();
        }
        return;
    }

    if ((pending === "2" || hasData) && hasData && !vm.mechanisms) {
        vm.stepApprovalGateActive = true;
        vm.stepApprovalGateStepId = "2";
        vm.stepApprovalGateMessage =
            "Knowledge graph is ready. Continue to generate mechanistic hypotheses?";
        vm.importedWorkflowPendingHypothesisRun = true;
        if (typeof vm.pauseStepsElapsedForReview === "function") {
            vm.pauseStepsElapsedForReview();
        }
        if (!vm.loadStatus) {
            vm.setLoadStatus("Waiting for your approval to continue…", true);
        }
    }
}

/**
 * Apply an imported workflow snapshot onto the component (resume at Terms, Data, or Results).
 * @returns {{ pendingStepGate: string|null, label: string, hasData: boolean, hasResults: boolean }}
 */
function applyMultiQueryRevealWorkflowImport(vm, workflow, { label = "" } = {}) {
    if (vm.stepApprovalGateActive && typeof vm.cancelStepGate === "function") {
        vm.cancelStepGate(false);
    }

    assignVmState(vm, "loadComplete", false);
    assignVmState(vm, "mechanisms", null);
    assignVmState(vm, "mechanisms_summary", null);
    assignVmState(vm, "mechanismDiagnosticAssessment", null);
    assignVmState(vm, "hypothesisLastRunMode", null);
    assignVmState(vm, "revealResultsTabUnlocked", false);
    assignVmState(vm, "importedWorkflowPendingHypothesisRun", false);
    assignVmState(vm, "importedWorkflowPendingResearchRun", false);
    assignVmState(vm, "error_mechanisms", false);
    assignVmState(vm, "error_msg_mechanisms", "");
    assignVmState(vm, "loading_search_criteria", false);
    assignVmState(vm, "error_search_criteria", false);
    assignVmState(vm, "error_msg_search_criteria", "");

    WORKFLOW_IMPORT_FIELDS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(workflow, key)) {
            assignVmState(vm, key, cloneJson(workflow[key], vm[key]));
        }
    });

    assignVmState(vm, "steps", nonErrorWorkflowSteps(cloneJson(workflow.steps, vm.steps || [])));

    const hasData = hasFactorDataLoaded(workflow);
    const hasResults = hasWorkflowResults(workflow);
    if (hasResults) {
        assignVmState(vm, "showTab", "results");
    } else if (hasData || workflow.searchCriteriaExtractionGateDone) {
        assignVmState(vm, "showTab", "data");
    } else {
        assignVmState(vm, "showTab", "terms");
    }

    restoreImportedStepGate(vm, workflow);

    const pendingStepGate = workflow.pendingStepGate ? String(workflow.pendingStepGate) : null;
    return {
        pendingStepGate,
        hasData,
        hasResults,
        label: String(label || workflow.userQuery || "").trim() || "Imported workflow",
    };
}

export {
    REVEAL_MQ_WORKFLOW_EXPORT_KIND,
    REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION,
    applyMultiQueryRevealWorkflowImport,
    buildMultiQueryRevealExportBundle,
    canExportMultiQueryRevealWorkflow,
    collectMultiQueryRevealWorkflowState,
    defaultWorkflowExportFilename,
    exportMultiQueryRevealWorkflow,
    hasExportableWorkflowState,
    hasFactorDataLoaded,
    hasWorkflowResults,
    nonErrorWorkflowSteps,
    parseMultiQueryRevealWorkflowImport,
    parseMultiQueryRevealWorkflowImportFile,
    resolvePendingStepGateForExport,
    workflowPayloadFromImport,
};
