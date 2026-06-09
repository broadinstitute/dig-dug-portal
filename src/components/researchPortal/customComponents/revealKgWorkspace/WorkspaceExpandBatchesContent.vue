<template>
    <div class="wkb-expand-batches-content" :class="`is-${variant}`">
        <p v-if="!progress?.message && !hasBatches" class="wkb-expand-batches-empty">
            Neighbor classification batches appear when expansion uses intent or known/novel filters.
        </p>
        <p v-else-if="progress?.message && !hasBatches" class="wkb-expand-batches-status">
            {{ progress.message }}
        </p>
        <template v-else>
            <p
                v-if="neighborGoalSummary"
                class="wkb-expand-batches-goal"
                role="status"
            >
                {{ neighborGoalSummary }}
            </p>
            <p v-if="progress?.message" class="wkb-expand-batches-status" role="status">
                {{ progress.message }}
            </p>
            <div
                v-if="showProgressBar"
                class="wkb-expand-batches-progress"
                role="progressbar"
                :aria-valuenow="progressValue"
                :aria-valuemin="0"
                :aria-valuemax="progressMax"
                :aria-label="progressAriaLabel"
            >
                <div
                    class="wkb-expand-batches-progress-bar"
                    :style="{ width: `${progressPercent}%` }"
                />
            </div>
            <div class="wkb-expand-batches-guidance">
                <p class="wkb-expand-batches-intro">{{ batchDescription }}</p>
                <p class="wkb-expand-batches-intro wkb-expand-batches-termination">
                    {{ batchTerminationNote }}
                </p>
            </div>
            <ul class="wkb-expand-batches-list" aria-label="Neighbor classification batches">
                <li
                    v-for="batch in progress.batches"
                    :key="batch.index"
                    class="wkb-expand-batches-item"
                    :class="`is-${batch.status}`"
                >
                    <span class="wkb-expand-batches-marker" aria-hidden="true">
                        <span v-if="batch.status === 'running'" class="wkb-expand-batches-spinner" />
                        <span v-else-if="batch.status === 'complete'">✓</span>
                        <span v-else-if="batch.status === 'skipped'">–</span>
                        <span v-else>•</span>
                    </span>
                    <div class="wkb-expand-batches-copy">
                        <span class="wkb-expand-batches-label">
                            {{ batchRangeLabel(batch) }}
                        </span>
                        <span v-if="batch.detail" class="wkb-expand-batches-detail">
                            {{ batch.detail }}
                        </span>
                    </div>
                    <span class="wkb-expand-batches-state">{{
                        batchStatusLabel(batch.status)
                    }}</span>
                </li>
            </ul>
        </template>
    </div>
</template>

<script>
import {
    EXPANSION_BATCH_DESCRIPTION,
    EXPANSION_BATCH_EARLY_STOP,
    EXPANSION_BATCH_SIZE,
    expansionBatchRangeLabel,
} from "./revealKgExpandProgressUtils.js";

export default {
    name: "WorkspaceExpandBatchesContent",
    props: {
        progress: {
            type: Object,
            default: null,
        },
        variant: {
            type: String,
            default: "panel",
        },
    },
    computed: {
        hasBatches() {
            return (this.progress?.batches || []).length > 0;
        },
        batchDescription() {
            return EXPANSION_BATCH_DESCRIPTION;
        },
        batchTerminationNote() {
            const limit = this.progress?.targetNeighborCount;
            if (!limit) {
                return EXPANSION_BATCH_EARLY_STOP;
            }
            return `Expansion stops once ${limit} neighbor${limit === 1 ? "" : "s"} pass your filters (Count: ${limit}). Remaining batches are skipped—you do not need to run through every batch to finish.`;
        },
        neighborGoalSummary() {
            const target = this.progress?.targetNeighborCount;
            if (!target) {
                return "";
            }
            const matched = Math.min(
                this.progress?.matchedNeighborCount || 0,
                target
            );
            const classified = this.progress?.classifiedCandidateCount || 0;
            const total = this.progress?.totalCandidateCount || 0;
            let summary = `${matched} of ${target} neighbor${target === 1 ? "" : "s"} matched so far`;
            if (total > 0) {
                summary += ` · ${classified} of ${total} candidates classified`;
            }
            if (this.progress?.stoppedEarly) {
                summary += " · stopping early";
            }
            return summary;
        },
        completedBatchCount() {
            return (this.progress?.batches || []).filter((batch) => batch.status === "complete")
                .length;
        },
        showProgressBar() {
            return (
                this.progress?.targetNeighborCount > 0 ||
                this.progress?.totalBatches > 0
            );
        },
        progressMax() {
            if (this.progress?.targetNeighborCount > 0) {
                return this.progress.targetNeighborCount;
            }
            return this.progress?.totalBatches || 0;
        },
        progressValue() {
            if (this.progress?.targetNeighborCount > 0) {
                return Math.min(
                    this.progress?.matchedNeighborCount || 0,
                    this.progress.targetNeighborCount
                );
            }
            return this.completedBatchCount;
        },
        progressPercent() {
            if (!this.progressMax) {
                return 0;
            }
            return Math.round((this.progressValue / this.progressMax) * 100);
        },
        progressAriaLabel() {
            if (this.progress?.targetNeighborCount > 0) {
                return `${this.progressValue} of ${this.progressMax} neighbors matched`;
            }
            return `Neighbor batches ${this.completedBatchCount} of ${this.progressMax} complete`;
        },
    },
    methods: {
        batchRangeLabel(batch) {
            return expansionBatchRangeLabel(batch, EXPANSION_BATCH_SIZE);
        },
        batchStatusLabel(status) {
            if (status === "running") {
                return "Running";
            }
            if (status === "complete") {
                return "Complete";
            }
            if (status === "skipped") {
                return "Skipped";
            }
            return "Pending";
        },
    },
};
</script>

<style scoped>
.wkb-expand-batches-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.wkb-expand-batches-content.is-overlay {
    text-align: left;
}

.wkb-expand-batches-empty,
.wkb-expand-batches-status,
.wkb-expand-batches-intro,
.wkb-expand-batches-goal {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-batches-guidance {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 2px;
}

.wkb-expand-batches-intro {
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-batches-termination {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-batches-goal {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-expand-batches-content.is-overlay .wkb-expand-batches-status {
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-batches-progress {
    height: 6px;
    border-radius: 999px;
    background: #e8e3da;
    overflow: hidden;
}

.wkb-expand-batches-progress-bar {
    height: 100%;
    border-radius: inherit;
    background: var(--cfde-orange, #e07b39);
    transition: width 0.2s ease;
}

.wkb-expand-batches-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow: auto;
}

.wkb-expand-batches-item {
    display: grid;
    grid-template-columns: 18px 1fr auto;
    align-items: start;
    gap: 8px;
    font-size: 12px;
}

.wkb-expand-batches-item.is-skipped {
    opacity: 0.72;
}

.wkb-expand-batches-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-expand-batches-item.is-running .wkb-expand-batches-marker,
.wkb-expand-batches-item.is-complete .wkb-expand-batches-marker {
    color: var(--cfde-orange, #e07b39);
}

.wkb-expand-batches-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.wkb-expand-batches-label {
    color: var(--cfde-ink, #33363d);
    font-weight: 600;
}

.wkb-expand-batches-detail {
    color: var(--cfde-muted, #6b6b6b);
    line-height: 1.4;
    word-break: break-word;
}

.wkb-expand-batches-state {
    color: var(--cfde-muted, #6b6b6b);
    white-space: nowrap;
    padding-top: 1px;
}

.wkb-expand-batches-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(224, 123, 57, 0.2);
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-expand-batches-spin 0.75s linear infinite;
}

@keyframes wkb-expand-batches-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
