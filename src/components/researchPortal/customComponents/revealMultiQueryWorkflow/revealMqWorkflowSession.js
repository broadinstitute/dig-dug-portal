/**
 * Default workflow session shape for Multi Query REVEAL.
 * The shell (multiQueriesReveal.vue) owns this state; panels receive slices as props.
 */

function cloneJson(value, fallback) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return fallback;
    }
}

function createEmptyWorkflowSession() {
    return {
        userQuery: "",
        searchMode: "auto",
        searchCriteria: null,
        searchCriteriaEditRows: [],
        searchCriteriaEditRowsDefault: [],
        searchCriteriaExtractionGateDone: false,
        lastAlternativeQueries: [],
        extractionAmbiguityCheck: null,
        extractionAmbiguityDismissed: false,
        multiQueryRoutes: [],
        multiQueryRouteEditRows: [],
        multiQueryRouteEditRowsDefault: [],
        routeTermsEditAccordionOpen: {},
        multiQueryRouteResults: [],
        multiQueryEvidenceBundles: [],
        multiQueryRouteErrors: [],
        lastExplicitUserGenes: [],
        lastGenesOfInterest: [],
        lastPhenotypeTerms: [],
        lastMechanismTerms: [],
        phenotypeDescriptionById: {},
        lastHybridSearchMeta: {},
        lastHybridSearchResponse: null,
        lastRunUsedHardConstraint: false,
        lastHardConstraintFactorLabelByPair: {},
        factorData: {},
        pairSelectionOverrides: {},
        llmFilteredPairKeysBaseline: [],
        adHocCoveredRowKeys: [],
        lastKgTriples: [],
        lastFlattenedKG: null,
        genesAndFactorValuesLoaded: false,
        steps: [],
        loadStatus: "",
        loadComplete: false,
        showTab: "terms",
        revealResultsTabUnlocked: false,
        stepApprovalGateActive: false,
        stepApprovalGateStepId: "",
        stepApprovalGateMessage: "",
        mechanisms: null,
        mechanisms_summary: null,
        mechanismDiagnosticAssessment: null,
        workflowRunId: 0,
        workflowVisualKey: 0,
    };
}

function workflowPhaseFromSession(session = {}) {
    if (session.mechanisms && session.mechanisms.length) return "results";
    if (session.genesAndFactorValuesLoaded && session.factorData && Object.keys(session.factorData).length) {
        return "data";
    }
    if (session.searchCriteriaExtractionGateDone || (session.multiQueryRoutes || []).length) {
        return "extraction_complete";
    }
    if ((session.steps || []).some((s) => s && s.id === "1")) return "extraction";
    if (String(session.userQuery || "").trim()) return "query";
    return "empty";
}

function cloneWorkflowSession(session) {
    return cloneJson(session, createEmptyWorkflowSession());
}

export {
    cloneWorkflowSession,
    createEmptyWorkflowSession,
    workflowPhaseFromSession,
};
