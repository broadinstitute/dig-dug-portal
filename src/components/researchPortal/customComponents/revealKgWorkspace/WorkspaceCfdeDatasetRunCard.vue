<template>
    <section class="wkb-cfde-dataset-run">
        <header class="wkb-cfde-dataset-run-head">
            <h3 class="wkb-cfde-dataset-run-title">{{ runHeadline }}</h3>
            <span v-if="startedLabel" class="wkb-cfde-dataset-run-meta">{{ startedLabel }}</span>
        </header>

        <div v-if="activeSetNodes.length" class="wkb-cfde-dataset-selected-set">
            <div class="wkb-cfde-dataset-selected-set-head">
                <strong>Selected genes used</strong>
                <span class="wkb-cfde-dataset-run-meta">
                    {{ activeSetNodes.length }} gene{{ activeSetNodes.length === 1 ? "" : "s" }}
                </span>
            </div>
            <div class="wkb-cfde-dataset-chip-list">
                <span
                    v-for="node in activeSetNodes"
                    :key="node.id"
                    class="wkb-cfde-dataset-chip"
                >
                    {{ node.label || node.id }}
                </span>
            </div>
        </div>

        <div v-if="run.status === 'loading'" class="wkb-cfde-dataset-loading" role="status">
            <span class="wkb-cfde-dataset-spinner" aria-hidden="true" />
            <div>
                <strong>Finding CFDE gene sets…</strong>
                <p>This may take a moment.</p>
            </div>
        </div>

        <p v-else-if="run.status === 'error'" class="wkb-cfde-dataset-error" role="alert">
            {{ run.error || "CFDE gene-set search failed." }}
        </p>

        <div v-else-if="run.status === 'success' && !datasets.length" class="wkb-cfde-dataset-empty">
            <h4>No CFDE gene sets found</h4>
            <p class="wkb-inspector-note">
                {{ payload.zero_state_reason || "No CFDE gene sets matched the selected genes." }}
            </p>
        </div>

        <div v-else-if="run.status === 'success' && datasets.length" class="wkb-cfde-dataset-results">
            <div class="wkb-cfde-dataset-graph-panel">
                <div class="wkb-cfde-dataset-graph-head">
                    <button
                        v-if="showRefresh"
                        type="button"
                        class="wkb-cfde-dataset-refresh-btn"
                        :disabled="loading"
                        @click="$emit('refresh')"
                    >
                        {{ loading ? "Updating…" : "Update results" }}
                    </button>
                    <span class="wkb-cfde-dataset-graph-note">
                        Top {{ Math.min(payload.graph_limit || graphLimit, datasets.length) }}
                        gene sets shown
                    </span>
                    <div class="wkb-cfde-dataset-zoom-controls">
                        <button
                            type="button"
                            class="wkb-cfde-dataset-zoom-btn"
                            title="Zoom out"
                            aria-label="Zoom out"
                            :disabled="graphZoomLevel <= graphZoomMin"
                            @click="adjustGraphZoom(-graphZoomStep)"
                        >
                            −
                        </button>
                        <input
                            v-model.number="graphZoomLevel"
                            type="range"
                            class="wkb-cfde-dataset-zoom-slider"
                            :min="graphZoomMin"
                            :max="graphZoomMax"
                            :step="graphZoomStep"
                            aria-label="CFDE graph zoom"
                        />
                        <button
                            type="button"
                            class="wkb-cfde-dataset-zoom-btn"
                            title="Zoom in"
                            aria-label="Zoom in"
                            :disabled="graphZoomLevel >= graphZoomMax"
                            @click="adjustGraphZoom(graphZoomStep)"
                        >
                            +
                        </button>
                    </div>
                </div>
                <div class="wkb-cfde-dataset-graph-shell">
                    <WorkspaceTreeGraphCanvas
                        :graph-nodes="graphNodes"
                        :graph-edges="graphEdges"
                        :contextual-edges="[]"
                        :key-node-ids="activeSetNodeIds"
                        :zoom-level="graphZoomLevel"
                        :hide-contextual-edges="true"
                        :hide-jumping-edges="true"
                    />
                </div>
            </div>

            <div class="wkb-cfde-dataset-table-slot">
                <WorkspaceCfdeGeneSetsTable
                    :rows="tableRows"
                    :graph-node-ids="canvasGraphNodeIds"
                    :graph-busy="graphBusy"
                    @add-gene-set="$emit('add-gene-set', $event)"
                    @remove-gene-set="$emit('remove-gene-set', $event)"
                />
            </div>
        </div>
    </section>
</template>

<script>
import WorkspaceCfdeGeneSetsTable from "./WorkspaceCfdeGeneSetsTable.vue";
import WorkspaceTreeGraphCanvas from "./WorkspaceTreeGraphCanvas.vue";
import {
    CFDE_DATASET_GRAPH_LIMIT,
    buildCfdeDatasetTableRows,
    formatCfdeDatasetRunHeadline,
    getCfdeActiveSetKey,
    mapCfdeGraphEdges,
    mapCfdeGraphNodes,
} from "./revealKgCfdeDatasetUtils.js";

export default {
    name: "WorkspaceCfdeDatasetRunCard",
    components: {
        WorkspaceCfdeGeneSetsTable,
        WorkspaceTreeGraphCanvas,
    },
    props: {
        run: {
            type: Object,
            required: true,
        },
        currentActiveSetKey: {
            type: String,
            default: "",
        },
        canvasGraphNodeIds: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            graphLimit: CFDE_DATASET_GRAPH_LIMIT,
            graphZoomLevel: 0.85,
            graphZoomMin: 0.35,
            graphZoomMax: 1.8,
            graphZoomStep: 0.05,
        };
    },
    computed: {
        payload() {
            return this.run?.payload || {};
        },
        datasets() {
            return this.payload.datasets || [];
        },
        activeSetNodes() {
            return this.run?.activeSetNodes || [];
        },
        activeSetNodeIds() {
            return this.activeSetNodes.map((node) => node.id).filter(Boolean);
        },
        graphNodes() {
            return mapCfdeGraphNodes(this.payload.graph || {}, this.activeSetNodeIds);
        },
        graphEdges() {
            return mapCfdeGraphEdges(this.payload.graph || {}, this.graphNodes);
        },
        tableRows() {
            return buildCfdeDatasetTableRows(this.datasets);
        },
        runHeadline() {
            return formatCfdeDatasetRunHeadline(this.datasets.length, this.run?.status);
        },
        startedLabel() {
            return this.run?.startedAt ? new Date(this.run.startedAt).toLocaleString() : "";
        },
        runGeneKey() {
            return getCfdeActiveSetKey(this.activeSetNodes);
        },
        showRefresh() {
            return (
                Boolean(this.currentActiveSetKey) &&
                (this.run.status === "success" || this.run.status === "error") &&
                this.currentActiveSetKey !== this.runGeneKey
            );
        },
    },
    methods: {
        adjustGraphZoom(delta) {
            const next = Math.min(
                this.graphZoomMax,
                Math.max(this.graphZoomMin, this.graphZoomLevel + delta)
            );
            this.graphZoomLevel = Number(next.toFixed(2));
        },
    },
};
</script>

<style scoped>
.wkb-cfde-dataset-run {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.wkb-cfde-dataset-run-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
}

.wkb-cfde-dataset-run-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-cfde-dataset-run-meta {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-cfde-dataset-selected-set {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
}

.wkb-cfde-dataset-selected-set-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
}

.wkb-cfde-dataset-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.wkb-cfde-dataset-chip {
    padding: 2px 8px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 12px;
    color: var(--cfde-ink, #33363d);
}

.wkb-cfde-dataset-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
}

.wkb-cfde-dataset-loading p {
    margin: 4px 0 0;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-cfde-dataset-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #ddd;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-cfde-dataset-spin 0.8s linear infinite;
    flex-shrink: 0;
}

@keyframes wkb-cfde-dataset-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-cfde-dataset-error {
    margin: 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff0f0;
    color: #8b2e2e;
    font-size: 13px;
}

.wkb-cfde-dataset-empty h4 {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
}

.wkb-cfde-dataset-results {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
}

.wkb-cfde-dataset-table-slot {
    min-width: 0;
}

.wkb-cfde-dataset-table-slot ::v-deep .wkb-evidence-table {
    margin-top: 0;
}

.wkb-cfde-dataset-table-slot ::v-deep .wkb-evidence-table-grid {
    width: 100%;
    max-width: 100%;
}

.wkb-cfde-dataset-table-slot ::v-deep td.wkb-evidence-table-cell--wrap {
    max-width: 11rem;
    overflow-wrap: anywhere;
    word-break: normal;
}

.wkb-cfde-dataset-graph-panel {
    min-width: 0;
}

.wkb-cfde-dataset-graph-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.wkb-cfde-dataset-refresh-btn {
    padding: 6px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-cfde-dataset-refresh-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-cfde-dataset-graph-note {
    flex: 1;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-cfde-dataset-zoom-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
}

.wkb-cfde-dataset-zoom-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    font-size: 16px;
    cursor: pointer;
}

.wkb-cfde-dataset-zoom-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-cfde-dataset-zoom-slider {
    width: 96px;
    accent-color: var(--cfde-orange, #e07b39);
}

.wkb-cfde-dataset-graph-shell {
    height: min(420px, 42vh);
    min-height: 360px;
    overflow: hidden;
    position: relative;
    isolation: isolate;
}

.wkb-inspector-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
