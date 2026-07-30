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

function revealHypothesisStep(steps) {
    const list = Array.isArray(steps) ? steps : [];
    return list.find((s) => s && s.id === WORKFLOW_STEP_IDS.HYPOTHESES) || null;
}

/**
 * Upsert a step (and optional substep) into `vm.steps`, toggling the elapsed-time interval timer.
 * Vue-reactivity-sensitive (mutates the `steps` array/objects in place) -- kept alongside the
 * step-id constants it operates on rather than in a general orchestration-shared module.
 */
function applyStepUpdate(vm, step, toggleTimer = false) {
    if (step.type === "error") {
        vm.steps.push({
            type: step.type,
            title: step.title,
        });
        if (vm.stepsTimer) {
            clearInterval(vm.stepsTimer);
            vm.stepsTimer = null;
            vm.now = now;
        }
        return;
    }

    const ID = step.id;
    if (!ID) {
        return;
    }

    const now = Date.now();
    if (toggleTimer) {
        if (vm.steps?.length === 0) {
            //start vm.stepsTimer
            vm.stepsTime = now;
            vm.stepsTimer = setInterval(() => {
                vm.now = Date.now();
            }, 500);
        } else {
            //stop vm.stepsTimer
            clearInterval(vm.stepsTimer);
            vm.stepsTimer = null;
            vm.now = now;
        }
    }

    let IDidx = vm.steps.findIndex((o) => o.id === ID);
    if (IDidx === -1) {
        vm.steps.push({
            id: ID,
            title: step.title,
            substeps: [],
            expanded: false,
            timeStart: now,
            time: null,
        });
        IDidx = vm.steps.length - 1;

        if (vm.stepsTimer && vm.steps.length > 1) {
            const prev = vm.steps[IDidx - 1];
            prev.time = now - prev.timeStart;
        }
    }
    if (step.substep) {
        const sID = step.substep.id;
        if (!sID) {
            return;
        }
        const sIDidx = vm.steps[IDidx].substeps.findIndex((o) => o.id === sID);
        if (sIDidx === -1) {
            vm.steps[IDidx].substeps.push({
                id: sID,
                title: step.substep.title,
                result: step.substep.result,
                expanded: false,
            });
        } else {
            if (step.substep.title != null) {
                vm.steps[IDidx].substeps[sIDidx].title = step.substep.title;
            }
            if (Object.prototype.hasOwnProperty.call(step.substep, "result")) {
                vm.steps[IDidx].substeps[sIDidx].result = step.substep.result;
            }
        }
    }
}

export {
    applyStepUpdate,
    WORKFLOW_STEP_IDS,
    revealDataSteps,
    revealExtractionStep,
    revealHypothesisStep,
    stepsThroughDataStep,
    workflowErrorSteps,
};
