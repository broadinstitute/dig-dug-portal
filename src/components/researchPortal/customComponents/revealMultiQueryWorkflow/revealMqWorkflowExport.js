import userUtils from "@/utils/userUtils";

const REVEAL_MQ_WORKFLOW_EXPORT_KIND = "reveal-mq-workflow-export";
const REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION = 6;

/** URL / entry mode: gene-set entry (`?genes=`) vs text query (`?query=`). */
const SEARCH_PATH_GENES = "genes";
const SEARCH_PATH_QUERY = "query";

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

function geneSetEntryInputGenes(vmOrWorkflow) {
    const ge = vmOrWorkflow && vmOrWorkflow.geneSetEntry;
    if (!ge || !Array.isArray(ge.inputGenes)) return [];
    return ge.inputGenes.map((g) => String(g || "").trim()).filter(Boolean);
}

function resolveSearchPath(vmOrWorkflow) {
    const explicit = vmOrWorkflow && vmOrWorkflow.searchPath;
    if (explicit === SEARCH_PATH_GENES || explicit === SEARCH_PATH_QUERY) return explicit;
    if (geneSetEntryInputGenes(vmOrWorkflow).length) return SEARCH_PATH_GENES;
    return SEARCH_PATH_QUERY;
}

function collectGeneSetEntryForExport(vm) {
    const genes = geneSetEntryInputGenes(vm);
    if (!genes.length) return null;
    const ge = vm.geneSetEntry || {};
    return {
        inputGenes: cloneJson(genes, []),
        researchIntention: String(ge.researchIntention || ""),
        status: ge.status != null ? String(ge.status) : "ready",
    };
}

function emptyGeneSetEntryImportState() {
    return {
        status: "idle",
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

function defaultWorkflowExportFilename(userQuery, searchPath, geneSetEntry) {
    const stamp = new Date().toISOString().slice(0, 10);
    let slug = slugFromQuery(userQuery);
    if (!slug && searchPath === SEARCH_PATH_GENES) {
        const genes = geneSetEntry && Array.isArray(geneSetEntry.inputGenes) ? geneSetEntry.inputGenes : [];
        slug = slugFromQuery(genes.slice(0, 6).join("-")) || "genes";
    }
    if (!slug) slug = "workflow";
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
    if (geneSetEntryInputGenes(vm).length) return true;
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
    const searchPath = resolveSearchPath(vm);
    const geneSetEntry = collectGeneSetEntryForExport(vm);
    return {
        userQuery: String(vm.userQuery || ""),
        searchPath,
        geneSetEntry,
        searchMode: vm.searchMode || "auto",
        searchCriteria: cloneJson(vm.searchCriteria, null),
        searchCriteriaEditRows: cloneJson(vm.searchCriteriaEditRows, []),
        searchCriteriaEditRowsDefault: cloneJson(vm.searchCriteriaEditRowsDefault, []),
        searchCriteriaExtractionGateDone: !!vm.searchCriteriaExtractionGateDone,
        lastAlternativeQueries: cloneJson(vm.lastAlternativeQueries, []),
        extractionAmbiguityCheck: cloneJson(vm.extractionAmbiguityCheck, null),
        extractionAmbiguityDismissed: !!vm.extractionAmbiguityDismissed,
        multiQueryRoutes: cloneJson(vm.multiQueryRoutes, []),
        selectedRouteId: vm.selectedRouteId != null ? String(vm.selectedRouteId) : "",
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
        heatmapSelectedNodes: cloneJson(vm.heatmapSelectedNodes, []),
        selectedNodesExplanations: cloneJson(vm.selectedNodesExplanations, []),
        selectedNodesProvenanceRuns: cloneJson(vm.selectedNodesProvenanceRuns, []),
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
    const genesLabel =
        workflow.searchPath === SEARCH_PATH_GENES && workflow.geneSetEntry
            ? `Genes: ${(workflow.geneSetEntry.inputGenes || []).slice(0, 8).join(", ")}`
            : "";
    const preferred =
        label !== undefined && String(label).trim() !== ""
            ? String(label).trim()
            : String(workflow.userQuery || "").trim() || genesLabel;
    const exportLabel = preferred || "REVEAL workflow";
    return {
        bundle: {
            kind: REVEAL_MQ_WORKFLOW_EXPORT_KIND,
            schemaVersion: REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            label: exportLabel,
            workflow,
        },
        filename: userUtils.normalizeExportFilename(
            filename ||
                defaultWorkflowExportFilename(
                    workflow.userQuery,
                    workflow.searchPath,
                    workflow.geneSetEntry
                )
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
        record.searchPath === SEARCH_PATH_GENES ||
        geneSetEntryInputGenes(record).length ||
        (Array.isArray(record.steps) && record.steps.length)
    ) {
        return record;
    }
    return null;
}

function hasImportableWorkflowContent(workflow) {
    if (!workflow || typeof workflow !== "object") return false;
    if (String(workflow.userQuery || "").trim()) return true;
    if (geneSetEntryInputGenes(workflow).length) return true;
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
                const genesLabel =
                    resolveSearchPath(workflow) === SEARCH_PATH_GENES
                        ? `Genes: ${geneSetEntryInputGenes(workflow).slice(0, 8).join(", ")}`
                        : "";
                resolve({
                    workflow,
                    label:
                        String(parsed?.label || workflow.userQuery || genesLabel || "").trim() ||
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
    "searchPath",
    "searchMode",
    "searchCriteria",
    "searchCriteriaEditRows",
    "searchCriteriaEditRowsDefault",
    "searchCriteriaExtractionGateDone",
    "lastAlternativeQueries",
    "extractionAmbiguityCheck",
    "extractionAmbiguityDismissed",
    "multiQueryRoutes",
    "selectedRouteId",
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
    "heatmapSelectedNodes",
    "selectedNodesExplanations",
    "selectedNodesProvenanceRuns",
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

/**
 * Sync browser URL (`?genes=` / `?query=`) to the imported search path.
 * @param {object} workflow
 * @param {(map: object) => void} [setKeyParams]
 */
function applySearchPathToUrl(workflow, setKeyParams) {
    const apply =
        typeof setKeyParams === "function"
            ? setKeyParams
            : (map) => {
                  try {
                      const keyParams = require("@/utils/keyParams").default;
                      if (keyParams && typeof keyParams.set === "function") keyParams.set(map);
                  } catch (e) {
                      /* ignore missing keyParams in non-browser tests */
                  }
              };
    const path = resolveSearchPath(workflow);
    if (path === SEARCH_PATH_GENES) {
        const genes = geneSetEntryInputGenes(workflow);
        apply({
            genes: genes.length ? genes.join(",") : null,
            query: null,
            geneSetEntryFail: null,
        });
        return path;
    }
    const q = String(workflow.userQuery || "").trim();
    apply({
        query: q || null,
        genes: null,
        geneSetEntryFail: null,
    });
    return SEARCH_PATH_QUERY;
}

function restoreGeneSetEntryFromImport(vm, workflow) {
    const path = resolveSearchPath(workflow);
    if (path === SEARCH_PATH_GENES) {
        const imported = workflow.geneSetEntry && typeof workflow.geneSetEntry === "object" ? workflow.geneSetEntry : {};
        const genes = geneSetEntryInputGenes(workflow);
        assignVmState(vm, "geneSetEntry", {
            ...emptyGeneSetEntryImportState(),
            ...cloneJson(imported, {}),
            inputGenes: genes,
            status: imported.status || (genes.length ? "ready" : "idle"),
            offerMainPathFallback: false,
            failureReason: null,
            progress: { message: "", detail: "" },
        });
        assignVmState(vm, "geneSetEntryProgressDismissed", true);
        return;
    }
    assignVmState(vm, "geneSetEntry", emptyGeneSetEntryImportState());
    assignVmState(vm, "geneSetEntryProgressDismissed", true);
}

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
 * Restores `searchPath` / `geneSetEntry` and updates the page URL (`?genes=` or `?query=`).
 * @returns {{ pendingStepGate: string|null, label: string, hasData: boolean, hasResults: boolean, searchPath: string }}
 */
function applyMultiQueryRevealWorkflowImport(vm, workflow, { label = "", setKeyParams } = {}) {
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

    if (
        !(vm.selectedRouteId != null && String(vm.selectedRouteId).trim()) &&
        Array.isArray(vm.multiQueryRoutes) &&
        vm.multiQueryRoutes.length
    ) {
        const ranked = vm.multiQueryRoutes
            .slice()
            .sort((a, b) => Number((a && a.fit_rank) || 99) - Number((b && b.fit_rank) || 99));
        assignVmState(vm, "selectedRouteId", ranked[0] && ranked[0].route_id ? String(ranked[0].route_id) : "");
    }

    assignVmState(vm, "steps", nonErrorWorkflowSteps(cloneJson(workflow.steps, vm.steps || [])));
    restoreGeneSetEntryFromImport(vm, workflow);
    const searchPath = applySearchPathToUrl(workflow, setKeyParams);
    assignVmState(vm, "searchPath", searchPath);

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
    const genesLabel =
        searchPath === SEARCH_PATH_GENES
            ? `Genes: ${geneSetEntryInputGenes(workflow).slice(0, 8).join(", ")}`
            : "";
    return {
        pendingStepGate,
        hasData,
        hasResults,
        searchPath,
        label:
            String(label || workflow.userQuery || genesLabel || "").trim() || "Imported workflow",
    };
}

export {
    REVEAL_MQ_WORKFLOW_EXPORT_KIND,
    REVEAL_MQ_WORKFLOW_EXPORT_SCHEMA_VERSION,
    SEARCH_PATH_GENES,
    SEARCH_PATH_QUERY,
    applyMultiQueryRevealWorkflowImport,
    applySearchPathToUrl,
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
    resolveSearchPath,
    workflowPayloadFromImport,
};
