/** Structured progress updates for toolbar expand runs. */

export const EXPANSION_BATCH_SIZE = 20;

export const EXPANSION_BATCH_DESCRIPTION =
    "Each batch is a chunk of 20 ranked neighbor nodes fetched from the connections API, sent to the AI to check your intent / known-novel filters.";

export const EXPANSION_BATCH_EARLY_STOP =
    "Expansion stops once enough neighbors pass your Count setting. Remaining batches are skipped—you do not need to run through every batch to finish.";

const TYPE_LABELS = {
    gene: "genes",
    trait: "traits",
    factor: "mechanisms",
    gene_set: "gene sets",
};

export function formatTypeCountSummary(typeCounts = {}) {
    const entries = Object.entries(typeCounts).filter(([, count]) => count > 0);
    if (!entries.length) {
        return "";
    }
    return entries
        .sort((left, right) => right[1] - left[1])
        .map(([type, count]) => `${count} ${TYPE_LABELS[type] || type}`)
        .join(", ");
}

export function summarizeBatchCandidates(batchItems = []) {
    const typeCounts = {};
    const previewLabels = [];

    for (const item of batchItems) {
        const candidate = item?.candidate || {};
        const type = String(candidate.node_type || candidate.type || "").toLowerCase() || "other";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        if (previewLabels.length < 3) {
            const label = String(candidate.label || "").trim();
            if (label) {
                previewLabels.push(label);
            }
        }
    }

    const candidateCount = batchItems.length;
    const typeSummary = formatTypeCountSummary(typeCounts);

    return {
        candidateCount,
        typeCounts,
        typeSummary,
        previewLabels,
        detail: buildBatchDetail({
            candidateCount,
            typeSummary,
            previewLabels,
            status: "pending",
        }),
    };
}

export function buildBatchDetail({
    candidateCount = 0,
    typeSummary = "",
    previewLabels = [],
    matchedCount = null,
    status = "pending",
} = {}) {
    const countPart = candidateCount
        ? `${candidateCount} candidate${candidateCount === 1 ? "" : "s"}`
        : "";

    if (status === "skipped") {
        return "Skipped — enough neighbors already matched your filters";
    }

    if (status === "complete" && matchedCount !== null && matchedCount !== undefined) {
        const matchedPart = `${matchedCount} passed filter${matchedCount === 1 ? "" : "s"} in this batch`;
        const typePart = typeSummary ? ` · ${typeSummary}` : "";
        return `${matchedPart} · ${countPart}${typePart}`;
    }

    const typePart = typeSummary ? ` · ${typeSummary}` : "";
    const preview =
        previewLabels.length > 0
            ? ` · e.g. ${previewLabels.slice(0, 2).join(", ")}${previewLabels.length > 2 ? "…" : ""}`
            : "";
    return `${countPart}${typePart}${preview}`.trim();
}

export function createExpansionBatchList(totalBatches = 0, candidates = [], batchSize = 20) {
    const count = Math.max(0, Number(totalBatches) || 0);
    return Array.from({ length: count }, (_, index) => {
        const start = index * batchSize;
        const slice = candidates.slice(start, start + batchSize);
        return {
            index: index + 1,
            status: "pending",
            ...summarizeBatchCandidates(slice),
        };
    });
}

export function markExpansionBatchRunning(batches = [], batchIndex = 0) {
    return (batches || []).map((batch) => {
        if (batch.index === batchIndex) {
            return { ...batch, status: "running" };
        }
        if (batch.index < batchIndex) {
            return { ...batch, status: "complete" };
        }
        return batch;
    });
}

export function applyBatchCompletionSummary(batch, matchedCount) {
    return {
        ...batch,
        matchedCount,
        detail: buildBatchDetail({
            candidateCount: batch.candidateCount,
            typeSummary: batch.typeSummary,
            previewLabels: batch.previewLabels,
            matchedCount,
            status: "complete",
        }),
    };
}

export function markExpansionBatchComplete(batches = [], batchIndex = 0, { matchedCount } = {}) {
    return (batches || []).map((batch) => {
        if (batch.index < batchIndex) {
            return { ...batch, status: "complete" };
        }
        if (batch.index === batchIndex) {
            return applyBatchCompletionSummary({ ...batch, status: "complete" }, matchedCount);
        }
        return batch;
    });
}

export function markExpansionBatchesSkipped(
    batches = [],
    firstSkippedIndex = Number.MAX_SAFE_INTEGER,
    reason = ""
) {
    const skipDetail = buildBatchDetail({ status: "skipped" });
    return (batches || []).map((batch) => {
        if (batch.index >= firstSkippedIndex && batch.status === "pending") {
            return {
                ...batch,
                status: "skipped",
                detail: reason || skipDetail,
            };
        }
        return batch;
    });
}

export function expansionBatchRangeLabel(batch = {}, batchSize = EXPANSION_BATCH_SIZE) {
    const index = Number(batch.index) || 0;
    if (!index) {
        return "Batch";
    }
    const start = (index - 1) * batchSize + 1;
    const end = start + (Number(batch.candidateCount) || batchSize) - 1;
    return `Neighbors ${start}–${end}`;
}

export function buildClassifyProgressMeta({
    matchedNeighborCount = 0,
    targetNeighborCount = 0,
    classifiedCandidateCount = 0,
    totalCandidateCount = 0,
    stoppedEarly = false,
} = {}) {
    return {
        matchedNeighborCount: Number(matchedNeighborCount) || 0,
        targetNeighborCount: Number(targetNeighborCount) || 0,
        classifiedCandidateCount: Number(classifiedCandidateCount) || 0,
        totalCandidateCount: Number(totalCandidateCount) || 0,
        stoppedEarly: Boolean(stoppedEarly),
    };
}

export function emptyExpandBatchProgress(message = "") {
    return {
        message,
        stage: "",
        currentBatch: 0,
        totalBatches: 0,
        batches: [],
        matchedNeighborCount: 0,
        targetNeighborCount: 0,
        classifiedCandidateCount: 0,
        totalCandidateCount: 0,
        stoppedEarly: false,
    };
}

export function normalizeExpandProgressUpdate(update = {}) {
    if (typeof update === "string") {
        return emptyExpandBatchProgress(update);
    }
    return {
        message: String(update.message || ""),
        stage: String(update.stage || ""),
        currentBatch: Number(update.currentBatch) || 0,
        totalBatches: Number(update.totalBatches) || 0,
        batches: Array.isArray(update.batches) ? update.batches : [],
        matchedNeighborCount: Number(update.matchedNeighborCount) || 0,
        targetNeighborCount: Number(update.targetNeighborCount) || 0,
        classifiedCandidateCount: Number(update.classifiedCandidateCount) || 0,
        totalCandidateCount: Number(update.totalCandidateCount) || 0,
        stoppedEarly: Boolean(update.stoppedEarly),
    };
}
