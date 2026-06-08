<template>
    <article class="wkb-sig-chain-pathway">
        <header class="wkb-sig-chain-pathway-head">
            <h3 class="wkb-sig-chain-pathway-title">{{ chain.title || "Connection" }}</h3>
            <p v-if="chain.claim" class="wkb-sig-chain-pathway-claim">{{ chain.claim }}</p>
            <p v-if="chain.factor_label" class="wkb-sig-chain-pathway-meta">
                <strong>Mechanism:</strong> {{ chain.factor_label }}
                <code v-if="chain.factor_id">{{ chain.factor_id }}</code>
            </p>
        </header>

        <section class="wkb-sig-chain-graph-panel">
            <div class="wkb-sig-chain-graph-head">
                <h4 class="wkb-sig-chain-section-title">How these nodes connect</h4>
                <div v-if="packet" class="wkb-sig-chain-zoom-controls">
                    <button
                        type="button"
                        class="wkb-sig-chain-zoom-btn"
                        title="Zoom out"
                        aria-label="Zoom out"
                        :disabled="pathwayZoomLevel <= pathwayZoomMin"
                        @click="adjustPathwayZoom(-pathwayZoomStep)"
                    >
                        −
                    </button>
                    <input
                        v-model.number="pathwayZoomLevel"
                        type="range"
                        class="wkb-sig-chain-zoom-slider"
                        :min="pathwayZoomMin"
                        :max="pathwayZoomMax"
                        :step="pathwayZoomStep"
                        aria-label="Connection graph zoom"
                    />
                    <button
                        type="button"
                        class="wkb-sig-chain-zoom-btn"
                        title="Zoom in"
                        aria-label="Zoom in"
                        :disabled="pathwayZoomLevel >= pathwayZoomMax"
                        @click="adjustPathwayZoom(pathwayZoomStep)"
                    >
                        +
                    </button>
                </div>
            </div>
            <div class="wkb-sig-chain-graph-shell">
                <div v-if="loading" class="wkb-sig-chain-graph-loading" role="status">
                    <span class="wkb-sig-chain-spinner" aria-hidden="true" />
                    <strong>Loading connection graph…</strong>
                </div>
                <WorkspaceTreeGraphCanvas
                    v-else-if="packet"
                    :graph-nodes="packetGraphNodes"
                    :graph-edges="packetGraphEdges"
                    :contextual-edges="[]"
                    :key-node-ids="selectedNodeIds"
                    :zoom-level="pathwayZoomLevel"
                    :hide-contextual-edges="true"
                    :hide-jumping-edges="true"
                />
            </div>
            <p v-if="error" class="wkb-sig-chain-error" role="alert">{{ error }}</p>
        </section>

        <div class="wkb-sig-chain-pathway-actions">
            <button
                v-if="llmAvailable"
                type="button"
                class="wkb-sig-chain-btn wkb-sig-chain-btn-primary"
                :disabled="!packet || hypothesisLoading"
                @click="onGenerateHypothesisClick"
            >
                {{
                    hypothesisEntry?.interpretation && !hypothesisLoading
                        ? "Regenerate hypothesis"
                        : "Generate hypothesis"
                }}
            </button>
            <p v-else-if="packet" class="wkb-sig-chain-llm-note" role="note">
                LLM explanations are not available for this session.
            </p>
        </div>

        <section
            v-if="hypothesisLoading || hypothesisEntry?.interpretation || hypothesisEntry?.status === 'error'"
            class="wkb-sig-chain-hypothesis"
        >
            <h4 class="wkb-sig-chain-section-title">Hypothesis</h4>
            <div v-if="hypothesisLoading" class="wkb-sig-chain-loading" role="status">
                <span class="wkb-sig-chain-spinner" aria-hidden="true" />
                <div><strong>Generating hypothesis…</strong></div>
            </div>
            <p v-else-if="hypothesisEntry?.status === 'error'" class="wkb-sig-chain-error">
                {{ hypothesisEntry.error || "Hypothesis generation failed." }}
            </p>
            <WorkspaceMarkdownBlock
                v-else-if="hypothesisEntry?.interpretation"
                :text="hypothesisEntry.interpretation"
            />
        </section>

        <details v-if="packet" class="wkb-sig-chain-evidence">
            <summary class="wkb-sig-chain-evidence-summary">Association scores</summary>
            <div class="wkb-sig-chain-evidence-body">
                <section class="wkb-sig-chain-matrices">
                    <div class="wkb-sig-chain-ledger">
                        <div class="wkb-sig-chain-toolbar">
                            <div
                                class="wkb-sig-chain-tabs"
                                role="tablist"
                                aria-label="Association score tables"
                            >
                                <button
                                    v-for="tab in matrixTabs"
                                    :id="matrixTabId(tab.id)"
                                    :key="tab.id"
                                    type="button"
                                    role="tab"
                                    class="wkb-sig-chain-tab"
                                    :class="{ 'is-active': activeMatrixTab === tab.id }"
                                    :aria-selected="activeMatrixTab === tab.id ? 'true' : 'false'"
                                    :aria-controls="matrixPanelId"
                                    @click="activeMatrixTab = tab.id"
                                >
                                    {{ tab.label }}
                                </button>
                            </div>
                        </div>
                        <div
                            :id="matrixPanelId"
                            class="wkb-sig-chain-panel"
                            role="tabpanel"
                            :aria-labelledby="matrixTabId(activeMatrixTab)"
                        >
                            <WorkspaceSigChainMatrix
                                :matrix="activeMatrix"
                                :active-cell-key="activeCellKey"
                                @cell-click="onMatrixCellClick"
                            />
                        </div>
                    </div>
                </section>

                <section v-if="selectedEdgeSummary" class="wkb-sig-chain-edge-note">
                    <h4 class="wkb-sig-chain-section-title">Selected edge</h4>
                    <p class="wkb-sig-chain-edge-line">
                        {{ selectedEdgeSummary }}
                    </p>
                </section>
            </div>
        </details>
    </article>
</template>

<script>
import WorkspaceMarkdownBlock from "./WorkspaceMarkdownBlock.vue";
import WorkspaceSigChainMatrix from "./WorkspaceSigChainMatrix.vue";
import WorkspaceTreeGraphCanvas from "./WorkspaceTreeGraphCanvas.vue";
import {
    SIG_CHAIN_MATRIX_TABS,
    buildSigChainHypothesisPayload,
    resolveSigChainIntent,
    sigChainPathwayKey,
} from "./revealKgSigChainPrioritizeUtils.js";

let matrixPanelIdCounter = 0;

export default {
    name: "WorkspaceSigChainPathwayCard",
    components: {
        WorkspaceMarkdownBlock,
        WorkspaceSigChainMatrix,
        WorkspaceTreeGraphCanvas,
    },
    props: {
        chain: {
            type: Object,
            required: true,
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
        graphEdges: {
            type: Array,
            default: () => [],
        },
        anchorItems: {
            type: Array,
            default: () => [],
        },
        selectedNodeObjects: {
            type: Array,
            default: () => [],
        },
        selectedNodeIds: {
            type: Array,
            default: () => [],
        },
        sessionContext: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
        llmAvailable: {
            type: Boolean,
            default: false,
        },
        savedPathwayState: {
            type: Object,
            default: null,
        },
    },
    data() {
        matrixPanelIdCounter += 1;
        return {
            matrixPanelId: `wkb-sig-chain-score-panel-${matrixPanelIdCounter}`,
            loading: false,
            error: "",
            packet: null,
            loadedKey: "",
            activeMatrixTab: SIG_CHAIN_MATRIX_TABS[0].id,
            matrixTabs: SIG_CHAIN_MATRIX_TABS,
            activeCellKey: "",
            selectedEdgeSummary: "",
            selectedNodeId: null,
            hypothesisLoading: false,
            hypothesisEntry: null,
            pathwayZoomLevel: 0.85,
            pathwayZoomMin: 0.35,
            pathwayZoomMax: 1.8,
            pathwayZoomStep: 0.05,
        };
    },
    computed: {
        packetGraphNodes() {
            return (this.packet?.nodes || []).map((node) => ({
                id: node.id,
                label: node.label || node.id,
                node_type: node.node_type || node.type || "",
                type: node.node_type || node.type || "",
                is_anchor: Boolean(node.is_anchor),
            }));
        },
        packetGraphEdges() {
            return this.packet?.edges || [];
        },
        activeMatrix() {
            return this.packet?.matrices?.[this.activeMatrixTab] || null;
        },
        chainPacketKey() {
            return [
                this.chain?.chain_id || this.chain?.title || "",
                (this.graphNodes || []).map((node) => node.id).join("|"),
                (this.graphEdges || []).map((edge) => edge.id).join("|"),
            ].join("::");
        },
        pathwayKey() {
            return sigChainPathwayKey(this.chain);
        },
    },
    watch: {
        chainPacketKey() {
            this.resetPathwayState();
            this.loadPacket();
        },
        savedPathwayState: {
            deep: true,
            handler(nextState) {
                this.applySavedPathwayState(nextState);
            },
        },
        activeMatrixTab() {
            this.activeCellKey = "";
            this.selectedEdgeSummary = "";
        },
    },
    mounted() {
        if (this.savedPathwayState?.packet) {
            this.applySavedPathwayState(this.savedPathwayState);
        } else {
            this.loadPacket();
        }
    },
    methods: {
        applySavedPathwayState(state) {
            if (!state?.packet) {
                return;
            }
            this.packet = state.packet;
            this.loadedKey = this.chainPacketKey;
            this.error = "";
            this.loading = false;
            if (state.hypothesisEntry) {
                this.hypothesisEntry = state.hypothesisEntry;
            }
        },
        emitPathwayStateUpdate() {
            if (!this.packet) {
                return;
            }
            this.$emit("pathway-state-update", {
                chainKey: this.pathwayKey,
                state: {
                    packet: this.packet,
                    hypothesisEntry: this.hypothesisEntry,
                },
            });
        },
        matrixTabId(tabId) {
            const safe = String(this.chain?.chain_id || this.chain?.title || "connection").replace(
                /[^a-zA-Z0-9_-]+/g,
                "-"
            );
            return `wkb-sig-chain-tab-${safe}-${tabId}`;
        },
        adjustPathwayZoom(delta) {
            const next = Math.min(
                this.pathwayZoomMax,
                Math.max(this.pathwayZoomMin, this.pathwayZoomLevel + delta)
            );
            this.pathwayZoomLevel = Number(next.toFixed(2));
        },
        resetPathwayState() {
            this.packet = null;
            this.loadedKey = "";
            this.error = "";
            this.hypothesisEntry = null;
            this.pathwayZoomLevel = 0.85;
            this.activeCellKey = "";
            this.selectedEdgeSummary = "";
            this.selectedNodeId = null;
        },
        async loadPacket() {
            if (this.loadedKey === this.chainPacketKey && this.packet) {
                return;
            }
            if (!this.apiClient?.getInteractiveSigChainPacket) {
                this.error = "Connection evidence API is not configured.";
                return;
            }
            this.loading = true;
            this.error = "";
            this.packet = null;
            const loadKey = this.chainPacketKey;
            try {
                const payload = {
                    anchor_items: this.anchorItems,
                    context: this.sessionContext,
                    intent: resolveSigChainIntent({ context: this.sessionContext }),
                    chain: this.chain,
                    graph_nodes: this.graphNodes,
                    graph_edges: this.graphEdges,
                };
                const packet = await this.apiClient.getInteractiveSigChainPacket(payload);
                if (loadKey !== this.chainPacketKey) {
                    return;
                }
                this.packet = packet;
                this.loadedKey = loadKey;
                this.emitPathwayStateUpdate();
            } catch (nextError) {
                if (loadKey !== this.chainPacketKey) {
                    return;
                }
                this.error = String(nextError?.message || nextError);
                this.loadedKey = "";
            } finally {
                if (loadKey === this.chainPacketKey) {
                    this.loading = false;
                }
            }
        },
        onGenerateHypothesisClick() {
            this.runHypothesis();
        },
        async runHypothesis() {
            if (!this.packet || !this.llmAvailable || !this.apiClient?.interpretInteractiveSession) {
                return;
            }
            this.hypothesisLoading = true;
            this.hypothesisEntry = { status: "loading" };
            try {
                const session = { context: this.sessionContext };
                const payload = buildSigChainHypothesisPayload(session, {
                    packet: this.packet,
                    chain: this.chain,
                    selectedNodes: this.selectedNodeObjects,
                });
                const response = await this.apiClient.interpretInteractiveSession(payload);
                this.hypothesisEntry = {
                    status: "success",
                    interpretation: response?.interpretation || "",
                    error: "",
                };
            } catch (nextError) {
                this.hypothesisEntry = {
                    status: "error",
                    interpretation: "",
                    error: String(nextError?.message || nextError),
                };
            } finally {
                this.hypothesisLoading = false;
                this.emitPathwayStateUpdate();
            }
        },
        onMatrixCellClick(cell, cellKey) {
            this.activeCellKey = cellKey;
            this.selectedNodeId = null;
            const edge = cell?.edge;
            if (!edge) {
                this.selectedEdgeSummary = "";
                return;
            }
            this.selectedEdgeSummary = `${edge.source || ""} → ${edge.target || ""} (${
                edge.family || edge.label || "edge"
            })`;
        },
    },
};
</script>

<style scoped>
.wkb-sig-chain-pathway {
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fff;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-sig-chain-pathway-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.wkb-sig-chain-pathway-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-sig-chain-pathway-claim {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    line-height: 1.45;
}

.wkb-sig-chain-pathway-meta {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
}

.wkb-sig-chain-section-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-sig-chain-pathway-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.wkb-sig-chain-btn {
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-sig-chain-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-sig-chain-btn-primary {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-sig-chain-llm-note {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-sig-chain-graph-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.wkb-sig-chain-graph-head .wkb-sig-chain-section-title {
    margin: 0;
}

.wkb-sig-chain-zoom-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.wkb-sig-chain-zoom-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-ink, #33363d);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
}

.wkb-sig-chain-zoom-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-sig-chain-zoom-slider {
    width: 96px;
    accent-color: var(--cfde-orange, #e07b39);
}

.wkb-sig-chain-graph-shell {
    height: 240px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
}

.wkb-sig-chain-graph-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-sig-chain-evidence {
    font-size: 12px;
}

.wkb-sig-chain-evidence-summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    list-style: none;
}

.wkb-sig-chain-evidence-summary::-webkit-details-marker {
    display: none;
}

.wkb-sig-chain-evidence-body {
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-sig-chain-ledger {
    min-width: 0;
}

.wkb-sig-chain-toolbar {
    padding: 0.4rem 0.55rem 0;
    background: #e8e3da;
    border: 1px solid #d4cdc2;
    border-bottom: none;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.wkb-sig-chain-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.15rem;
}

.wkb-sig-chain-tab {
    flex: 0 0 auto;
    margin: 0 0 -1px;
    padding: 0.45rem 0.8rem 0.55rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: #5a5248;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    cursor: pointer;
    appearance: none;
}

.wkb-sig-chain-tab.is-active {
    background: #fff;
    color: var(--cfde-ink, #33363d);
    font-weight: 700;
    border-color: #d4cdc2;
    border-bottom: 1px solid #fff;
    z-index: 1;
}

.wkb-sig-chain-tab:not(.is-active):hover {
    background: rgba(255, 255, 255, 0.45);
}

.wkb-sig-chain-panel {
    padding: 0.65rem 0.55rem 0.75rem;
    border: 1px solid #d4cdc2;
    border-top: none;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    background: #fff;
}

.wkb-sig-chain-edge-line {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
}

.wkb-sig-chain-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
}

.wkb-sig-chain-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #ddd;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    animation: wkb-sig-chain-spin 0.8s linear infinite;
    flex-shrink: 0;
}

@keyframes wkb-sig-chain-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-sig-chain-error {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #fff0f0;
    color: #8b2e2e;
    font-size: 12px;
    line-height: 1.45;
}
</style>
