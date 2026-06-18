<template>
    <div class="wkb-canvas">
        <div v-if="graphLoading" class="wkb-canvas-status wkb-canvas-status--loading">
            <span class="wkb-canvas-spinner" aria-hidden="true" />
            Building graph…
        </div>
        <div v-else-if="graphError" class="wkb-canvas-status wkb-canvas-status--error">
            {{ graphError }}
        </div>
        <template v-else-if="showCanvasWorkspace">
            <div class="wkb-canvas-toolbar">
                <div class="wkb-canvas-legend" aria-label="Tree view legend">
                    <span class="wkb-canvas-legend-item">
                        <span
                            class="wkb-canvas-swatch wkb-canvas-swatch--key-node"
                            aria-hidden="true"
                        />
                        Selected node
                    </span>
                    <span class="wkb-canvas-legend-item">
                        <span
                            class="wkb-canvas-swatch wkb-canvas-swatch--starting-node"
                            aria-hidden="true"
                        />
                        Starting node
                    </span>
                    <span class="wkb-canvas-legend-item">
                        <span class="wkb-canvas-line wkb-canvas-line--solid" aria-hidden="true" />
                        Active edges
                    </span>
                    <span class="wkb-canvas-legend-item">
                        <span class="wkb-canvas-line wkb-canvas-line--contextual" aria-hidden="true" />
                        Contextual edges
                    </span>
                </div>
                <WorkspaceGraphViewportControls
                    :zoom-level="zoomLevel"
                    :graph-table-open="graphTableOpen"
                    :graph-table-disabled="!hasGraph"
                    :graph-options-open="graphOptionsOpen"
                    :hide-contextual-edges="hideContextualEdges"
                    :hide-jumping-edges="hideJumpingEdges"
                    :visibility-filter-count="activeVisibilityFilterCount"
                    :ai-assistant-open="aiAssistantOpen"
                    @update:zoomLevel="zoomLevel = $event"
                    @update:graphTableOpen="graphTableOpen = $event"
                    @update:graphOptionsOpen="graphOptionsOpen = $event"
                    @update:hideContextualEdges="hideContextualEdges = $event"
                    @update:hideJumpingEdges="hideJumpingEdges = $event"
                    @action="$emit('graph-action', $event)"
                />
            </div>
            <div class="wkb-canvas-graph-wrap" @click="onGraphViewerClick">
                <div v-if="!hasGraph" class="wkb-canvas-empty" role="status">
                    <p class="wkb-canvas-empty-title">Blank canvas</p>
                    <p class="wkb-canvas-empty-sub">
                        Use <strong>Expand KG → Add nodes</strong> or the
                        <strong>AI assistant</strong> to place entities on the graph.
                    </p>
                </div>
                <WorkspaceGraphReminder
                    v-if="graphReminder && !graphLoading"
                    :reminder="graphReminder"
                    @action="$emit('graph-reminder-action', $event)"
                    @dismiss="$emit('graph-reminder-dismiss')"
                />
                <WorkspaceTreeGraphCanvas
                    ref="treeGraph"
                    :show-empty-message="false"
                    :graph-nodes="graphNodes"
                    :graph-edges="graphEdges"
                    :contextual-edges="contextualEdges"
                :selected-node-id="selectedNodeId"
                :selected-edge-id="selectedEdgeId"
                    :key-node-ids="keyNodeIds"
                    :node-ids-with-evidence="nodeIdsWithEvidence"
                    :edge-keys-with-evidence="edgeKeysWithEvidence"
                    :zoom-level="zoomLevel"
                    :hide-contextual-edges="hideContextualEdges"
                    :hide-jumping-edges="hideJumpingEdges"
                    @node-menu-open="$emit('node-menu-open', $event)"
                    @edge-menu-open="$emit('edge-menu-open', $event)"
                />
                <WorkspaceInspector
                    :open="inspectorOpen"
                    :selected-node-id="selectedNodeId"
                    :selected-edge-id="selectedEdgeId"
                    :selected-node="selectedNodeDetail"
                    :selected-edge="selectedEdgeDetail"
                    :gene-inspector-context="geneInspectorContext"
                    :trait-inspector-context="traitInspectorContext"
                    :mechanism-inspector-context="mechanismInspectorContext"
                    :gene-set-inspector-context="geneSetInspectorContext"
                    :expression-options="expressionOptions"
                    :api-client="apiClient"
                    :graph-busy="graphBusy"
                    :graph-nodes="graphNodes"
                    :inspector-content-key="inspectorContentKey"
                    @toggle="$emit('toggle-inspector')"
                    @cache-connections="$emit('cache-node-connections', $event)"
                    @cache-expression="$emit('cache-node-expression', $event)"
                    @cache-factor-loadings="$emit('cache-factor-loadings', $event)"
                    @load-factor-loadings="$emit('load-factor-loadings', $event)"
                    @add-node="$emit('add-table-node', $event)"
                    @remove-node="$emit('remove-table-node', $event)"
                    @inspect-connected-edge="$emit('inspect-connected-edge', $event)"
                    @inspect-connected-node="$emit('inspect-connected-node', $event)"
                />
            </div>
            <WorkspaceGraphDataTableModal
                :open="graphTableOpen && hasGraph"
                :graph-nodes="allGraphNodes.length ? allGraphNodes : graphNodes"
                :graph-edges="graphEdges"
                :contextual-edges="contextualEdges"
                :retrieval-ledger="retrievalLedger"
                :ledger-session="ledgerSession"
                :key-node-ids="keyNodeIds"
                :graph-busy="graphBusy"
                @close="graphTableOpen = false"
                @add-node="$emit('add-table-node', $event)"
                @remove-node="$emit('remove-table-node', $event)"
            />
        </template>
        <div v-else class="wkb-canvas-placeholder">
            <div class="wkb-canvas-placeholder-mark">KG</div>
            <p class="wkb-canvas-placeholder-title">Knowledge graph canvas</p>
            <p class="wkb-canvas-placeholder-sub">
                Your graph will appear here. Start by building an initial graph from
                <strong>Manage → New graph</strong>, or open <strong>My library</strong> to load a saved graph.
            </p>
        </div>
    </div>
</template>

<script>
import WorkspaceTreeGraphCanvas from "./WorkspaceTreeGraphCanvas.vue";
import WorkspaceGraphViewportControls from "./WorkspaceGraphViewportControls.vue";
import WorkspaceGraphDataTableModal from "./WorkspaceGraphDataTableModal.vue";
import WorkspaceGraphReminder from "./WorkspaceGraphReminder.vue";
import WorkspaceInspector from "./WorkspaceInspector.vue";
import { getEnabledVisibilityFilterLayers } from "./revealKgVisibilityFilterUtils.js";

export default {
    name: "WorkspaceCanvas",
    components: {
        WorkspaceTreeGraphCanvas,
        WorkspaceGraphViewportControls,
        WorkspaceGraphDataTableModal,
        WorkspaceGraphReminder,
        WorkspaceInspector,
    },
    props: {
        graphNodes: {
            type: Array,
            default: () => [],
        },
        allGraphNodes: {
            type: Array,
            default: () => [],
        },
        ledgerSession: {
            type: Object,
            default: null,
        },
        graphEdges: {
            type: Array,
            default: () => [],
        },
        contextualEdges: {
            type: Array,
            default: () => [],
        },
        graphLoading: {
            type: Boolean,
            default: false,
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
        graphError: {
            type: String,
            default: "",
        },
        selectedNodeId: {
            type: String,
            default: null,
        },
        selectedEdgeId: {
            type: String,
            default: null,
        },
        keyNodeIds: {
            type: Array,
            default: () => [],
        },
        nodeIdsWithEvidence: {
            type: Array,
            default: () => [],
        },
        edgeKeysWithEvidence: {
            type: Array,
            default: () => [],
        },
        selectedNodeDetail: {
            type: Object,
            default: null,
        },
        selectedEdgeDetail: {
            type: Object,
            default: null,
        },
        geneInspectorContext: {
            type: Object,
            default: null,
        },
        traitInspectorContext: {
            type: Object,
            default: null,
        },
        mechanismInspectorContext: {
            type: Object,
            default: null,
        },
        geneSetInspectorContext: {
            type: Object,
            default: null,
        },
        expressionOptions: {
            type: Object,
            default: null,
        },
        apiClient: {
            type: Object,
            default: null,
        },
        inspectorOpen: {
            type: Boolean,
            default: false,
        },
        retrievalLedger: {
            type: Object,
            default: () => ({}),
        },
        tableAddBusy: {
            type: Boolean,
            default: false,
        },
        inspectorContentKey: {
            type: String,
            default: "",
        },
        graphReminder: {
            type: Object,
            default: null,
        },
        aiAssistantOpen: {
            type: Boolean,
            default: false,
        },
        canvasActive: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            zoomLevel: 1,
            graphTableOpen: false,
            graphOptionsOpen: false,
            hideContextualEdges: true,
            hideJumpingEdges: true,
        };
    },
    computed: {
        hasGraph() {
            return (this.graphNodes || []).length > 0;
        },
        showCanvasWorkspace() {
            return this.canvasActive || this.hasGraph;
        },
        activeVisibilityFilterCount() {
            return getEnabledVisibilityFilterLayers(
                this.ledgerSession,
                this.expressionOptions
            ).length;
        },
    },
    methods: {
        getGraphViewOptions() {
            return {
                hideContextualEdges: this.hideContextualEdges,
                hideJumpingEdges: this.hideJumpingEdges,
            };
        },
        setGraphViewOptions({ hideContextualEdges, hideJumpingEdges } = {}) {
            if (hideContextualEdges !== undefined) {
                this.hideContextualEdges = Boolean(hideContextualEdges);
            }
            if (hideJumpingEdges !== undefined) {
                this.hideJumpingEdges = Boolean(hideJumpingEdges);
            }
        },
        setGraphTableOpen(open) {
            this.graphTableOpen = Boolean(open);
        },
        onGraphViewerClick(event) {
            if (event.target.closest(".wkb-inspector")) {
                return;
            }
            if (
                event.target.closest(".wkb-tree-graph-node") ||
                event.target.closest(".wkb-tree-graph-link-hit") ||
                event.target.closest(".wkb-tree-graph-edge")
            ) {
                return;
            }
            const onGraphSurface =
                event.target === event.currentTarget ||
                Boolean(event.target.closest(".wkb-tree-graph, .wkb-tree-graph-svg, .wkb-tree-graph-pan-bg"));
            if (!onGraphSurface) {
                return;
            }
            this.$emit("close-inspector");
        },
        captureGraphSvgMarkup() {
            return this.$refs.treeGraph?.getSvgSnapshotMarkup?.() || "";
        },
        focusGraphView({ nodeIds = [], fit = true, resetView = false } = {}) {
            const treeGraph = this.$refs.treeGraph;
            if (!treeGraph) {
                return;
            }
            if (resetView || !nodeIds.length) {
                const reset = treeGraph.resetGraphView?.();
                if (reset?.zoomLevel !== undefined) {
                    this.zoomLevel = reset.zoomLevel;
                }
                return;
            }
            const result = treeGraph.focusOnNodeIds?.(nodeIds, { fit });
            if (result?.zoomLevel !== undefined) {
                this.zoomLevel = result.zoomLevel;
            }
        },
    },
    watch: {
        hasGraph(isVisible) {
            if (!isVisible) {
                this.zoomLevel = 1;
                this.graphTableOpen = false;
                this.graphOptionsOpen = false;
            }
        },
    },
};
</script>

<style scoped>
.wkb-canvas {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background:
        radial-gradient(circle at 1px 1px, rgba(20, 22, 30, 0.06) 1px, transparent 0);
    background-size: 22px 22px;
    background-color: var(--cfde-bg, #f6f5f2);
    overflow: hidden;
}

.wkb-canvas-toolbar {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    padding: 10px 16px;
    background: rgba(246, 245, 242, 0.92);
    --wkb-toolbar-row: 28px;
    --wkb-toolbar-icon: 17px;
    --wkb-toolbar-gap: 12px;
    --wkb-toolbar-symbol: 14px;
}

.wkb-canvas-graph-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
}

.wkb-canvas-empty {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    pointer-events: none;
}

.wkb-canvas-empty-title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-canvas-empty-sub {
    margin: 0;
    max-width: 360px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-canvas-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--wkb-toolbar-gap);
    min-height: var(--wkb-toolbar-row);
    font-size: 13px;
    line-height: 1;
    color: var(--cfde-ink, #33363d);
}

.wkb-canvas-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: var(--wkb-toolbar-row);
}

.wkb-canvas-swatch {
    flex-shrink: 0;
    width: var(--wkb-toolbar-symbol);
    height: var(--wkb-toolbar-symbol);
    border-radius: 50%;
}

.wkb-canvas-swatch--key-node {
    background: #488bf7;
}

.wkb-canvas-swatch--starting-node {
    width: calc(var(--wkb-toolbar-symbol) * 0.92);
    height: calc(var(--wkb-toolbar-symbol) * 0.92);
    background: #888888;
    transform: rotate(45deg);
    border-radius: 2px;
}

.wkb-canvas-line {
    flex-shrink: 0;
    display: inline-block;
    width: 20px;
    height: 0;
    border-top: 2px solid #b0a890;
}

.wkb-canvas-line--contextual {
    border-top-style: dashed;
}

.wkb-canvas-status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 13px;
    color: var(--cfde-ink, #33363d);
}

.wkb-canvas-status--error {
    padding: 24px;
    text-align: center;
    color: #c45c3a;
}

.wkb-canvas-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(224, 123, 57, 0.25);
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-canvas-spin 0.75s linear infinite;
}

@keyframes wkb-canvas-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-canvas-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    max-width: 420px;
    margin: 0 auto;
    padding: 24px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-canvas-placeholder-mark {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #fff;
    background: var(--cfde-orange, #e07b39);
    letter-spacing: 0.02em;
}

.wkb-canvas-placeholder-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    margin: 0 0 6px;
}

.wkb-canvas-placeholder-sub {
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
}
</style>
