<template>
    <div class="wkb-gene-inspector-stack">
        <section v-if="hasHeader" class="wkb-inspector-panel-block">
            <h3 class="wkb-inspector-node-title">{{ node.label || node.id }}</h3>
            <p v-if="displaySubtitle" class="wkb-inspector-node-subtitle">
                {{ displaySubtitle }}
            </p>
            <div class="wkb-inspector-connected">
                <div class="wkb-inspector-connected-head">
                    <span class="wkb-inspector-connected-title">Connected:</span>
                    <div class="wkb-inspector-connected-legend" aria-hidden="true">
                        <span class="wkb-inspector-connected-legend-item">
                            <span
                                class="wkb-inspector-connected-swatch wkb-inspector-connected-swatch--direct"
                            />
                            Direct
                        </span>
                        <span class="wkb-inspector-connected-legend-item">
                            <span
                                class="wkb-inspector-connected-swatch wkb-inspector-connected-swatch--indirect"
                            />
                            Indirect
                        </span>
                    </div>
                </div>
                <div class="wkb-inspector-connected-group">
                    <p class="wkb-inspector-connected-line">with Active edges:</p>
                    <ul
                        v-if="activeConnectedNeighbors.length"
                        class="wkb-inspector-connected-bubbles"
                    >
                        <li
                            v-for="neighbor in activeConnectedNeighbors"
                            :key="`active-${neighbor.id}`"
                        >
                            <div
                                class="wkb-inspector-connected-bubble"
                                :class="`wkb-inspector-connected-bubble--${neighbor.linkKind}`"
                            >
                                <span class="wkb-inspector-connected-bubble-label">{{
                                    neighbor.label
                                }}</span>
                                <span class="wkb-inspector-connected-bubble-actions">
                                    <button
                                        type="button"
                                        class="wkb-inspector-connected-bubble-action"
                                        :class="{
                                            'is-dimmed': !canInspectEdge(neighbor),
                                        }"
                                        :disabled="!neighbor.edgeRef"
                                        title="Inspect connecting edge"
                                        @click="onInspectConnectingEdge(neighbor)"
                                    >
                                        Edge
                                    </button>
                                    <button
                                        type="button"
                                        class="wkb-inspector-connected-bubble-action"
                                        :disabled="!neighbor.nodeInspectable"
                                        title="Inspect node"
                                        @click="onInspectConnectedNode(neighbor)"
                                    >
                                        Node
                                    </button>
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p v-else class="wkb-inspector-connected-empty">None</p>
                </div>
                <div class="wkb-inspector-connected-group">
                    <p class="wkb-inspector-connected-line">with Contextual edges:</p>
                    <ul
                        v-if="contextualConnectedNeighbors.length"
                        class="wkb-inspector-connected-bubbles"
                    >
                        <li
                            v-for="neighbor in contextualConnectedNeighbors"
                            :key="`contextual-${neighbor.id}`"
                        >
                            <div
                                class="wkb-inspector-connected-bubble"
                                :class="`wkb-inspector-connected-bubble--${neighbor.linkKind}`"
                            >
                                <span class="wkb-inspector-connected-bubble-label">{{
                                    neighbor.label
                                }}</span>
                                <span class="wkb-inspector-connected-bubble-actions">
                                    <button
                                        type="button"
                                        class="wkb-inspector-connected-bubble-action"
                                        :class="{
                                            'is-dimmed': !canInspectEdge(neighbor),
                                        }"
                                        :disabled="!neighbor.edgeRef"
                                        title="Inspect connecting edge"
                                        @click="onInspectConnectingEdge(neighbor)"
                                    >
                                        Edge
                                    </button>
                                    <button
                                        type="button"
                                        class="wkb-inspector-connected-bubble-action"
                                        :disabled="!neighbor.nodeInspectable"
                                        title="Inspect node"
                                        @click="onInspectConnectedNode(neighbor)"
                                    >
                                        Node
                                    </button>
                                </span>
                            </div>
                        </li>
                    </ul>
                    <p v-else class="wkb-inspector-connected-empty">None</p>
                </div>
                <p class="wkb-inspector-connected-footnote">
                    Edge inspect is available for gene–trait links; other edge types open a
                    summary only.
                </p>
            </div>
        </section>

        <WorkspaceNodeConnectionTabs
            :node="node"
            :key-node-items="keyNodeItems"
            :session-context="sessionContext"
            :graph-nodes="graphNodes"
            :connection-cache="connectionCache"
            :api-client="apiClient"
            :graph-busy="graphBusy"
            @cache-connections="$emit('cache-connections', $event)"
            @add-node="$emit('add-node', $event)"
            @remove-node="$emit('remove-node', $event)"
        />

        <WorkspaceNodeExpressionPanel
            :node="node"
            :expression-options="expressionOptions"
            :expression-cache="expressionCache"
            :preferred-expression-reference-id="preferredExpressionReferenceId"
            :api-client="apiClient"
            @cache-expression="$emit('cache-expression', $event)"
        />
    </div>
</template>

<script>
import { groupedConnectedNeighborsForNode } from "./revealKgInspectorUtils";
import WorkspaceNodeConnectionTabs from "./WorkspaceNodeConnectionTabs.vue";
import WorkspaceNodeExpressionPanel from "./WorkspaceNodeExpressionPanel.vue";

export default {
    name: "WorkspaceGeneNodeInspectorContent",
    components: {
        WorkspaceNodeConnectionTabs,
        WorkspaceNodeExpressionPanel,
    },
    props: {
        node: {
            type: Object,
            required: true,
        },
        keyNodeItems: {
            type: Array,
            default: () => [],
        },
        sessionContext: {
            type: String,
            default: "",
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
        graphEdges: {
            type: Array,
            default: () => [],
        },
        contextualEdges: {
            type: Array,
            default: () => [],
        },
        connectionCache: {
            type: Object,
            default: () => ({}),
        },
        expressionCache: {
            type: Object,
            default: () => ({}),
        },
        preferredExpressionReferenceId: {
            type: String,
            default: "",
        },
        expressionOptions: {
            type: Object,
            default: null,
        },
        apiClient: {
            type: Object,
            default: null,
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        connectedNeighborGroups() {
            return groupedConnectedNeighborsForNode(
                this.node?.id,
                this.graphEdges,
                this.contextualEdges,
                this.graphNodes
            );
        },
        activeConnectedNeighbors() {
            return this.connectedNeighborGroups.active;
        },
        contextualConnectedNeighbors() {
            return this.connectedNeighborGroups.contextual;
        },
        displaySubtitle() {
            const subtitle = String(this.node?.subtitle || "").trim();
            if (!subtitle) {
                return "";
            }
            const label = String(this.node?.label || "").trim();
            if (subtitle.toLowerCase() === "gene" || subtitle === label) {
                return "";
            }
            return subtitle;
        },
        hasHeader() {
            return Boolean(this.node?.label || this.node?.id);
        },
    },
    methods: {
        canInspectEdge(neighbor) {
            return Boolean(neighbor?.edgeRef?.inspectable);
        },
        onInspectConnectingEdge(neighbor) {
            if (!neighbor?.edgeRef) {
                return;
            }
            this.$emit("inspect-connected-edge", { ...neighbor.edgeRef });
        },
        onInspectConnectedNode(neighbor) {
            if (!neighbor?.id) {
                return;
            }
            this.$emit("inspect-connected-node", {
                nodeId: neighbor.id,
                label: neighbor.label,
            });
        },
    },
};
</script>

<style scoped>
.wkb-gene-inspector-stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.wkb-inspector-panel-block {
    padding-bottom: 4px;
}

.wkb-inspector-node-title {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-node-subtitle {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected {
    margin: 0 0 10px;
}

.wkb-inspector-connected-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: 6px;
}

.wkb-inspector-connected-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-connected-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 11px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.wkb-inspector-connected-group {
    margin-bottom: 8px;
}

.wkb-inspector-connected-group:last-child {
    margin-bottom: 0;
}

.wkb-inspector-connected-line {
    margin: 0 0 4px;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected-bubbles {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.wkb-inspector-connected-bubble {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 2px 2px 2px 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 11px;
    line-height: 1.25;
    color: var(--cfde-ink, #33363d);
    background: #f7f7f8;
}

.wkb-inspector-connected-bubble-label {
    padding: 1px 0;
    font-weight: 600;
}

.wkb-inspector-connected-bubble--direct {
    border-color: #e07b39;
    background: #fff4ec;
}

.wkb-inspector-connected-bubble--direct .wkb-inspector-connected-bubble-label {
    color: #9a3412;
}

.wkb-inspector-connected-bubble--indirect {
    border-color: #b0a890;
    background: #f3f2ef;
}

.wkb-inspector-connected-bubble--indirect .wkb-inspector-connected-bubble-label {
    font-weight: 500;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected-bubble-actions {
    display: inline-flex;
    align-items: stretch;
    gap: 1px;
    padding: 1px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.65);
}

.wkb-inspector-connected-bubble-action {
    margin: 0;
    padding: 2px 6px;
    border: none;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--cfde-ink, #33363d);
    background: transparent;
    cursor: pointer;
}

.wkb-inspector-connected-bubble-action:hover:not(:disabled) {
    background: rgba(224, 123, 57, 0.15);
}

.wkb-inspector-connected-bubble-action:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 1px;
}

.wkb-inspector-connected-bubble-action:disabled {
    opacity: 0.35;
    cursor: default;
}

.wkb-inspector-connected-bubble-action.is-dimmed:not(:disabled) {
    opacity: 0.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected-footnote {
    margin: 6px 0 0;
    font-size: 10px;
    line-height: 1.35;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-connected-swatch {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.wkb-inspector-connected-swatch--direct {
    background-color: #e07b39;
}

.wkb-inspector-connected-swatch--indirect {
    background-color: #b0a890;
}

.wkb-inspector-connected-empty {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    font-style: italic;
}
</style>
