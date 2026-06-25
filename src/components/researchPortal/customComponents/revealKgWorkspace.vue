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
            <div v-if="analysisBubblesVisible" class="rkw-analysis-bubbles">
                <WorkspaceDatasetsBubble
                    :visible="datasetsBubbleVisible"
                    :entries="savedDatasetRuns"
                    @open-datasets="openSavedDatasetsRun"
                />
                <WorkspaceHypothesesBubble
                    :visible="hypothesesBubbleVisible"
                    :entries="savedHypothesisRuns"
                    @open-hypotheses="openSavedHypothesesRun"
                />
                <WorkspaceExplanationBubble
                    :visible="explanationBubbleVisible"
                    :entries="savedGraphExplanations"
                    @open-explanation="openSavedExplanation"
                />
            </div>
            <div class="rkw-canvas-shell">
                <WorkspaceCanvas
                    ref="workspaceCanvas"
                    :graph-nodes="canvasGraphNodes"
                    :all-graph-nodes="allCanvasGraphNodes"
                    :ledger-session="activeSession"
                    :graph-edges="canvasGraphEdges"
                    :contextual-edges="canvasContextualEdges"
                    :graph-loading="graphLoading"
                    :graph-busy="canvasGraphBusy"
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
                    :ai-assistant-open="aiAssistantOpen"
                    :canvas-active="Boolean(activeSession)"
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
                <WorkspaceExpandProgressOverlay
                    :open="expandGraphLoading"
                    :message="expandGraphProgress"
                    :progress="expandBatchProgress"
                />
                <WorkspaceAssistantActionProgressOverlay
                    :open="assistantActionProgressOpen"
                    :message="assistantActionProgressMessage"
                />
            </div>
            <WorkspaceExpandGraphPanel
                :open="expandGraphOpen"
                :initial-tab="expandPanelInitialTab"
                :loading="expandGraphLoading"
                :manual-add-busy="expandManualAddBusy"
                :intent-add-busy="expandIntentAddBusy"
                :intent-add-status="expandIntentAddStatus"
                :intent-add-explanation="expandIntentAddExplanation"
                :filters="expandFilters"
                :controls="expandControls"
                :expand-seed-summary="expandSeedSummary"
                :expand-seed-label="expandSeedLabel"
                :expand-from-single-node="expandFromSingleNode"
                :expand-from-edge="expandFromEdge"
                :expansion-history-entries="expansionHistoryEntries"
                :available-target-types="expandAvailableTargetTypes"
                :expression-options="expressionOptions"
                :api-client="apiClient"
                :llm-available="llmAvailable"
                :expand-needs-llm="expandGraphNeedsLlm"
                @close="closeExpandGraph"
                @patch-filters="onExpandFiltersPatch"
                @patch-controls="onExpandControlsPatch"
                @toggle-novelty="onExpandToggleNovelty"
                @expand="runExpandGraph"
                @add-manual-node="onExpandManualAddNode"
                @intent-add-nodes="onExpandIntentAddNodes"
                @manual-add-error="onExpandManualAddError"
                @remove-history-entry="onRemoveExpansionHistoryEntry"
            />
            <WorkspaceAiAssistantPanel
                ref="aiAssistantPanel"
                :open="aiAssistantOpen"
                :planning="assistantPlanning"
                :executing="assistantExecuting"
                :executing-step-label="assistantExecutingStepLabel"
                :plan="assistantPlan"
                :clarification="assistantClarification"
                :step-states="assistantStepStates"
                :error="assistantError"
                :graph-nodes="assistantSuggestNodes"
                @close="closeAiAssistant"
                @plan-request="onAssistantPlanRequest"
                @execute-all="onAssistantExecuteAll"
                @execute-step="onAssistantExecuteStep"
                @open-panel="onAssistantOpenPanel"
                @error-acknowledged="assistantError = ''"
            />
            <WorkspaceVisibilityFilterPanel
                :open="filterGraphOpen"
                :loading="graphFilterLoading"
                :progress-label="graphFilterProgress"
                :filters="graphFilters"
                :saved-filters="savedVisibilityFilters"
                :expression-options="expressionOptions"
                :llm-available="llmAvailable"
                :filter-needs-llm="graphFilterNeedsLlm"
                :can-clear-draft="graphFilterCanClearDraft"
                :can-build="graphFilterCanBuild"
                :node-count="allGraphNodeCount"
                :visible-node-count="visibleGraphNodeCount"
                :invisible-node-count="invisibleGraphNodeCount"
                @close="closeFilterGraph"
                @patch-filters="onGraphFiltersPatch"
                @toggle-novelty="onGraphFilterToggleNovelty"
                @build="buildVisibilityFilter"
                @clear-draft="clearGraphFilterDraft"
                @toggle-filter="onToggleVisibilityFilterLayer"
                @remove-filter="onRemoveVisibilityFilterLayer"
                @remove-invisible-nodes="onRemoveInvisibleNodesFromGraph"
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
            :initial-tab="welcomeInitialTab"
            :dismissible="canDismissWelcome"
            :has-saved-graphs="savedGraphs.length > 0"
            :show-learn-companion="showWelcomeLearnCompanion"
            :canvas-open-count="canvasOpenCount"
            :learn-companion-max-opens="learnCompanionMaxOpens"
            @create="onWelcomeCreate"
            @create-with-assistant="onWelcomeCreateWithAssistant"
            @blank-canvas="onWelcomeBlankCanvas"
            @load-library="onWelcomeLoadLibrary"
            @import-graph="onWelcomeImportGraph"
            @close="closeWelcome"
        />
        <WorkspaceLearnCompanionOverlay
            :open="learnCompanionOpen"
            :canvas-open-count="canvasOpenCount"
            :learn-companion-max-opens="learnCompanionMaxOpens"
            :dismissible="canDismissWelcome"
            @close="closeLearnCompanion"
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
            :key-node-count="explainKeyNodeCount"
            :node-count="explainNodeCount"
            :edge-count="explainEdgeCount"
            :contextual-edge-count="explainContextualEdgeCount"
            :key-node-ids="canvasKeyNodeIds"
            @close="closeExplainGraph"
            @update:scope="onExplainScopeChange"
            @update-entry="onExplainEntryPatch"
            @run="runGraphExplanation"
            @add-suggested-key-node="onExplainAddSuggestedKeyNode"
            @add-all-suggested-key-nodes="onExplainAddAllSuggestedKeyNodes"
        />
        <WorkspaceBuildHypothesesModal
            :open="hypothesesOpen"
            :draft-run="activeSigChainDraft"
            :result-run="activeSigChainResult"
            :loading="sigChainLoading"
            :llm-available="llmAvailable"
            :selected-node-count="explainKeyNodeCount"
            :selected-node-ids="canvasKeyNodeIds"
            :anchor-items="canvasAnchorItems"
            :session-context="activeSession ? activeSession.context || '' : ''"
            :api-client="apiClient"
            @close="closeBuildHypotheses"
            @update-draft="onSigChainDraftPatch"
            @run="runSigChainPrioritization"
            @new-run="onSigChainNewRun"
            @pathway-state-update="onSigChainPathwayStateUpdate"
        />
        <WorkspaceFindRelatedDatasetsModal
            :open="relatedDatasetsOpen"
            :result-run="activeDatasetResult"
            :show-search-form="datasetShowSearchForm"
            :loading="datasetLoading"
            :selected-gene-count="selectedGeneCount"
            :current-active-set-key="cfdeActiveSetKey"
            :canvas-graph-node-ids="canvasGraphNodeIds"
            :graph-busy="graphLoading"
            @close="closeFindRelatedDatasets"
            @search="runCfdeDatasetSearch"
            @search-again="onDatasetSearchAgain"
            @add-gene-set="onAddCfdeGeneSet"
            @remove-gene-set="onRemoveCfdeGeneSet"
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
import WorkspaceLearnCompanionOverlay from "./revealKgWorkspace/WorkspaceLearnCompanionOverlay.vue";
import WorkspaceInitialGraphModal from "./revealKgWorkspace/WorkspaceInitialGraphModal.vue";
import WorkspaceSaveGraphModal from "./revealKgWorkspace/WorkspaceSaveGraphModal.vue";
import WorkspaceExportGraphModal from "./revealKgWorkspace/WorkspaceExportGraphModal.vue";
import WorkspaceExplainGraphModal from "./revealKgWorkspace/WorkspaceExplainGraphModal.vue";
import WorkspaceBuildHypothesesModal from "./revealKgWorkspace/WorkspaceBuildHypothesesModal.vue";
import WorkspaceFindRelatedDatasetsModal from "./revealKgWorkspace/WorkspaceFindRelatedDatasetsModal.vue";
import WorkspaceVisibilityFilterPanel from "./revealKgWorkspace/WorkspaceVisibilityFilterPanel.vue";
import WorkspaceExpandGraphPanel from "./revealKgWorkspace/WorkspaceExpandGraphPanel.vue";
import WorkspaceAiAssistantPanel from "./revealKgWorkspace/WorkspaceAiAssistantPanel.vue";
import WorkspaceAssistantActionProgressOverlay from "./revealKgWorkspace/WorkspaceAssistantActionProgressOverlay.vue";
import {
    assistantActionShowsProgressOverlay,
    assistantActionUsesExpandProgress,
    defaultProgressMessageForAction,
} from "./revealKgWorkspace/revealKgAssistantActionCatalog.js";
import { planAssistantQuery, abortAssistantPlan } from "./revealKgWorkspace/revealKgAssistantLlm.js";
import { executeAssistantPlan } from "./revealKgWorkspace/revealKgAssistantExecutor.js";
import { sanitizeAssistantError } from "./revealKgWorkspace/revealKgAssistantErrorUtils.js";
import {
    assistantActionPostEffects,
    computeAssistantPlanPostEffects,
    initialAssistantStepStates,
} from "./revealKgWorkspace/revealKgAssistantPlan.js";
import { formatAssistantStepSummary } from "./revealKgWorkspace/revealKgAssistantStepSummary.js";
import WorkspaceExpandProgressOverlay from "./revealKgWorkspace/WorkspaceExpandProgressOverlay.vue";
import { expandGraphOnSession } from "./revealKgWorkspace/revealKgGraphExpand.js";
import {
    emptyExpandBatchProgress,
    normalizeExpandProgressUpdate,
} from "./revealKgWorkspace/revealKgExpandProgressUtils.js";
import { downloadGraphSnapshotFromSession } from "./revealKgWorkspace/revealKgGraphSnapshotUtils.js";
import {
    appendExpansionHistoryEntry,
    buildExpansionHistoryEntry,
    expansionHistoryEntriesFromSession,
    removeExpansionHistoryEntry,
} from "./revealKgWorkspace/revealKgExpansionHistoryUtils.js";
import {
    buildVisibilityFilterOnSession,
    graphFilterCanReset as sessionGraphFilterCanReset,
    resetGraphFilterOnSession,
} from "./revealKgWorkspace/revealKgGraphFilterApply.js";
import { getDisplayGraph, computeContextualEdgeSignature } from "./revealKgWorkspace/revealKgGraphDisplayUtils.js";
import {
    createDefaultGraphFilters,
    ensureSessionFilterState,
    expandNeedsLlm,
    graphFilterNeedsLlm,
    patchSessionExpandControls,
    patchSessionGraphFilters,
    toggleNoveltyIncludeCheckbox,
} from "./revealKgWorkspace/revealKgGraphFilterUtils.js";
import {
    collectInvisibleNodeIds,
    countInvisibleGraphNodes,
    draftHasBuildCriteria,
    isNodeVisibleInSession,
    normalizeVisibilityFilterLayers,
    removeVisibilityFilterLayer,
    toggleVisibilityFilterLayer,
} from "./revealKgWorkspace/revealKgVisibilityFilterUtils.js";
import { resolveIntentAddNodes } from "./revealKgWorkspace/revealKgIntentAddNodes.js";
import WorkspaceExplanationBubble from "./revealKgWorkspace/WorkspaceExplanationBubble.vue";
import WorkspaceHypothesesBubble from "./revealKgWorkspace/WorkspaceHypothesesBubble.vue";
import WorkspaceDatasetsBubble from "./revealKgWorkspace/WorkspaceDatasetsBubble.vue";
import WorkspaceNodeActionMenu from "./revealKgWorkspace/WorkspaceNodeActionMenu.vue";
import WorkspaceEdgeActionMenu from "./revealKgWorkspace/WorkspaceEdgeActionMenu.vue";
import WorkspaceRemoveNodeConfirmModal from "./revealKgWorkspace/WorkspaceRemoveNodeConfirmModal.vue";
import {
    addDemoGeneSetsToGraphLocally,
} from "./revealKgWorkspace/revealKgDemoGeneSets.js";
import {
    addNodesToGraphLocally,
    addKeyNodesBatch,
    addNodesToWorkspaceGraph,
    anchorItemsFromBuckets,
    buildInitialGraphFromAnchors,
    createBlankCanvasSession,
    getAvailableConnectionTargetTypes,
    findGraphNode,
    graphNodeToAnchorItem,
    canRemoveGraphNode,
    countConnectedEdgesForNode,
    fetchContextualEdgesForGraph,
    findSessionEdge,
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
import { logGeneSetInspect } from "./revealKgWorkspace/revealKgGeneSetDebug.js";
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
    buildSigChainPrioritizePayload,
    buildSigChainPrioritizationQuestion,
    computeSigChainDraftSnapshot,
    edgesForVisibleNodes,
    ensureSigChainDraft,
    getSigChainPrioritizationSnapshot,
    mergeGraphEdgesForSigChainRun,
    patchSigChainRun,
    successfulSigChainRuns,
} from "./revealKgWorkspace/revealKgSigChainPrioritizeUtils.js";
import {
    buildCfdeDatasetRun,
    buildCfdeDatasetSearchPayload,
    cfdeDatasetRunMatchesActiveSet,
    getCfdeActiveSetKey,
    getCfdeActiveSetNodesFromSession,
    patchCfdeDatasetRun,
    successfulCfdeDatasetRuns,
} from "./revealKgWorkspace/revealKgCfdeDatasetUtils.js";
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
        WorkspaceLearnCompanionOverlay,
        WorkspaceInitialGraphModal,
        WorkspaceSaveGraphModal,
        WorkspaceExportGraphModal,
        WorkspaceExplainGraphModal,
        WorkspaceBuildHypothesesModal,
        WorkspaceFindRelatedDatasetsModal,
        WorkspaceVisibilityFilterPanel,
        WorkspaceExpandGraphPanel,
        WorkspaceAiAssistantPanel,
        WorkspaceExpandProgressOverlay,
        WorkspaceAssistantActionProgressOverlay,
        WorkspaceExplanationBubble,
        WorkspaceHypothesesBubble,
        WorkspaceDatasetsBubble,
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
            learnCompanionOpen: false,
            canvasOpenCount: 0,
            welcomeInitialTab: "start",
            initialGraphOpen: false,
            starterBuckets: emptyStarterBuckets(),
            starterContext: "",
            addNeighboringNodes: false,
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
            snapshotDownloadBusy: false,
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
            hypothesesOpen: false,
            relatedDatasetsOpen: false,
            datasetForceSearchForm: false,
            filterGraphOpen: false,
            graphFilterLoading: false,
            graphFilterProgress: "",
            expandGraphOpen: false,
            expandPanelInitialTab: "",
            expandGraphLoading: false,
            expandGraphProgress: "",
            expandBatchProgress: null,
            expandManualAddBusy: false,
            expandIntentAddBusy: false,
            expandIntentAddStatus: "",
            expandIntentAddExplanation: "",
            expandSeedNodeIds: [],
            aiAssistantOpen: false,
            assistantPlanning: false,
            assistantExecuting: false,
            assistantExecutingStepLabel: "",
            assistantActionProgressOpen: false,
            assistantActionProgressMessage: "",
            assistantCurrentStep: null,
            assistantPlan: null,
            assistantClarification: null,
            assistantStepStates: {},
            assistantError: "",
            assistantUserQuery: "",
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
        savedHypothesisRuns() {
            return successfulSigChainRuns(this.activeSession);
        },
        savedDatasetRuns() {
            return successfulCfdeDatasetRuns(this.activeSession);
        },
        explanationBubbleVisible() {
            return (
                !this.explainGraphOpen &&
                this.savedGraphExplanations.length > 0 &&
                Boolean(this.activeSession?.graphNodes?.length)
            );
        },
        hypothesesBubbleVisible() {
            return (
                !this.hypothesesOpen &&
                this.savedHypothesisRuns.length > 0 &&
                Boolean(this.activeSession?.graphNodes?.length)
            );
        },
        datasetsBubbleVisible() {
            return (
                !this.relatedDatasetsOpen &&
                this.savedDatasetRuns.length > 0 &&
                Boolean(this.activeSession?.graphNodes?.length)
            );
        },
        analysisBubblesVisible() {
            return (
                this.datasetsBubbleVisible ||
                this.hypothesesBubbleVisible ||
                this.explanationBubbleVisible
            );
        },
        canDismissWelcome() {
            return Boolean(this.activeSession);
        },
        learnCompanionMaxOpens() {
            return userUtils.REVEAL_KG_LEARN_COMPANION_MAX_OPENS;
        },
        showWelcomeLearnCompanion() {
            return userUtils.shouldShowRevealKgLearnCompanion(this.canvasOpenCount);
        },
        explainHelperText() {
            return this.activeGraphInterpretation?.helper_text || "";
        },
        explainKeyNodeCount() {
            return normalizeKeyNodeIds(this.activeSession).length;
        },
        explainNodeCount() {
            return this.displayGraph.visibleNodes.length || 0;
        },
        explainEdgeCount() {
            return this.displayGraph.visibleEdges.length || 0;
        },
        explainContextualEdgeCount() {
            return (this.activeSession?.contextualEdges || []).length;
        },
        sigChainLoading() {
            return Boolean(this.activeSession?.sigChainLoading);
        },
        activeSigChainRun() {
            return this.activeSession?.sigChainRun || null;
        },
        activeSigChainDraft() {
            const run = this.activeSigChainRun;
            if (run && (run.status === "draft" || run.status === "error")) {
                return run;
            }
            return (this.activeSession?.sigChainRuns || []).find(
                (entry) => entry.status === "draft"
            );
        },
        activeSigChainResult() {
            const run = this.activeSigChainRun;
            if (run?.status === "success") {
                return run;
            }
            return null;
        },
        cfdeActiveSetNodes() {
            return getCfdeActiveSetNodesFromSession(this.activeSession);
        },
        selectedGeneCount() {
            return this.cfdeActiveSetNodes.length;
        },
        cfdeActiveSetKey() {
            return getCfdeActiveSetKey(this.cfdeActiveSetNodes);
        },
        datasetLoading() {
            return Boolean(this.activeSession?.datasetLoading);
        },
        activeDatasetRun() {
            return this.activeSession?.datasetRun || null;
        },
        activeDatasetResult() {
            const run = this.activeDatasetRun;
            if (run && !this.datasetForceSearchForm) {
                return run;
            }
            return null;
        },
        datasetShowSearchForm() {
            return this.datasetForceSearchForm || !this.activeDatasetRun;
        },
        canvasGraphNodeIds() {
            return (this.activeSession?.graphNodes || []).map((node) => node.id);
        },
        canvasAnchorItems() {
            return keyNodeItemsFromSession(this.activeSession);
        },
        assistantSuggestNodes() {
            return (this.activeSession?.graphNodes || []).map((node) => ({
                id: node.id,
                label: node.label || node.id,
                type: node.type || node.node_type,
            }));
        },
        canvasGraphBusy() {
            return (
                this.graphLoading ||
                this.expandGraphLoading ||
                this.expandManualAddBusy ||
                this.expandIntentAddBusy ||
                this.tableAddBusy ||
                this.assistantPlanning ||
                this.assistantExecuting
            );
        },
        displayGraph() {
            return getDisplayGraph(this.activeSession, {
                selectedNodeId: this.selectedNodeId,
                expressionOptions: this.expressionOptions,
            });
        },
        allCanvasGraphNodes() {
            return this.activeSession?.graphNodes || [];
        },
        canvasGraphNodes() {
            return this.displayGraph.visibleNodes;
        },
        canvasGraphEdges() {
            return this.displayGraph.visibleEdges;
        },
        allGraphNodeCount() {
            return this.activeSession?.graphNodes?.length || 0;
        },
        visibleGraphNodeCount() {
            return this.displayGraph.visibleNodes.length;
        },
        graphFilters() {
            return (
                this.activeSession?.controls?.graphFilters ||
                createDefaultGraphFilters(this.expressionOptions)
            );
        },
        expandFilters() {
            return (
                this.activeSession?.controls?.expandFilters ||
                createDefaultGraphFilters(this.expressionOptions)
            );
        },
        expandControls() {
            return this.activeSession?.controls || {};
        },
        expandGraphNeedsLlm() {
            return expandNeedsLlm(this.expandFilters);
        },
        expandSeedItems() {
            if (this.expandSeedNodeIds.length) {
                return this.expandSeedNodeIds
                    .map((nodeId) => graphNodeToAnchorItem(findGraphNode(this.activeSession, nodeId)))
                    .filter(Boolean);
            }
            return keyNodeItemsFromSession(this.activeSession);
        },
        expandFromSingleNode() {
            return this.expandSeedNodeIds.length === 1;
        },
        expandFromEdge() {
            return this.expandSeedNodeIds.length === 2;
        },
        expandSeedLabel() {
            if (this.expandFromSingleNode) {
                return "From node";
            }
            if (this.expandFromEdge) {
                return "From edge";
            }
            return "Selected nodes";
        },
        expansionHistoryEntries() {
            return expansionHistoryEntriesFromSession(this.activeSession);
        },
        expandSeedMode() {
            if (this.expandFromEdge) {
                return "edge";
            }
            if (this.expandFromSingleNode) {
                return "node";
            }
            return "selected";
        },
        expandSeedSummary() {
            const labels = (this.expandSeedItems || [])
                .map((item) => item.label || item.node_id)
                .filter(Boolean);
            if (!labels.length) {
                return "";
            }
            if (this.expandFromEdge && labels.length === 2) {
                return `${labels[0]} ↔ ${labels[1]}`;
            }
            if (labels.length <= 4) {
                return labels.join(", ");
            }
            return `${labels.slice(0, 4).join(", ")} + ${labels.length - 4} more`;
        },
        expandAvailableTargetTypes() {
            const scope = this.activeSession?.controls?.connectionScope || "direct";
            return getAvailableConnectionTargetTypes(this.expandSeedItems, scope);
        },
        savedVisibilityFilters() {
            return normalizeVisibilityFilterLayers(
                this.activeSession,
                this.expressionOptions
            );
        },
        invisibleGraphNodeCount() {
            return countInvisibleGraphNodes(this.activeSession, this.expressionOptions);
        },
        graphFilterCanClearDraft() {
            return sessionGraphFilterCanReset(this.activeSession, this.expressionOptions);
        },
        graphFilterCanBuild() {
            return draftHasBuildCriteria(this.graphFilters);
        },
        graphFilterNeedsLlm() {
            return graphFilterNeedsLlm(this.graphFilters);
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
            return computeContextualEdgeSignature(this.activeSession) || "";
        },
    },
    watch: {
        contextualGraphSignature() {
            this.scheduleContextualEdgesFetch();
        },
    },
    created() {
        this.canvasOpenCount = userUtils.recordRevealKgCanvasOpen();
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
        onWelcomeCreateWithAssistant() {
            this.bootstrapEmptyCanvas({ openAssistant: true });
        },
        onWelcomeBlankCanvas() {
            this.bootstrapEmptyCanvas();
        },
        bootstrapEmptyCanvas({ openAssistant = false } = {}) {
            this.clearDuplicateFlow();
            this.welcomeOpen = false;
            this.initialGraphOpen = false;
            this.libraryOpen = false;
            this.resetStarterBuilder();
            this.closeNodeActionMenu();
            this.closeEdgeActionMenu();
            this.selectedNodeId = null;
            this.selectedEdgeId = null;
            this.selectedEdgeRef = null;
            this.edgeProvenanceLoadingId = null;
            this.inspectorInspectSeq += 1;
            this.loadedSavedGraphId = null;
            this.graphError = "";
            this.graphLoading = false;
            this.activeSession = ensureSessionFilterState(
                withNormalizedKeyNodes(createBlankCanvasSession()),
                this.expressionOptions
            );
            this.contextualFetchSignature = "";
            this.resetGraphReminders(
                openAssistant ? `assistant-bootstrap-${Date.now()}` : `blank-${Date.now()}`
            );
            if (openAssistant) {
                this.expandGraphOpen = false;
                this.filterGraphOpen = false;
                this.aiAssistantOpen = true;
                this.$nextTick(() => {
                    this.$refs.aiAssistantPanel?.focusRequestInput?.();
                });
                return;
            }
            this.showStatus(
                "Blank canvas ready. Use Expand KG → Add nodes to place entities.",
                3600
            );
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
                this.welcomeInitialTab = "start";
                this.welcomeOpen = true;
            }
        },
        resetStarterBuilder() {
            this.starterBuckets = emptyStarterBuckets();
            this.starterContext = "";
            this.addNeighboringNodes = false;
        },
        async onInitialGraphContinue({ buckets, context, addNeighboringNodes }) {
            this.starterBuckets = buckets;
            this.starterContext = context;
            this.addNeighboringNodes = addNeighboringNodes === true;
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
                sigChainRuns: [],
                sigChainRun: null,
                sigChainLoading: false,
                datasetRuns: [],
                datasetRun: null,
                datasetLoading: false,
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
                this.activeSession = ensureSessionFilterState(
                    withNormalizedKeyNodes({
                        ...this.activeSession,
                        graphNodes: built.graphNodes,
                        graphEdges: built.graphEdges,
                        contextualEdges: [],
                        retrievalLedger: built.retrievalLedger || {},
                        anchorItems: built.anchorItems,
                        context: built.context,
                        highlighted: built.highlighted || [],
                        graphFilterCache: {},
                        visibilityFilterLayers: [],
                    }),
                    this.expressionOptions
                );
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
            if (!payload?.nodeId || this.canvasGraphBusy) {
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
            if (!payload?.edgeId || this.canvasGraphBusy) {
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
            if (graphNode && isGeneSetInspectorNode(graphNode)) {
                logGeneSetInspect("open inspector", {
                    graphNode,
                    extra: {
                        connectionCache:
                            this.activeSession?.nodeConnectionEvidenceCache?.[graphNode.id] ||
                            {},
                    },
                });
            } else if (graphNode && isTraitInspectorNode(graphNode)) {
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
                    "Selected nodes cannot be removed. Remove from selected nodes first.",
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
            this.openExpandGraphFromNode(node.nodeId);
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
            this.openExpandGraphFromEdge(edge);
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
                    ? `Marked ${label} as a selected node.`
                    : `Removed ${label} from selected nodes.`,
                2600
            );
        },
        onGraphAction(action) {
            if (action === "filter") {
                this.openFilterGraph();
                return;
            }
            if (action === "expand") {
                this.openExpandGraph();
                return;
            }
            if (action === "assistant") {
                this.openAiAssistant();
                return;
            }
            this.showStatus(`Triggered: ${action}`);
        },
        openAiAssistant() {
            if (this.aiAssistantOpen) {
                this.closeAiAssistant();
                return;
            }
            if (!this.activeSession) {
                this.showStatus("Start a canvas session before using the canvas assistant.", 3200);
                return;
            }
            this.expandGraphOpen = false;
            this.filterGraphOpen = false;
            this.aiAssistantOpen = true;
        },
        closeAiAssistant() {
            if (this.assistantExecuting) {
                return;
            }
            abortAssistantPlan();
            this.aiAssistantOpen = false;
            this.assistantPlanning = false;
            this.assistantPlan = null;
            this.assistantClarification = null;
            this.assistantStepStates = {};
            this.assistantError = "";
            this.assistantExecutingStepLabel = "";
            this.clearAssistantStepProgress();
        },
        beginAssistantStepProgress(step) {
            if (!step?.action) {
                return;
            }
            this.assistantExecutingStepLabel = String(step.label || "").trim();
            this.nodeActionMenu = null;
            this.edgeActionMenu = null;
            const message =
                this.assistantExecutingStepLabel ||
                defaultProgressMessageForAction(step.action);
            if (assistantActionUsesExpandProgress(step.action)) {
                this.expandGraphLoading = true;
                this.expandGraphProgress = message;
                this.expandBatchProgress = emptyExpandBatchProgress(message);
                return;
            }
            if (assistantActionShowsProgressOverlay(step.action, step.options || {})) {
                this.assistantActionProgressOpen = true;
                this.assistantActionProgressMessage = message;
            }
        },
        endAssistantStepProgress(step) {
            if (!step?.action) {
                return;
            }
            if (assistantActionUsesExpandProgress(step.action)) {
                this.expandGraphLoading = false;
                this.expandGraphProgress = "";
                this.expandBatchProgress = null;
            }
            if (assistantActionShowsProgressOverlay(step.action, step.options || {})) {
                this.assistantActionProgressOpen = false;
                this.assistantActionProgressMessage = "";
            }
        },
        clearAssistantStepProgress() {
            this.assistantExecutingStepLabel = "";
            this.expandGraphLoading = false;
            this.expandGraphProgress = "";
            this.expandBatchProgress = null;
            this.assistantActionProgressOpen = false;
            this.assistantActionProgressMessage = "";
        },
        onAssistantProgress(update, step) {
            if (step && assistantActionUsesExpandProgress(step.action)) {
                if (update && typeof update === "object") {
                    this.onExpandProgress(update);
                    return;
                }
                const expandMessage = String(update || this.expandGraphProgress || "").trim();
                this.expandGraphProgress = expandMessage;
                if (expandMessage && this.assistantExecuting) {
                    this.assistantExecutingStepLabel = expandMessage;
                }
                return;
            }
            const message = String(update || "").trim();
            if (!message) {
                return;
            }
            if (this.assistantExecuting) {
                this.assistantExecutingStepLabel = message;
            }
            if (step && assistantActionShowsProgressOverlay(step.action, step.options || {})) {
                this.assistantActionProgressMessage = message;
            }
        },
        resetAssistantPlanState() {
            this.assistantPlan = null;
            this.assistantClarification = null;
            this.assistantStepStates = {};
            this.assistantError = "";
        },
        applyAssistantStepOutcome(step, session, meta = {}, previousNodeCount = 0) {
            const effects = assistantActionPostEffects(step?.action, step?.options || {});
            if (effects.normalizeSession) {
                this.activeSession = ensureSessionFilterState(
                    withNormalizedKeyNodes(session),
                    this.expressionOptions
                );
            } else {
                this.activeSession = session;
            }
            if (effects.forceContextualRefetch) {
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
            }
            if (effects.clearHiddenSelection) {
                this.clearSelectionIfHidden();
            }
            if (effects.remindAfterMutation) {
                this.maybeRemindAfterGraphMutation(previousNodeCount);
            }
            if (this.activeSession?.pendingNodeAdds?.length) {
                this.showGraphRebuildReminder();
            }
            this.applyAssistantStepUiEffects(step, meta);
        },
        applyAssistantStepUiEffects(step, meta = {}) {
            if (step?.action === "explain_graph" && meta.openExplain) {
                this.explainScope =
                    meta.scope === EXPLAIN_SCOPE.ENTIRE_GRAPH
                        ? EXPLAIN_SCOPE.ENTIRE_GRAPH
                        : EXPLAIN_SCOPE.KEY_NODES;
                this.explainGraphOpen = true;
                this.remindAfterAnalysis("Explain graph");
            }
            if (meta.openHypotheses) {
                this.hypothesesOpen = true;
                this.remindAfterAnalysis("Build hypotheses");
            }
            if (meta.openDatasets) {
                this.relatedDatasetsOpen = true;
                this.datasetForceSearchForm = false;
            }
        },
        async onAssistantPlanRequest(payload) {
            const query = String(
                typeof payload === "string" ? payload : payload?.query || ""
            ).trim();
            const threadHistory =
                typeof payload === "object" && Array.isArray(payload?.threadHistory)
                    ? payload.threadHistory
                    : [];
            if (!query) {
                return;
            }
            this.assistantUserQuery = query;
            if (!this.activeSession) {
                this.assistantError = "Start a canvas session before planning canvas actions.";
                return;
            }
            if (this.assistantPlanning || this.assistantExecuting) {
                return;
            }
            const previousPlan = this.assistantPlan;
            this.resetAssistantPlanState();
            this.assistantPlanning = true;
            try {
                this.refreshSavedGraphs();
                const canvas = this.$refs.workspaceCanvas;
                const { result } = await planAssistantQuery(query, this.activeSession, {
                    interactiveLlmAvailable: this.llmAvailable,
                    viewOptions: canvas?.getGraphViewOptions?.() || {},
                    conversation: threadHistory,
                    lastPlan: previousPlan,
                    savedLibraryGraphs: this.savedGraphs,
                });
                if (result?.type === "clarify") {
                    this.assistantClarification = {
                        ...result,
                        restoreQuery: query,
                    };
                    return;
                }
                this.assistantPlan = result;
                this.assistantStepStates = initialAssistantStepStates(result.steps);
            } catch (error) {
                this.assistantError = sanitizeAssistantError(error);
            } finally {
                this.assistantPlanning = false;
            }
        },
        async onAssistantExecuteAll() {
            if (!this.assistantPlan?.steps?.length || this.assistantExecuting) {
                return;
            }
            await this.runAssistantPlanSteps(this.assistantPlan.steps, { startIndex: 0 });
        },
        onAssistantOpenPanel({ target = "expand", expandPanelTab = "discover" } = {}) {
            if (target === "filter") {
                this.openFilterGraph();
                return;
            }
            const seedNodeIds = normalizeKeyNodeIds(this.activeSession);
            this.openExpandGraphPanel({
                seedNodeIds,
                tab: expandPanelTab === "manual" ? "manual" : "discover",
            });
        },
        async onAssistantExecuteStep(stepId) {
            if (!this.assistantPlan?.steps?.length || this.assistantExecuting) {
                return;
            }
            const index = this.assistantPlan.steps.findIndex((step) => step.id === stepId);
            if (index < 0) {
                return;
            }
            await this.runAssistantPlanSteps(this.assistantPlan.steps, { startIndex: index });
        },
        setAssistantStepState(stepId, status) {
            this.assistantStepStates = {
                ...this.assistantStepStates,
                [stepId]: status,
            };
        },
        async runAssistantPlanSteps(steps, { startIndex = 0 } = {}) {
            if (!this.activeSession || this.assistantExecuting) {
                return;
            }
            const stepsToRun = steps.slice(startIndex);
            const postEffects = computeAssistantPlanPostEffects(stepsToRun);
            this.assistantExecuting = true;
            this.assistantError = "";
            if (postEffects.graphLoading) {
                this.graphLoading = true;
            }
            let stepPreviousNodeCount = this.activeSession.graphNodes?.length || 0;
            try {
                this.refreshSavedGraphs();
                const result = await executeAssistantPlan(
                    this.activeSession,
                    steps,
                    {
                        apiClient: this.apiClient,
                        expressionOptions: this.expressionOptions,
                        interactiveLlmAvailable: this.llmAvailable,
                        userQuery: this.assistantUserQuery,
                        anchorItems: this.canvasAnchorItems,
                        savedLibraryGraphs: this.savedGraphs,
                        setGraphViewOptions: (options) => {
                            this.$refs.workspaceCanvas?.setGraphViewOptions(options);
                        },
                        setGraphTableOpen: (open) => {
                            this.$refs.workspaceCanvas?.setGraphTableOpen(open);
                        },
                        inspectNode: ({ nodeId }) => {
                            this.onNodeActionInspect({ nodeId });
                        },
                        inspectEdge: ({ edgeId, sourceId, targetId }) => {
                            this.inspectorInspectSeq += 1;
                            this.selectedNodeId = null;
                            this.selectedEdgeId = edgeId || null;
                            this.selectedEdgeRef = { edgeId, sourceId, targetId };
                            this.inspectorOpen = true;
                        },
                        openExportGraph: () => this.openExportGraph(),
                        openImportGraph: () => this.onImportGraphClick(),
                        openSaveGraph: () => this.openSaveGraph(),
                        openNewGraph: () => this.openInitialGraphSetup({ reset: true }),
                        downloadSnapshot: () => this.downloadGraphSnapshot(),
                        openExpandGraphPanel: ({ seedNodeIds = [] } = {}) =>
                            this.openExpandGraphPanel({ seedNodeIds }),
                        openFilterGraphPanel: () => this.openFilterGraph(),
                        openMyLibrary: () => this.openLibrary(),
                        loadLibraryGraph: (record) => {
                            const session = this.graphStore.sessionFromGraph(record);
                            if (!session?.graphNodes?.length) {
                                throw new Error("Could not load that saved graph.");
                            }
                            this.loadSessionOntoCanvas(session, {
                                restoreInspectorCaches: false,
                                loadedSavedGraphId: record.id,
                                statusMessage: `Loaded "${record.label}"`,
                            });
                            return this.activeSession;
                        },
                        focusGraphView: (options) =>
                            this.$refs.workspaceCanvas?.focusGraphView?.(options),
                        onProgress: (update) => {
                            this.onAssistantProgress(update, this.assistantCurrentStep);
                        },
                        onStepStart: (step) => {
                            this.assistantCurrentStep = step;
                            this.setAssistantStepState(step.id, "running");
                            this.beginAssistantStepProgress(step);
                        },
                        onStepComplete: (step, index, workingSession, meta) => {
                            this.endAssistantStepProgress(step);
                            this.setAssistantStepState(step.id, "done");
                            this.applyAssistantStepOutcome(
                                step,
                                workingSession,
                                meta,
                                stepPreviousNodeCount
                            );
                            stepPreviousNodeCount = workingSession?.graphNodes?.length || 0;
                            const summary = formatAssistantStepSummary(step, meta);
                            this.$refs.aiAssistantPanel?.appendStepResult?.(summary, {
                                workflowLink: meta?.bulkWorkflowLink || null,
                            });
                        },
                        onStepError: (step) => {
                            this.endAssistantStepProgress(step);
                            this.setAssistantStepState(step.id, "error");
                        },
                    },
                    { startIndex }
                );
                this.showStatus("Canvas assistant finished running the plan.", 3200);
            } catch (error) {
                this.assistantError = sanitizeAssistantError(error);
                this.showStatus(this.assistantError, 3600);
            } finally {
                this.assistantExecuting = false;
                this.assistantCurrentStep = null;
                this.clearAssistantStepProgress();
                if (postEffects.graphLoading) {
                    this.graphLoading = false;
                }
                if (this.activeSession?.pendingNodeAdds?.length) {
                    this.clearGraphRebuildTimer();
                    void this.runPendingGraphRebuild();
                }
            }
        },
        openExpandGraph() {
            this.openExpandGraphPanel({ seedNodeIds: [] });
        },
        openExpandGraphFromNode(nodeId) {
            if (!nodeId) {
                return;
            }
            this.openExpandGraphPanel({ seedNodeIds: [nodeId] });
        },
        openExpandGraphFromEdge(edgeRef) {
            const edge =
                edgeRef?.edge ||
                findSessionEdge(
                    this.activeSession,
                    edgeRef?.edgeId,
                    edgeRef?.sourceId,
                    edgeRef?.targetId
                );
            const sourceId = edgeRef?.sourceId || edge?.source;
            const targetId = edgeRef?.targetId || edge?.target;
            const nodeIds = [sourceId, targetId].filter(
                (nodeId, index, list) =>
                    nodeId &&
                    list.indexOf(nodeId) === index &&
                    findGraphNode(this.activeSession, nodeId)
            );
            if (!nodeIds.length) {
                this.showStatus("Edge endpoints not found on the graph.", 3200);
                return;
            }
            this.openExpandGraphPanel({ seedNodeIds: nodeIds });
        },
        openExpandGraphPanel({ seedNodeIds = [], tab = "" } = {}) {
            if (!this.activeSession) {
                this.showStatus("Start a canvas session before expanding.", 3200);
                return;
            }
            const normalizedSeedIds = (seedNodeIds || []).filter(Boolean);
            this.expandPanelInitialTab =
                tab === "manual" || tab === "discover" || tab === "history" ? tab : "";
            if (!this.activeSession.graphNodes?.length) {
                this.filterGraphOpen = false;
                this.aiAssistantOpen = false;
                this.expandSeedNodeIds = [];
                this.expandGraphOpen = true;
                return;
            }
            for (const nodeId of normalizedSeedIds) {
                if (!findGraphNode(this.activeSession, nodeId)) {
                    this.showStatus("That node is no longer on the graph.", 3200);
                    return;
                }
            }
            this.filterGraphOpen = false;
            this.aiAssistantOpen = false;
            this.expandSeedNodeIds = normalizedSeedIds;
            this.activeSession = ensureSessionFilterState(
                this.activeSession,
                this.expressionOptions
            );
            this.expandGraphOpen = true;
        },
        closeExpandGraph() {
            if (this.expandGraphLoading || this.expandManualAddBusy || this.expandIntentAddBusy) {
                return;
            }
            this.expandGraphOpen = false;
            this.expandPanelInitialTab = "";
            this.expandSeedNodeIds = [];
        },
        onRemoveExpansionHistoryEntry(entryId) {
            if (!this.activeSession || !entryId) {
                return;
            }
            this.activeSession = removeExpansionHistoryEntry(this.activeSession, entryId);
        },
        onExpandFiltersPatch(patch) {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = patchSessionExpandControls(
                this.activeSession,
                { expandFilters: patch },
                this.expressionOptions
            );
        },
        onExpandControlsPatch(patch) {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = patchSessionExpandControls(
                this.activeSession,
                patch,
                this.expressionOptions
            );
        },
        onExpandToggleNovelty(label) {
            if (!this.activeSession) {
                return;
            }
            const current = this.activeSession.controls?.expandFilters || {};
            this.activeSession = patchSessionExpandControls(
                this.activeSession,
                {
                    expandFilters: toggleNoveltyIncludeCheckbox(current, label),
                },
                this.expressionOptions
            );
        },
        onExpandManualAddError(message) {
            this.showStatus(String(message || "Could not search for that node."), 3200);
        },
        async onExpandIntentAddNodes({ intention } = {}) {
            const text = String(intention || "").trim();
            if (!text || !this.activeSession) {
                return;
            }
            if (!this.llmAvailable) {
                this.showStatus("Intention-based add requires an LLM backend.", 3200);
                return;
            }
            this.expandIntentAddBusy = true;
            this.expandIntentAddStatus = "Planning catalog searches…";
            this.expandIntentAddExplanation = "";
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            try {
                const result = await resolveIntentAddNodes(text, this.activeSession, {
                    apiClient: this.apiClient,
                    sessionContext: this.activeSession.context || "",
                    onProgress: (message) => {
                        this.expandIntentAddStatus = message;
                    },
                });
                this.expandIntentAddExplanation = result.plan.explanation || "";
                const nextSession = await addNodesToWorkspaceGraph(
                    this.apiClient,
                    this.activeSession,
                    result.rows
                );
                this.activeSession = withNormalizedKeyNodes(nextSession);
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.maybeRemindAfterGraphMutation(previousNodeCount);
                const addedCount = Math.max(
                    0,
                    (this.activeSession.graphNodes?.length || 0) - previousNodeCount
                );
                const geneHint =
                    " Expand from added mechanisms or inspect gene sets to add genes.";
                this.showStatus(
                    `Added ${addedCount} node${addedCount === 1 ? "" : "s"} from your intention.${geneHint}`,
                    5200
                );
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not add nodes from that intention.",
                    3600
                );
            } finally {
                this.expandIntentAddBusy = false;
                this.expandIntentAddStatus = "";
            }
        },
        async onExpandManualAddNode(row) {
            if (!this.activeSession) {
                this.showStatus("Start a canvas session before adding nodes.", 3200);
                return;
            }
            if (!row?.node_id) {
                return;
            }
            const existingIds = new Set((this.activeSession.graphNodes || []).map((node) => node.id));
            if (existingIds.has(row.node_id)) {
                this.showStatus(`${row.label || row.node_id} is already on the graph.`, 2800);
                return;
            }
            this.expandManualAddBusy = true;
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            try {
                const nextSession = row.demo_gene_set?.standard_name
                    ? addDemoGeneSetsToGraphLocally(this.activeSession, [row])
                    : await addNodesToWorkspaceGraph(this.apiClient, this.activeSession, [row]);
                if ((nextSession.graphNodes?.length || 0) <= previousNodeCount) {
                    this.showStatus(`${row.label || row.node_id} is already on the graph.`, 2800);
                    return;
                }
                this.activeSession = withNormalizedKeyNodes(nextSession);
                if (!row.demo_gene_set?.standard_name) {
                    this.contextualFetchSignature = "";
                    this.scheduleContextualEdgesFetch({ immediate: true });
                }
                this.maybeRemindAfterGraphMutation(previousNodeCount);
                this.showStatus(`Added ${row.label || row.node_id} to the graph.`, 2800);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not add that node.",
                    3200
                );
            } finally {
                this.expandManualAddBusy = false;
            }
        },
        async runExpandGraph() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before expanding.", 3200);
                return;
            }
            if (!this.expandSeedItems.length) {
                this.showStatus(
                    this.expandFromSingleNode || this.expandFromEdge
                        ? "Those expansion seeds are no longer on the graph."
                        : "Mark at least one selected node before expanding.",
                    3200
                );
                return;
            }
            if (!this.llmAvailable && this.expandGraphNeedsLlm) {
                this.showStatus("LLM expansion filters are not available.", 3200);
                return;
            }
            this.expandGraphLoading = true;
            this.expandGraphProgress = "Expanding graph…";
            this.expandBatchProgress = emptyExpandBatchProgress("Expanding graph…");
            this.nodeActionMenu = null;
            this.edgeActionMenu = null;
            const previousNodeCount = this.activeSession.graphNodes?.length || 0;
            try {
                const result = await expandGraphOnSession(this.activeSession, {
                    apiClient: this.apiClient,
                    expressionOptions: this.expressionOptions,
                    anchorItems: this.expandSeedItems,
                    onProgress: (update) => {
                        this.onExpandProgress(update);
                    },
                });
                let nextSession = ensureSessionFilterState(
                    withNormalizedKeyNodes(result.session),
                    this.expressionOptions
                );
                nextSession = appendExpansionHistoryEntry(
                    nextSession,
                    buildExpansionHistoryEntry({
                        addedItems: result.addedItems,
                        addedCount: result.addedCount,
                        expandFilters: this.expandFilters,
                        controls: this.expandControls,
                        seedSummary: this.expandSeedSummary,
                        seedMode: this.expandSeedMode,
                    })
                );
                this.activeSession = nextSession;
                this.contextualFetchSignature = "";
                this.scheduleContextualEdgesFetch({ immediate: true });
                this.maybeRemindAfterGraphMutation(previousNodeCount);
                const count = result.addedCount || 0;
                this.showStatus(
                    count
                        ? `Added ${count} node${count === 1 ? "" : "s"} to the graph.`
                        : "Expansion completed with no new nodes.",
                    3200
                );
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not expand the graph.",
                    3200
                );
            } finally {
                this.expandGraphLoading = false;
                this.expandGraphProgress = "";
            }
        },
        onExpandProgress(update) {
            const normalized = normalizeExpandProgressUpdate(update);
            this.expandGraphProgress = normalized.message;
            this.expandBatchProgress = normalized;
        },
        openFilterGraph() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before filtering.", 3200);
                return;
            }
            this.expandGraphOpen = false;
            this.aiAssistantOpen = false;
            let session = ensureSessionFilterState(
                this.activeSession,
                this.expressionOptions
            );
            session = {
                ...session,
                visibilityFilterLayers: normalizeVisibilityFilterLayers(
                    session,
                    this.expressionOptions
                ),
                appliedGraphFilter: null,
            };
            this.activeSession = session;
            this.filterGraphOpen = true;
        },
        closeFilterGraph() {
            if (this.graphFilterLoading) {
                return;
            }
            this.filterGraphOpen = false;
        },
        onGraphFiltersPatch(patch) {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = patchSessionGraphFilters(
                this.activeSession,
                patch,
                this.expressionOptions
            );
        },
        onGraphFilterToggleNovelty(label) {
            if (!this.activeSession) {
                return;
            }
            const current = this.activeSession.controls?.graphFilters || {};
            this.activeSession = patchSessionGraphFilters(
                this.activeSession,
                toggleNoveltyIncludeCheckbox(current, label),
                this.expressionOptions
            );
        },
        clearSelectionIfHidden() {
            if (!this.selectedNodeId || !this.activeSession) {
                return;
            }
            const node = findGraphNode(this.activeSession, this.selectedNodeId);
            if (
                node &&
                !isNodeVisibleInSession(node, this.activeSession, this.expressionOptions)
            ) {
                this.selectedNodeId = null;
                this.selectedEdgeId = null;
                this.selectedEdgeRef = null;
                this.inspectorOpen = false;
            }
        },
        async buildVisibilityFilter() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before creating filters.", 3200);
                return;
            }
            if (!this.graphFilterCanBuild) {
                this.showStatus(
                    "Add expression, novelty, or intent criteria before building.",
                    3200
                );
                return;
            }
            if (!this.llmAvailable && this.graphFilterNeedsLlm) {
                this.showStatus("LLM filtering is not available.", 3200);
                return;
            }
            this.graphFilterLoading = true;
            this.graphFilterProgress = "Building visibility filter…";
            this.graphLoading = true;
            try {
                const result = await buildVisibilityFilterOnSession(this.activeSession, {
                    apiClient: this.apiClient,
                    expressionOptions: this.expressionOptions,
                    anchorItems: this.canvasAnchorItems,
                    onProgress: (label) => {
                        this.graphFilterProgress = label;
                    },
                });
                this.activeSession = ensureSessionFilterState(
                    result.session,
                    this.expressionOptions
                );
                this.clearSelectionIfHidden();
                this.showStatus(
                    `Filter built (${result.afterVisibleCount}/${result.beforeVisibleCount} nodes visible).`,
                    3600
                );
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Filter build failed.",
                    3600
                );
            } finally {
                this.graphFilterLoading = false;
                this.graphFilterProgress = "";
                this.graphLoading = false;
            }
        },
        clearGraphFilterDraft() {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = ensureSessionFilterState(
                resetGraphFilterOnSession(this.activeSession, this.expressionOptions),
                this.expressionOptions
            );
            this.showStatus("Filter form cleared.", 2800);
        },
        onToggleVisibilityFilterLayer(layerId) {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = {
                ...toggleVisibilityFilterLayer(
                    this.activeSession,
                    layerId,
                    this.expressionOptions
                ),
            };
            this.clearSelectionIfHidden();
        },
        onRemoveVisibilityFilterLayer(layerId) {
            if (!this.activeSession) {
                return;
            }
            this.activeSession = {
                ...removeVisibilityFilterLayer(
                    this.activeSession,
                    layerId,
                    this.expressionOptions
                ),
            };
            this.clearSelectionIfHidden();
        },
        onRemoveInvisibleNodesFromGraph() {
            if (!this.activeSession) {
                return;
            }
            const nodeIds = collectInvisibleNodeIds(
                this.activeSession,
                this.expressionOptions
            );
            if (!nodeIds.length) {
                this.showStatus("No hidden nodes to remove.", 2800);
                return;
            }
            const nextSession = removeNodesFromWorkspaceGraph(this.activeSession, nodeIds);
            this.activeSession = withNormalizedKeyNodes({
                ...nextSession,
                contextualEdgeSignature: "",
            });
            if (
                this.selectedNodeId &&
                nodeIds.includes(this.selectedNodeId)
            ) {
                this.selectedNodeId = null;
                this.selectedEdgeId = null;
                this.selectedEdgeRef = null;
                this.inspectorOpen = false;
            }
            this.clearSelectionIfHidden();
            this.showStatus(
                `Removed ${nodeIds.length} hidden node${nodeIds.length === 1 ? "" : "s"} from the graph.`,
                3600
            );
        },
        async runGraphFilter() {
            return this.buildVisibilityFilter();
        },
        resetGraphFilter() {
            return this.clearGraphFilterDraft();
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
                const { visibleNodes } = getDisplayGraph(session);
                const contextualEdges = await fetchContextualEdgesForGraph(
                    this.apiClient,
                    visibleNodes,
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
        openLearnCanvas() {
            this.learnCompanionOpen = true;
        },
        closeLearnCompanion() {
            this.learnCompanionOpen = false;
        },
        closeWelcome() {
            this.welcomeOpen = false;
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
                `Added ${node?.label || nodeId} as a selected node.`,
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
                this.showStatus("Suggested nodes are already selected nodes.", 2600);
                return;
            }
            this.activeSession = withNormalizedKeyNodes(session);
            this.showStatus(
                `Added ${addedIds.length} suggested node${addedIds.length === 1 ? "" : "s"} as selected nodes.`,
                2800
            );
        },
        triggerBuildHypotheses() {
            this.startBuildHypotheses();
        },
        startBuildHypotheses() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before building hypotheses.", 3200);
                return;
            }
            if (!normalizeKeyNodeIds(this.activeSession).length) {
                this.showStatus(
                    "Mark nodes as selected on the canvas before building hypotheses.",
                    3200
                );
                return;
            }
            const current = this.activeSession?.sigChainRun;
            if (current?.status === "success") {
                this.hypothesesOpen = true;
                return;
            }
            if (current?.status === "draft" || current?.status === "error") {
                this.ensureSigChainDraft({ forceNew: false });
                this.hypothesesOpen = true;
                return;
            }
            const saved = this.savedHypothesisRuns;
            if (saved.length) {
                this.activeSession = {
                    ...this.activeSession,
                    sigChainRun: saved[0],
                };
                this.hypothesesOpen = true;
                return;
            }
            this.ensureSigChainDraft({ forceNew: false });
            this.hypothesesOpen = true;
        },
        openSavedHypothesesRun(runId) {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before building hypotheses.", 3200);
                return;
            }
            if (!runId) {
                this.startBuildHypotheses();
                return;
            }
            const entry = (this.activeSession.sigChainRuns || []).find(
                (item) => item.id === runId
            );
            if (entry) {
                this.activeSession = {
                    ...this.activeSession,
                    sigChainRun: entry,
                };
            }
            this.hypothesesOpen = true;
        },
        closeBuildHypotheses() {
            if (this.sigChainLoading) {
                return;
            }
            this.hypothesesOpen = false;
        },
        onSigChainNewRun() {
            this.ensureSigChainDraft({ forceNew: true });
        },
        ensureSigChainDraft({ forceNew = false } = {}) {
            if (!this.activeSession) {
                return;
            }
            const draft = ensureSigChainDraft(this.activeSession, { forceNew });
            const runs = this.mergeSigChainRunIntoHistory(draft).filter(
                (entry) => entry.status !== "draft" || entry.id === draft.id
            );
            this.activeSession = {
                ...this.activeSession,
                sigChainRun: draft,
                sigChainRuns: runs,
                explainContext: draft.additionalContext,
            };
        },
        mergeSigChainRunIntoHistory(run) {
            const runs = this.activeSession?.sigChainRuns || [];
            const existingIndex = runs.findIndex((entry) => entry.id === run.id);
            if (existingIndex === -1) {
                return [run, ...runs];
            }
            return runs.map((entry, index) => (index === existingIndex ? run : entry));
        },
        onSigChainPathwayStateUpdate({ chainKey, state }) {
            const run = this.activeSigChainRun;
            if (!run?.id || !chainKey) {
                return;
            }
            const pathwayCache = {
                ...(run.pathwayCache || {}),
                [chainKey]: {
                    ...(run.pathwayCache?.[chainKey] || {}),
                    ...state,
                },
            };
            this.patchSigChainRunEntry(run.id, patchSigChainRun(run, { pathwayCache }));
        },
        onSigChainDraftPatch(patch) {
            const run = this.activeSigChainDraft || this.activeSigChainRun;
            if (!run || !this.activeSession) {
                return;
            }
            let mergedPatch = { ...patch };
            if (patch.noveltyFilter !== undefined) {
                const snapshot = computeSigChainDraftSnapshot(this.activeSession);
                mergedPatch = {
                    ...mergedPatch,
                    queryText: buildSigChainPrioritizationQuestion({
                        selectedNodes: run.selectedNodes?.length
                            ? run.selectedNodes
                            : snapshot.selectedNodes,
                        intent: run.intent || snapshot.intent,
                        noveltyFilter: patch.noveltyFilter,
                    }),
                };
            }
            const nextRun = patchSigChainRun(run, mergedPatch);
            this.patchSigChainRunEntry(run.id, nextRun);
        },
        patchSigChainRunEntry(runId, nextRun) {
            if (!this.activeSession || !runId) {
                return;
            }
            this.activeSession = {
                ...this.activeSession,
                explainContext: nextRun.additionalContext ?? this.activeSession.explainContext,
                sigChainRun:
                    this.activeSession.sigChainRun?.id === runId
                        ? nextRun
                        : this.activeSession.sigChainRun,
                sigChainRuns: (this.activeSession.sigChainRuns || []).map((entry) =>
                    entry.id === runId ? nextRun : entry
                ),
            };
        },
        async runSigChainPrioritization() {
            const session = this.activeSession;
            const run = this.activeSigChainDraft || session?.sigChainRun;
            if (!session || !run) {
                return;
            }
            if (!this.llmAvailable) {
                this.showStatus("LLM prioritization is not available.", 3200);
                return;
            }
            if (!this.apiClient?.prioritizeInteractiveSigChains) {
                this.showStatus("Connection ranking API is not configured.", 3200);
                return;
            }
            const snapshot = getSigChainPrioritizationSnapshot(session);
            const visibleNodes = run.graphNodes?.length
                ? run.graphNodes
                : snapshot.visibleNodes;
            const selectedNodes = run.selectedNodes?.length
                ? run.selectedNodes
                : snapshot.selectedNodes;
            let loadingRun = patchSigChainRun(run, {
                status: "loading",
                graphNodes: visibleNodes,
                selectedNodes,
                graphSignature: snapshot.graphSignature,
                error: "",
                pathwayCache: {},
            });
            this.patchSigChainRunEntry(run.id, loadingRun);
            this.activeSession = {
                ...this.activeSession,
                sigChainLoading: true,
            };
            try {
                let extraContextualEdges = [];
                if (visibleNodes.length >= 2 && this.apiClient.getInteractiveSubgraphEdges) {
                    const subgraphPayload = await this.apiClient.getInteractiveSubgraphEdges({
                        node_ids: visibleNodes.map((node) => node.id),
                        connection_scope: "direct",
                    });
                    const baseEdgeIds = new Set(
                        (session.graphEdges || []).map((edge) => edge.id)
                    );
                    extraContextualEdges = (subgraphPayload.edges || []).filter(
                        (edge) => !baseEdgeIds.has(edge.id)
                    );
                    this.activeSession = {
                        ...this.activeSession,
                        contextualEdges: extraContextualEdges,
                    };
                }
                const mergedEdges = mergeGraphEdgesForSigChainRun(
                    this.activeSession,
                    extraContextualEdges
                );
                const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
                const runEdges = edgesForVisibleNodes(mergedEdges, visibleNodeIds);
                loadingRun = patchSigChainRun(loadingRun, { graphEdges: runEdges });
                const payload = await this.apiClient.prioritizeInteractiveSigChains(
                    buildSigChainPrioritizePayload(this.activeSession, loadingRun)
                );
                const successRun = patchSigChainRun(loadingRun, {
                    status: payload?.status === "error" ? "error" : "success",
                    completedAt: new Date().toISOString(),
                    payload,
                    error: payload?.error || "",
                });
                this.patchSigChainRunEntry(run.id, successRun);
                this.activeSession = {
                    ...this.activeSession,
                    sigChainRun: successRun,
                    sigChainLoading: false,
                };
                const chainCount = successRun.payload?.chains?.length || 0;
                if (successRun.status === "error") {
                    this.showStatus(
                        successRun.error || "Could not rank connections.",
                        3200
                    );
                } else {
                    this.showStatus(
                        chainCount
                            ? `Found ${chainCount} connection${chainCount === 1 ? "" : "s"}.`
                            : "No connections matched the current graph.",
                        3200
                    );
                    this.remindAfterAnalysis("Build hypotheses");
                }
            } catch (error) {
                const errorRun = patchSigChainRun(loadingRun, {
                    status: "error",
                    completedAt: new Date().toISOString(),
                    payload: {
                        status: "error",
                        chains: [],
                        zero_state_reason: "",
                        llm_debug: { prompt: {}, response_text: "", model: "" },
                    },
                    error: String(error?.message || error),
                });
                this.patchSigChainRunEntry(run.id, errorRun);
                this.activeSession = {
                    ...this.activeSession,
                    sigChainRun: errorRun,
                    sigChainLoading: false,
                };
                this.showStatus(
                    String(error?.message || error) || "Could not rank connections.",
                    3200
                );
            }
        },
        triggerFindRelatedDatasets() {
            this.startFindRelatedDatasets();
        },
        startFindRelatedDatasets() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before finding related datasets.", 3200);
                return;
            }
            if (!this.selectedGeneCount) {
                this.showStatus(
                    "Mark one or more genes as selected on the canvas before finding related datasets.",
                    3200
                );
                return;
            }
            const activeSetKey = this.cfdeActiveSetKey;
            const current = this.activeSession?.datasetRun;
            if (current && cfdeDatasetRunMatchesActiveSet(current, activeSetKey)) {
                this.datasetForceSearchForm = false;
                this.relatedDatasetsOpen = true;
                return;
            }
            const saved = successfulCfdeDatasetRuns(this.activeSession);
            if (saved.length && cfdeDatasetRunMatchesActiveSet(saved[0], activeSetKey)) {
                this.activeSession = {
                    ...this.activeSession,
                    datasetRun: saved[0],
                };
                this.datasetForceSearchForm = false;
                this.relatedDatasetsOpen = true;
                return;
            }
            this.datasetForceSearchForm = true;
            this.relatedDatasetsOpen = true;
        },
        openSavedDatasetsRun(runId) {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Build a graph before finding related datasets.", 3200);
                return;
            }
            if (!runId) {
                this.startFindRelatedDatasets();
                return;
            }
            const entry = (this.activeSession.datasetRuns || []).find(
                (item) => item.id === runId
            );
            if (entry) {
                this.activeSession = {
                    ...this.activeSession,
                    datasetRun: entry,
                };
            }
            this.datasetForceSearchForm = false;
            this.relatedDatasetsOpen = true;
        },
        closeFindRelatedDatasets() {
            if (this.datasetLoading) {
                return;
            }
            this.relatedDatasetsOpen = false;
        },
        onDatasetSearchAgain() {
            this.datasetForceSearchForm = true;
        },
        mergeDatasetRunIntoHistory(run) {
            const runs = this.activeSession?.datasetRuns || [];
            const existingIndex = runs.findIndex((entry) => entry.id === run.id);
            if (existingIndex === -1) {
                return [run, ...runs];
            }
            return runs.map((entry, index) => (index === existingIndex ? run : entry));
        },
        patchDatasetRunEntry(runId, nextRun) {
            if (!this.activeSession || !runId) {
                return;
            }
            this.activeSession = {
                ...this.activeSession,
                datasetRun:
                    this.activeSession.datasetRun?.id === runId
                        ? nextRun
                        : this.activeSession.datasetRun,
                datasetRuns: (this.activeSession.datasetRuns || []).map((entry) =>
                    entry.id === runId ? nextRun : entry
                ),
            };
        },
        async runCfdeDatasetSearch() {
            const session = this.activeSession;
            const activeSetNodes = getCfdeActiveSetNodesFromSession(session);
            if (!session || !activeSetNodes.length) {
                this.showStatus(
                    "Mark one or more genes as selected on the canvas before finding related datasets.",
                    3200
                );
                return;
            }
            if (!this.apiClient?.findInteractiveCfdeDatasets) {
                this.showStatus("CFDE dataset search API is not configured.", 3200);
                return;
            }
            const run = buildCfdeDatasetRun(activeSetNodes);
            this.activeSession = {
                ...session,
                datasetRun: run,
                datasetRuns: this.mergeDatasetRunIntoHistory(run),
                datasetLoading: true,
            };
            this.datasetForceSearchForm = false;
            try {
                const payload = await this.apiClient.findInteractiveCfdeDatasets(
                    buildCfdeDatasetSearchPayload(session, activeSetNodes)
                );
                const nextRun = patchCfdeDatasetRun(run, {
                    status: payload?.status === "error" ? "error" : "success",
                    completedAt: new Date().toISOString(),
                    payload,
                    error: payload?.error || "",
                });
                this.patchDatasetRunEntry(run.id, nextRun);
                this.activeSession = {
                    ...this.activeSession,
                    datasetLoading: false,
                };
                const datasetCount = nextRun.payload?.datasets?.length || 0;
                if (nextRun.status === "error") {
                    this.showStatus(
                        nextRun.error || "CFDE gene-set search failed.",
                        3200
                    );
                } else {
                    this.showStatus(
                        datasetCount
                            ? `Found ${datasetCount} CFDE gene set${datasetCount === 1 ? "" : "s"}.`
                            : "No CFDE gene sets matched the selected genes.",
                        3200
                    );
                }
            } catch (error) {
                const errorRun = patchCfdeDatasetRun(run, {
                    status: "error",
                    completedAt: new Date().toISOString(),
                    payload: null,
                    error: String(error?.message || error),
                });
                this.patchDatasetRunEntry(run.id, errorRun);
                this.activeSession = {
                    ...this.activeSession,
                    datasetLoading: false,
                };
                this.showStatus(
                    String(error?.message || error) || "CFDE gene-set search failed.",
                    3200
                );
            }
        },
        async onAddCfdeGeneSet(row) {
            if (!this.activeSession || !row?.node_id) {
                return;
            }
            this.graphLoading = true;
            try {
                const nextSession = await addNodesToWorkspaceGraph(this.apiClient, this.activeSession, [
                    {
                        node_id: row.node_id,
                        node_type: "gene_set",
                        type: "gene_set",
                        label: row.label || row.node_id,
                        subtitle: row.subtitle || "",
                    },
                ]);
                const previousCount = this.activeSession.graphNodes?.length || 0;
                if ((nextSession.graphNodes?.length || 0) <= previousCount) {
                    this.showStatus(`${row.label || row.node_id} is already on the graph.`, 2800);
                    return;
                }
                this.activeSession = withNormalizedKeyNodes(nextSession);
                this.scheduleContextualEdgesFetch();
                this.showStatus(`Added ${row.label || row.node_id} to the graph.`, 2800);
            } catch (error) {
                this.showStatus(
                    String(error?.message || error) || "Could not add gene set.",
                    3200
                );
            } finally {
                this.graphLoading = false;
            }
        },
        onRemoveCfdeGeneSet(row) {
            this.onRemoveTableNode({
                nodeId: row?.node_id,
                label: row?.label,
            });
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
                void this.downloadGraphSnapshot();
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
            if (payload.menu === "help" && payload.action === "learnCanvas") {
                this.openLearnCanvas();
                return;
            }
            if (
                (payload.menu === "help" && payload.action === "documentation") ||
                (payload.menu === "documentation" && payload.action === "open")
            ) {
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
                void this.downloadGraphSnapshot();
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
                this.triggerFindRelatedDatasets();
                return;
            }
            this.showStatus(`Triggered: ${payload.label}`);
        },
        async downloadGraphSnapshot() {
            if (!this.activeSession?.graphNodes?.length) {
                this.showStatus("Nothing to snapshot — build a graph first.", 3200);
                return;
            }
            if (this.snapshotDownloadBusy) {
                return;
            }
            this.snapshotDownloadBusy = true;
            try {
                await this.$nextTick();
                const graphSvgMarkup = this.$refs.workspaceCanvas?.captureGraphSvgMarkup?.() || "";
                const result = await downloadGraphSnapshotFromSession(this.activeSession, {
                    label: this.saveGraphLabel,
                    graphSvgMarkup,
                    graphEdges: this.canvasGraphEdges,
                    contextualEdges: this.activeSession?.contextualEdges || [],
                    keyNodeIds: this.canvasKeyNodeIds,
                });
                if (!result?.ok) {
                    const detail = result?.reason ? ` ${result.reason}` : "";
                    this.showStatus(`Could not download graph snapshot.${detail}`, 5200);
                    return;
                }
                this.showStatus(`Downloaded graph snapshot as ${result.filename}.`, 4200);
            } catch (error) {
                console.error("Download graph snapshot failed", error);
                const detail = error?.message ? ` ${error.message}` : "";
                this.showStatus(`Could not download graph snapshot.${detail}`, 5200);
            } finally {
                this.snapshotDownloadBusy = false;
            }
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

            this.activeSession = ensureSessionFilterState(
                withNormalizedKeyNodes({
                    ...session,
                    graphNodes: normalized.graphNodes,
                    graphEdges: normalized.graphEdges,
                    contextualEdges: session.contextualEdges || [],
                    retrievalLedger: session.retrievalLedger || {},
                    contextualEdgeSignature: session.contextualEdgeSignature || "",
                    graphFilterCache: session.graphFilterCache || {},
                    anchorItems: anchorItemsFromBuckets(buckets),
                    starterBuckets: buckets,
                    pendingNodeAdds: [],
                    pendingGraphRebuild: false,
                    ...inspectorCaches,
                }),
                this.expressionOptions
            );
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
                this.showStatus("No selected nodes found in that graph.");
                return;
            }

            this.duplicateFlowActive = true;
            this.duplicateSourceLabel = String(record.label || "Untitled graph").trim();
            this.starterBuckets = buckets;
            this.starterContext = session.context || "";
            this.addNeighboringNodes =
                session.addNeighboringNodes !== undefined
                    ? session.addNeighboringNodes
                    : false;
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
    --wkb-toolbar-row: 28px;
    --wkb-canvas-toolbar-pad-y: 20px;
    --wkb-side-panel-gap: 8px;
    --wkb-side-panel-top: calc(
        var(--wkb-canvas-toolbar-pad-y) + var(--wkb-toolbar-row) + var(--wkb-side-panel-gap)
    );

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
    position: relative;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--cfde-border);
    background: #ffffff;
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

.rkw-canvas-shell {
    position: absolute;
    inset: 0;
}

.rkw-analysis-bubbles {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 6;
    display: flex;
    flex-direction: row-reverse;
    align-items: flex-end;
    gap: 8px;
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
