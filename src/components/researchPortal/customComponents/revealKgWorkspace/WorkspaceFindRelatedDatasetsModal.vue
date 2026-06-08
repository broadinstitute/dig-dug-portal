<template>
    <div
        v-if="open"
        class="wkb-datasets-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-datasets-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-datasets-title"
            @click.stop
        >
            <header class="wkb-datasets-head">
                <div class="wkb-datasets-head-row">
                    <h2 id="wkb-datasets-title">Find related datasets</h2>
                    <button
                        type="button"
                        class="wkb-datasets-close"
                        aria-label="Close"
                        :disabled="loading"
                        @click="$emit('close')"
                    >
                        &times;
                    </button>
                </div>
                <p class="wkb-datasets-intro">
                    Select genes on the canvas, then find CFDE gene sets linked to them.
                    Results include overlap and enrichment-style scores for the top matches.
                </p>
            </header>

            <div class="wkb-datasets-body">
                <p v-if="!selectedGeneCount" class="wkb-datasets-empty">
                    Mark one or more genes as selected on the canvas before finding related
                    datasets.
                </p>

                <template v-else>
                    <p class="wkb-datasets-helper">
                        Using {{ selectedGeneCount }} selected gene{{
                            selectedGeneCount === 1 ? "" : "s"
                        }}
                        for CFDE gene-set search.
                    </p>

                    <section v-if="resultRun" class="wkb-datasets-results">
                        <WorkspaceCfdeDatasetRunCard
                            :run="resultRun"
                            :current-active-set-key="currentActiveSetKey"
                            :canvas-graph-node-ids="canvasGraphNodeIds"
                            :loading="loading"
                            :graph-busy="graphBusy"
                            @refresh="$emit('search')"
                            @add-gene-set="$emit('add-gene-set', $event)"
                            @remove-gene-set="$emit('remove-gene-set', $event)"
                        />
                    </section>
                </template>
            </div>

            <div
                v-if="selectedGeneCount && (showSearchForm || resultRun)"
                class="wkb-datasets-actions"
            >
                <button
                    v-if="resultRun && !showSearchForm"
                    type="button"
                    class="wkb-datasets-btn wkb-datasets-btn-secondary"
                    :disabled="loading"
                    @click="$emit('search-again')"
                >
                    Find datasets again
                </button>
                <button
                    v-if="showSearchForm"
                    type="button"
                    class="wkb-datasets-btn wkb-datasets-btn-primary"
                    :disabled="loading"
                    @click="$emit('search')"
                >
                    Find datasets
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import WorkspaceCfdeDatasetRunCard from "./WorkspaceCfdeDatasetRunCard.vue";

export default {
    name: "WorkspaceFindRelatedDatasetsModal",
    components: {
        WorkspaceCfdeDatasetRunCard,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        resultRun: {
            type: Object,
            default: null,
        },
        showSearchForm: {
            type: Boolean,
            default: true,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        selectedGeneCount: {
            type: Number,
            default: 0,
        },
        currentActiveSetKey: {
            type: String,
            default: "",
        },
        canvasGraphNodeIds: {
            type: Array,
            default: () => [],
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick() {
            if (!this.loading) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && !this.loading && event.key === "Escape") {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.wkb-datasets-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-datasets-modal {
    display: flex;
    flex-direction: column;
    width: min(1080px, 100%);
    max-height: min(92vh, 960px);
    overflow: hidden;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-datasets-head {
    flex-shrink: 0;
    padding: 20px 26px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-datasets-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.wkb-datasets-head-row h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-datasets-close {
    border: none;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
}

.wkb-datasets-close:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-datasets-intro {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-datasets-body {
    flex: 1;
    overflow: auto;
    padding: 16px 26px 20px;
}

.wkb-datasets-empty,
.wkb-datasets-helper {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-datasets-helper {
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-datasets-actions {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 26px 18px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-datasets-btn {
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-datasets-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-datasets-btn-primary {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-datasets-btn-secondary {
    background: #ffffff;
    border-color: var(--cfde-border, #e6e1d6);
    color: var(--cfde-ink, #33363d);
}
</style>
