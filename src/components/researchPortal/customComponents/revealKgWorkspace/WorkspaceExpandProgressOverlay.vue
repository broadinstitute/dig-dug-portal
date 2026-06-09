<template>
    <div
        v-if="open"
        class="wkb-expand-progress-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        aria-busy="true"
        :aria-label="message || 'Expanding graph'"
    >
        <div class="wkb-expand-progress-card" :class="{ 'has-batches': hasBatches }">
            <span class="wkb-expand-progress-spinner" aria-hidden="true" />
            <p class="wkb-expand-progress-message">{{ message || "Expanding graph…" }}</p>
            <details v-if="hasBatches" class="wkb-expand-progress-batches" open>
                <summary class="wkb-expand-progress-batches-summary">
                    Neighbor classification batches
                </summary>
                <div class="wkb-expand-progress-batches-body">
                    <WorkspaceExpandBatchesContent :progress="progress" variant="overlay" />
                </div>
            </details>
            <p class="wkb-expand-progress-note">Graph changes are paused while expansion runs.</p>
        </div>
    </div>
</template>

<script>
import WorkspaceExpandBatchesContent from "./WorkspaceExpandBatchesContent.vue";

export default {
    name: "WorkspaceExpandProgressOverlay",
    components: {
        WorkspaceExpandBatchesContent,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        message: {
            type: String,
            default: "",
        },
        progress: {
            type: Object,
            default: null,
        },
    },
    computed: {
        hasBatches() {
            return (this.progress?.batches || []).length > 0;
        },
    },
};
</script>

<style scoped>
.wkb-expand-progress-overlay {
    position: absolute;
    inset: 0;
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(246, 245, 242, 0.72);
    backdrop-filter: blur(2px);
    pointer-events: all;
}

.wkb-expand-progress-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: min(420px, calc(100% - 32px));
    max-width: min(520px, calc(100% - 32px));
    padding: 22px 28px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 12px 40px rgba(20, 22, 30, 0.18);
    text-align: center;
}

.wkb-expand-progress-card.has-batches {
    width: min(520px, calc(100% - 32px));
    align-items: stretch;
}

.wkb-expand-progress-card.has-batches .wkb-expand-progress-spinner {
    align-self: center;
}

.wkb-expand-progress-card.has-batches .wkb-expand-progress-message,
.wkb-expand-progress-card.has-batches .wkb-expand-progress-note {
    align-self: center;
    text-align: center;
}

.wkb-expand-progress-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(224, 123, 57, 0.2);
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-expand-progress-spin 0.75s linear infinite;
}

@keyframes wkb-expand-progress-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-expand-progress-message {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-expand-progress-batches {
    width: 100%;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #faf9f7;
    text-align: left;
}

.wkb-expand-progress-batches-summary {
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.wkb-expand-progress-batches-body {
    padding: 0 12px 12px;
}

.wkb-expand-progress-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
