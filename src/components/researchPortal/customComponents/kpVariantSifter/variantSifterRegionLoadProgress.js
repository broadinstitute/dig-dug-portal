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
