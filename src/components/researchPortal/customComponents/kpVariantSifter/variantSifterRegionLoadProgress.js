export const VKS_REGION_LOAD_STATUS = {
    PENDING: "pending",
    LOADING: "loading",
    DONE: "done",
    FAILED: "failed",
};

export const VKS_REGION_LOAD_STEPS = [
    { id: "associations", label: "Association data" },
    { id: "genes", label: "Genes track" },
    { id: "recomb", label: "Recombination overlay" },
    { id: "credibleSets", label: "Credible sets list" },
    { id: "globalEnrichment", label: "Global enrichment" },
    { id: "ld", label: "LD scores" },
];

/**
 * Steps that additive phenotype loads currently drive.
 * Remaining steps stay pending in the panel until marked done/deferred.
 */
export const VKS_PHENOTYPE_SERIES_LOAD_STEPS = [
    "associations",
    "ld",
    "credibleSets",
    "globalEnrichment",
];

/**
 * Steps reserved for future additive-phenotype companion loads.
 * Marked done when finishing a phenotype-series progress cycle for now.
 */
export const VKS_PHENOTYPE_SERIES_DEFERRED_STEPS = VKS_REGION_LOAD_STEPS.map(
    (step) => step.id
).filter((id) => !VKS_PHENOTYPE_SERIES_LOAD_STEPS.includes(id));

export function emptyRegionLoadProgress() {
    return {
        active: false,
        steps: VKS_REGION_LOAD_STEPS.map((step) => ({
            ...step,
            status: VKS_REGION_LOAD_STATUS.PENDING,
        })),
    };
}

export function startRegionLoadProgress() {
    return {
        active: true,
        steps: VKS_REGION_LOAD_STEPS.map((step) => ({
            ...step,
            status: VKS_REGION_LOAD_STATUS.PENDING,
        })),
    };
}

export function patchRegionLoadStep(progress, stepId, status) {
    return {
        ...progress,
        steps: progress.steps.map((step) =>
            step.id === stepId ? { ...step, status } : step
        ),
    };
}

export function regionLoadProgressSettled(progress) {
    return progress.steps.every(
        (step) =>
            step.status === VKS_REGION_LOAD_STATUS.DONE ||
            step.status === VKS_REGION_LOAD_STATUS.FAILED
    );
}

export function regionLoadProgressHasFailure(progress) {
    return progress.steps.some(
        (step) => step.status === VKS_REGION_LOAD_STATUS.FAILED
    );
}

export function regionLoadProgressCanAutoDismiss(progress) {
    return (
        regionLoadProgressSettled(progress) &&
        !regionLoadProgressHasFailure(progress)
    );
}

export function finishRegionLoadProgress(progress) {
    return {
        ...progress,
        active: false,
    };
}

/** Mark still-pending deferred companion steps as done for this cycle. */
export function completeDeferredPhenotypeSeriesSteps(progress) {
    let next = progress;
    VKS_PHENOTYPE_SERIES_DEFERRED_STEPS.forEach((stepId) => {
        const step = next.steps.find((entry) => entry.id === stepId);
        if (step?.status === VKS_REGION_LOAD_STATUS.PENDING) {
            next = patchRegionLoadStep(next, stepId, VKS_REGION_LOAD_STATUS.DONE);
        }
    });
    return next;
}
