<template>
    <div class="reveal-kg-workspace">
        <header class="rkw-header">
            <div class="rkw-brand">
                <span class="rkw-mark">REVEAL</span>
                <span class="rkw-title">KG Canvas</span>
            </div>
            <WorkspaceMenuBar @action="onMenuAction" />
        </header>

        <div class="rkw-stage">
            <WorkspaceExplanationBubble
                :visible="explanationBubbleVisible"
                :entries="savedGraphExplanations"
                @open-explanation="openSavedExplanation"
            />
            <WorkspaceCanvas
                :graph-nodes="canvasGraphNodes"
                :graph-edges="canvasGraphEdges"
                :contextual-edges="canvasContextualEdges"
                :graph-loading="graphLoading"
                :graph-error="graphError"
                :selected-node-id="selectedNodeId"
                :selected-edge-id="selectedEdgeId"
                :key-node-ids="canvasKeyNodeIds"
                :node-ids-with-evidence="nodeIdsWithEvidence"
                :edge-keys-with-evidence="edgeKeysWithEvidence"
                :selected-node-detail="selectedNodeDetail"
                :selected-edge-detail="selectedEdgeDetail"
                :gene-inspector-context="geneInspectorContext"
                :trait-inspector-context="traitInspectorContext"
                :mechanism-inspector-context="mechanismInspectorContext"
                :gene-set-inspector-context="geneSetInspectorContext"
                :expression-options="expressionOptions"
                :api-client="apiClient"
                :inspector-open="inspectorOpen"
                :retrieval-ledger="canvasRetrievalLedger"
                :table-add-busy="tableAddBusy"
                :inspector-content-key="inspectorContentKey"
                :graph-reminder="graphReminder"
                @node-menu-open="onNodeMenuOpen"
                @edge-menu-open="onEdgeMenuOpen"
                @toggle-inspector="onToggleInspector"
                @close-inspector="inspectorOpen = false"
                @graph-action="onGraphAction"
                @add-table-node="onAddTableNode"
                @remove-table-node="onRemoveTableNode"
                @cache-node-connections="onCacheNodeConnections"
                @cache-node-expression="onCacheNodeExpression"
                @cache-factor-loadings="onCacheFactorLoadings"
                @load-factor-loadings="onLoadFactorLoadings"
                @inspect-connected-edge="onEdgeActionInspect"
                @inspect-connected-node="onNodeActionInspect"
                @graph-reminder-action="onGraphReminderAction"
                @graph-reminder-dismiss="dismissGraphReminder"
            />
        </div>

        <WorkspaceNodeActionMenu
            :open="Boolean(nodeActionMenu)"
            :node="nodeActionMenu"
            :left="nodeActionMenu ? nodeActionMenu.left : 0"
            :top="nodeActionMenu ? nodeActionMenu.top : 0"
            :can-remove="
                nodeActionMenu
                    ? canRemoveGraphNode(activeSession, nodeActionMenu.nodeId)
                    : false
            "
            :is-key-node="
                nodeActionMenu
                    ? checkKeyNode(activeSession, nodeActionMenu.nodeId)
                    : false
            "
            @close="closeNodeActionMenu"
            @inspect="onNodeActionInspect"
            @remove-node="onNodeActionRemove"
            @expand="onNodeActionExpand"
            @toggle-key-node="onNodeActionToggleKeyNode"
        />

        <WorkspaceEdgeActionMenu
            :open="Boolean(edgeActionMenu)"
            :edge="edgeActionMenu"
            :left="edgeActionMenu ? edgeActionMenu.left : 0"
            :top="edgeActionMenu ? edgeActionMenu.top : 0"
            @close="closeEdgeActionMenu"
            @inspect="onEdgeActionInspect"
            @expand="onEdgeActionExpand"
        />

        <WorkspaceRemoveNodeConfirmModal
            :open="Boolean(pendingRemoveNode)"
            :node-label="pendingRemoveNodeLabel"
            :edge-count="pendingRemoveEdgeCount"
            @close="cancelRemoveNode"
            @confirm="confirmRemoveNode"
        />

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
            @import-graph="onWelcomeImportGraph"
        />
        <WorkspaceInitialGraphModal
            :open="initialGraphOpen"
            :buckets="starterBuckets"
            :context="starterContext"
            :add-neighboring-nodes="addNeighboringNodes"
            :api-client="apiClient"
            :llm-available="llmAvailable"
            :duplicate-source-label="duplicateSourceLabel"
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
            :completion-message="saveGraphCompletionMessage"
            @close="closeSaveGraph"
            @save="onSaveGraphConfirm"
        />
        <WorkspaceExportGraphModal
            :open="exportGraphOpen"
            :default-filename="exportGraphDefaultFilename"
            :summary="graphSummary"
            :exporting="exportGraphBusy"
            @close="closeExportGraph"
            @export="onExportGraphConfirm"
        />
        <WorkspaceExplainGraphModal
            :open="explainGraphOpen"
            :entry="activeGraphInterpretation"
            :scope="explainScope"
            :helper-text="explainHelperText"
            :loading="graphInterpretationLoading"
            :llm-available="llmAvailable"
            :explain-intent="explainIntentValue"
            :key-node-count="explainKeyNodeCount"
            :node-count="explainNodeCount"
            :edge-count="explainEdgeCount"
            :contextual-edge-count="explainContextualEdgeCount"
            :key-node-ids="canvasKeyNodeIds"
            @close="closeExplainGraph"
            @update:scope="onExplainScopeChange"
            @update:explainIntent="onExplainIntentChange"
            @update-entry="onExplainEntryPatch"
            @run="runGraphExplanation"
            @add-suggested-key-node="onExplainAddSuggestedKeyNode"
            @add-all-suggested-key-nodes="onExplainAddAllSuggestedKeyNodes"
        />

        <input
            ref="graphImportFileInput"
            type="file"
            accept=".json,application/json"
            class="rkw-graph-import-input"
            @change="onGraphImportFileChange"
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
import WorkspaceExportGraphModal from "./revealKgWorkspace/WorkspaceExportGraphModal.vue";
import WorkspaceExplainGraphModal from "./revealKgWorkspace/WorkspaceExplainGraphModal.vue";
import WorkspaceExplanationBubble from "./revealKgWorkspace/WorkspaceExplanationBubble.vue";
import WorkspaceNodeActionMenu from "./revealKgWorkspace/WorkspaceNodeActionMenu.vue";
import WorkspaceEdgeActionMenu from "./revealKgWorkspace/WorkspaceEdgeActionMenu.vue";
import WorkspaceRemoveNodeConfirmModal from "./revealKgWorkspace/WorkspaceRemoveNodeConfirmModal.vue";
import {
    addNodesToGraphLocally,
    addKeyNodesBatch,
    addNodesToWorkspaceGraph,
    anchorItemsFromBuckets,
    buildInitialGraphFromAnchors,
    canRemoveGraphNode,
    countConnectedEdgesForNode,
    expandGraphFromEdge,
    expandGraphFromNode,
    fetchContextualEdgesForGraph,
    findGraphNode,
    findSessionEdge,
    graphNodeToAnchorItem,
    isInspectableEdge,
    isKeyNode,
    keyNodeItemsFromSession,
    normalizeKeyNodeIds,
    normalizeWorkspaceGraph,
    rebuildGraphFromPendingAdds,
    removeNodesFromWorkspaceGraph,
    toggleKeyNode,
    withNormalizedKeyNodes,
} from "./revealKgWorkspace/revealKgGraphBootstrap.js";
import {
    emptyStarterBuckets,
    formatStarterCountSummary,
    starterBucketsFromSession,
    totalStarterCount,
} from "./revealKgWorkspace/revealKgEntityUtils.js";
import {
    hierarchyEdgeKeysWithInspectorEvidence,
    isGeneInspectorNode,
    isGeneSetInspectorNode,
    isMechanismInspectorNode,
    isTraitInspectorNode,
    nodeIdsWithInspectorEvidence,
} from "./revealKgWorkspace/revealKgInspectorUtils.js";
import {
    buildGraphSigChainForFactor,
    buildGraphSigChainForTrait,
} from "./revealKgWorkspace/revealKgSigChainUtils.js";
import {
    EXPLAIN_SCOPE,
    buildExplanationDraft,
    successfulGraphExplanations,
    patchExplanationEntry,
    explanationApiPayload,
    parseSuggestedKeyNodesFromInterpretation,
    interpretationMarkdownForDisplay,
} from "./revealKgWorkspace/revealKgExplainUtils.js";
import {
    REMINDER_ACTION,
    REMINDER_ID,
    NODES_ADDED_SAVE_THRESHOLD,
    REMINDER_AUTO_DISMISS_MS,
    GRAPH_REBUILD_DELAY_MS,
    buildAfterAnalysisPersistReminder,
    buildAfterSaveExportReminder,
    buildExpandGraphReminder,
    buildImportGraphReminder,
    buildLibraryLoadReminder,
    buildNewGraphReminder,
    buildNodesAddedSaveReminder,
    buildPendingGraphRebuildReminder,
    createGraphReminderTracker,
    dismissActiveReminder,
    markReminderShown,
    syncSaveBaseline,
    nodesAddedSinceSave,
    tryShowReminder,
} from "./revealKgWorkspace/revealKgReminders.js";

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
        WorkspaceExportGraphModal,
        WorkspaceExplainGraphModal,
        WorkspaceExplanationBubble,
        WorkspaceNodeActionMenu,
        WorkspaceEdgeActionMenu,
        WorkspaceRemoveNodeConfirmModal,
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
            selectedEdgeId: null,
            selectedEdgeRef: null,
            edgeProvenanceLoadingId: null,
            traitSigChainLoadingNodeId: null,
            mechanismSigChainLoadingNodeId: null,
            factorLoadingsLoadingNodeId: null,
            contextualFetchTimer: null,
            contextualFetchSignature: "",
            tableAddBusy: false,
            saveGraphOpen: false,
            exportGraphOpen: false,
            exportGraphBusy: false,
            duplicateFlowActive: false,
            duplicateSourceLabel: "",
            nodeActionMenu: null,
            edgeActionMenu: null,
            pendingRemoveNode: null,
            expressionOptions: null,
            inspectorInspectSeq: 0,
            graphReminderState: { active: null },
            graphReminderTracker: createGraphReminderTracker(),
            graphReminderAutoDismissTimer: null,
            graphRebuildTimer: null,
            graphRebuildBusy: false,
            explainGraphOpen: false,
            explainScope: EXPLAIN_SCOPE.KEY_NODES,
        };
    },
    computed: {
        inspectorContentKey() {
            return [
                this.inspectorInspectSeq,
                this.selectedEdgeId || "",
                this.selectedNodeId || "",
            ].join(":");
        },
        saveGraphLabel() {
            if (this.duplicateFlowActive) {
                const base = String(this.duplicateSourceLabel || "Untitled graph").trim();
                return `${base} (copy)`;
            }
            return this.activeSession?.label || "Untitled graph";
        },
        exportGraphDefaultFilename() {
            const label = this.activeSession?.label || this.saveGraphLabel || "graph";
            if (this.graphStore.defaultGraphExportFilename) {
                return this.graphStore.defaultGraphExportFilename(label);
            }
            return `reveal-kg-graph-export.json`;
        },
        saveGraphCompletionMessage() {
            if (this.duplicateFlowActive) {
                return "Save the graph to complete the duplication process.";
            }
            return "";
        },
        pendingRemoveNodeLabel() {
            if (!this.pendingRemoveNode?.nodeId || !this.activeSession) {
                return "";
            }
            const graphNode = (this.activeSession.graphNodes || []).find(
                (entry) =>
                    entry.id === this.pendingRemoveNode.nodeId ||
                    entry.node_id === this.pendingRemoveNode.nodeId
            );
            return (
                graphNode?.label ||
                this.pendingRemoveNode.label ||
                this.pendingRemoveNode.nodeId
            );
        },
        pendingRemoveEdgeCount() {
            if (!this.pendingRemoveNode?.nodeId || !this.activeSession) {
                return 0;
            }
            return countConnectedEdgesForNode(
                this.activeSession,
                this.pendingRemoveNode.nodeId
            );
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
            const keyNodeCount = normalizeKeyNodeIds(this.activeSession).length;
            const neighborCount = Math.max(0, nodeCount - keyNodeCount);
            const parts = [
                `${nodeCount} node${nodeCount === 1 ? "" : "s"}`,
                `${edgeCount} edge${edgeCount === 1 ? "" : "s"}`,
            ];
            if (contextualCount) {
                parts.push(`${contextualCount} contextual`);
            }
            if (keyNodeCount) {
                parts.push(`${keyNodeCount} key`);
            }
            if (neighborCount) {
                parts.push(`${neighborCount} neighbor${neighborCount === 1 ? "" : "s"}`);
            }
            return parts.join(" · ");
        },
        graphInterpretationLoading() {
            return Boolean(this.activeSession?.graphInterpretationLoading);
        },
        activeGraphInterpretation() {
            return this.activeSession?.graphInterpretation || null;
        },
        savedGraphExplanations() {
            return successfulGraphExplanations(this.activeSession);
        },
        explanationBubbleVisible() {
            return (
                !this.explainGraphOpen &&
                this.savedGraphExplanations.length > 0 &&
                Boolean(this.activeSession?.graphNodes?.length)
            );
        },
        explainHelperText() {
            return this.activeGraphInterpretation?.helper_text || "";
        },
        explainIntentValue() {
            return this.activeSession?.controls?.explainIntent || "";
        },
        explainKeyNodeCount() {
            return normalizeKeyNodeIds(this.activeSession).length;
        },
        explainNodeCount() {
            return this.activeSession?.graphNodes?.length || 0;
        },
        explainEdgeCount() {
            return (this.activeSession?.graphEdges || []).length;
        },
        explainContextualEdgeCount() {
            return (this.activeSession?.contextualEdges || []).length;
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
        canvasKeyNodeIds() {
            return normalizeKeyNodeIds(this.activeSession);
        },
        graphReminder() {
            return this.graphReminderState?.active || null;
        },
        nodeIdsWithEvidence() {
            return nodeIdsWithInspectorEvidence(this.activeSession);
        },
        edgeKeysWithEvidence() {
            return hierarchyEdgeKeysWithInspectorEvidence(this.activeSession);
        },
        selectedNodeDetail() {
            if (!this.selectedNodeId || !this.activeSession) {
                return null;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (!node) {
                return null;
            }
            const ledger = this.activeSession.retrievalLedger?.[node.id] || {};
            const nodeType = String(node.node_type || node.type || "").toLowerCase();
            const typeLabels = {
                gene: "Gene",
                gene_set: "Gene set",
                factor: "Mechanism",
                trait: "Trait",
            };
            return {
                id: node.id,
                label: node.label || node.id,
                nodeType: typeLabels[nodeType] || nodeType || "",
                isKeyNode: isKeyNode(this.activeSession, node.id),
                subtitle: node.subtitle || ledger.subtitle || "",
                rationale: ledger.rationale || node.rationale || "",
            };
        },
        geneInspectorContext() {
            if (!this.selectedNodeId || !this.activeSession || this.selectedEdgeId) {
                return null;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (!node || !isGeneInspectorNode(node)) {
                return null;
            }
            const ledger = this.activeSession.retrievalLedger?.[node.id] || {};
            return {
                node,
                keyNodeItems: keyNodeItemsFromSession(this.activeSession),
                sessionContext: this.activeSession.context || "",
                graphNodes: this.activeSession.graphNodes || [],
                graphEdges: this.activeSession.graphEdges || [],
                contextualEdges: this.activeSession.contextualEdges || [],
                connectionCache:
                    this.activeSession.nodeConnectionEvidenceCache?.[node.id] || {},
                expressionCache:
                    this.activeSession.nodeExpressionProfileCache?.[node.id] || {},
                preferredExpressionReferenceId:
                    this.activeSession.nodeExpressionReferenceById?.[node.id] || "",
                rationale: ledger.rationale || node.rationale || "",
            };
        },
        traitInspectorContext() {
            if (!this.selectedNodeId || !this.activeSession || this.selectedEdgeId) {
                return null;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (!node || !isTraitInspectorNode(node)) {
                return null;
            }
            const ledger = this.activeSession.retrievalLedger?.[node.id] || {};
            const sigChainEntry =
                this.activeSession.nodeSigChainPacketCache?.[node.id] || null;
            return {
                node,
                keyNodeItems: keyNodeItemsFromSession(this.activeSession),
                sessionContext: this.activeSession.context || "",
                graphNodes: this.activeSession.graphNodes || [],
                graphEdges: this.activeSession.graphEdges || [],
                contextualEdges: this.activeSession.contextualEdges || [],
                connectionCache:
                    this.activeSession.nodeConnectionEvidenceCache?.[node.id] || {},
                sigChainPacket: sigChainEntry?.packet || null,
                sigChainError: sigChainEntry?.error || "",
                sigChainLoading: this.traitSigChainLoadingNodeId === node.id,
                rationale: ledger.rationale || node.rationale || "",
            };
        },
        mechanismInspectorContext() {
            if (!this.selectedNodeId || !this.activeSession || this.selectedEdgeId) {
                return null;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (!node || !isMechanismInspectorNode(node)) {
                return null;
            }
            const sigChainEntry =
                this.activeSession.nodeSigChainPacketCache?.[node.id] || null;
            const loadingsEntry =
                this.activeSession.nodeFactorLoadingsCache?.[node.id] || null;
            return {
                node,
                keyNodeItems: keyNodeItemsFromSession(this.activeSession),
                sessionContext: this.activeSession.context || "",
                graphNodes: this.activeSession.graphNodes || [],
                graphEdges: this.activeSession.graphEdges || [],
                contextualEdges: this.activeSession.contextualEdges || [],
                connectionCache:
                    this.activeSession.nodeConnectionEvidenceCache?.[node.id] || {},
                factorLoadingsCache: loadingsEntry,
                factorLoadingsError: loadingsEntry?.error || "",
                factorLoadingsLoading: this.factorLoadingsLoadingNodeId === node.id,
                sigChainPacket: sigChainEntry?.packet || null,
                sigChainError: sigChainEntry?.error || "",
                sigChainLoading: this.mechanismSigChainLoadingNodeId === node.id,
            };
        },
        geneSetInspectorContext() {
            if (!this.selectedNodeId || !this.activeSession || this.selectedEdgeId) {
                return null;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (!node || !isGeneSetInspectorNode(node)) {
                return null;
            }
            return {
                node,
                keyNodeItems: keyNodeItemsFromSession(this.activeSession),
                sessionContext: this.activeSession.context || "",
                graphNodes: this.activeSession.graphNodes || [],
                graphEdges: this.activeSession.graphEdges || [],
                contextualEdges: this.activeSession.contextualEdges || [],
                connectionCache:
                    this.activeSession.nodeConnectionEvidenceCache?.[node.id] || {},
            };
        },
        selectedEdgeDetail() {
            if (!this.selectedEdgeId || !this.activeSession) {
                return null;
            }
            const edgeRef = this.selectedEdgeRef || {
                edgeId: this.selectedEdgeId,
            };
            const edge = findSessionEdge(
                this.activeSession,
                edgeRef.edgeId,
                edgeRef.sourceId,
                edgeRef.targetId
            );
            if (!edge && !edgeRef.sourceId) {
                return null;
            }
            const sourceNode = (this.activeSession.graphNodes || []).find(
                (entry) => entry.id === (edge?.source || edgeRef.sourceId)
            );
            const targetNode = (this.activeSession.graphNodes || []).find(
                (entry) => entry.id === (edge?.target || edgeRef.targetId)
            );
            const sourceLabel = sourceNode?.label || edge?.source || edgeRef.sourceId;
            const targetLabel = targetNode?.label || edge?.target || edgeRef.targetId;
            const edgeKey = edge?.id || edgeRef.edgeId;
            const provenance = edgeKey
                ? this.activeSession?.edgeProvenanceById?.[edgeKey]
                : null;
            const score =
                edge?.normalized_score ?? edge?.weight ?? edge?.score ?? null;
            const scoreLabel =
                score === null || score === undefined || Number.isNaN(Number(score))
                    ? ""
                    : String(score);
            const inspectable = isInspectableEdge(edge || edgeRef.edge);
            let provenanceError = "";
            if (!inspectable) {
                provenanceError =
                    "Detailed provenance is available for gene–trait, gene–mechanism, and mechanism–trait edges.";
            } else if (provenance?.error) {
                provenanceError = provenance.error;
            }
            return {
                id: edgeKey,
                label: edgeRef.label || `${sourceLabel} → ${targetLabel}`,
                edgeType:
                    edge?.family || edge?.relation || edge?.label || (edgeRef.isContextual ? "Contextual" : ""),
                isContextual: Boolean(
                    edgeRef.isContextual || edge?.origin_tags?.includes?.("contextual")
                ),
                scoreLabel,
                provenanceLoading: this.edgeProvenanceLoadingId === edgeKey,
                provenanceError,
                provenancePayload:
                    inspectable && provenance && !provenance.error ? provenance : null,
            };
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
        this.bootstrapExpressionOptions();
    },
    beforeDestroy() {
        if (this.lastActionTimer) {
            clearTimeout(this.lastActionTimer);
        }
        if (this.contextualFetchTimer) {
            clearTimeout(this.contextualFetchTimer);
        }
        this.clearReminderAutoDismissTimer();
        this.clearGraphRebuildTimer();
    },
    methods: {
        canRemoveGraphNode,
        checkKeyNode(session, nodeId) {
            return isKeyNode(session, nodeId);
        },
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
        async bootstrapExpressionOptions() {
            if (!this.apiClient?.getInteractiveExpressionOptions) {
                return;
            }
            try {
                this.expressionOptions = await this.apiClient.getInteractiveExpressionOptions();
            } catch (error) {
                this.expressionOptions = null;
            }
        },
        onCacheNodeConnections({ nodeId, targetType, candidates }) {
            if (!this.activeSession || !nodeId || !targetType) {
                return;
            }
            const cache = {
                ...(this.activeSession.nodeConnectionEvidenceCache || {}),
            };
            const nodeCache = { ...(cache[nodeId] || {}) };
            nodeCache[targetType] = candidates;
            cache[nodeId] = nodeCache;
            this.activeSession = {
                ...this.activeSession,
                nodeConnectionEvidenceCache: cache,
            };
        },
        setEdgeProvenance(edgeId, value) {
            if (!this.activeSession || !edgeId) {
                return;
            }
            this.activeSession = {
                ...this.activeSession,
                edgeProvenanceById: {
                    ...(this.activeSession.edgeProvenanceById || {}),
                    [edgeId]: value,
                },
            };
        },
        onCacheNodeExpression({ nodeId, referenceId, payload, error }) {
            if (!this.activeSession || !nodeId || !referenceId) {
                return;
            }
            const profileCache = {
                ...(this.activeSession.nodeExpressionProfileCache || {}),
            };
            const nodeCache = { ...(profileCache[nodeId] || {}) };
            if (error) {
                nodeCache[referenceId] = { error: String(error) };
            } else {
                nodeCache[referenceId] = { payload: payload ?? null };
            }
            profileCache[nodeId] = nodeCache;
            const referenceByNode = {
                ...(this.activeSession.nodeExpressionReferenceById || {}),
                [nodeId]: referenceId,
            };
            this.activeSession = {
                ...this.activeSession,
                nodeExpressionProfileCache: profileCache,
                nodeExpressionReferenceById: referenceByNode,
            };
        },
        onWelcomeCreate() {
            this.clearDuplicateFlow();
            this.openInitialGraphSetup({ reset: true });
        },
        clearDuplicateFlow() {
            this.duplicateFlowActive = false;
            this.duplicateSourceLabel = "";
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
                this.clearDuplicateFlow();
                this.closeNodeActionMenu();
                this.closeEdgeActionMenu();
                this.selectedNodeId = null;
                this.selectedEdgeId = null;
                this.selectedEdgeRef = null;
                this.edgeProvenanceLoadingId = null;
                this.inspectorInspectSeq += 1;
            }
        },
        onWelcomeLoadLibrary() {
            if (!this.savedGraphs.length) {
                return;
            }
            this.welcomeOpen = false;
            this.openLibrary();
        },
        onWelcomeImportGraph() {
            this.welcomeOpen = false;
            this.onImportGraphClick();
        },
        closeInitialGraph() {
            this.initialGraphOpen = false;
            if (this.duplicateFlowActive) {
                this.resetStarterBuilder();
                this.clearDuplicateFlow();
            }
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
            this.inspectorInspectSeq += 1;

            const anchorItems = anchorItemsFromBuckets(buckets);
            const parts = formatStarterCountSummary(buckets);
            this.graphLoading = true;
            this.activeSession = {
                label: "New graph",
                graphNodes: [],
                graphEdges: [],
                contextualEdges: [],
                retrievalLedger: {},
                highlighted: [],
                nodeConnectionEvidenceCache: {},
                nodeExpressionProfileCache: {},
                nodeExpressionReferenceById: {},
                nodeSigChainPacketCache: {},
                nodeFactorLoadingsCache: {},
                edgeProvenanceById: {},
                graphInterpretations: [],
                graphInterpretation: null,
                graphInterpretationLoading: false,
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
                this.activeSession = withNormalizedKeyNodes({
                    ...this.activeSession,
                    graphNodes: built.graphNodes,
                    graphEdges: built.graphEdges,
                    contextualEdges: [],
                    retrievalLedger: built.retrievalLedger || {},
                    anchorItems: built.anchorItems,
                    context: built.context,
                    highlighted: built.highlighted || [],
                });
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                const statusMessage = this.duplicateFlowActive
                    ? `Built duplicate from ${parts.join(", ")}`
                    : `Built graph with ${parts.join(", ")}`;
                this.showStatus(statusMessage, 3200);
                this.resetGraphReminders(`build-${Date.now()}`);
                if (!this.duplicateFlowActive) {
                    this.queueGraphReminder(buildNewGraphReminder());
                }
                if (this.duplicateFlowActive) {
                    this.openSaveGraph();
                }
            } catch (error) {
                this.graphError = String(error?.message || error);
                this.activeSession = null;
                if (this.duplicateFlowActive) {
                    this.clearDuplicateFlow();
                }
                this.showStatus("Could not build graph.", 3200);
            } finally {
                this.graphLoading = false;
            }
        },
        onNodeMenuOpen(payload) {
            if (!payload?.nodeId) {
                return;
            }
            this.closeEdgeActionMenu();
            if (
                this.nodeActionMenu?.nodeId === payload.nodeId &&
                this.nodeActionMenu
            ) {
                this.closeNodeActionMenu();
                return;
            }
            this.nodeActionMenu = { ...payload };
        },
        closeNodeActionMenu() {
            this.nodeActionMenu = null;
        },
        onEdgeMenuOpen(payload) {
            if (!payload?.edgeId) {
                return;
            }
            this.closeNodeActionMenu();
            if (
                this.edgeActionMenu?.edgeId === payload.edgeId &&
                this.edgeActionMenu
            ) {
                this.closeEdgeActionMenu();
                return;
            }
            this.edgeActionMenu = { ...payload };
        },
        closeEdgeActionMenu() {
            this.edgeActionMenu = null;
        },
        onToggleInspector() {
            this.inspectorOpen = !this.inspectorOpen;
        },
        onNodeActionInspect(node) {
            if (!node?.nodeId) {
                return;
            }
            this.closeNodeActionMenu();
            this.inspectorInspectSeq += 1;
            this.selectedEdgeId = null;
            this.selectedEdgeRef = null;
            this.selectedNodeId = node.nodeId;
            this.inspectorOpen = true;
            const graphNode = findGraphNode(this.activeSession, node.nodeId);
            if (graphNode && isTraitInspectorNode(graphNode)) {
                void this.loadTraitSigChainPacket(graphNode);
            } else if (graphNode && isMechanismInspectorNode(graphNode)) {
                void this.loadMechanismSigChainPacket(graphNode);
                void this.loadFactorLoadings(graphNode);
            }
        },
        setNodeSigChainCache(nodeId, entry) {
            if (!this.activeSession || !nodeId) {
                return;
            }
            this.activeSession = {
                ...this.activeSession,
                nodeSigChainPacketCache: {
                    ...(this.activeSession.nodeSigChainPacketCache || {}),
                    [nodeId]: entry,
                },
            };
        },
        async loadTraitSigChainPacket(node) {
            if (!node?.id || !this.activeSession) {
                return;
            }
            const nodeId = node.id;
            const cached = this.activeSession.nodeSigChainPacketCache?.[nodeId];
            if (cached?.packet || cached?.error) {
                return;
            }
            if (!this.apiClient?.getInteractiveSigChainPacket) {
                this.setNodeSigChainCache(nodeId, {
                    error: "Association scores API is not configured.",
                });
                return;
            }
            const chain = buildGraphSigChainForTrait(node, this.activeSession);
            if (!chain?.nodes?.length) {
                this.setNodeSigChainCache(nodeId, {
                    error: "No graph neighborhood available to score for this trait.",
                });
                return;
            }
            this.traitSigChainLoadingNodeId = nodeId;
            try {
                const packet = await this.fetchSigChainPacket(node, chain);
                this.setNodeSigChainCache(nodeId, { packet: packet || null });
            } catch (error) {
                this.setNodeSigChainCache(nodeId, {
                    error:
                        String(error?.message || error) ||
                        "Could not load trait association scores.",
                });
            } finally {
                if (this.traitSigChainLoadingNodeId === nodeId) {
                    this.traitSigChainLoadingNodeId = null;
                }
            }
        },
        async loadMechanismSigChainPacket(node) {
            if (!node?.id || !this.activeSession) {
                return;
            }
            const nodeId = node.id;
            const cached = this.activeSession.nodeSigChainPacketCache?.[nodeId];
            if (cached?.packet || cached?.error) {
                return;
            }
            if (!this.apiClient?.getInteractiveSigChainPacket) {
                this.setNodeSigChainCache(nodeId, {
                    error: "Association scores API is not configured.",
                });
                return;
            }
            const chain = buildGraphSigChainForFactor(node, this.activeSession);
            if (!chain?.nodes?.length) {
                this.setNodeSigChainCache(nodeId, {
                    error:
                        "No graph neighborhood available to score for this mechanism.",
                });
                return;
            }
            this.mechanismSigChainLoadingNodeId = nodeId;
            try {
                const packet = await this.fetchSigChainPacket(node, chain);
                this.setNodeSigChainCache(nodeId, { packet: packet || null });
            } catch (error) {
                this.setNodeSigChainCache(nodeId, {
                    error:
                        String(error?.message || error) ||
                        "Could not load mechanism association scores.",
                });
            } finally {
                if (this.mechanismSigChainLoadingNodeId === nodeId) {
                    this.mechanismSigChainLoadingNodeId = null;
                }
            }
        },
        async fetchSigChainPacket(node, chain) {
            return this.apiClient.getInteractiveSigChainPacket({
                anchor_items: (() => {
                    const keyItems = keyNodeItemsFromSession(this.activeSession);
                    if (keyItems.length) {
                        return keyItems;
                    }
                    const fallback = graphNodeToAnchorItem(node);
                    return fallback ? [fallback] : [];
                })(),
                context: (this.activeSession.context || "").trim(),
                intent: "",
                chain,
                graph_nodes: this.activeSession.graphNodes || [],
                graph_edges: this.activeSession.graphEdges || [],
            });
        },
        setFactorLoadingsCache(nodeId, entry) {
            if (!this.activeSession || !nodeId) {
                return;
            }
            this.activeSession = {
                ...this.activeSession,
                nodeFactorLoadingsCache: {
                    ...(this.activeSession.nodeFactorLoadingsCache || {}),
                    [nodeId]: entry,
                },
            };
        },
        onCacheFactorLoadings({ nodeId, payload, error }) {
            if (!nodeId) {
                return;
            }
            if (error) {
                this.setFactorLoadingsCache(nodeId, { error: String(error) });
                return;
            }
            this.setFactorLoadingsCache(nodeId, { payload: payload ?? null });
        },
        onLoadFactorLoadings({ nodeId }) {
            const node = findGraphNode(this.activeSession, nodeId);
            if (node) {
                void this.loadFactorLoadings(node);
            }
        },
        async loadFactorLoadings(node) {
            if (!node?.id || !this.activeSession) {
                return;
            }
            const nodeId = node.id;
            const cached = this.activeSession.nodeFactorLoadingsCache?.[nodeId];
            if (cached?.payload || cached?.error) {
                return;
            }
            if (!this.apiClient?.getInteractiveFactorLoadings) {
                this.setFactorLoadingsCache(nodeId, {
                    error: "Factor loadings API is not configured.",
                });
                return;
            }
            this.factorLoadingsLoadingNodeId = nodeId;
            try {
                const payload = await this.apiClient.getInteractiveFactorLoadings(nodeId);
                this.setFactorLoadingsCache(nodeId, { payload: payload || null });
            } catch (error) {
                this.setFactorLoadingsCache(nodeId, {
                    error:
                        String(error?.message || error) ||
                        "Could not load factor loadings.",
                });
            } finally {
                if (this.factorLoadingsLoadingNodeId === nodeId) {
                    this.factorLoadingsLoadingNodeId = null;
                }
            }
        },
        onNodeActionRemove(node) {
            if (!node?.nodeId) {
                return;
            }
            if (!this.activeSession) {
                this.showStatus("Open or build a graph before removing nodes.", 2800);
                return;
            }
            if (!canRemoveGraphNode(this.activeSession, node.nodeId)) {
                this.showStatus(
                    "Key nodes cannot be removed. Remove from key nodes first.",
                    2800
                );
                this.closeNodeActionMenu();
                return;
            }
            this.closeNodeActionMenu();
            this.pendingRemoveNode = { ...node };
        },
        cancelRemoveNode() {
            this.pendingRemoveNode = null;
        },
        confirmRemoveNode() {
            const node = this.pendingRemoveNode;
            if (!this.activeSession || !node?.nodeId) {
                this.pendingRemoveNode = null;
                return;
            }
            const graphNode = (this.activeSession.graphNodes || []).find(
                (entry) => entry.id === node.nodeId || entry.node_id === node.nodeId
            );
            const label = graphNode?.label || node.label || node.nodeId;
            const nextSession = removeNodesFromWorkspaceGraph(this.activeSession, [
                node.nodeId,
            ]);
            this.activeSession = withNormalizedKeyNodes({
                ...nextSession,
                graphNodes: [...(nextSession.graphNodes || [])],
                graphEdges: [...(nextSession.graphEdges || [])],
                contextualEdges: [...(nextSession.contextualEdges || [])],
            });
            if (this.selectedNodeId === node.nodeId) {
                this.selectedNodeId = null;
            }
            if (
                this.selectedEdgeRef &&
                (node.nodeId === this.selectedEdgeRef.sourceId ||
                    node.nodeId === this.selectedEdgeRef.targetId)
            ) {
                this.selectedEdgeId = null;
                this.selectedEdgeRef = null;
            }
            this.pendingRemoveNode = null;
            this.contextualFetchSignature = "";
            this.scheduleContextualEdgesFetch({ immediate: true });
            this.showStatus(`Removed ${label} from the graph.`, 2800);
        },
        async onNodeActionExpand(node) {
            if (!this.activeSession || !node?.nodeId) {
                return;
            }
            const label = node.label || node.nodeId;
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            this.graphLoading = true;
            try {
                const next = await expandGraphFromNode(
                    this.apiClient,
                    this.activeSession,
                    node.nodeId
                );
                this.activeSession = withNormalizedKeyNodes({
                    ...this.activeSession,
                    graphNodes: next.graphNodes,
                    graphEdges: next.graphEdges,
                    retrievalLedger: next.retrievalLedger,
                });
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.maybeRemindAfterGraphMutation(previousNodeCount);
                this.showStatus(`Expanded graph from ${label}.`, 3200);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not expand from that node.",
                    3200
                );
            } finally {
                this.graphLoading = false;
            }
        },
        async onEdgeActionInspect(edge) {
            if (!edge?.edgeId || !this.activeSession) {
                return;
            }
            this.inspectorInspectSeq += 1;
            this.selectedNodeId = null;
            this.selectedEdgeId = edge.edgeId;
            this.selectedEdgeRef = { ...edge };
            this.inspectorOpen = true;
            await this.loadEdgeProvenance(edge);
        },
        async loadEdgeProvenance(edgeRef) {
            const edge = findSessionEdge(
                this.activeSession,
                edgeRef.edgeId,
                edgeRef.sourceId,
                edgeRef.targetId
            ) || edgeRef.edge;
            if (!edge || !isInspectableEdge(edge)) {
                return;
            }
            const edgeId = edge.id || edgeRef.edgeId;
            if (this.activeSession.edgeProvenanceById?.[edgeId]) {
                return;
            }
            if (!this.apiClient?.getInteractiveEdgeProvenance) {
                this.setEdgeProvenance(edgeId, {
                    error: "Edge provenance API is not configured.",
                });
                return;
            }
            this.edgeProvenanceLoadingId = edgeId;
            try {
                const payload = await this.apiClient.getInteractiveEdgeProvenance({
                    edge,
                });
                this.setEdgeProvenance(edgeId, payload);
            } catch (error) {
                this.setEdgeProvenance(edgeId, {
                    error:
                        String(error?.message || error) ||
                        "Could not load edge provenance.",
                });
            } finally {
                if (this.edgeProvenanceLoadingId === edgeId) {
                    this.edgeProvenanceLoadingId = null;
                }
            }
        },
        async onEdgeActionExpand(edge) {
            if (!this.activeSession || !edge?.edgeId) {
                return;
            }
            const label = edge.label || edge.edgeId;
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            this.graphLoading = true;
            try {
                const next = await expandGraphFromEdge(
                    this.apiClient,
                    this.activeSession,
                    edge
                );
                this.activeSession = withNormalizedKeyNodes({
                    ...this.activeSession,
                    graphNodes: next.graphNodes,
                    graphEdges: next.graphEdges,
                    retrievalLedger: next.retrievalLedger,
                });
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.maybeRemindAfterGraphMutation(previousNodeCount);
                this.showStatus(`Expanded graph from ${label}.`, 3200);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not expand from that edge.",
                    3200
                );
            } finally {
                this.graphLoading = false;
            }
        },
        onNodeActionToggleKeyNode(node) {
            if (!node?.nodeId || !this.activeSession) {
                return;
            }
            const graphNode = (this.activeSession.graphNodes || []).find(
                (entry) => entry.id === node.nodeId || entry.node_id === node.nodeId
            );
            const label = graphNode?.label || node.label || node.nodeId;
            const { session, changed, added } = toggleKeyNode(
                this.activeSession,
                node.nodeId
            );
            if (!changed) {
                return;
            }
            this.activeSession = session;
            this.showStatus(
                added
                    ? `Marked ${label} as a key node.`
                    : `Removed ${label} from key nodes.`,
                2600
            );
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
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            try {
                const nextSession = addNodesToGraphLocally(this.activeSession, [row]);
                if ((nextSession.graphNodes?.length || 0) <= previousNodeCount) {
                    return;
                }
                this.activeSession = withNormalizedKeyNodes(nextSession);
                this.showGraphRebuildReminder();
                this.showStatus(`Added ${row.label || row.node_id} to the graph.`, 2800);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not add node.",
                    3200
                );
            }
        },
        onRemoveTableNode(node) {
            this.onNodeActionRemove({
                nodeId: node?.nodeId || node?.node_id,
                label: node?.label,
            });
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
        resetGraphReminders(instanceKey) {
            this.clearReminderAutoDismissTimer();
            this.clearGraphRebuildTimer();
            this.graphReminderTracker = createGraphReminderTracker(instanceKey);
            this.graphReminderState = { active: null };
        },
        clearActiveGraphReminder() {
            this.clearReminderAutoDismissTimer();
            if (!this.graphReminderState.active) {
                return;
            }
            const { state, tracker } = dismissActiveReminder(
                this.graphReminderState,
                this.graphReminderTracker
            );
            this.graphReminderState = state;
            this.graphReminderTracker = tracker;
        },
        markGraphRebuildReminderShown() {
            this.graphReminderTracker = markReminderShown(
                this.graphReminderTracker,
                REMINDER_ID.PENDING_GRAPH_REBUILD
            );
            if (
                this.graphReminderState.active?.id ===
                REMINDER_ID.PENDING_GRAPH_REBUILD
            ) {
                this.clearReminderAutoDismissTimer();
                this.graphReminderState = { active: null };
            }
        },
        clearReminderAutoDismissTimer() {
            if (this.graphReminderAutoDismissTimer) {
                clearTimeout(this.graphReminderAutoDismissTimer);
                this.graphReminderAutoDismissTimer = null;
            }
        },
        clearGraphRebuildTimer() {
            if (this.graphRebuildTimer) {
                clearTimeout(this.graphRebuildTimer);
                this.graphRebuildTimer = null;
            }
        },
        scheduleReminderAutoDismiss(delayMs = REMINDER_AUTO_DISMISS_MS) {
            this.clearReminderAutoDismissTimer();
            this.graphReminderAutoDismissTimer = setTimeout(() => {
                this.graphReminderAutoDismissTimer = null;
                this.dismissGraphReminder({ skipAutoDismissTimer: true });
            }, delayMs);
        },
        scheduleGraphRebuild(delayMs = GRAPH_REBUILD_DELAY_MS) {
            this.clearGraphRebuildTimer();
            this.graphRebuildTimer = setTimeout(() => {
                this.graphRebuildTimer = null;
                void this.runPendingGraphRebuild();
            }, delayMs);
        },
        showGraphRebuildReminder() {
            const pendingCount = this.activeSession?.pendingNodeAdds?.length || 0;
            if (!pendingCount) {
                return;
            }
            this.setGraphReminder(
                buildPendingGraphRebuildReminder(pendingCount),
                { oncePerGraph: false }
            );
            this.scheduleGraphRebuild();
        },
        setGraphReminder(reminder, { oncePerGraph = true, autoDismiss = true } = {}) {
            const { state, tracker, shown } = tryShowReminder(
                this.graphReminderState,
                this.graphReminderTracker,
                reminder,
                { oncePerGraph }
            );
            if (!shown) {
                return;
            }
            this.graphReminderState = state;
            this.graphReminderTracker = tracker;
            if (autoDismiss) {
                this.scheduleReminderAutoDismiss();
            }
        },
        queueGraphReminder(reminder, options = {}) {
            this.setGraphReminder(reminder, options);
        },
        dismissGraphReminder({ skipAutoDismissTimer = false } = {}) {
            if (!skipAutoDismissTimer) {
                this.clearReminderAutoDismissTimer();
            }
            const { state, tracker } = dismissActiveReminder(
                this.graphReminderState,
                this.graphReminderTracker
            );
            this.graphReminderState = state;
            this.graphReminderTracker = tracker;
        },
        maybeRemindSaveAfterNodeAdd() {
            const nextCount = this.activeSession?.graphNodes?.length || 0;
            const addedSinceSave = nodesAddedSinceSave(
                this.graphReminderTracker,
                nextCount
            );
            if (addedSinceSave >= NODES_ADDED_SAVE_THRESHOLD) {
                this.setGraphReminder(
                    buildNodesAddedSaveReminder(addedSinceSave)
                );
            }
        },
        async runPendingGraphRebuild() {
            if (
                !this.activeSession?.pendingNodeAdds?.length ||
                this.graphRebuildBusy
            ) {
                return;
            }
            this.clearGraphRebuildTimer();
            this.markGraphRebuildReminderShown();
            this.graphRebuildBusy = true;
            this.graphLoading = true;
            try {
                const next = await rebuildGraphFromPendingAdds(
                    this.apiClient,
                    this.activeSession
                );
                this.activeSession = withNormalizedKeyNodes(next);
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.maybeRemindSaveAfterNodeAdd();
                this.showStatus("Graph rebuilt.", 2800);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) ||
                        "Could not rebuild graph.",
                    3200
                );
                this.showGraphRebuildReminder();
            } finally {
                this.graphRebuildBusy = false;
                this.graphLoading = false;
            }
        },
        maybeRemindAfterGraphMutation(previousNodeCount) {
            const nextCount = this.activeSession?.graphNodes?.length || 0;
            if (nextCount <= previousNodeCount) {
                return;
            }
            this.queueGraphReminder(buildExpandGraphReminder());
            const addedSinceSave = nodesAddedSinceSave(
                this.graphReminderTracker,
                nextCount
            );
            if (addedSinceSave >= NODES_ADDED_SAVE_THRESHOLD) {
                this.queueGraphReminder(
                    buildNodesAddedSaveReminder(addedSinceSave)
                );
            }
        },
        triggerExplainGraph() {
            this.startNewExplanation();
        },
        startNewExplanation() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before explaining.", 3200);
                return;
            }
            this.ensureExplainDraft({ forceNew: true });
            this.explainGraphOpen = true;
        },
        openExplainGraphModal() {
            this.startNewExplanation();
        },
        openSavedExplanation(explanationId) {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before explaining.", 3200);
                return;
            }
            if (!explanationId) {
                this.startNewExplanation();
                return;
            }
            const entry = (this.activeSession.graphInterpretations || []).find(
                (item) => item.id === explanationId
            );
            if (entry) {
                this.explainScope = entry.scope || this.explainScope;
                this.activeSession = {
                    ...this.activeSession,
                    graphInterpretation: entry,
                };
            }
            this.explainGraphOpen = true;
        },
        closeExplainGraph() {
            if (this.graphInterpretationLoading) {
                return;
            }
            this.explainGraphOpen = false;
        },
        ensureExplainDraft({ forceNew = false } = {}) {
            if (!this.activeSession) {
                return;
            }
            const current = this.activeSession.graphInterpretation;
            if (
                !forceNew &&
                current &&
                current.scope === this.explainScope &&
                (current.status === "draft" ||
                    current.status === "success" ||
                    current.status === "error")
            ) {
                return;
            }
            const draft = buildExplanationDraft(this.activeSession, this.explainScope);
            this.activeSession = {
                ...this.activeSession,
                explainContext: draft.additional_context,
                graphInterpretation: draft,
                graphInterpretations: [
                    draft,
                    ...(this.activeSession.graphInterpretations || []),
                ],
            };
        },
        onExplainScopeChange(scope) {
            this.explainScope = scope;
            if (!this.activeSession) {
                return;
            }
            const draft = buildExplanationDraft(this.activeSession, scope);
            this.activeSession = {
                ...this.activeSession,
                explainContext: draft.additional_context,
                graphInterpretation: draft,
                graphInterpretations: [
                    draft,
                    ...(this.activeSession.graphInterpretations || []).filter(
                        (entry) => entry.id !== draft.id
                    ),
                ],
            };
        },
        onExplainIntentChange(value) {
            if (!this.activeSession) {
                return;
            }
            const controls = {
                ...(this.activeSession.controls || {}),
                explainIntent: value,
            };
            this.activeSession = {
                ...this.activeSession,
                controls,
            };
            const entry = this.activeSession.graphInterpretation;
            if (entry && entry.status === "draft") {
                const draft = buildExplanationDraft(this.activeSession, this.explainScope);
                const nextEntry = {
                    ...entry,
                    query_text: draft.query_text,
                    intent: draft.intent,
                    prompt_preview: draft.prompt_preview,
                };
                this.patchGraphInterpretationEntry(entry.id, nextEntry);
            }
        },
        onExplainEntryPatch(patch) {
            const entry = this.activeSession?.graphInterpretation;
            if (!entry) {
                return;
            }
            this.patchGraphInterpretationEntry(
                entry.id,
                patchExplanationEntry(entry, patch)
            );
        },
        patchGraphInterpretationEntry(explanationId, patch) {
            if (!this.activeSession || !explanationId) {
                return;
            }
            const base =
                (this.activeSession.graphInterpretations || []).find(
                    (item) => item.id === explanationId
                ) || this.activeSession.graphInterpretation;
            const nextEntry = patchExplanationEntry(base, patch);
            this.activeSession = {
                ...this.activeSession,
                explainContext:
                    nextEntry.additional_context ?? this.activeSession.explainContext,
                graphInterpretation:
                    this.activeSession.graphInterpretation?.id === explanationId
                        ? nextEntry
                        : this.activeSession.graphInterpretation,
                graphInterpretations: (this.activeSession.graphInterpretations || []).map(
                    (item) => (item.id === explanationId ? nextEntry : item)
                ),
            };
        },
        async runGraphExplanation() {
            const session = this.activeSession;
            const entry = session?.graphInterpretation;
            if (!session || !entry) {
                return;
            }
            if (!this.llmAvailable) {
                this.showStatus("LLM explanation is not available.", 3200);
                return;
            }
            if (!this.apiClient?.interpretInteractiveSession) {
                this.showStatus("Session interpretation API is not configured.", 3200);
                return;
            }
            const explanationId = entry.id;
            const loadingEntry = patchExplanationEntry(entry, {
                status: "loading",
                error: "",
            });
            this.activeSession = {
                ...session,
                graphInterpretationLoading: true,
                graphInterpretation: loadingEntry,
                graphInterpretations: (session.graphInterpretations || []).map((item) =>
                    item.id === explanationId ? loadingEntry : item
                ),
            };
            try {
                const payload = await this.apiClient.interpretInteractiveSession(
                    explanationApiPayload(session, loadingEntry)
                );
                const timestamp = new Date().toISOString();
                let suggestedKeyNodes = [];
                if (loadingEntry.scope === EXPLAIN_SCOPE.ENTIRE_GRAPH) {
                    suggestedKeyNodes = parseSuggestedKeyNodesFromInterpretation(
                        payload?.interpretation,
                        loadingEntry.graph_nodes || []
                    );
                }
                const successEntry = patchExplanationEntry(loadingEntry, {
                    ...payload,
                    status: "success",
                    timestamp,
                    timestamp_label: new Date(timestamp).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                    }),
                    suggested_key_nodes: suggestedKeyNodes,
                    interpretation_display: interpretationMarkdownForDisplay(
                        payload?.interpretation || ""
                    ),
                    error: "",
                });
                this.activeSession = {
                    ...this.activeSession,
                    graphInterpretation: successEntry,
                    graphInterpretations: (
                        this.activeSession.graphInterpretations || []
                    ).map((item) =>
                        item.id === explanationId ? successEntry : item
                    ),
                    graphInterpretationLoading: false,
                };
                this.remindAfterAnalysis("Explain graph");
                this.showStatus("Graph explanation ready.", 2800);
            } catch (error) {
                const errorEntry = patchExplanationEntry(loadingEntry, {
                    status: "error",
                    error: String(error?.message || error) || "Explanation failed.",
                });
                this.activeSession = {
                    ...this.activeSession,
                    graphInterpretation: errorEntry,
                    graphInterpretations: (
                        this.activeSession.graphInterpretations || []
                    ).map((item) =>
                        item.id === explanationId ? errorEntry : item
                    ),
                    graphInterpretationLoading: false,
                };
                this.showStatus("Could not generate explanation.", 3200);
            }
        },
        onExplainAddSuggestedKeyNode(nodeId) {
            if (!nodeId || !this.activeSession) {
                return;
            }
            const { session, changed, addedIds } = addKeyNodesBatch(
                this.activeSession,
                [nodeId]
            );
            if (!changed) {
                return;
            }
            this.activeSession = withNormalizedKeyNodes(session);
            const node = findGraphNode(this.activeSession, addedIds[0] || nodeId);
            this.showStatus(
                `Added ${node?.label || nodeId} as a key node.`,
                2600
            );
        },
        onExplainAddAllSuggestedKeyNodes() {
            const entry = this.activeSession?.graphInterpretation;
            const nodeIds = (entry?.suggested_key_nodes || [])
                .map((item) => item.node_id)
                .filter(Boolean);
            if (!nodeIds.length || !this.activeSession) {
                return;
            }
            const { session, changed, addedIds } = addKeyNodesBatch(
                this.activeSession,
                nodeIds
            );
            if (!changed) {
                this.showStatus("Suggested nodes are already key nodes.", 2600);
                return;
            }
            this.activeSession = withNormalizedKeyNodes(session);
            this.showStatus(
                `Added ${addedIds.length} suggested node${addedIds.length === 1 ? "" : "s"} as key nodes.`,
                2800
            );
        },
        triggerBuildHypotheses() {
            this.showStatus("Triggered: Build hypotheses");
            this.remindAfterAnalysis("Build hypotheses");
        },
        remindAfterAnalysis(analysisLabel) {
            if (!this.activeSession?.graphNodes?.length) {
                return;
            }
            this.queueGraphReminder(
                buildAfterAnalysisPersistReminder({ analysisLabel })
            );
        },
        onGraphReminderAction(actionId) {
            if (actionId === REMINDER_ACTION.DISMISS) {
                this.dismissGraphReminder();
                return;
            }
            this.dismissGraphReminder();
            if (actionId === REMINDER_ACTION.EXPLAIN_GRAPH) {
                this.triggerExplainGraph();
                return;
            }
            if (actionId === REMINDER_ACTION.BUILD_HYPOTHESES) {
                this.triggerBuildHypotheses();
                return;
            }
            if (actionId === REMINDER_ACTION.SAVE_LIBRARY) {
                this.openSaveGraph();
                return;
            }
            if (actionId === REMINDER_ACTION.EXPORT_GRAPH) {
                this.openExportGraph();
                return;
            }
            if (actionId === REMINDER_ACTION.DOWNLOAD_SNAPSHOT) {
                this.showStatus("Download review snapshot is not available yet.", 3200);
                return;
            }
            if (actionId === REMINDER_ACTION.BUILD_GRAPH) {
                this.clearGraphRebuildTimer();
                void this.runPendingGraphRebuild();
            }
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
            if (payload.menu === "save" && payload.action === "exportGraph") {
                this.onExportGraph();
                return;
            }
            if (payload.menu === "save" && payload.action === "importGraph") {
                this.onImportGraphClick();
                return;
            }
            if (payload.menu === "save" && payload.action === "downloadSnapshot") {
                this.showStatus("Download review snapshot is not available yet.", 3200);
                return;
            }
            if (payload.menu === "analyze" && payload.action === "explain") {
                this.triggerExplainGraph();
                return;
            }
            if (payload.menu === "analyze" && payload.action === "hypotheses") {
                this.triggerBuildHypotheses();
                return;
            }
            if (payload.menu === "analyze" && payload.action === "dataProvenance") {
                this.showStatus(`Triggered: ${payload.label}`);
                return;
            }
            this.showStatus(`Triggered: ${payload.label}`);
        },
        openExportGraph() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Nothing to export — build a graph first.", 3200);
                return;
            }
            this.exportGraphOpen = true;
        },
        closeExportGraph() {
            if (!this.exportGraphBusy) {
                this.exportGraphOpen = false;
            }
        },
        async onExportGraphConfirm({ filename }) {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Nothing to export — build a graph first.", 3200);
                return;
            }
            this.exportGraphBusy = true;
            try {
                const result = await this.graphStore.exportGraphFromSession?.(
                    this.activeSession,
                    {
                        label: this.activeSession.label || this.saveGraphLabel,
                        filename,
                    }
                );
                if (result?.reason === "cancelled") {
                    return;
                }
                if (!result?.ok) {
                    this.showStatus("Could not export graph.", 3200);
                    return;
                }
                this.exportGraphOpen = false;
                const locationNote = result.usedSavePicker
                    ? `Saved as ${result.filename}`
                    : `Downloaded ${result.filename}`;
                this.showStatus(`Exported "${result.label}" — ${locationNote}`, 4200);
            } catch (error) {
                console.error("Export graph failed", error);
                this.showStatus("Could not export graph.", 3200);
            } finally {
                this.exportGraphBusy = false;
            }
        },
        onExportGraph() {
            this.openExportGraph();
        },
        onImportGraphClick() {
            const input = this.$refs.graphImportFileInput;
            if (!input) {
                return;
            }
            input.value = "";
            input.click();
        },
        async onGraphImportFileChange(event) {
            const file = event?.target?.files?.[0];
            const input = event?.target;
            if (!file) {
                return;
            }
            try {
                const session = await this.graphStore.parseGraphImportFile(file);
                this.welcomeOpen = false;
                this.loadSessionOntoCanvas(session, {
                    restoreInspectorCaches: true,
                    loadedSavedGraphId: null,
                    statusMessage: `Imported "${session.label || "graph"}"`,
                });
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not import graph.",
                    4000
                );
            } finally {
                if (input) {
                    input.value = "";
                }
            }
        },
        loadSessionOntoCanvas(
            session,
            {
                restoreInspectorCaches = false,
                loadedSavedGraphId = null,
                statusMessage = "",
            } = {}
        ) {
            if (!session?.graphNodes?.length) {
                this.showStatus("Could not load that graph.");
                return;
            }
            this.clearDuplicateFlow();
            this.closeNodeActionMenu();
            this.closeEdgeActionMenu();
            this.selectedNodeId = null;
            this.selectedEdgeId = null;
            this.selectedEdgeRef = null;
            this.edgeProvenanceLoadingId = null;
            this.inspectorInspectSeq += 1;

            const normalized = normalizeWorkspaceGraph(session.graphNodes, session.graphEdges);
            const buckets = starterBucketsFromSession(session);
            const emptyCaches = {
                nodeConnectionEvidenceCache: {},
                nodeExpressionProfileCache: {},
                nodeExpressionReferenceById: {},
                nodeSigChainPacketCache: {},
                nodeFactorLoadingsCache: {},
                edgeProvenanceById: {},
            };
            const inspectorCaches = restoreInspectorCaches
                ? {
                      nodeConnectionEvidenceCache:
                          session.nodeConnectionEvidenceCache || {},
                      nodeExpressionProfileCache:
                          session.nodeExpressionProfileCache || {},
                      nodeExpressionReferenceById:
                          session.nodeExpressionReferenceById || {},
                      nodeSigChainPacketCache: session.nodeSigChainPacketCache || {},
                      nodeFactorLoadingsCache: session.nodeFactorLoadingsCache || {},
                      edgeProvenanceById: session.edgeProvenanceById || {},
                  }
                : emptyCaches;

            this.activeSession = withNormalizedKeyNodes({
                ...session,
                graphNodes: normalized.graphNodes,
                graphEdges: normalized.graphEdges,
                contextualEdges: session.contextualEdges || [],
                retrievalLedger: session.retrievalLedger || {},
                contextualEdgeSignature: session.contextualEdgeSignature || "",
                anchorItems: anchorItemsFromBuckets(buckets),
                starterBuckets: buckets,
                pendingNodeAdds: [],
                pendingGraphRebuild: false,
                ...inspectorCaches,
            });
            this.contextualFetchSignature = session.contextualEdgeSignature || "";
            if (
                !session.contextualEdges?.length &&
                this.contextualGraphSignature !== this.contextualFetchSignature
            ) {
                this.scheduleContextualEdgesFetch({ immediate: true });
            }
            this.loadedSavedGraphId = loadedSavedGraphId;
            this.graphError = "";
            this.graphLoading = false;
            this.welcomeOpen = false;
            this.initialGraphOpen = false;
            this.closeLibrary();
            if (statusMessage) {
                this.showStatus(statusMessage);
            }
            this.resetGraphReminders(
                loadedSavedGraphId || session.label || `load-${Date.now()}`
            );
            if (restoreInspectorCaches) {
                this.queueGraphReminder(buildImportGraphReminder());
            } else if (loadedSavedGraphId) {
                this.queueGraphReminder(buildLibraryLoadReminder());
                this.graphReminderTracker = syncSaveBaseline(
                    this.graphReminderTracker,
                    session.graphNodes.length
                );
            }
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
            const session = withNormalizedKeyNodes({
                ...this.activeSession,
                label,
                contextualEdgeSignature: this.contextualGraphSignature,
            });
            let record = null;
            let savedAsNewGraph = false;
            try {
                if (this.loadedSavedGraphId) {
                    record = this.graphStore.updateGraphFromSession(
                        this.loadedSavedGraphId,
                        session,
                        { label }
                    );
                    if (!record) {
                        record = this.graphStore.saveGraphFromSession(session, { label });
                        savedAsNewGraph = Boolean(record);
                    }
                } else {
                    record = this.graphStore.saveGraphFromSession(session, { label });
                }
            } catch (error) {
                this.saveGraphOpen = false;
                if (error?.message === userUtils.GRAPH_STORE_QUOTA_ERROR) {
                    this.showStatus(
                        "Browser storage is full (~5 MB per site). Delete older graphs in My library or back up library.",
                        6500
                    );
                } else {
                    console.error("Save graph failed", error);
                    this.showStatus("Could not save graph.", 3200);
                }
                return;
            }
            this.saveGraphOpen = false;
            if (!record) {
                this.showStatus("Could not save graph — no nodes to store.", 3200);
                return;
            }
            this.loadedSavedGraphId = record.id;
            this.activeSession = {
                ...this.activeSession,
                label: record.label,
                contextualEdgeSignature: this.contextualGraphSignature,
                highlighted: [...(record.highlighted || [])],
            };
            this.refreshSavedGraphs();
            let savedMessage = this.duplicateFlowActive
                ? `Duplication complete — saved "${record.label}"`
                : `Saved "${record.label}"`;
            if (savedAsNewGraph) {
                savedMessage = `Original My library entry was missing; saved as "${record.label}".`;
            }
            this.clearDuplicateFlow();
            this.showStatus(savedMessage, 3200);
            this.graphReminderTracker = syncSaveBaseline(
                this.graphReminderTracker,
                this.activeSession.graphNodes.length
            );
            this.queueGraphReminder(buildAfterSaveExportReminder());
        },
        onLibraryLoad(record) {
            const session = this.graphStore.sessionFromGraph(record);
            if (!session) {
                this.showStatus("Could not load that graph.");
                return;
            }
            this.loadSessionOntoCanvas(session, {
                restoreInspectorCaches: false,
                loadedSavedGraphId: record.id,
                statusMessage: `Loaded "${record.label}"`,
            });
        },
        onLibraryDuplicate(record) {
            const session = this.graphStore.sessionFromGraph(record);
            if (!session) {
                this.showStatus("Could not duplicate that graph.");
                return;
            }
            const buckets = starterBucketsFromSession(session);
            if (!totalStarterCount(buckets)) {
                this.showStatus("No key nodes found in that graph.");
                return;
            }

            this.duplicateFlowActive = true;
            this.duplicateSourceLabel = String(record.label || "Untitled graph").trim();
            this.starterBuckets = buckets;
            this.starterContext = session.context || "";
            this.addNeighboringNodes =
                session.addNeighboringNodes !== undefined
                    ? session.addNeighboringNodes
                    : true;
            this.activeSession = null;
            this.loadedSavedGraphId = null;
            this.graphError = "";
            this.graphLoading = false;
            this.selectedNodeId = null;
            this.welcomeOpen = false;
            this.initialGraphOpen = true;
            this.closeLibrary();
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
                    `Backed up ${result.graphCount} graph${result.graphCount === 1 ? "" : "s"}`,
                    3200
                );
            }
        },
        onLibraryImported(result) {
            this.refreshSavedGraphs();
            if (result?.ok) {
                this.showStatus(
                    `Imported ${result.imported} graph${result.imported === 1 ? "" : "s"} into My library`,
                    3200
                );
            }
        },
    },
});
</script>

<style>
@import "./revealKgWorkspace/wkbSharedStyles.css";

.rkw-graph-import-input {
    display: none;
}

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
