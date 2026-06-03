<template>
    <div class="reveal-kg-workspace">
        <header class="rkw-header">
            <div class="rkw-brand">
                <span class="rkw-mark">REVEAL</span>
                <span class="rkw-title">KG Workspace</span>
            </div>
            <WorkspaceMenuBar @action="onMenuAction" />
        </header>

        <div class="rkw-stage">
            <WorkspaceCanvas
                :graph-nodes="canvasGraphNodes"
                :graph-edges="canvasGraphEdges"
                :contextual-edges="canvasContextualEdges"
                :graph-loading="graphLoading"
                :graph-error="graphError"
                :selected-node-id="selectedNodeId"
                :inspector-open="inspectorOpen"
                :retrieval-ledger="canvasRetrievalLedger"
                :table-add-busy="tableAddBusy"
                @node-click="onCanvasNodeClick"
                @toggle-inspector="inspectorOpen = !inspectorOpen"
                @graph-action="onGraphAction"
                @add-table-node="onAddTableNode"
            />
        </div>

        <WorkspaceLibraryModal
            :open="libraryOpen"
            :records="savedGraphs"
            :graph-store="graphStore"
            @close="closeLibrary"
            @load="onLibraryLoad"
            @duplicate="onLibraryDuplicate"
            @delete="onLibraryDelete"
            @exported="onLibraryExported"
            @imported="onLibraryImported"
        />
        <WorkspaceDocumentationModal
            :open="docsOpen"
            @close="closeDocumentation"
        />
        <WorkspaceWelcomeModal
            :open="welcomeOpen"
            :has-saved-graphs="savedGraphs.length > 0"
            @create="onWelcomeCreate"
            @load-library="onWelcomeLoadLibrary"
        />
        <WorkspaceInitialGraphModal
            :open="initialGraphOpen"
            :buckets="starterBuckets"
            :context="starterContext"
            :add-neighboring-nodes="addNeighboringNodes"
            :api-client="apiClient"
            :llm-available="llmAvailable"
            @update:buckets="starterBuckets = $event"
            @update:context="starterContext = $event"
            @update:addNeighboringNodes="addNeighboringNodes = $event"
            @reset="resetStarterBuilder"
            @close="closeInitialGraph"
            @continue="onInitialGraphContinue"
        />
        <WorkspaceSaveGraphModal
            :open="saveGraphOpen"
            :label="saveGraphLabel"
            :summary="graphSummary"
            :is-update="Boolean(loadedSavedGraphId)"
            @close="closeSaveGraph"
            @save="onSaveGraphConfirm"
        />

        <transition name="rkw-fade">
            <div v-if="lastActionLabel" class="rkw-action-status">
                {{ lastActionLabel }}
            </div>
        </transition>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import userUtils from "@/utils/userUtils.js";
import revealKgApi from "@/utils/revealKgApi.js";
import WorkspaceMenuBar from "./revealKgWorkspace/WorkspaceMenuBar.vue";
import WorkspaceCanvas from "./revealKgWorkspace/WorkspaceCanvas.vue";
import WorkspaceLibraryModal from "./revealKgWorkspace/WorkspaceLibraryModal.vue";
import WorkspaceDocumentationModal from "./revealKgWorkspace/WorkspaceDocumentationModal.vue";
import WorkspaceWelcomeModal from "./revealKgWorkspace/WorkspaceWelcomeModal.vue";
import WorkspaceInitialGraphModal from "./revealKgWorkspace/WorkspaceInitialGraphModal.vue";
import WorkspaceSaveGraphModal from "./revealKgWorkspace/WorkspaceSaveGraphModal.vue";
import {
    addNodesToWorkspaceGraph,
    anchorItemsFromBuckets,
    buildInitialGraphFromAnchors,
    fetchContextualEdgesForGraph,
    normalizeWorkspaceGraph,
} from "./revealKgWorkspace/revealKgGraphBootstrap.js";
import {
    emptyStarterBuckets,
    formatStarterCountSummary,
    totalStarterCount,
} from "./revealKgWorkspace/revealKgEntityUtils.js";

Vue.use(BootstrapVueIcons);
Vue.use(BootstrapVue);

export default Vue.component("reveal-kg-workspace", {
    components: {
        WorkspaceMenuBar,
        WorkspaceCanvas,
        WorkspaceLibraryModal,
        WorkspaceDocumentationModal,
        WorkspaceWelcomeModal,
        WorkspaceInitialGraphModal,
        WorkspaceSaveGraphModal,
    },
    props: {
        phenotypesInUse: {
            type: [Array, Object],
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: [Array, Object],
            default: () => ({}),
        },
    },
    data() {
        return {
            inspectorOpen: false,
            libraryOpen: false,
            docsOpen: false,
            savedGraphs: [],
            activeSession: null,
            loadedSavedGraphId: null,
            lastActionLabel: "",
            lastActionTimer: null,
            welcomeOpen: true,
            initialGraphOpen: false,
            starterBuckets: emptyStarterBuckets(),
            starterContext: "",
            addNeighboringNodes: true,
            llmAvailable: false,
            graphLoading: false,
            graphError: "",
            selectedNodeId: null,
            contextualFetchTimer: null,
            contextualFetchSignature: "",
            tableAddBusy: false,
            saveGraphOpen: false,
        };
    },
    computed: {
        saveGraphLabel() {
            return this.activeSession?.label || "Untitled graph";
        },
        graphStore() {
            return this.utilsBox?.userUtils || userUtils;
        },
        apiClient() {
            return this.utilsBox?.revealKgApi || revealKgApi;
        },
        graphSummary() {
            if (!this.activeSession?.graphNodes?.length) {
                return "";
            }
            const nodeCount = this.activeSession.graphNodes.length;
            const edgeCount = (this.activeSession.graphEdges || []).length;
            const contextualCount = (this.activeSession.contextualEdges || []).length;
            const anchorCount = this.activeSession.graphNodes.filter((node) => node.is_anchor).length;
            const neighborCount = Math.max(0, nodeCount - anchorCount);
            const parts = [
                `${nodeCount} node${nodeCount === 1 ? "" : "s"}`,
                `${edgeCount} edge${edgeCount === 1 ? "" : "s"}`,
            ];
            if (contextualCount) {
                parts.push(`${contextualCount} contextual`);
            }
            if (anchorCount) {
                parts.push(`${anchorCount} starting`);
            }
            if (neighborCount) {
                parts.push(`${neighborCount} neighbor${neighborCount === 1 ? "" : "s"}`);
            }
            return parts.join(" · ");
        },
        canvasGraphNodes() {
            return this.activeSession?.graphNodes || [];
        },
        canvasGraphEdges() {
            return this.activeSession?.graphEdges || [];
        },
        canvasContextualEdges() {
            return this.activeSession?.contextualEdges || [];
        },
        canvasRetrievalLedger() {
            return this.activeSession?.retrievalLedger || {};
        },
        contextualGraphSignature() {
            const nodes = (this.activeSession?.graphNodes || [])
                .map((node) => node.id)
                .sort()
                .join("|");
            const edges = (this.activeSession?.graphEdges || [])
                .map((edge) => edge.id)
                .sort()
                .join("|");
            return `${nodes}::${edges}`;
        },
    },
    watch: {
        contextualGraphSignature() {
            this.scheduleContextualEdgesFetch();
        },
    },
    created() {
        this.refreshSavedGraphs();
        this.bootstrapInteractiveApi();
    },
    beforeDestroy() {
        if (this.lastActionTimer) {
            clearTimeout(this.lastActionTimer);
        }
        if (this.contextualFetchTimer) {
            clearTimeout(this.contextualFetchTimer);
        }
    },
    methods: {
        async bootstrapInteractiveApi() {
            if (!this.apiClient?.getInteractiveHealth) {
                return;
            }
            try {
                const health = await this.apiClient.getInteractiveHealth();
                this.llmAvailable = Boolean(health?.llm_available);
            } catch (error) {
                this.llmAvailable = false;
                this.showStatus("Interactive API not reachable yet.", 3200);
            }
        },
        onWelcomeCreate() {
            this.openInitialGraphSetup({ reset: true });
        },
        openInitialGraphSetup({ reset = false } = {}) {
            this.welcomeOpen = false;
            this.libraryOpen = false;
            this.docsOpen = false;
            this.initialGraphOpen = true;
            this.graphError = "";
            if (reset) {
                this.resetStarterBuilder();
                this.activeSession = null;
                this.loadedSavedGraphId = null;
            }
        },
        onWelcomeLoadLibrary() {
            if (!this.savedGraphs.length) {
                return;
            }
            this.welcomeOpen = false;
            this.openLibrary();
        },
        closeInitialGraph() {
            this.initialGraphOpen = false;
            if (!this.activeSession && totalStarterCount(this.starterBuckets) === 0) {
                this.welcomeOpen = true;
            }
        },
        resetStarterBuilder() {
            this.starterBuckets = emptyStarterBuckets();
            this.starterContext = "";
            this.addNeighboringNodes = true;
        },
        async onInitialGraphContinue({ buckets, context, addNeighboringNodes }) {
            this.starterBuckets = buckets;
            this.starterContext = context;
            this.addNeighboringNodes = addNeighboringNodes !== false;
            this.initialGraphOpen = false;
            this.graphError = "";
            this.selectedNodeId = null;

            const anchorItems = anchorItemsFromBuckets(buckets);
            const parts = formatStarterCountSummary(buckets);
            this.graphLoading = true;
            this.activeSession = {
                label: "New graph",
                graphNodes: [],
                graphEdges: [],
                contextualEdges: [],
                retrievalLedger: {},
                context: context || "",
                starterBuckets: buckets,
                anchorItems,
                addNeighboringNodes: this.addNeighboringNodes,
            };
            this.loadedSavedGraphId = null;

            try {
                const built = await buildInitialGraphFromAnchors({
                    apiClient: this.apiClient,
                    anchorItems,
                    context: context || "",
                    addNeighboringNodes: this.addNeighboringNodes,
                });
                this.activeSession = {
                    ...this.activeSession,
                    graphNodes: built.graphNodes,
                    graphEdges: built.graphEdges,
                    contextualEdges: [],
                    retrievalLedger: built.retrievalLedger || {},
                    anchorItems: built.anchorItems,
                    context: built.context,
                };
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.showStatus(
                    `Built graph with ${parts.join(", ")}`,
                    3200
                );
            } catch (error) {
                this.graphError = String(error?.message || error);
                this.activeSession = null;
                this.showStatus("Could not build graph.", 3200);
            } finally {
                this.graphLoading = false;
            }
        },
        onCanvasNodeClick(nodeId) {
            this.selectedNodeId = nodeId;
            this.inspectorOpen = true;
        },
        onGraphAction(action) {
            const labels = {
                expand: "Expand KG",
                filter: "Filter KG",
            };
            this.showStatus(`Triggered: ${labels[action] || action}`);
        },
        async onAddTableNode(row) {
            if (!this.activeSession || !row?.node_id) {
                return;
            }
            this.tableAddBusy = true;
            this.graphLoading = true;
            try {
                const next = await addNodesToWorkspaceGraph(
                    this.apiClient,
                    this.activeSession,
                    [row]
                );
                this.activeSession = {
                    ...this.activeSession,
                    graphNodes: next.graphNodes,
                    graphEdges: next.graphEdges,
                    retrievalLedger: next.retrievalLedger,
                };
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.showStatus(`Added ${row.label || row.node_id} to the graph.`, 2800);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not add node.",
                    3200
                );
            } finally {
                this.tableAddBusy = false;
                this.graphLoading = false;
            }
        },
        scheduleContextualEdgesFetch({ immediate = false } = {}) {
            if (this.contextualFetchTimer) {
                clearTimeout(this.contextualFetchTimer);
                this.contextualFetchTimer = null;
            }
            const delayMs = immediate ? 0 : 400;
            this.contextualFetchTimer = setTimeout(() => {
                this.contextualFetchTimer = null;
                this.loadContextualEdges();
            }, delayMs);
        },
        async loadContextualEdges() {
            const session = this.activeSession;
            if (!session?.graphNodes?.length) {
                return;
            }
            const signature = this.contextualGraphSignature;
            if (signature === this.contextualFetchSignature) {
                return;
            }
            this.contextualFetchSignature = signature;
            try {
                const contextualEdges = await fetchContextualEdgesForGraph(
                    this.apiClient,
                    session.graphNodes,
                    session.graphEdges
                );
                if (!this.activeSession || this.contextualGraphSignature !== signature) {
                    return;
                }
                this.activeSession = {
                    ...this.activeSession,
                    contextualEdges,
                };
            } catch (error) {
                if (this.activeSession && this.contextualGraphSignature === signature) {
                    this.activeSession = {
                        ...this.activeSession,
                        contextualEdges: [],
                    };
                }
            }
        },
        refreshSavedGraphs() {
            this.savedGraphs = this.graphStore.listGraphs();
        },
        openLibrary() {
            this.refreshSavedGraphs();
            this.libraryOpen = true;
        },
        closeLibrary() {
            this.libraryOpen = false;
        },
        openDocumentation() {
            this.docsOpen = true;
        },
        closeDocumentation() {
            this.docsOpen = false;
        },
        showStatus(message, durationMs = 2800) {
            this.lastActionLabel = message;
            if (this.lastActionTimer) {
                clearTimeout(this.lastActionTimer);
            }
            this.lastActionTimer = setTimeout(() => {
                this.lastActionLabel = "";
            }, durationMs);
        },
        onMenuAction(payload) {
            if (payload.menu === "library" && payload.action === "open") {
                this.openLibrary();
                return;
            }
            if (payload.menu === "documentation" && payload.action === "open") {
                this.openDocumentation();
                return;
            }
            if (payload.menu === "save" && payload.action === "newGraph") {
                this.openInitialGraphSetup({ reset: true });
                return;
            }
            if (payload.menu === "save" && payload.action === "saveKg") {
                this.openSaveGraph();
                return;
            }
            this.showStatus(`Triggered: ${payload.label}`);
        },
        openSaveGraph() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Nothing to save — build a graph first.", 3200);
                return;
            }
            this.saveGraphOpen = true;
        },
        closeSaveGraph() {
            this.saveGraphOpen = false;
        },
        onSaveGraphConfirm({ label }) {
            const session = {
                ...this.activeSession,
                label,
                contextualEdgeSignature: this.contextualGraphSignature,
            };
            let record;
            if (this.loadedSavedGraphId) {
                record = this.graphStore.updateGraphFromSession(this.loadedSavedGraphId, session, {
                    label,
                });
            } else {
                record = this.graphStore.saveGraphFromSession(session, { label });
            }
            this.saveGraphOpen = false;
            if (!record) {
                this.showStatus("Could not save graph.", 3200);
                return;
            }
            this.loadedSavedGraphId = record.id;
            this.activeSession = {
                ...this.activeSession,
                label: record.label,
                contextualEdgeSignature: this.contextualGraphSignature,
            };
            this.refreshSavedGraphs();
            this.showStatus(`Saved "${record.label}"`, 3200);
        },
        onLibraryLoad(record) {
            const session = this.graphStore.sessionFromGraph(record);
            if (!session) {
                this.showStatus("Could not load that graph.");
                return;
            }
            const normalized = normalizeWorkspaceGraph(session.graphNodes, session.graphEdges);
            this.activeSession = {
                ...session,
                graphNodes: normalized.graphNodes,
                graphEdges: normalized.graphEdges,
                contextualEdges: session.contextualEdges || [],
                retrievalLedger: session.retrievalLedger || {},
                contextualEdgeSignature: session.contextualEdgeSignature || "",
            };
            this.contextualFetchSignature = session.contextualEdgeSignature || "";
            if (
                !session.contextualEdges?.length &&
                this.contextualGraphSignature !== this.contextualFetchSignature
            ) {
                this.scheduleContextualEdgesFetch({ immediate: true });
            }
            this.loadedSavedGraphId = record.id;
            this.graphError = "";
            this.graphLoading = false;
            this.selectedNodeId = null;
            this.welcomeOpen = false;
            this.initialGraphOpen = false;
            this.closeLibrary();
            this.showStatus(`Loaded "${record.label}"`);
        },
        onLibraryDuplicate(record) {
            const copy = this.graphStore.duplicateGraph(record.id);
            if (!copy) {
                this.showStatus("Could not duplicate that graph.");
                return;
            }
            this.refreshSavedGraphs();
            this.showStatus(`Duplicated as "${copy.label}"`);
        },
        onLibraryDelete(record) {
            this.graphStore.deleteGraph(record.id);
            if (this.loadedSavedGraphId === record.id) {
                this.activeSession = null;
                this.loadedSavedGraphId = null;
            }
            this.refreshSavedGraphs();
            this.showStatus(`Deleted "${record.label}"`);
        },
        onLibraryExported(result) {
            if (result?.ok) {
                this.showStatus(
                    `Exported ${result.graphCount} graph${result.graphCount === 1 ? "" : "s"}`,
                    3200
                );
            }
        },
        onLibraryImported(result) {
            this.refreshSavedGraphs();
            if (result?.ok) {
                this.showStatus(
                    `Imported ${result.imported} graph${result.imported === 1 ? "" : "s"} into Library`,
                    3200
                );
            }
        },
    },
});
</script>

<style>
.reveal-kg-workspace {
    --cfde-orange: #e07b39;
    --cfde-orange-dark: #c2662b;
    --cfde-orange-soft: #fbeee3;
    --cfde-blue: #2c5c97;
    --cfde-border: #e6e1d6;
    --cfde-bg: #f6f5f2;
    --cfde-ink: #33363d;
    --cfde-muted: #6b6b6b;

    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
    min-height: 560px;
    border: 1px solid var(--cfde-border);
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    position: relative;
}

.rkw-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #ffffff;
    z-index: 7;
}

.rkw-brand {
    display: flex;
    align-items: baseline;
    gap: 7px;
}

.rkw-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange);
    font-size: 1.05rem;
}

.rkw-title {
    font-weight: 600;
    color: var(--cfde-blue);
    font-size: 1.05rem;
}

.rkw-stage {
    position: relative;
    flex: 1;
    min-height: 0;
}

.rkw-action-status {
    position: absolute;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    background: rgba(42, 42, 42, 0.92);
    color: #fff;
    font-size: 13px;
    padding: 7px 14px;
    border-radius: 999px;
    z-index: 8;
    pointer-events: none;
}

.rkw-fade-enter-active,
.rkw-fade-leave-active {
    transition: opacity 0.18s ease;
}

.rkw-fade-enter,
.rkw-fade-leave-to {
    opacity: 0;
}
</style>
