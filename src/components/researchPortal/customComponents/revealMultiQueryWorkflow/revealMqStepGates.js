/**
 * Workflow step and approval-gate helpers for Multi Query REVEAL.
 */

const WORKFLOW_STEP_IDS = {
    EXTRACTION: "1",
    DATA: "2",
    HYPOTHESES: "4",
};

function stepsThroughDataStep(steps) {
    return (Array.isArray(steps) ? steps : []).filter(
        (s) => s && s.type !== "error" && (s.id === "1" || s.id === "2")
    );
}

function workflowErrorSteps(steps) {
    return (Array.isArray(steps) ? steps : []).filter((s) => s && s.type === "error");
}

function revealDataSteps(steps) {
    return (Array.isArray(steps) ? steps : []).filter(
        (s) => s && s.type !== "error" && s.id === WORKFLOW_STEP_IDS.DATA
    );
}

function revealExtractionStep(steps) {
    const list = Array.isArray(steps) ? steps : [];
    return list.find((s) => s && s.type !== "error" && s.id === WORKFLOW_STEP_IDS.EXTRACTION) || null;
}

export {
    WORKFLOW_STEP_IDS,
    revealDataSteps,
    revealExtractionStep,
    stepsThroughDataStep,
    workflowErrorSteps,
};
