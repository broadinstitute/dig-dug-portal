<template>
    <div class="wkb-inspector" :class="{ 'is-open': open }">
        <button
            type="button"
            class="wkb-inspector-tab"
            :aria-expanded="open ? 'true' : 'false'"
            @click="$emit('toggle')"
        >
            <span class="wkb-inspector-tab-label">Inspector</span>
        </button>
        <aside class="wkb-inspector-panel" role="complementary" aria-label="Inspector">
            <header class="wkb-inspector-head">
                <h3 class="wkb-inspector-title">Inspector</h3>
                <button
                    type="button"
                    class="wkb-inspector-close"
                    aria-label="Close inspector"
                    @click="$emit('toggle')"
                >
                    &times;
                </button>
            </header>
            <div class="wkb-inspector-body">
                <div
                    :key="inspectorContentKey || 'inspector-empty'"
                    class="wkb-inspector-content"
                >
                    <WorkspaceGeneSetNodeInspectorContent
                        v-if="geneSetInspectorContext"
                        :node="geneSetInspectorContext.node"
                        :key-node-items="geneSetInspectorContext.keyNodeItems"
                        :session-context="geneSetInspectorContext.sessionContext"
                        :graph-nodes="geneSetInspectorContext.graphNodes"
                        :graph-edges="geneSetInspectorContext.graphEdges"
                        :contextual-edges="geneSetInspectorContext.contextualEdges"
                        :connection-cache="geneSetInspectorContext.connectionCache"
                        :api-client="apiClient"
                        :graph-busy="graphBusy"
                        @cache-connections="$emit('cache-connections', $event)"
                        @add-node="$emit('add-node', $event)"
                        @inspect-connected-edge="$emit('inspect-connected-edge', $event)"
                        @inspect-connected-node="$emit('inspect-connected-node', $event)"
                    />
                    <WorkspaceMechanismNodeInspectorContent
                        v-else-if="mechanismInspectorContext"
                        :node="mechanismInspectorContext.node"
                        :key-node-items="mechanismInspectorContext.keyNodeItems"
                        :session-context="mechanismInspectorContext.sessionContext"
                        :graph-nodes="mechanismInspectorContext.graphNodes"
                        :graph-edges="mechanismInspectorContext.graphEdges"
                        :contextual-edges="mechanismInspectorContext.contextualEdges"
                        :connection-cache="mechanismInspectorContext.connectionCache"
                        :factor-loadings-cache="mechanismInspectorContext.factorLoadingsCache"
                        :factor-loadings-loading="mechanismInspectorContext.factorLoadingsLoading"
                        :factor-loadings-error="mechanismInspectorContext.factorLoadingsError"
                        :sig-chain-packet="mechanismInspectorContext.sigChainPacket"
                        :sig-chain-loading="mechanismInspectorContext.sigChainLoading"
                        :sig-chain-error="mechanismInspectorContext.sigChainError"
                        :api-client="apiClient"
                        :graph-busy="graphBusy"
                        @cache-connections="$emit('cache-connections', $event)"
                        @cache-factor-loadings="$emit('cache-factor-loadings', $event)"
                        @load-factor-loadings="$emit('load-factor-loadings', $event)"
                        @add-node="$emit('add-node', $event)"
                        @inspect-connected-edge="$emit('inspect-connected-edge', $event)"
                        @inspect-connected-node="$emit('inspect-connected-node', $event)"
                    />
                    <WorkspaceTraitNodeInspectorContent
                        v-else-if="traitInspectorContext"
                        :node="traitInspectorContext.node"
                        :key-node-items="traitInspectorContext.keyNodeItems"
                        :session-context="traitInspectorContext.sessionContext"
                        :graph-nodes="traitInspectorContext.graphNodes"
                        :graph-edges="traitInspectorContext.graphEdges"
                        :contextual-edges="traitInspectorContext.contextualEdges"
                        :connection-cache="traitInspectorContext.connectionCache"
                        :sig-chain-packet="traitInspectorContext.sigChainPacket"
                        :sig-chain-loading="traitInspectorContext.sigChainLoading"
                        :sig-chain-error="traitInspectorContext.sigChainError"
                        :api-client="apiClient"
                        :graph-busy="graphBusy"
                        @cache-connections="$emit('cache-connections', $event)"
                        @add-node="$emit('add-node', $event)"
                        @inspect-connected-edge="$emit('inspect-connected-edge', $event)"
                        @inspect-connected-node="$emit('inspect-connected-node', $event)"
                    />
                    <WorkspaceGeneNodeInspectorContent
                        v-else-if="geneInspectorContext"
                        :node="geneInspectorContext.node"
                        :key-node-items="geneInspectorContext.keyNodeItems"
                        :session-context="geneInspectorContext.sessionContext"
                        :graph-nodes="geneInspectorContext.graphNodes"
                        :graph-edges="geneInspectorContext.graphEdges"
                        :contextual-edges="geneInspectorContext.contextualEdges"
                        :connection-cache="geneInspectorContext.connectionCache"
                        :expression-cache="geneInspectorContext.expressionCache"
                        :preferred-expression-reference-id="
                            geneInspectorContext.preferredExpressionReferenceId
                        "
                        :expression-options="expressionOptions"
                        :api-client="apiClient"
                        :graph-busy="graphBusy"
                        @cache-connections="$emit('cache-connections', $event)"
                        @cache-expression="$emit('cache-expression', $event)"
                        @add-node="$emit('add-node', $event)"
                        @inspect-connected-edge="$emit('inspect-connected-edge', $event)"
                        @inspect-connected-node="$emit('inspect-connected-node', $event)"
                    />
                    <WorkspaceEdgeInspectorContent
                        v-else-if="selectedEdgeId && selectedEdge"
                        :selected-edge="selectedEdge"
                        :payload="selectedEdge.provenancePayload"
                        :provenance-loading="selectedEdge.provenanceLoading"
                        :provenance-error="selectedEdge.provenanceError"
                        :api-client="apiClient"
                        :graph-busy="graphBusy"
                        @add-node="$emit('add-node', $event)"
                    />
                    <template v-else-if="selectedNode">
                        <p class="wkb-inspector-node-name">{{ selectedNode.label }}</p>
                        <dl class="wkb-inspector-meta">
                            <div v-if="selectedNode.nodeType">
                                <dt>Type</dt>
                                <dd>{{ selectedNode.nodeType }}</dd>
                            </div>
                            <div v-if="selectedNode.isKeyNode">
                                <dt>Role</dt>
                                <dd>Key node</dd>
                            </div>
                            <div v-if="selectedNode.subtitle">
                                <dt>Subtitle</dt>
                                <dd>{{ selectedNode.subtitle }}</dd>
                            </div>
                            <div v-if="selectedNode.rationale">
                                <dt>Rationale</dt>
                                <dd>{{ selectedNode.rationale }}</dd>
                            </div>
                        </dl>
                        <p class="wkb-inspector-note">
                            Use <strong>Inspect node</strong> on gene, trait, mechanism, or
                            gene set nodes for full evidence.
                        </p>
                    </template>
                    <template v-else-if="selectedNodeId">
                        <p class="wkb-inspector-node-name">{{ selectedNodeId }}</p>
                        <p class="wkb-inspector-note wkb-inspector-note--warn">
                            This node is no longer on the graph. Choose another node on the
                            canvas.
                        </p>
                    </template>
                    <p v-else class="wkb-inspector-empty">
                        Select a node or edge in the graph to see the associations
                        behind it.
                    </p>
                </div>
            </div>
        </aside>
    </div>
</template>

<script>
import WorkspaceGeneNodeInspectorContent from "./WorkspaceGeneNodeInspectorContent.vue";
import WorkspaceGeneSetNodeInspectorContent from "./WorkspaceGeneSetNodeInspectorContent.vue";
import WorkspaceMechanismNodeInspectorContent from "./WorkspaceMechanismNodeInspectorContent.vue";
import WorkspaceTraitNodeInspectorContent from "./WorkspaceTraitNodeInspectorContent.vue";
import WorkspaceEdgeInspectorContent from "./WorkspaceEdgeInspectorContent.vue";

export default {
    name: "WorkspaceInspector",
    components: {
        WorkspaceGeneNodeInspectorContent,
        WorkspaceGeneSetNodeInspectorContent,
        WorkspaceMechanismNodeInspectorContent,
        WorkspaceTraitNodeInspectorContent,
        WorkspaceEdgeInspectorContent,
    },
    props: {
        inspectorContentKey: {
            type: String,
            default: "",
        },
        open: {
            type: Boolean,
            default: false,
        },
        selectedNode: {
            type: Object,
            default: null,
        },
        selectedNodeId: {
            type: String,
            default: null,
        },
        selectedEdgeId: {
            type: String,
            default: null,
        },
        selectedEdge: {
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
        graphBusy: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.wkb-inspector {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    max-height: 100%;
    display: flex;
    align-items: stretch;
    pointer-events: none;
    z-index: 6;
}

.wkb-inspector-tab {
    pointer-events: auto;
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    height: 116px;
    width: 30px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-right: none;
    border-radius: 8px 0 0 8px;
    background: #ffffff;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    box-shadow: -3px 0 10px rgba(20, 22, 30, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.wkb-inspector-tab:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-inspector-tab-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
}

.wkb-inspector.is-open .wkb-inspector-tab {
    border-color: var(--cfde-orange, #e07b39);
}

.wkb-inspector-panel {
    pointer-events: auto;
    width: 0;
    overflow: hidden;
    background: #ffffff;
    border-left: 1px solid var(--cfde-border, #e6e1d6);
    display: flex;
    flex-direction: column;
    transition: width 0.22s ease;
}

.wkb-inspector.is-open .wkb-inspector-panel {
    width: 80vw;
}

.wkb-inspector-head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-inspector-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.wkb-inspector-close:hover {
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 14px 16px;
}

.wkb-inspector-meta {
    margin: 0 0 12px;
    font-size: 13px;
}

.wkb-inspector-meta div {
    display: grid;
    grid-template-columns: 88px 1fr;
    gap: 8px;
    margin-bottom: 6px;
}

.wkb-inspector-meta dt {
    margin: 0;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-meta dd {
    margin: 0;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-node-name,
.wkb-inspector-edge-name {
    margin: 0 0 10px;
    font-size: 16px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-note {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-inspector-note--warn {
    color: #9a3412;
}

.wkb-inspector-empty {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
