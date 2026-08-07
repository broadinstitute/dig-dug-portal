<template>
    <div class="factor-base-reveal">
        <div class="card mdkp-card" style="margin: 0 0 50px 0;">
            <div class="card-body" style="display:flex; flex-direction: column; gap:30px">
                <workflow-header @show-byor-tab="showByorTab" />
                <div class="reveal-query-section">
                    <workflow-ops-menu
                        :hypothesis-generation-mode="hypothesisGenerationMode"
                        :can-export-workflow="canExportWorkflow"
                        :busy="workflowExportImportBusy"
                        :query-builder-visible="queryHelperLinkVisible"
                        @set-mode="onOpsSetMode"
                        @reset-search="onOpsResetSearch"
                        @export-workflow="exportWorkflowSnapshot"
                        @import-workflow-file="onWorkflowImportFile"
                        @open-query-builder="openQueryHelperModal"
                        @open-query-guidelines="queryGuidelinesOpen = true"
                        @open-search-terms-extraction="searchTermsExtractionOpen = true"
                    />
                    <workflow-query-bar
                        ref="workflowQueryBar"
                        :user-query="userQuery"
                        :search-input-placeholder="searchInputPlaceholder"
                        :search-criteria-type="searchCriteriaType"
                        @update:userQuery="onUserQueryUpdate"
                        @update:searchCriteriaType="onSearchCriteriaTypeUpdate"
                        @query-focus="onQueryInputFocus"
                        @query-blur="onQueryInputBlur"
                        @reveal="queryParse"
                    />
                </div>

                <!--
                <div v-if="loading_search_criteria" class="load-indicator mb-3 d-flex align-items-center gap-2">
                    <b-spinner small></b-spinner>
                    <span class="text-muted">Extracting research criteria based on your query…</span>
                </div>
                <div v-if="error_search_criteria" class="alert alert-danger d-flex align-items-center justify-content-between">
                    <span>{{ error_msg_search_criteria }}</span>
                    <button v-if="allow_retry" class="btn btn-sm btn-primary" @click="beginFlow()">Retry</button>
                </div>
                <div v-if="error_mechanisms" class="alert alert-danger d-flex align-items-center justify-content-between mt-2">
                    <span><strong>Error:</strong> {{ error_msg_mechanisms }}</span>
                    <button class="btn btn-sm btn-primary" @click="retryMechanismHypotheses()">Retry</button>
                </div>
                -->
                
                <template v-if="false">
                    <div v-if="searchCriteria && searchCriteria.length" class="mt-3">
                        <div class="font-weight-bold mb-2" style="color: #FF6600; font-size: 1.1em;">Extracted research criteria from your Query</div>
                        <div class="section-header d-flex justify-content-between align-items-start mb-2" @click="display_search_criteria = !display_search_criteria">
                            <div class="d-flex flex-column gap-2" style="max-width: calc(100% - 100px);">
                                <!-- og
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Search Terms:</strong>
                                    <span class="pill" v-for="item in searchCriteria[0].values" :key="item">{{ item }}</span>
                                </div>
                                -->
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Phenotype Terms:</strong>
                                    <span class="pill" v-for="item in lastPhenotypeTerms" :key="item">{{ item }}</span>
                                </div>
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Mechanism Terms:</strong>
                                    <span class="pill" v-for="item in lastMechanismTerms" :key="item">{{ item }}</span>
                                </div>
                                <div class="d-flex flex-wrap align-items-baseline gap-2">
                                    <strong>Your Research Context:</strong>
                                    <span class="pill">{{ searchCriteria[1].values }}</span>
                                </div>
                            </div>
                            <span class="small text-muted">{{ display_search_criteria ? 'show less' : 'show more' }}</span>
                        </div>
                        <div :class="{ collapsed: !display_search_criteria }" class="criteria-detail">
                            <div class="d-flex justify-content-end mb-2">
                                <button v-if="!edit_search_criteria" class="btn btn-info btn-sm" @click="editSearchCriteria()">✎ Edit search criteria</button>
                                <div v-else class="d-flex gap-1">
                                    <button class="btn btn-warning btn-sm" @click="cancelEditSearchCriteria()">Cancel</button>
                                    <button class="btn btn-success btn-sm" @click="saveSearchCriteria()">Save search criteria</button>
                                </div>
                            </div>
                            <p class="small font-weight-bold mb-2">The values below will be used to inform subsequent steps.</p>
                            <b-table
                                :items="searchCriteria"
                                :fields="[
                                    { key: 'search_criteria', label: 'Search Criteria' },
                                    { key: 'values', label: 'Values' },
                                    { key: 'why', label: 'Why' },
                                    { key: 'purpose', label: 'Purpose' }
                                ]"
                                small
                                striped
                                hover
                                responsive="sm"
                                head-variant="light"
                            >
                                <template #cell(values)="row">
                                    <span v-if="Array.isArray(row.item.values)" class="d-inline-flex flex-wrap gap-1">
                                        <span
                                            class="pill"
                                            :class="{ editable: edit_search_criteria }"
                                            v-for="item in row.item.values"
                                            :key="item"
                                            @click="edit_search_criteria && removeSearchTerm(item)"
                                        >{{ item }}</span>
                                        <input
                                            v-if="edit_search_criteria"
                                            class="pill new"
                                            placeholder="+"
                                            @keyup.enter="addSearchTerm($event)"
                                            @blur="addSearchTerm($event)"
                                        />
                                    </span>
                                    <textarea
                                        v-else
                                        class="pill form-control"
                                        style="width:100%; field-sizing: content; min-height: 2.5em;"
                                        :disabled="!edit_search_criteria"
                                        v-model="row.item.values"
                                    ></textarea>
                                </template>
                                <template #cell(why)="data">
                                    <span v-html="data.value"></span>
                                </template>
                            </b-table>
                            <div class="d-flex justify-content-end mt-2">
                                <button
                                    class="btn btn-primary"
                                    :disabled="edit_search_criteria"
                                    @click="onResearch()"
                                >
                                    {{ searchMode === 'step' ? 'Continue' : 'Re-search' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </template>

                <div v-if="steps && steps.length" style="display:flex; flex-direction: column;">
                    <workflow-tab-bar
                        :active-tab="showTab"
                        :data-tab-enabled="revealDataTabEnabled"
                        :results-tab-enabled="revealResultsTabEnabled"
                        :workflow-error-steps="workflowErrorSteps"
                        @select-tab="switchRevealTab"
                    />
                    <div>
                        <workflow-terms-panel
                            v-if="showTab === 'terms'"
                            :extraction-step="revealExtractionStep"
                            :extraction-step-time-label="extractionStepTimeLabel"
                            :loading-search-criteria="loading_search_criteria"
                            :gate-active="stepApprovalGateActive"
                            :gate-step-id="stepApprovalGateStepId"
                            :search-criteria-edit-rows="searchCriteriaEditRows"
                            :multi-query-route-edit-rows="multiQueryRouteEditRows"
                            :extraction-gate-done="searchCriteriaExtractionGateDone"
                            :extraction-ambiguity-check="extractionAmbiguityCheck"
                            :extraction-ambiguity-dismissed="extractionAmbiguityDismissed"
                            :use-per-route-search-terms-editor="usePerRouteSearchTermsEditor"
                            :shared-research-context="sharedResearchContextTerm"
                            :multi-query-routes="multiQueryRoutes"
                            :alternative-queries="lastAlternativeQueries"
                            :route-terms-edit-accordion-open="routeTermsEditAccordionOpen"
                            @approve-gate="approveStepGate"
                            @update:sharedResearchContext="sharedResearchContextTerm = $event"
                            @dismiss-ambiguity="extractionAmbiguityDismissed = true"
                            @toggle-route-terms-edit="toggleRouteTermsEditAccordion"
                            @update-route-edit-field="onRouteEditFieldUpdate"
                            @select-alternative-query="onAlternativeQuerySelected"
                        />

                        <workflow-data-panel
                            v-if="showDataTabContent"
                            ref="workflowDataPanel"
                            v-bind="dataPanelProps"
                            :helpers="dataPanelHelpers"
                            @approve-gate="approveStepGate"
                            @download-raw-json="downloadLastHybridSearchRawJson"
                            @pair-included-toggle="onPairIncludedToggle"
                            @toggle-factor-row="toggleFactorGenesRow"
                            @open-factor-connectivity="openFactorConnectivityPopup"
                            @gene-set-row-toggle="onGeneSetRowToggled"
                            @update:mainTableCurrentPage="mainTableCurrentPage = $event"
                            @update:subtable-page="onSubtablePageUpdate"
                            @update:researchIntention="onGeneSetEntryResearchIntentionUpdate"
                            @update:llmFeedScope="onGeneSetEntryLlmFeedScopeUpdate"
                        >
                            <template #data-viz>
                                <factor-base-reveal-heatmap
                                    v-if="dataVizReady"
                                    ref="factorBaseRevealHeatmap"
                                    :key="'fbr-heatmap-' + workflowVisualKey + '-' + factorDataTableRowsFiltered.length"
                                    :factor-data="factorData"
                                    :factor-data-table-rows="factorDataTableRowsFiltered"
                                    :phenotype-description-by-id="phenotypeDescriptionById"
                                    :row-label-mode="isGeneSetEntryMode ? 'factor' : 'phenotype'"
                                    :emphasize-search-context-genes="emphasizeSearchContextGenes"
                                    :cell-color-mode="isGeneSetEntryMode ? 'factorValue' : 'association'"
                                    :show-association-score-header="!isGeneSetEntryMode"
                                    :show-association-legend="!isGeneSetEntryMode"
                                    :phenotype-association-filters.sync="phenotypeAssociationFilters"
                                    :heatmap-view-filters.sync="heatmapViewFilters"
                                    :selected-nodes.sync="heatmapSelectedNodes"
                                    show-workflow-selection-chrome
                                    :saved-explanations="savedSelectedNodesExplainMenuItems"
                                    :saved-dataset-runs="savedSelectedNodesProvenanceMenuItems"
                                    height="auto"
                                    @analyze-explain="onAnalyzeSelectedNodesExplain"
                                    @analyze-provenance="onAnalyzeSelectedNodesProvenance"
                                    @open-saved-explanation="onOpenSavedSelectedNodesExplanation"
                                    @open-saved-dataset="onOpenSavedSelectedNodesProvenance"
                                />
                            </template>
                        </workflow-data-panel>

                        <workflow-results-panel
                            v-if="showResultsTabContent"
                            ref="workflowResultsPanel"
                            v-bind="resultsPanelProps"
                            :helpers="resultsPanelHelpers"
                            @retry-hypotheses="retryMechanismHypotheses"
                            @retry-hypotheses-relaxed="retryMechanismHypothesesRelaxed"
                            @download-report="downloadReport"
                            @apply-suggested-query="applySuggestedOptimizedQuery"
                            @update:displayMechanisms="display_mechanisms = $event"
                            @set-mechanism-map-view="setMechanismMapViewMode"
                            @open-network-popup="openNetworkPopup"
                            @open-design-protocol="openDesignProtocolForMechanism"
                            @select-alternative-query="onAlternativeQuerySelected"
                            @copy-mechanism-for-llm="copyMechanismForLlm"
                            @download-mechanism-handoff="downloadMechanismHandoffPackage"
                            @toggle-factor-row="toggleFactorGenesRow"
                            @generate-remaining-pair="generateHypothesisForRemainingPair"
                            @open-factor-connectivity="openFactorConnectivityPopup"
                            @gene-set-row-toggle="onGeneSetRowToggled"
                            @update:remainingTableCurrentPage="remainingTableCurrentPage = $event"
                            @update:subtable-page="onSubtablePageUpdate"
                        />
                    </div>
                </div>

                <!--
                <p v-if="!searchCriteria && !loading_search_criteria && !error_search_criteria" class="text-muted mb-0">Enter a research question above and click Search to extract search terms and context.</p>
                -->
                <!--
                <div v-if="loadStatus" class="load-indicator mt-3 mb-2">
                    <b-spinner v-if="!loadComplete" small class="mr-2"></b-spinner>
                    <span :class="loadComplete ? 'text-success' : 'text-muted'">{{ loadStatus }}{{ loadStepSeconds > 0 ? ' (' + loadStepSeconds + 's)' : '' }}</span>
                </div>
                -->

                <b-modal
                    id="gene-set-entry-progress-modal"
                    v-model="geneSetEntryProgressModalOpen"
                    centered
                    hide-header-close
                    no-close-on-backdrop
                    no-close-on-esc
                    :hide-footer="geneSetEntry.status === 'loading'"
                    :title="geneSetEntry.offerMainPathFallback ? 'Gene-set entry retrieval failed' : 'Gene-set entry data loading'"
                >
                    <div class="d-flex align-items-start">
                        <b-spinner v-if="geneSetEntry.status === 'loading'" class="mr-3 mt-1"></b-spinner>
                        <div style="min-width: 0;">
                            <div class="font-weight-bold mb-1">
                                {{ (geneSetEntry.progress && geneSetEntry.progress.message) || "Working…" }}
                            </div>
                            <div
                                v-if="geneSetEntry.progress && geneSetEntry.progress.detail"
                                class="small text-muted"
                                style="white-space: pre-line; line-height: 1.45;"
                            >
                                {{ geneSetEntry.progress.detail }}
                            </div>
                            <div v-if="geneSetEntry.inputGenes && geneSetEntry.inputGenes.length" class="small text-muted mt-2">
                                {{ geneSetEntry.inputGenes.length }} gene(s)
                                <span v-if="geneSetEntry.inputGenes.length <= 12">
                                    : {{ geneSetEntry.inputGenes.join(", ") }}
                                </span>
                                <span v-else>
                                    : {{ geneSetEntry.inputGenes.slice(0, 8).join(", ") }}…
                                </span>
                            </div>
                            <div
                                v-if="geneSetEntry.offerMainPathFallback"
                                class="mt-3 p-2 border rounded"
                                style="background: #f8f9fa; font-size: 0.9rem; line-height: 1.45;"
                            >
                                Switch to the standard text-query path? Your genes will be placed in a default research question, the URL will use
                                <code>query=</code> instead of <code>genes=</code>, and search-term extraction will start.
                            </div>
                        </div>
                    </div>
                    <template #modal-footer>
                        <b-button
                            v-if="geneSetEntry.offerMainPathFallback"
                            variant="outline-secondary"
                            size="sm"
                            @click="dismissGeneSetEntryProgressModal"
                        >
                            Dismiss
                        </b-button>
                        <b-button
                            v-if="geneSetEntry.offerMainPathFallback"
                            variant="primary"
                            size="sm"
                            @click="onSwitchGeneSetEntryToMainPath"
                        >
                            Switch to text-query search
                        </b-button>
                        <b-button
                            v-else
                            variant="primary"
                            size="sm"
                            @click="dismissGeneSetEntryProgressModal"
                        >
                            OK
                        </b-button>
                    </template>
                </b-modal>
            </div>
        </div>

        <workflow-query-helper-modal
            v-bind="queryHelperModalProps"
            :helpers="queryHelperModalHelpers"
            v-on="queryHelperModalListeners"
        />
        <workflow-query-guidelines-modal :open.sync="queryGuidelinesOpen" />
        <workflow-search-terms-extraction-modal :open.sync="searchTermsExtractionOpen" />
        <workflow-network-modals
            v-bind="networkModalsProps"
            :helpers="networkModalsHelpers"
            v-on="networkModalsListeners"
        />

        <workspace-explain-graph-modal
            :open="selectedNodesExplainOpen"
            :entry="selectedNodesExplainEntry"
            :scope="selectedNodesExplainScope"
            :helper-text="selectedNodesExplainHelperText"
            :loading="selectedNodesExplainLoading"
            :llm-available="true"
            :key-node-count="heatmapSelectedNodes.length"
            :node-count="selectedNodesExplainNodeCount"
            :edge-count="selectedNodesExplainEdgeCount"
            :scope-locked="true"
            @close="closeSelectedNodesExplain"
            @run="runSelectedNodesExplanationModal"
            @update-entry="onSelectedNodesExplainEntryPatch"
            @update:scope="selectedNodesExplainScope = $event"
        />

        <workflow-selected-nodes-provenance-modal
            :open="selectedNodesProvenanceOpen"
            :gene-set-ids="selectedNodesProvenanceGeneSetIds"
            :items="selectedNodesProvenanceItems"
            @close="selectedNodesProvenanceOpen = false"
        />

    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import BootstrapVue from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import { createLLMClient } from "@/utils/llmClient";
import {
    kcURL,
    resolveCfdePhenotypeLabel,
    resolveCfdeFactorClusterDisplayLabel,
    getCfdePhenotypesInList,
    getCfdeMousePhenotypesInList,
} from "@/utils/cfdeUtils";
import uiUtils from "@/utils/uiUtils";
import { colorForGeneRole } from "@/utils/factorRevealGeneColors";

import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";
import FactorBaseRevealHeatmap from "./FactorBaseRevealHeatmap2.vue";
import WorkflowHeader from "./revealMultiQueryWorkflow/WorkflowHeader.vue";
import WorkflowOpsMenu from "./revealMultiQueryWorkflow/WorkflowOpsMenu.vue";
import WorkflowQueryBar from "./revealMultiQueryWorkflow/WorkflowQueryBar.vue";
import WorkflowTabBar from "./revealMultiQueryWorkflow/WorkflowTabBar.vue";
import WorkflowTermsPanel from "./revealMultiQueryWorkflow/WorkflowTermsPanel.vue";
import WorkflowDataPanel from "./revealMultiQueryWorkflow/WorkflowDataPanel.vue";
import WorkflowResultsPanel from "./revealMultiQueryWorkflow/WorkflowResultsPanel.vue";
import WorkflowQueryGuidelinesModal from "./revealMultiQueryWorkflow/WorkflowQueryGuidelinesModal.vue";
import WorkflowSearchTermsExtractionModal from "./revealMultiQueryWorkflow/WorkflowSearchTermsExtractionModal.vue";
import WorkflowQueryHelperModal from "./revealMultiQueryWorkflow/WorkflowQueryHelperModal.vue";
import WorkflowNetworkModals from "./revealMultiQueryWorkflow/WorkflowNetworkModals.vue";
import WorkflowSelectedNodesProvenanceModal from "./revealMultiQueryWorkflow/WorkflowSelectedNodesProvenanceModal.vue";
import WorkspaceExplainGraphModal from "./revealKgWorkspace/WorkspaceExplainGraphModal.vue";
import { EXPLAIN_SCOPE, patchExplanationEntry } from "./revealKgWorkspace/revealKgExplainUtils.js";
import {
    appendSavedSelectedNodesExplanation,
    appendSavedSelectedNodesProvenanceRun,
    buildSavedSelectedNodesExplanation,
    buildSavedSelectedNodesProvenanceRun,
    buildSelectedNodesExplanationDraft,
    findSavedSelectedNodesExplanation,
    findSavedSelectedNodesProvenanceRun,
    geneSetIdsFromSelectedNodes,
    runSelectedNodesExplanation,
    savedSelectedNodesExplanationMenuItems,
    savedSelectedNodesProvenanceMenuItems,
    selectedNodesExplainHelperText,
} from "./revealMultiQueryWorkflow/revealMqSelectedNodesAnalyze.js";
import {
    beginExtractionFlow,
    handleExtractionError as reportExtractionError,
    processExtractionResponse,
    resetWorkflowStateForNewRun as resetMqWorkflowSessionForNewRun,
    startWorkflowFromExtractedTerms as orchestrateStartFromExtractedTerms,
    beginMechanismHypothesisGeneration as startMechanismHypothesisGeneration,
    generateHypothesisForRemainingPair as orchestrateGenerateHypothesisForRemainingPair,
    requestMechanismHypotheses as orchestrateMechanismHypotheses,
    resumeImportedWorkflowAfterDataGate as orchestrateResumeImportedAfterDataGate,
    retryMechanismHypotheses as orchestrateRetryMechanismHypotheses,
    retryMechanismHypothesesRelaxed as orchestrateRetryMechanismHypothesesRelaxed,
    onResearch as orchestrateOnResearch,
    runHybridRetrievalWorkflow as orchestrateHybridRetrieval,
    runMultiQueryRetrievalWorkflow as orchestrateMultiQueryRetrieval,
} from "./revealMultiQueryWorkflow/revealMqWorkflowPipeline.js";
import {
    applyStepUpdate,
    WORKFLOW_STEP_IDS,
    revealDataSteps as computeRevealDataSteps,
    revealExtractionStep as computeRevealExtractionStep,
    revealHypothesisStep as computeRevealHypothesisStep,
    workflowErrorSteps as computeWorkflowErrorSteps,
} from "./revealMultiQueryWorkflow/revealMqStepGates.js";
import {
    DEFAULT_HEATMAP_VIEW_FILTERS,
    filterTableRowsByHeatmapSelection,
    filterTableRowsForOnlySelectedView,
    isHeatmapColHighlighted,
    normalizeHeatmapViewFilters,
} from "./revealMultiQueryWorkflow/revealMqHeatmapSelection.js";
import {
    annotateFactorDataWithFetchedDirection as annotateRouteFactorData,
    buildCompactRouteEvidence as buildRouteEvidenceBundle,
    factorMatchesEvidenceHit as routeFactorMatchesHit,
    filterRouteFactorDataToEvidenceHits as filterRouteFactorDataByHits,
    getRouteConstraintSpec,
    isConstraintValidationError as isHybridConstraintValidationError,
    mergeRouteFactorData as mergeMultiRouteFactorData,
    normalizeMultiQueryRoutes,
    normalizeRouteCategory,
    resolveHybridPhenotypeFilterTerms as resolveHybridPhenotypeTerms,
    resolveMultiRouteHybridPhenotypeFilterTerms as resolveMultiRoutePhenotypeTerms,
    routeFactorSupportScore as scoreRouteFactorSupport,
    routeGenesOfInterestForFetch as genesOfInterestForRouteFetch,
    routeResearchContextForFetch as researchContextForRouteFetch,
    sanitizeEmbeddingText as sanitizeHybridEmbeddingText,
    setMultiQueryRouteStatus as updateMultiQueryRouteStatus,
} from "./revealMultiQueryWorkflow/revealMqMultiRoute.js";
import {
    callHybridRevealSearch as postHybridRevealSearch,
    fetchHybridQueryEmbedding as fetchClientHybridEmbedding,
    fetchWithTimeout as fetchUrlWithTimeout,
} from "./revealMultiQueryWorkflow/revealMqHybridSearchApi.js";
import WorkflowStepGate from "./revealMultiQueryWorkflow/WorkflowStepGate.vue";
import {
    buildHybridQueryText,
    inferExplicitUserGenes,
    normalizeLlmTermList,
    parseLlmJsonResponse,
} from "./revealMultiQueryWorkflow/revealMqExtraction.js";
import {
    buildHybridSearchRequestBody as composeHybridSearchRequestBody,
    hybridSearchErrorMessage as formatHybridSearchErrorMessage,
    normalizeHybridFactorsToFactorData as mapHybridFactorsToFactorData,
    prepareHybridSearchRequestFields,
} from "./revealMultiQueryWorkflow/revealMqHybridSearch.js";
import {
    buildMechanismLlmContextBlock,
    flattenKGData,
    flattenedKGToCSV,
    transformMergedDataToKG as buildKgTriplesFromFactorData,
} from "./revealMultiQueryWorkflow/revealMqKgTransform.js";
import {
    DEFAULT_ASSOCIATION_FILTERS,
    associationTierPasses,
    filterFactorDataByAssociationFilters,
} from "./revealMultiQueryWorkflow/revealMqAssociationScore.js";
import {
    buildFactorConnectivityNetwork,
    buildMechanismFlowNetworkFromHypothesisKg,
    buildNetworkFromFlattenedRowIds,
    extractGeneConnectionsFromFlattened,
    extractRelevantFactorsAndGeneSetsFromFlattened,
    factorLabelsForPhenotypeGene,
    filterSupportingNetworkToCandidateGenes,
    getGeneScoresFromFlattenedKG,
} from "./revealMultiQueryWorkflow/revealMqNetworkBuild.js";
import {
    candidateInventoryRows,
    normalizeCandidateInventory,
    normalizeMechanismHypotheses,
} from "./revealMultiQueryWorkflow/revealMqMechanismNormalize.js";
import {
    applySearchCriteriaGateEdits,
    syncUnionTermsFromMultiQueryRoutes,
} from "./revealMultiQueryWorkflow/revealMqSearchCriteriaGate.js";
import { resolveRevealMqRuntimeConfig } from "./revealMultiQueryWorkflow/revealMqConfig.js";
import {
    MECHANISM_HYPOTHESIS_EXPLORATORY_MODE_SUFFIX,
    MECHANISM_HYPOTHESIS_SYSTEM_PROMPT,
    MULTI_ROUTE_EXTRACT_SYSTEM_PROMPT,
    QUERY_HELPER_COMPOSE_SYSTEM_PROMPT,
} from "./revealMultiQueryWorkflow/revealMqPrompts.js";
import {
    buildAntiAnchorFallbackAlternatives,
    detectAntiAnchorTerms,
    ensureAntiAnchorWarningMessage,
    mergeAlternativeQueries,
    normalizeAlternativeQueries,
    normalizeExtractionAmbiguity,
} from "./revealMultiQueryWorkflow/revealMqExtractionAmbiguity.js";
import {
    fetchC2m2Provenance,
    fetchGeneSuggestionsForQueryHelper,
    fetchQueryHelperFactorRows,
} from "./revealMultiQueryWorkflow/revealMqQueryHelperApi.js";
import {
    buildHelperFallbackQuery,
    continueWithQueryHelper,
} from "./revealMultiQueryWorkflow/revealMqQueryHelperOrchestrator.js";
import { parseGenesParam, runGeneSetEntryWorkflow } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryOrchestrator.js";
import { switchGeneSetEntryToMainPath } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryFallback.js";
import { buildGeneSetEntryRawExport } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryRawExport.js";
import {
    GENE_SET_ENTRY_LLM_FEED_SCOPE,
    buildGeneSetEntryLlmFeed,
} from "./revealMultiQueryWorkflow/revealMqGeneSetEntryLlmFeed.js";
import {
    edgeEndpointIdsFromMappedNode,
    edgeSupportedByTrapiRelay,
    extractTopHitFromNameResolutionResponse,
    fetchBiolinkNodeDetails,
    findNormalizedNodeEntry,
    inferBiolinkClassHintFromCurie,
    isTrapiDiseaseLikeCategory,
    isTrapiGeneLikeCategory,
    normalizeBiolinkLookupLabel,
    pickPrimaryBiolinkType,
    resolveLabelViaNameResolution,
    trapiCategoriesArray,
    trapiKnowledgeIndicatesEdgeSupport,
    trapiRelayPostTrapiMessage,
    validateBiolinkMappedEdgesViaRelay,
    validateSingleMappedBiolinkEdge,
} from "./revealMultiQueryWorkflow/revealMqBiolinkApi.js";
import {
    autoMapAllMechanismsToBiolink,
    biolinkEdgeVisualSignature,
    classifyBiolinkNodeType,
    inferBiolinkPredicate,
    mapMechanismBiolinkPhase1Only,
    patchMechanismBiolinkTrapiProgress,
    queueBiolinkTrapiValidation,
    runBiolinkTrapiValidationForMechanism,
} from "./revealMultiQueryWorkflow/revealMqBiolinkOrchestrator.js";
import {
    buildHtmlReportDocument,
    buildMechanismClipboardText,
    buildMechanismHandoffAppendixObject,
    buildMechanismHandoffHtmlDocument,
    buildMechanismReportOneCardHtml,
    buildMechanismReportSections,
    getMechanismTopGenes,
    sanitizeHandoffCandidateGenes,
    sanitizeHandoffFlattenedRows,
    sanitizeHandoffGeneConnections,
    sanitizeHandoffNetwork,
    sanitizeHandoffSelectionRows,
} from "./revealMultiQueryWorkflow/revealMqReportBuilder.js";
import {
    buildRouteEditRowsFromRoutes,
    getRouteEditRow as findRouteEditRow,
    patchRoutesFromEditRows,
} from "./revealMultiQueryWorkflow/revealMqRouteEdit.js";
import { formatStepElapsedMs, formatLiveStepTime, formatStepTimeLabel } from "./revealMultiQueryWorkflow/revealMqStepTime.js";
import {
    applyMultiQueryRevealWorkflowImport,
    canExportMultiQueryRevealWorkflow,
    exportMultiQueryRevealWorkflow,
    parseMultiQueryRevealWorkflowImportFile,
} from "./revealMultiQueryWorkflow/revealMqWorkflowExport.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "./revealMultiQueryWorkflow/mqSharedStyles.css";
import { divide } from "lodash";

Vue.use(BootstrapVueIcons);
Vue.use(BootstrapVue);
Vue.component("factor-base-reveal-heatmap", FactorBaseRevealHeatmap);
Vue.component("factor-base-reveal-network", FactorBaseRevealNetwork);

export default Vue.component("factor-base-reveal", {
    components: {
        FactorBaseRevealNetwork,
        FactorBaseRevealHeatmap,
        WorkflowHeader,
        WorkflowOpsMenu,
        WorkflowQueryBar,
        WorkflowQueryGuidelinesModal,
        WorkflowSearchTermsExtractionModal,
        WorkflowTabBar,
        WorkflowTermsPanel,
        WorkflowDataPanel,
        WorkflowResultsPanel,
        WorkflowQueryHelperModal,
        WorkflowNetworkModals,
        WorkspaceExplainGraphModal,
        WorkflowSelectedNodesProvenanceModal,
    },
    props: {},
    data() {
        return {
            /**
             * Gene-set entry point (?genes=... URL param). Populated by runGeneSetEntryWorkflow,
             * which also assigns vm.factorData/vm.showTab -- see revealMqGeneSetEntryOrchestrator.js
             * and ARCHITECTURE.md's "Gene-set entry point" section for the full data flow.
             */
            geneSetEntry: {
                status: "idle",
                inputGenes: [],
                errors: { phenotypes: null, perPhenotype: {}, pigean: null },
                phenotypesResponse: null,
                pigeanResponse: null,
                topTraits: [],
                progress: { message: "", detail: "" },
                researchIntention: "",
                offerMainPathFallback: false,
                failureReason: null,
            },
            /** Keeps error/partial progress modal open until the user dismisses it. */
            geneSetEntryProgressDismissed: false,
            /**
             * Gene-set entry: which evidence subset to format for hypothesis LLM.
             * @see GENE_SET_ENTRY_LLM_FEED_SCOPE
             */
            geneSetEntryLlmFeedScope: GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
            /** Last slim JSON feed sent to the gene-set hypothesis LLM (debug / future export). */
            lastGeneSetEntryLlmFeed: null,
            /**
             * Entry / search path for the main query box.
             * - "query": free-text → extraction / hybrid retrieval
             * - "genes": gene-list entry (`?genes=` or gene-set entry session)
             * Future entity types (phenotypes, gene sets, …) will extend this.
             */
            searchPath: "query",
            userQuery: "",
            searchMode: "auto",
            /** Rotating best-practice placeholder examples (Strict Anchor + Semantic Net + Context + Phenotype). */
            placeholderExamples: [
                "Describe what you're researching or curious about...",
                "e.g., Find a microglial phagocytosis mechanism involving TREM2 in the cortex linked to amyloid-beta clearance.",
                "e.g., Find a short-chain fatty acid receptor mechanism involving FFAR3 in the intestinal epithelium that alters systemic insulin sensitivity.",
                "e.g., Find a lipid droplet biogenesis mechanism involving GPAM in hepatocytes that drives triglyceride accumulation and NAFLD.",
            ],
            currentPlaceholderIndex: 0,
            placeholderIntervalId: null,
            placeholderRotationPaused: false,
            /** Avoid pausing rotation from the component's initial programmatic focus(). */
            suppressNextQueryFocusPause: false,
            /** Collapsed by default; expands query-building documentation below the search box. */
            queryGuidelinesOpen: false,
            searchTermsExtractionOpen: false,
            /** Heatmap-selected traits, gene sets, genes, and crossings for scoped hypothesis generation. */
            heatmapSelectedNodes: [],
            /**
             * Gene-set entry heatmap ↔ table view filters (view-only; never mutates factorData).
             * Toggled from the heatmap legend strip.
             */
            heatmapViewFilters: { ...DEFAULT_HEATMAP_VIEW_FILTERS },
            /** Legend checkbox filters for Combined-score phenotype-association tiers. */
            phenotypeAssociationFilters: { ...DEFAULT_ASSOCIATION_FILTERS },
            selectedNodesExplanations: [],
            selectedNodesProvenanceRuns: [],
            selectedNodesExplainOpen: false,
            selectedNodesExplainEntry: null,
            selectedNodesExplainScope: EXPLAIN_SCOPE.KEY_NODES,
            selectedNodesExplainLoading: false,
            selectedNodesProvenanceOpen: false,
            selectedNodesProvenanceGeneSetIds: [],
            selectedNodesProvenanceItems: [],
            /** Toggle to show the Query helper link (temporarily off for release). */
            queryHelperLinkVisible: true,
            queryHelperOpen: false,
            queryHelperPhenotypeInput: "",
            queryHelperMechanismInput: "",
            queryHelperGeneInput: "",
            queryHelperGeneSuggestions: [],
            queryHelperGeneLookupLoading: false,
            queryHelperGeneLookupSeq: 0,
            queryHelperPhenotypeCatalog: [],
            queryHelperSelectedPhenotypes: [],
            queryHelperLoadingFactors: false,
            queryHelperFactorError: "",
            queryHelperFactorRows: [],
            queryHelperFactorSelection: {},
            queryHelperClusterFilterInput: "",
            queryHelperFactorPage: 1,
            queryHelperFactorsPerPage: 10,
            queryHelperMechanismTerms: [],
            queryHelperNoFactorPhenotypeLabels: [],
            queryHelperGenesOfInterest: [],
            queryHelperDraftResearchContext: "",
            queryHelperHardConstraintEnabled: false,
            queryHelperAdvancedOpen: false,
            queryHelperComposing: false,
            queryHelperError: "",
            lastHardConstraintFactorLabelByPair: {},
            lastRunUsedHardConstraint: false,
            searchCriteria: null,
            display_search_criteria: false,
            edit_search_criteria: false,
            prev_search_criteria: null,
            searchCriteriaEditRows: [],
            searchCriteriaEditRowsDefault: [],
            lastAlternativeQueries: [],
            /** Optional extraction warning when subjective/ambiguous terms were interpreted. */
            extractionAmbiguityCheck: null,
            extractionAmbiguityDismissed: false,
            multiQueryRoutes: [],
            multiQueryRouteResults: [],
            multiQueryEvidenceBundles: [],
            multiQueryRouteErrors: [],
            /** Editable per-route term rows (synced to multiQueryRoutes before retrieval). */
            multiQueryRouteEditRows: [],
            multiQueryRouteEditRowsDefault: [],
            /** Per-route "Edit search terms" accordion open state (default collapsed). */
            routeTermsEditAccordionOpen: {},
            multiQueryEvidenceLimits: {
                maxRoutes: 3,
                maxPairsPerRoute: 5,
                maxGenesPerFactor: 5,
                maxGenesOfInterestPerFactor: 5,
                maxGeneSetsPerFactor: 3,
            },
            /** Official symbols explicitly named or directly aliased by the user, separate from routing expansion. */
            lastExplicitUserGenes: [],
            /** Gene symbols from LLM extraction (and gate edits), forwarded to hybrid-search as genes_of_interest. */
            lastGenesOfInterest: [],
            /** Latest hybrid-search response meta (lexical fusion, genes-of-interest resolution). */
            lastHybridSearchMeta: {},
            /** Full JSON body from the last successful hybrid-search API (for raw download). */
            lastHybridSearchResponse: null,
            /** After user continues past step-1 review, keep extracted-terms table available when re-expanding the substep. */
            searchCriteriaExtractionGateDone: false,
            loading_search_criteria: false,
            error_search_criteria: false,
            error_msg_search_criteria: "",
            allow_retry: true,
            searchTerm: "",
            lastPhenotypeTerms: [],
            lastMechanismTerms: [],
            /** Map phenotype id -> description for display; queries still use id. */
            phenotypeDescriptionById: {},
            factorData: {},
            loadStatus: "",
            statusSteps: [],
            steps: [],
            stepsTime: null,
            stepsTimer: null,
            stepsPausedAt: null,
            now: Date.now(),
            loadComplete: false,
            genesAndFactorValuesLoaded: false,
            loadStepSeconds: 0,
            loadStepTimerId: null,
            lastKgTriples: [],
            lastFlattenedKG: null,
            error_mechanisms: false,
            error_msg_mechanisms: "",
            mechanisms: null,
            mechanisms_summary: null,
            /** Last mechanism index whose copy-to-clipboard succeeded (for transient "Copied!" state). */
            handoffCopiedMechanismIndex: null,
            handoffCopiedResetTimerId: null,
            /** Per-card loading state for post-hoc Biolink mapping calls. */
            biolinkMappingByMechanism: {},
            /** Per-card: TRAPI edge validation running after Biolink nodes are mapped. */
            biolinkTrapiValidatingByMechanism: {},
            /** Bumped when a mechanism is remapped; stale TRAPI runs stop patching. */
            biolinkTrapiValidationGeneration: {},
            /** Cache: normalized free-text label -> { curie, resolverLabel } from Name Resolution. */
            biolinkNameResolveByLabelCache: {},
            /** Cache: CURIE -> normalized node details from NodeNormalizer. */
            biolinkNodeByCurieCache: {},
            /** From mechanism LLM when can_generate_hypothesis is false or partial warnings. */
            mechanismDiagnosticAssessment: null,
            /** User approval gates at key workflow breakpoints. */
            stepApprovalGateActive: false,
            stepApprovalGateStepId: "",
            stepApprovalGateMessage: "",
            stepApprovalGateResolver: null,
            display_mechanisms: true,
            /** Row keys (phenotype|factor) for pairs user generated via "Generate" in Remaining section; removes row from that table. */
            adHocCoveredRowKeys: [],
            /** While set, matching row's Generate shows loading. */
            generatingRemainingRowKey: "",
            /** Start time (ms) for elapsed display on remaining-cluster Generate. */
            remainingGenerateStartedAt: null,
            /** Updated on interval while generating so elapsed time is reactive. */
            remainingGenerateNow: Date.now(),
            remainingGenerateTimerId: null,
            remainingPairGenerateError: "",
            pairSelectionOverrides: {},
            llmFilteredPairKeysBaseline: [],
            display_phenotypes_factors: true,
            subtablePerPage: 10,
            subtableCurrentPages: {},
            mainTablePerPage: 10,
            mainTableCurrentPage: 1,
            remainingTableCurrentPage: 1,
            expandedFactorRowKeys: {},
            factorConnectivityNetworks: {},
            loadingGenesForFactor: {},
            /** When set, show network viz in a floating overlay at 90% window size. Value = mechanism index. */
            networkPopupMechanismIndex: null,
            /** When true, overlay shows core_spine_network (hypothesis map); when false, supporting network. */
            networkPopupIsHypothesisMap: false,
            factorConnectivityPopupOpen: false,
            factorConnectivityPopupRow: null,
            factorConnectivityPopupNetwork: null,
            popupNetworkWidth: 960,
            popupNetworkHeight: 640,

            /**
             * Env-var-driven runtime config: hybridSearchBaseUrl, hybridSearchEndpointUrl,
             * queryHelperPigeanFactorUrlTemplate, revealBiolinkProxyBaseUrl,
             * hybridSearchUseClientEmbedding, ollamaEmbedUrl. See revealMqConfig.js.
             */
            ...resolveRevealMqRuntimeConfig(),
            /** POST timeout for hybrid search (ms); server may run DB + Ollama. */
            hybridSearchTimeoutMs: 120000,
            hybridEmbedModel: "mxbai-embed-large",
            hybridEmbedExpectedDim: 1024,

            all_supporting_network: null,
            gene_set_sources: {},

            NODE_COLORS: {
                Phenotype: "#e41a1c",
                Factor: "#377eb8",
                Pathway: "#4daf4a",
                Gene: "#984ea3",
                /** C2M2 provenance bubbles (distinct from pathway / gene-set green). */
                C2M2Provenance: "#3182ce",
                /** Program pill when C2M2 file downloads are available (hover for menu). */
                GeneSetProgramDownloads: "#6f42c1",
            },
            /**
             * c2m2-provenance API: { [geneSetId]: { status: 'loading'|'ok'|'empty'|'error', nodes: [{ id, dcc_url, labels }] } }
             */
            c2m2ProvenanceByGeneSet: {},

            showTab: 'terms',
            /** After user continues past KG gate, enable the Results tab until the next full reset. */
            revealResultsTabUnlocked: false,
            /** When true, Continue on the Data-step gate should start hypothesis generation after import. */
            importedWorkflowPendingHypothesisRun: false,
            /** When true, Continue on the Search-terms gate should start hybrid retrieval after import. */
            importedWorkflowPendingResearchRun: false,
            workflowExportImportBusy: false,
            /** Bumped on import / new query to ignore stale async workflow callbacks. */
            workflowRunId: 0,
            /** Bumped on import so heatmap/network visualizers remount with restored data. */
            workflowVisualKey: 0,
            mechanismHypothesisSystemPrompt: MECHANISM_HYPOTHESIS_SYSTEM_PROMPT,
            /** strict | relaxed — relaxed appends mechanismHypothesisExploratoryModeSuffix for the mechanism LLM only. */
            hypothesisGenerationMode: "strict",
            /** Mirrors the mode used for the last completed mechanism hypothesis LLM call (card banner). */
            hypothesisLastRunMode: null,
            mechanismHypothesisExploratoryModeSuffix: MECHANISM_HYPOTHESIS_EXPLORATORY_MODE_SUFFIX,
        };
    },
    computed: {
        queryHelperModalProps() {
            return {
                queryHelperOpen: this.queryHelperOpen,
                queryHelperPhenotypeInput: this.queryHelperPhenotypeInput,
                queryHelperPhenotypeSuggestions: this.queryHelperPhenotypeSuggestions,
                queryHelperSelectedPhenotypes: this.queryHelperSelectedPhenotypes,
                queryHelperNoFactorPhenotypeLabels: this.queryHelperNoFactorPhenotypeLabels,
                queryHelperFactorRows: this.queryHelperFactorRows,
                queryHelperLoadingFactors: this.queryHelperLoadingFactors,
                queryHelperFactorError: this.queryHelperFactorError,
                queryHelperClusterFilterInput: this.queryHelperClusterFilterInput,
                queryHelperAllFactorsSelected: this.queryHelperAllFactorsSelected,
                queryHelperSomeFactorsSelected: this.queryHelperSomeFactorsSelected,
                queryHelperFactorPageRows: this.queryHelperFactorPageRows,
                queryHelperFactorSelection: this.queryHelperFactorSelection,
                queryHelperFactorsPerPage: this.queryHelperFactorsPerPage,
                queryHelperFactorPage: this.queryHelperFactorPage,
                queryHelperMechanismInput: this.queryHelperMechanismInput,
                queryHelperMechanismTerms: this.queryHelperMechanismTerms,
                queryHelperGeneInput: this.queryHelperGeneInput,
                queryHelperGeneSuggestions: this.queryHelperGeneSuggestions,
                queryHelperGenesOfInterest: this.queryHelperGenesOfInterest,
                queryHelperCanContinue: this.queryHelperCanContinue,
                queryHelperDraftResearchContext: this.queryHelperDraftResearchContext,
                queryHelperAdvancedOpen: this.queryHelperAdvancedOpen,
                queryHelperHardConstraintEnabled: this.queryHelperHardConstraintEnabled,
                queryHelperHardConstraintEligible: this.queryHelperHardConstraintEligible,
                queryHelperError: this.queryHelperError,
                queryHelperComposing: this.queryHelperComposing,
            };
        },
        queryHelperModalHelpers() {
            const vm = this;
            return {
                onQueryHelperPickPhenotype: (opt) => vm.onQueryHelperPickPhenotype(opt),
                removeQueryHelperPhenotype: (value) => vm.removeQueryHelperPhenotype(value),
                applyQueryHelperClusterFilterSelection: () => vm.applyQueryHelperClusterFilterSelection(),
                toggleQueryHelperAllFactors: (e) => vm.toggleQueryHelperAllFactors(e),
                toggleQueryHelperFactor: (key, e) => vm.toggleQueryHelperFactor(key, e),
                addQueryHelperMechanismFromInput: () => vm.addQueryHelperMechanismFromInput(),
                removeQueryHelperMechanism: (term) => vm.removeQueryHelperMechanism(term),
                onQueryHelperGeneInput: () => vm.onQueryHelperGeneInput(),
                addQueryHelperGeneFromInput: () => vm.addQueryHelperGeneFromInput(),
                selectQueryHelperGeneSuggestion: (gene) => vm.selectQueryHelperGeneSuggestion(gene),
                removeQueryHelperGene: (gene) => vm.removeQueryHelperGene(gene),
                continueWithQueryHelper: () => vm.continueWithQueryHelper(),
            };
        },
        queryHelperModalListeners() {
            const vm = this;
            return {
                "update:queryHelperOpen": (v) => { vm.queryHelperOpen = v; },
                "update:queryHelperPhenotypeInput": (v) => { vm.queryHelperPhenotypeInput = v; },
                "update:queryHelperClusterFilterInput": (v) => { vm.queryHelperClusterFilterInput = v; },
                "update:queryHelperFactorPage": (v) => { vm.queryHelperFactorPage = v; },
                "update:queryHelperMechanismInput": (v) => { vm.queryHelperMechanismInput = v; },
                "update:queryHelperGeneInput": (v) => { vm.queryHelperGeneInput = v; },
                "update:queryHelperDraftResearchContext": (v) => { vm.queryHelperDraftResearchContext = v; },
                "update:queryHelperAdvancedOpen": (v) => { vm.queryHelperAdvancedOpen = v; },
                "update:queryHelperHardConstraintEnabled": (v) => { vm.queryHelperHardConstraintEnabled = v; },
            };
        },
        networkModalsProps() {
            return {
                allSupportingNetwork: this.all_supporting_network,
                networkPopupMechanismIndex: this.networkPopupMechanismIndex,
                mechanisms: this.mechanisms,
                networkPopupIsHypothesisMap: this.networkPopupIsHypothesisMap,
                popupNetworkWidth: this.popupNetworkWidth,
                popupNetworkHeight: this.popupNetworkHeight,
                factorConnectivityPopupOpen: this.factorConnectivityPopupOpen,
                factorConnectivityPopupRow: this.factorConnectivityPopupRow,
                factorConnectivityPopupNetwork: this.factorConnectivityPopupNetwork,
            };
        },
        networkModalsHelpers() {
            const vm = this;
            return {
                openNetworkPopup: (idx, options) => vm.openNetworkPopup(idx, options),
                closeNetworkPopup: () => vm.closeNetworkPopup(),
                isMechanismUsingBiolinkMap: (m) => vm.isMechanismUsingBiolinkMap(m),
                hasMechanismBiolinkNetwork: (m) => vm.hasMechanismBiolinkNetwork(m),
                setMechanismMapViewMode: (idx, mode) => vm.setMechanismMapViewMode(idx, mode),
                getPhenotypeDisplay: (id) => vm.getPhenotypeDisplay(id),
                getFactorClusterDisplay: (row) => vm.getFactorClusterDisplay(row),
            };
        },
        networkModalsListeners() {
            const vm = this;
            return {
                "update:factorConnectivityPopupOpen": (v) => { vm.factorConnectivityPopupOpen = v; },
            };
        },
        dataPanelProps() {
            const rowsForTable = this.factorTableRowsForDisplay || [];
            const rowCount = rowsForTable.length;
            return {
                showFactorTable:
                    (this.genesAndFactorValuesLoaded || this.loadComplete) &&
                    (this.factorDataTableRows || []).length > 0,
                gateActive: this.stepApprovalGateActive,
                gateStepId: this.stepApprovalGateStepId,
                phenotypeCount: this.phenotypeCount,
                factorCount: this.factorCount,
                hybridSearchMetaSummaryLines: this.hybridSearchMetaSummaryLines,
                isPhenotypePath: this.isPhenotypePath,
                phenotypeRationaleList: this.phenotypeRationaleList,
                mainFactorTableRowsPaged: this.mainFactorTableRowsPaged,
                factorTableRowCount: rowCount,
                mainTablePerPage: this.mainTablePerPage,
                mainTableCurrentPage: this.mainTableCurrentPage,
                subtablePerPage: this.subtablePerPage,
                subtableCurrentPages: this.subtableCurrentPages,
                loadingGenesForFactor: this.loadingGenesForFactor,
                geneSetSources: this.gene_set_sources,
                showResearchIntention: this.isGeneSetEntryMode,
                researchIntention:
                    (this.geneSetEntry && this.geneSetEntry.researchIntention) || "",
                llmFeedScope: this.geneSetEntryLlmFeedScope || GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
                isGeneSetEntryMode: this.isGeneSetEntryMode,
                emphasizeSearchContextGenes: this.emphasizeSearchContextGenes,
                heatmapViewFilters: this.normalizedHeatmapViewFilters,
                revealDataSteps: this.revealDataSteps,
                loadStatus: this.loadStatus,
                loadComplete: this.loadComplete,
                loadStepSeconds: this.loadStepSeconds,
                geneSetEntryProgress:
                    this.geneSetEntry && this.geneSetEntry.progress
                        ? this.geneSetEntry.progress
                        : { message: "", detail: "" },
                geneSetEntryLoading: !!(this.geneSetEntry && this.geneSetEntry.status === "loading"),
            };
        },
        dataPanelHelpers() {
            const vm = this;
            return {
                getPhenotypeDisplay: (p) => vm.getPhenotypeDisplay(p),
                getFactorClusterDisplay: (row) => vm.getFactorClusterDisplay(row),
                getFetchDirectionDisplay: (row) => vm.getFetchDirectionDisplay(row),
                getGeneSetCountForRow: (row) => vm.getGeneSetCountForRow(row),
                getGeneCountForRow: (row) => vm.getGeneCountForRow(row),
                getGeneSearchContextCountDisplay: (row) => vm.getGeneSearchContextCountDisplay(row),
                isPairIncluded: (row) => vm.isPairIncluded(row),
                isFactorRowExpanded: (row) => vm.isFactorRowExpanded(row),
                getFactorConnectivityNetwork: (row) => vm.getFactorConnectivityNetwork(row),
                getGenesetForFactor: (...args) => vm.getGenesetForFactor(...args),
                getGenesForFactor: (...args) => vm.getGenesForFactor(...args),
                cfdeExploreAssociationHref: (...args) => vm.cfdeExploreAssociationHref(...args),
                getSubtableCurrentPage: (row) => vm.getSubtableCurrentPage(row),
                getGeneSetSubtableCurrentPage: (row) => vm.getGeneSetSubtableCurrentPage(row),
                getRowKey: (row) => vm.getRowKey(row),
                formatTime: (t) => vm.formatTime(t),
                currStepTime: (step) => vm.currStepTime(step),
                dataStepShowsSpinner: (step) => vm.dataStepShowsSpinner(step),
                dataStepShowsGatePause: (step) => vm.dataStepShowsGatePause(step),
            };
        },
        resultsPanelProps() {
            const remainingTableRowCount = this.isPhenotypePath
                ? (this.remainingFactorDataTableRowsWithRationaleMeta || []).length
                : (this.remainingGeneSetClusterRows || []).length;
            return {
                isMechanismHypothesisLoading: this.isMechanismHypothesisLoading,
                revealHypothesisStep: this.revealHypothesisStep,
                errorMechanisms: this.error_mechanisms,
                errorMsgMechanisms: this.error_msg_mechanisms,
                showMechanismResultsPanel: this.showMechanismResultsPanel,
                mechanisms: this.mechanisms || [],
                canDownloadMechanismReport: this.canDownloadMechanismReport,
                mechanismDiagnosticAssessment: this.mechanismDiagnosticAssessment,
                hypothesisGenerationMode: this.hypothesisGenerationMode,
                mechanismResultsDetailVisible: this.mechanismResultsDetailVisible,
                displayMechanisms: this.display_mechanisms,
                researchContext: this.sharedResearchContextTerm,
                reportSessionSummary: this.getReportSessionSummary(),
                hypothesisLastRunMode: this.hypothesisLastRunMode,
                remainingRows: this.remainingGeneSetClusterRows || [],
                remainingFactorTableRowsPaged: this.remainingFactorTableRowsPaged,
                remainingGeneSetClusterRowsPaged: this.remainingGeneSetClusterRowsPaged,
                remainingTableRowCount,
                remainingPairGenerateError: this.remainingPairGenerateError,
                generatingRemainingRowKey: this.generatingRemainingRowKey,
                handoffCopiedMechanismIndex: this.handoffCopiedMechanismIndex,
                isPhenotypePath: this.isPhenotypePath,
                isGeneSetEntryMode: this.isGeneSetEntryMode,
                mainTablePerPage: this.mainTablePerPage,
                remainingTableCurrentPage: this.remainingTableCurrentPage,
                subtablePerPage: this.subtablePerPage,
                subtableCurrentPages: this.subtableCurrentPages,
                loadingGenesForFactor: this.loadingGenesForFactor,
                geneSetSources: this.gene_set_sources,
                nodeColors: this.NODE_COLORS,
            };
        },
        resultsPanelHelpers() {
            const vm = this;
            return {
                formatTime: (t) => vm.formatTime(t),
                currStepTime: (step) => vm.currStepTime(step),
                formatCellularAssignmentDisplay: (v) => vm.formatCellularAssignmentDisplay(v),
                formatDepotContrastDisplay: (v) => vm.formatDepotContrastDisplay(v),
                isMechanismUsingBiolinkMap: (m) => vm.isMechanismUsingBiolinkMap(m),
                hasMechanismBiolinkNetwork: (m) => vm.hasMechanismBiolinkNetwork(m),
                candidateInventoryRows: (inv) => vm.candidateInventoryRows(inv),
                mechanismGeneGroupPillStyle: (g) => vm.mechanismGeneGroupPillStyle(g),
                getGeneConnectionForMechanism: (m, g) => vm.getGeneConnectionForMechanism(m, g),
                formatGeneSetNamesForTableWrap: (sets) => vm.formatGeneSetNamesForTableWrap(sets),
                getRelevantPhenotypesDisplay: (p) => vm.getRelevantPhenotypesDisplay(p),
                getPhenotypeDisplay: (p) => vm.getPhenotypeDisplay(p),
                getFactorClusterDisplayString: (f) => vm.getFactorClusterDisplayString(f),
                getGeneSetFactorDisplayLabel: (f) => vm.getGeneSetFactorDisplayLabel(f),
                isGeneInSearchSet: (g) => vm.isGeneInSearchSet(g),
                formatRelevantGeneSetsForDisplay: (s) => vm.formatRelevantGeneSetsForDisplay(s),
                cfdeExploreGeneSetHref: (...args) => vm.cfdeExploreGeneSetHref(...args),
                c2m2GeneSetDownloadNodes: (gs) => vm.c2m2GeneSetDownloadNodes(gs),
                c2m2ProvenanceEntry: (gs) => vm.c2m2ProvenanceEntry(gs),
                isNextStepExperimentalValidation: (s) => vm.isNextStepExperimentalValidation(s),
                getRowKey: (row) => vm.getRowKey(row),
                getFactorClusterDisplay: (row) => vm.getFactorClusterDisplay(row),
                isFactorRowExpanded: (row) => vm.isFactorRowExpanded(row),
                getFactorConnectivityNetwork: (row) => vm.getFactorConnectivityNetwork(row),
                getGenesetForFactor: (...args) => vm.getGenesetForFactor(...args),
                getGenesForFactor: (...args) => vm.getGenesForFactor(...args),
                cfdeExploreAssociationHref: (...args) => vm.cfdeExploreAssociationHref(...args),
                getSubtableCurrentPage: (row) => vm.getSubtableCurrentPage(row),
                formatRemainingGenerateElapsed: () => vm.formatRemainingGenerateElapsed(),
            };
        },
        searchInputPlaceholder() {
            if (this.searchPath === "genes") {
                return "e.g., APOE, LDLR, PCSK9, PPARG";
            }
            const list = Array.isArray(this.placeholderExamples) ? this.placeholderExamples : [];
            if (!list.length) return "Describe what you're researching or curious about...";
            const idx = Math.max(0, Math.min(this.currentPlaceholderIndex, list.length - 1));
            return String(list[idx] || list[0]);
        },
        /** Query-bar entity select: gene_set ↔ searchPath genes, free_text ↔ query. */
        searchCriteriaType() {
            return this.searchPath === "genes" ? "gene_set" : "free_text";
        },
        hypothesisModeRelaxedSwitch: {
            get() {
                return this.hypothesisGenerationMode === "relaxed";
            },
            set(v) {
                this.hypothesisGenerationMode = v ? "relaxed" : "strict";
            },
        },
        /** Full system prompt for mechanism hypothesis LLM (strict base ± exploratory suffix). */
        mechanismHypothesisSystemPromptEffective() {
            if (this.hypothesisGenerationMode === "relaxed") {
                return `${this.mechanismHypothesisSystemPrompt}\n\n${this.mechanismHypothesisExploratoryModeSuffix}`;
            }
            return this.mechanismHypothesisSystemPrompt;
        },
        queryHelperPhenotypeSuggestions() {
            const raw = String(this.queryHelperPhenotypeInput || "").trim().toLowerCase();
            if (!raw) return [];
            const selected = new Set((this.queryHelperSelectedPhenotypes || []).map((x) => String(x.value)));
            return (this.queryHelperPhenotypeCatalog || [])
                .filter((item) => !selected.has(String(item.value)))
                .filter((item) => {
                    const label = String(item.label || "").toLowerCase();
                    const value = String(item.value || "").toLowerCase();
                    return this.queryHelperMatchesClauses(raw, `${label} ${value}`);
                })
                .sort((a, b) => {
                    const la = String(a.label || "");
                    const lb = String(b.label || "");
                    if (la.length !== lb.length) return la.length - lb.length;
                    return la.localeCompare(lb);
                })
                .slice(0, 30);
        },
        queryHelperSelectedFactorRows() {
            const selected = [];
            (this.queryHelperFactorRows || []).forEach((row) => {
                if (this.queryHelperFactorSelection[row.key]) selected.push(row);
            });
            return selected;
        },
        queryHelperFactorPageRows() {
            const rows = this.queryHelperFactorRows || [];
            if (!rows.length) return [];
            const perPage = Math.max(1, Number(this.queryHelperFactorsPerPage) || 10);
            const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
            const page = Math.min(Math.max(1, Number(this.queryHelperFactorPage) || 1), pageCount);
            const start = (page - 1) * perPage;
            return rows.slice(start, start + perPage);
        },
        queryHelperHasRequiredSelections() {
            return (
                Array.isArray(this.queryHelperSelectedPhenotypes) &&
                this.queryHelperSelectedPhenotypes.length > 0 &&
                Array.isArray(this.queryHelperSelectedFactorRows) &&
                this.queryHelperSelectedFactorRows.length > 0
            );
        },
        queryHelperCanContinue() {
            if (this.queryHelperHasRequiredSelections) return true;
            return Array.isArray(this.queryHelperMechanismTerms) && this.queryHelperMechanismTerms.length > 0;
        },
        queryHelperHardConstraintEligible() {
            return (
                Array.isArray(this.queryHelperSelectedPhenotypes) &&
                this.queryHelperSelectedPhenotypes.length > 0 &&
                Array.isArray(this.queryHelperSelectedFactorRows) &&
                this.queryHelperSelectedFactorRows.length > 0
            );
        },
        queryHelperAllFactorsSelected() {
            const rows = this.queryHelperFactorRows || [];
            if (!rows.length) return false;
            return rows.every((row) => !!this.queryHelperFactorSelection[row.key]);
        },
        queryHelperSomeFactorsSelected() {
            const rows = this.queryHelperFactorRows || [];
            if (!rows.length) return false;
            const selectedCount = rows.reduce(
                (acc, row) => acc + (this.queryHelperFactorSelection[row.key] ? 1 : 0),
                0
            );
            return selectedCount > 0 && selectedCount < rows.length;
        },
        factorDataTableRows() {
            const rows = [];
            const data = this.factorData || {};
            const filteredByPhenotype = {};
            Object.keys(data).forEach((p) => {
                const factors = data[p].factors || [];
                const set = new Set();
                factors.forEach((f) => {
                    if (f.factor != null) set.add(String(f.factor));
                    if (f.label != null && String(f.label).trim() !== "") set.add(String(f.label).trim());
                });
                filteredByPhenotype[p] = set;
            });
            Object.keys(data).forEach((phenotype) => {
                const factors = data[phenotype].factors || [];
                const allFactors = data[phenotype].allFactors || factors;
                const phenotypeRationale = data[phenotype].filterRationale;
                const filteredSet = filteredByPhenotype[phenotype];
                allFactors.forEach((f) => {
                    const topGeneSetsStr = f.top_gene_sets;
                    const topGeneSetProgramsStr = f.gene_set_program;
                    const topGeneSetsDisplay = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean).join(", ")
                        : "";
                    const topGeneSets = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                        ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                        : "";
                    const topGeneSetPrograms = (typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr)
                        ? topGeneSetProgramsStr.split("|").map((s) => s.trim()).filter(Boolean)
                        : "";
                    const rationale = (f.selectionRationale != null && f.selectionRationale !== "")
                        ? f.selectionRationale
                        : (phenotypeRationale != null && phenotypeRationale !== "" ? phenotypeRationale : "");
                    const isIncluded = !filteredSet || filteredSet.size === 0
                        ? true
                        : (filteredSet.has(String(f.factor)) || (f.label != null && filteredSet.has(String(f.label).trim())));
                    const fetchedDirection = f.fetched_direction != null && String(f.fetched_direction).trim() !== ""
                        ? String(f.fetched_direction).trim()
                        : (f.route_category != null ? String(f.route_category).trim() : "");
                    const rowKey = `${phenotype}|${f.factor}|${fetchedDirection}`;
                    const hardConstraintLabel =
                        this.lastRunUsedHardConstraint &&
                        this.lastHardConstraintFactorLabelByPair &&
                        this.lastHardConstraintFactorLabelByPair[rowKey]
                            ? String(this.lastHardConstraintFactorLabelByPair[rowKey]).trim()
                            : "";
                    const included = Object.prototype.hasOwnProperty.call(this.pairSelectionOverrides, rowKey)
                        ? !!this.pairSelectionOverrides[rowKey]
                        : isIncluded;
                    rows.push({
                        phenotype,
                        factor: f.factor,
                        factorLabel: hardConstraintLabel || (f.label != null ? f.label : f.factor),
                        factorLabelFromApi:
                            f.labelFromApi != null && String(f.labelFromApi).trim() !== ""
                                ? String(f.labelFromApi).trim()
                                : null,
                        top_gene_sets: topGeneSets,
                        top_gene_set_programs: topGeneSetPrograms,
                        fetched_direction: fetchedDirection,
                        fetched_direction_id: f.fetched_direction_id != null ? String(f.fetched_direction_id).trim() : "",
                        route_category: f.route_category != null ? String(f.route_category).trim() : "",
                        route_categories: Array.isArray(f.route_categories) ? f.route_categories : [],
                        route_query: f.route_query != null ? String(f.route_query).trim() : "",
                        route_queries: Array.isArray(f.route_queries) ? f.route_queries : [],
                        route_support_score:
                            f.route_support_score != null && !isNaN(Number(f.route_support_score))
                                ? Number(f.route_support_score)
                                : null,
                        fetchDirection: fetchedDirection,
                        rationale,
                        isFiltered: isIncluded,
                        included,
                        _rowKey: rowKey,
                        _showDetails: !!this.expandedFactorRowKeys[rowKey],
                    });
                });
            });
            rows.sort((a, b) => {
                const aIncluded = a.included ? 1 : 0;
                const bIncluded = b.included ? 1 : 0;
                if (bIncluded !== aIncluded) return bIncluded - aIncluded;
                return (a.phenotype || "").localeCompare(b.phenotype || "");
            });
            return rows;
        },
        isPhenotypePath() {
            const data = this.factorData || {};
            return Object.keys(data).some((p) => (data[p].allFactors || []).length > 0);
        },
        phenotypeRationaleList() {
            if (!this.isPhenotypePath) return [];
            const data = this.factorData || {};
            return Object.keys(data)
                .filter((p) => {
                    const r = data[p].filterRationale;
                    return r != null && String(r).trim() !== "";
                })
                .map((p) => ({ phenotype: p, rationale: String(data[p].filterRationale).trim() }));
        },
        factorDataTableRowsWithRationaleMeta() {
            const source = this.factorDataTableRows || [];
            if (!this.isPhenotypePath) return source;
            const rows = source.map((r) => ({ ...r, rationaleRowspan: 1, showRationaleTd: true }));
            let i = 0;
            while (i < rows.length) {
                if (!rows[i].included) break;
                const phenotype = rows[i].phenotype;
                let j = i;
                while (j < rows.length && rows[j].included && rows[j].phenotype === phenotype) j++;
                const count = j - i;
                rows[i].rationaleRowspan = count;
                rows[i].showRationaleTd = true;
                for (let k = i + 1; k < j; k++) {
                    rows[k].rationaleRowspan = 0;
                    rows[k].showRationaleTd = false;
                }
                i = j;
            }
            return rows;
        },
        factorDataTableRowsFiltered() {
            return (this.factorDataTableRows || []).filter((r) => r.isFiltered);
        },
        /** Table rows scoped by heatmap node selection when the user has selected any nodes. */
        factorDataTableRowsHeatmapScoped() {
            const base = this.factorDataTableRowsFiltered || [];
            return filterTableRowsByHeatmapSelection(base, this.heatmapSelectedNodes, this.factorData);
        },
        normalizedHeatmapViewFilters() {
            return normalizeHeatmapViewFilters(this.heatmapViewFilters);
        },
        /**
         * Rows shown in the Data table. Gene-set entry "Only selected" mirrors the heatmap
         * without mutating factorData (full rows return when the filter is cleared).
         */
        factorTableRowsForDisplay() {
            const base = this.isPhenotypePath
                ? this.factorDataTableRowsWithRationaleMeta || []
                : this.factorDataTableRows || [];
            if (!this.isGeneSetEntryMode) return base;
            const vf = this.normalizedHeatmapViewFilters;
            if (!vf.onlySelected) return base;
            // Match heatmap axis filtering (not hypothesis AND-scoping).
            return filterTableRowsForOnlySelectedView(base, this.heatmapSelectedNodes);
        },
        selectedNodesExplainHelperText() {
            return selectedNodesExplainHelperText(this.heatmapSelectedNodes.length);
        },
        savedSelectedNodesExplainMenuItems() {
            return savedSelectedNodesExplanationMenuItems(this.selectedNodesExplanations);
        },
        savedSelectedNodesProvenanceMenuItems() {
            return savedSelectedNodesProvenanceMenuItems(this.selectedNodesProvenanceRuns);
        },
        selectedNodesExplainNodeCount() {
            return (this.selectedNodesExplainEntry?.graph_nodes || []).length;
        },
        selectedNodesExplainEdgeCount() {
            return (this.selectedNodesExplainEntry?.graph_edges || []).length;
        },
        mainFactorTableRowsPaged() {
            const rows = this.factorTableRowsForDisplay || [];
            const start = (Math.max(1, this.mainTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        remainingFactorTableRowsPaged() {
            const rows = this.remainingFactorDataTableRowsWithRationaleMeta || [];
            const start = (Math.max(1, this.remainingTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        remainingGeneSetClusterRowsPaged() {
            const rows = this.remainingGeneSetClusterRows || [];
            const start = (Math.max(1, this.remainingTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        currentSelectedPairKeys() {
            return (this.factorDataTableRows || [])
                .filter((r) => !!r.included)
                .map((r) => this.getRowKey(r))
                .filter(Boolean);
        },
        selectionDiffersFromFiltered() {
            const baseline = new Set((this.llmFilteredPairKeysBaseline || []).map((k) => String(k)));
            const current = new Set((this.currentSelectedPairKeys || []).map((k) => String(k)));
            if (baseline.size !== current.size) return true;
            for (const k of baseline) {
                if (!current.has(k)) return true;
            }
            return false;
        },
        /** Results tab: hypotheses cards or explicit LLM rejection (no hallucination). */
        showMechanismResultsPanel() {
            if (!this.loadComplete || this.error_mechanisms) return false;
            if (this.mechanisms && this.mechanisms.length) return true;
            const d = this.mechanismDiagnosticAssessment;
            return !!(d && d.can_generate_hypothesis === false);
        },
        /** Hide mechanism narrative (context, summary, cards, remaining clusters) when LLM rejected with no hypotheses. */
        mechanismResultsDetailVisible() {
            const d = this.mechanismDiagnosticAssessment;
            return !(d && d.can_generate_hypothesis === false);
        },
        workflowErrorSteps() {
            return computeWorkflowErrorSteps(this.steps);
        },
        revealExtractionStep() {
            return computeRevealExtractionStep(this.steps);
        },
        extractionStepTimeLabel() {
            return formatStepTimeLabel(this.revealExtractionStep, this.now);
        },
        revealDataSteps() {
            return computeRevealDataSteps(this.steps);
        },
        isMechanismHypothesisLoading() {
            if (this.loadComplete) return false;
            return (this.steps || []).some((s) => s && s.id === WORKFLOW_STEP_IDS.HYPOTHESES);
        },
        dataVizReady() {
            return (
                (this.genesAndFactorValuesLoaded || this.loadComplete) &&
                (this.factorDataTableRows || []).length > 0
            );
        },
        /**
         * True when Data came from the gene-set entry path (`?genes=` / searchPath genes).
         * Used for gene-set entry-only heatmap presentation (e.g. factor labels on Y-axis).
         */
        isGeneSetEntryMode() {
            if (this.searchPath === "genes") return true;
            return !!(this.geneSetEntry && this.geneSetEntry.inputGenes && this.geneSetEntry.inputGenes.length);
        },
        /**
         * Bold search-term genes of interest vs context genes (gene-set entry input genes,
         * or extracted genes_of_interest on the text-query path).
         */
        emphasizeSearchContextGenes() {
            if (this.isGeneSetEntryMode) return true;
            return !!(this.lastGenesOfInterest && this.lastGenesOfInterest.length);
        },
        /** Error / fallback popup for gene-set entry (loading progress lives under the Data tab). */
        geneSetEntryProgressModalOpen: {
            get() {
                if (!this.geneSetEntry) return false;
                if (this.geneSetEntry.status === "loading") return false;
                if (this.geneSetEntryProgressDismissed) return false;
                return this.geneSetEntry.status === "error" || this.geneSetEntry.status === "partial";
            },
            set(open) {
                if (!open) this.dismissGeneSetEntryProgressModal();
            },
        },
        /** Mount Data panel only while the Data tab is active and Results generation has not started. */
        showDataTabContent() {
            return this.showTab === "data" && !this.isMechanismHypothesisLoading;
        },
        /** Show Results panel while on Results tab or while hypothesis LLM is running. */
        showResultsTabContent() {
            return this.showTab === "results" || this.isMechanismHypothesisLoading;
        },
        revealHypothesisStep() {
            return computeRevealHypothesisStep(this.steps);
        },
        revealDataTabEnabled() {
            if (this.isMechanismHypothesisLoading) return false;
            if (this.searchCriteriaExtractionGateDone) return true;
            return this.revealDataSteps.length > 0;
        },
        canExportWorkflow() {
            return canExportMultiQueryRevealWorkflow(this);
        },
        usePerRouteSearchTermsEditor() {
            return Array.isArray(this.multiQueryRouteEditRows) && this.multiQueryRouteEditRows.length > 0;
        },
        sharedResearchContextTerm: {
            get() {
                if (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null) {
                    const v = String(this.searchCriteria[1].values);
                    return v === "(none extracted)" ? "" : v;
                }
                const ctxRow = (this.searchCriteriaEditRows || []).find((r) => r && r.type === "Research context");
                return ctxRow ? String(ctxRow.term || "") : "";
            },
            set(val) {
                const text = String(val || "").trim();
                if (this.searchCriteria && this.searchCriteria[1]) {
                    this.$set(this.searchCriteria[1], "values", text || "(none extracted)");
                }
                const ctxRow = (this.searchCriteriaEditRows || []).find((r) => r && r.type === "Research context");
                if (ctxRow) ctxRow.term = text;
            },
        },
        revealResultsTabEnabled() {
            if (this.revealResultsTabUnlocked) return true;
            if ((this.steps || []).some((s) => s && s.id === WORKFLOW_STEP_IDS.HYPOTHESES)) return true;
            if (this.loadComplete && (this.error_mechanisms || this.showMechanismResultsPanel)) return true;
            return false;
        },
        /** ZIP report exists only after at least one hypothesis card was generated. */
        canDownloadMechanismReport() {
            return Array.isArray(this.mechanisms) && this.mechanisms.length > 0;
        },
        phenotypeCount() {
            const rows = this.factorDataTableRowsFiltered || [];
            return new Set(rows.map((r) => r.phenotype)).size;
        },
        factorCount() {
            return (this.factorDataTableRowsFiltered || []).length;
        },
        phenotypeList() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => r.phenotype))].sort();
        },
        factorLabelsList() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => r.factorLabel))].sort();
        },
        /** Human-readable gene-set cluster labels for pills (CFDE maps + fallback to raw id). */
        factorLabelsListDisplay() {
            const rows = this.factorDataTableRowsFiltered || [];
            return [...new Set(rows.map((r) => this.getFactorClusterDisplay(r)))].sort();
        },
        /**
         * Phenotype–table-row keys cited in mechanism results.
         * Free-text: inferred from supporting_row_ids + flattened KG.
         * Gene-set: from associated_pairs / associated_factor_ids (no flattened KG).
         */
        mechanismResultPhenotypeFactorPairKeys() {
            const keys = new Set();
            const flat = this.lastFlattenedKG;
            const mechs = this.mechanisms || [];
            const data = this.factorData || {};
            if (!mechs.length) return keys;
            const geneSetPath = this.searchPath === "genes";
            for (const m of mechs) {
                if (m._fromRemainingPair && Array.isArray(m._remainingPairCoverKeys)) {
                    m._remainingPairCoverKeys.forEach((k) => keys.add(k));
                    continue;
                }
                if (geneSetPath) {
                    const pairs = Array.isArray(m.associated_pairs) ? m.associated_pairs : [];
                    pairs.forEach((pair) => {
                        if (!pair) return;
                        const p = pair.phenotype != null ? String(pair.phenotype).trim() : "";
                        const f = pair.factor != null ? String(pair.factor).trim() : "";
                        if (p && f) {
                            keys.add(`${p}|${this.collapseWsLower(f)}`);
                            keys.add(`${f}|${this.collapseWsLower(p)}`);
                        } else if (f) {
                            keys.add(`${f}|${this.collapseWsLower(f)}`);
                        } else if (p) {
                            keys.add(`${p}|${this.collapseWsLower(p)}`);
                        }
                    });
                    const factorIds = Array.isArray(m.associated_factor_ids)
                        ? m.associated_factor_ids
                        : [];
                    factorIds.forEach((fid) => {
                        const id = fid != null ? String(fid).trim() : "";
                        if (!id) return;
                        keys.add(`${id}|${this.collapseWsLower(id)}`);
                        const bucket = data[id];
                        const factorObj =
                            bucket && Array.isArray(bucket.factors) && bucket.factors[0]
                                ? bucket.factors[0]
                                : null;
                        const label =
                            factorObj && factorObj.label != null
                                ? String(factorObj.label).trim()
                                : factorObj && factorObj.factorLabel != null
                                  ? String(factorObj.factorLabel).trim()
                                  : "";
                        if (label) {
                            keys.add(`${id}|${this.collapseWsLower(label)}`);
                        }
                    });
                    continue;
                }
                if (!flat || !flat.length) continue;
                if (!Array.isArray(m.supporting_row_ids) || !m.supporting_row_ids.length) continue;
                const idSet = new Set(m.supporting_row_ids.map(Number));
                this.addTableRowKeysFromCitedFlatRows(keys, flat, idSet, data);
            }
            return keys;
        },
        /** Included rows not yet cited in mechanism supporting evidence (or covered by ad-hoc generate). */
        remainingGeneSetClusterRows() {
            const mechKeys = this.mechanismResultPhenotypeFactorPairKeys;
            const adHoc = new Set(this.adHocCoveredRowKeys || []);
            return (this.factorDataTableRows || []).filter((r) => {
                if (!r.included) return false;
                if (adHoc.has(this.getRowKey(r))) return false;
                const p = String(r.phenotype).trim();
                const fl = r.factorLabel != null ? String(r.factorLabel).trim() : "";
                const fid = r.factor != null ? String(r.factor).trim() : "";
                const mechCovers =
                    mechKeys.has(`${p}|${this.collapseWsLower(fl)}`) ||
                    mechKeys.has(`${p}|${this.collapseWsLower(fid)}`);
                return !mechCovers;
            });
        },
        remainingFactorDataTableRowsWithRationaleMeta() {
            const remKeys = new Set((this.remainingGeneSetClusterRows || []).map((r) => this.getRowKey(r)));
            return (this.factorDataTableRowsWithRationaleMeta || []).filter((r) => remKeys.has(this.getRowKey(r)));
        },
        /** Human-readable lines for hybrid-search meta (fusion, genes of interest resolution). */
        hybridSearchMetaSummaryLines() {
            const m = this.lastHybridSearchMeta || {};
            const lines = [];
            const membershipExpansionStageMessages = {
                no_warehouse_candidates:
                    "We did not find enough baseline gene evidence for this factor, so we could not add extra gene links. We returned the standard ranked genes only.",
                no_gene_sets:
                    "We did not find usable pathway/gene-set records for this factor, so no pathway-based gene linking was possible. We returned the standard ranked genes only.",
                no_membership_hits:
                    "We checked pathway/gene-set membership, but none of the queried sets returned matching genes for this factor. We returned the standard ranked genes only.",
                no_anchors:
                    "We could not identify a starting gene to drive pathway-based linking for this factor. We returned the standard ranked genes only.",
                no_anchor_sets:
                    "A starting gene was identified, but it did not overlap with any returned pathway/gene-set memberships. We returned the standard ranked genes only.",
                no_expansion_candidates:
                    "Pathway memberships were found, but no additional genes met the overlap/scoring rules. We returned the standard ranked genes only.",
                no_budget_take:
                    "Additional linked genes were detected, but none were selected after final ranking/limit rules were applied. We returned the standard ranked genes only.",
                expansion_applied:
                    "We found additional pathway-linked genes and added them to this factor's gene list.",
            };
            if (m.lexical_fusion_used === true) {
                lines.push("Lexical fusion was used (dense retrieval + Postgres full-text search, merged with RRF).");
            }
            if (Array.isArray(m.genes_of_interest_requested) && m.genes_of_interest_requested.length) {
                lines.push(`Genes of interest sent to the server: ${m.genes_of_interest_requested.join(", ")}.`);
            }
            if (Array.isArray(m.genes_of_interest_absent_from_db) && m.genes_of_interest_absent_from_db.length) {
                lines.push(
                    `No row in genes_to_factors for: ${m.genes_of_interest_absent_from_db.join(", ")} (cannot be fabricated).`
                );
            }
            if (Array.isArray(m.genes_of_interest_missing_from_response) && m.genes_of_interest_missing_from_response.length) {
                lines.push(
                    `Not present on any factor gene list after merge: ${m.genes_of_interest_missing_from_response.join(", ")} (e.g. factor budget or data gaps).`
                );
            }
            if (
                m.membership_expansion_stage_counts &&
                typeof m.membership_expansion_stage_counts === "object" &&
                !Array.isArray(m.membership_expansion_stage_counts)
            ) {
                Object.keys(m.membership_expansion_stage_counts).forEach((stage) => {
                    const msg = membershipExpansionStageMessages[stage];
                    if (!msg) return;
                    const countRaw = m.membership_expansion_stage_counts[stage];
                    const count = Number(countRaw);
                    if (!Number.isFinite(count) || count <= 0) return;
                    lines.push(`${count} factor${count === 1 ? "" : "s"}: ${msg}`);
                });
            }
            return lines;
        },
    },
    watch: {
        showDataTabContent(visible) {
            if (!visible) return;
            this.$nextTick(() => {
                this.normalizeHeatmapSelectionAfterRegroup();
                const ref = this.$refs.factorBaseRevealHeatmap;
                const comp = Array.isArray(ref) ? ref[0] : ref;
                if (
                    comp &&
                    typeof comp.renderFactorBaseRevealHeatmap === "function" &&
                    comp.heatmapDataFromFactorData &&
                    comp.heatmapDataFromFactorData.ready
                ) {
                    setTimeout(() => comp.renderFactorBaseRevealHeatmap(), 200);
                }
            });
        },
        mechanisms: {
            handler(val) {
                if (Array.isArray(val) && val.length) {
                    this.$nextTick(() => this.prefetchC2m2ProvenanceForMechanisms());
                }
            },
            deep: true,
            immediate: true,
        },
    },
    created() {
        // Bedrock only (no OpenAI fallback). expectJson sends responsePrefix: "{".
        this.llmExtract = createLLMClient({
            system_prompt: MULTI_ROUTE_EXTRACT_SYSTEM_PROMPT,
            expectJson: true,
        });

        this.llmAnalyze = createLLMClient({
            system_prompt: this.mechanismHypothesisSystemPrompt,
            expectJson: true,
        });
        this.llmQueryHelper = createLLMClient({
            system_prompt: QUERY_HELPER_COMPOSE_SYSTEM_PROMPT,
            expectJson: true,
        });

    },
    async mounted() {
        if (keyParams.genes) {
            const genes = parseGenesParam(this, keyParams.genes);
            if (genes.length) {
                // Surface genes in the main query input and lock gene-set entry search path.
                this.userQuery = genes.join(", ");
                this.searchPath = "genes";
                this.placeholderRotationPaused = true;
            }
            this.geneSetEntryProgressDismissed = false;
            await runGeneSetEntryWorkflow(this, keyParams.genes, {
                failMode: keyParams.geneSetEntryFail,
            });
        } else if (keyParams.query) {
            this.searchPath = "query";
            this.userQuery = keyParams.query;
        }
        this.currentPlaceholderIndex = 0;
        this.startPlaceholderRotation();
        this.$nextTick(() => {
            const bar = this.$refs.workflowQueryBar;
            if (bar && typeof bar.focusQueryInput === "function") {
                this.suppressNextQueryFocusPause = true;
                bar.focusQueryInput();
            }
        });
    },
    beforeDestroy() {
        this.stopStepTimer();
        this.stopRemainingGenerateTimer();
        this.stopPlaceholderRotation();
        if (typeof this.stepApprovalGateResolver === "function") {
            this.stepApprovalGateResolver();
            this.stepApprovalGateResolver = null;
        }
    },
    methods: {
         showByorTab(){
            const TAB = 'research_method';
			const CONTENT = 'research_method_content';
			const TAB_WRAPPER = 'rp_tabs';
			const CONTENT_WRAPPER = 'rp_tabs_contents';
            uiUtils.showTabContent(TAB, CONTENT, TAB_WRAPPER, CONTENT_WRAPPER);
        },
        onOpsSetMode(mode) {
            this.hypothesisModeRelaxedSwitch = mode === "relaxed";
        },
        onOpsResetSearch() {
            if (this.stepApprovalGateActive) {
                this.cancelStepGate(false);
            }
            this.abortWorkflowClients();
            this.bumpWorkflowRunId();
            this.resetWorkflowStateForNewRun();
            this.userQuery = "";
            this.searchPath = "query";
            this.geneSetEntryProgressDismissed = false;
            this.geneSetEntryLlmFeedScope = GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER;
            this.lastGeneSetEntryLlmFeed = null;
            if (this.geneSetEntry) {
                this.geneSetEntry = {
                    status: "idle",
                    inputGenes: [],
                    errors: { phenotypes: null, perPhenotype: {}, pigean: null },
                    phenotypesResponse: null,
                    pigeanResponse: null,
                    topTraits: [],
                    progress: { message: "", detail: "" },
                    researchIntention: "",
                    offerMainPathFallback: false,
                    failureReason: null,
                };
            }
            if (keyParams && typeof keyParams.set === "function") {
                keyParams.set({ query: null, genes: null, geneSetEntryFail: null });
            }
            this.placeholderRotationPaused = false;
            this.startPlaceholderRotation();
            this.setLoadStatus("Ready", true);
            this.$nextTick(() => {
                const bar = this.$refs.workflowQueryBar;
                if (bar && typeof bar.focusQueryInput === "function") {
                    bar.focusQueryInput();
                }
            });
        },
        ensureQueryHelperPhenotypeCatalog() {
            if (Array.isArray(this.queryHelperPhenotypeCatalog) && this.queryHelperPhenotypeCatalog.length) return;
            const list = [...(getCfdePhenotypesInList() || []), ...(getCfdeMousePhenotypesInList() || [])];
            const seen = new Set();
            this.queryHelperPhenotypeCatalog = list
                .filter((x) => x && x.value != null && x.label != null)
                .map((x) => ({ value: String(x.value), label: String(x.label) }))
                .filter((x) => {
                    const key = `${x.value}::${x.label}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
        },
        resetQueryHelperState() {
            this.queryHelperPhenotypeInput = "";
            this.queryHelperMechanismInput = "";
            this.queryHelperGeneInput = "";
            this.queryHelperGeneSuggestions = [];
            this.queryHelperGeneLookupLoading = false;
            this.queryHelperGeneLookupSeq = 0;
            this.queryHelperSelectedPhenotypes = [];
            this.queryHelperLoadingFactors = false;
            this.queryHelperFactorError = "";
            this.queryHelperFactorRows = [];
            this.queryHelperFactorSelection = {};
            this.queryHelperClusterFilterInput = "";
            this.queryHelperMechanismTerms = [];
            this.queryHelperNoFactorPhenotypeLabels = [];
            this.queryHelperGenesOfInterest = [];
            this.queryHelperDraftResearchContext = "";
            this.queryHelperHardConstraintEnabled = false;
            this.queryHelperComposing = false;
            this.queryHelperError = "";
        },
        openQueryHelperModal() {
            this.ensureQueryHelperPhenotypeCatalog();
            this.queryHelperError = "";
            this.queryHelperComposing = false;
            this.queryHelperAdvancedOpen = false;
            this.queryHelperGeneSuggestions = [];
            this.queryHelperGeneLookupLoading = false;
            this.queryHelperOpen = true;
        },
        onQueryHelperPickPhenotype(item) {
            if (!item || item.value == null) return;
            const value = String(item.value);
            if ((this.queryHelperSelectedPhenotypes || []).some((x) => String(x.value) === value)) return;
            this.queryHelperSelectedPhenotypes.push({
                value,
                label: String(item.label || value),
            });
            this.queryHelperPhenotypeInput = "";
            this.refreshQueryHelperFactors();
        },
        removeQueryHelperPhenotype(value) {
            const target = String(value || "");
            this.queryHelperSelectedPhenotypes = (this.queryHelperSelectedPhenotypes || []).filter(
                (x) => String(x.value) !== target
            );
            if (!this.queryHelperHardConstraintEligible) {
                this.queryHelperHardConstraintEnabled = false;
            }
            this.refreshQueryHelperFactors();
        },
        toggleQueryHelperFactor(rowKey, evt) {
            const checked = !!(evt && evt.target && evt.target.checked);
            this.$set(this.queryHelperFactorSelection, String(rowKey || ""), checked);
            if (!this.queryHelperHardConstraintEligible) {
                this.queryHelperHardConstraintEnabled = false;
            }
        },
        toggleQueryHelperAllFactors(evt) {
            const checked = !!(evt && evt.target && evt.target.checked);
            const next = {};
            (this.queryHelperFactorRows || []).forEach((row) => {
                next[row.key] = checked;
            });
            this.queryHelperFactorSelection = next;
            if (!this.queryHelperHardConstraintEligible) {
                this.queryHelperHardConstraintEnabled = false;
            }
        },
        queryHelperMatchesClauses(rawQuery, haystackText) {
            const raw = String(rawQuery || "").trim().toLowerCase();
            if (!raw) return true;
            const clauses = raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (!clauses.length) return true;
            const haystack = String(haystackText || "").toLowerCase();
            return clauses.every((clause) => {
                if (haystack.includes(clause)) return true;
                const words = clause.split(/\s+/).filter(Boolean);
                return words.length > 0 && words.every((w) => haystack.includes(w));
            });
        },
        applyQueryHelperClusterFilterSelection() {
            const rows = this.queryHelperFactorRows || [];
            if (!rows.length) return;
            const raw = String(this.queryHelperClusterFilterInput || "").trim();
            const next = {};
            if (!raw) {
                rows.forEach((row) => {
                    next[row.key] = true;
                });
                this.queryHelperFactorSelection = next;
                return;
            }
            rows.forEach((row) => {
                const haystack = `${row.factorLabel || ""} ${row.factorLabelRaw || ""} ${row.factorId || ""}`
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();
                const clauses = raw
                    .toLowerCase()
                    .split(",")
                    .map((s) => s.replace(/\s+/g, " ").trim())
                    .filter(Boolean);
                next[row.key] = clauses.some((clause) => haystack.includes(clause));
            });
            this.queryHelperFactorSelection = next;
        },
        normalizeGeneSymbolInput(raw) {
            return String(raw || "")
                .trim()
                .replace(/[,\s]+$/g, "")
                .toUpperCase();
        },
        extractGeneSuggestionLabel(item) {
            if (item == null) return "";
            if (typeof item === "string") return item.trim();
            if (typeof item === "object") {
                const candidates = ["gene", "symbol", "name", "id"];
                for (const k of candidates) {
                    if (item[k] != null && String(item[k]).trim() !== "") {
                        return String(item[k]).trim();
                    }
                }
            }
            return "";
        },
        async onQueryHelperGeneInput() {
            return fetchGeneSuggestionsForQueryHelper(this);
        },
        selectQueryHelperGeneSuggestion(gene) {
            const g = this.normalizeGeneSymbolInput(gene);
            if (!g) return;
            if (!(this.queryHelperGenesOfInterest || []).includes(g)) {
                this.queryHelperGenesOfInterest.push(g);
            }
            this.queryHelperGeneInput = "";
            this.queryHelperGeneSuggestions = [];
        },
        normalizeMechanismInput(raw) {
            return String(raw || "")
                .trim()
                .replace(/[,\s]+$/g, "");
        },
        addQueryHelperMechanismFromInput() {
            const term = this.normalizeMechanismInput(this.queryHelperMechanismInput);
            if (!term) return;
            if (!(this.queryHelperMechanismTerms || []).includes(term)) {
                this.queryHelperMechanismTerms.push(term);
            }
            this.queryHelperMechanismInput = "";
        },
        removeQueryHelperMechanism(term) {
            const target = String(term || "");
            this.queryHelperMechanismTerms = (this.queryHelperMechanismTerms || []).filter((x) => String(x) !== target);
        },
        addQueryHelperGeneFromInput() {
            if (this.queryHelperGeneSuggestions.length) {
                this.selectQueryHelperGeneSuggestion(this.queryHelperGeneSuggestions[0]);
                return;
            }
            const g = this.normalizeGeneSymbolInput(this.queryHelperGeneInput);
            if (!g) return;
            if (!(this.queryHelperGenesOfInterest || []).includes(g)) {
                this.queryHelperGenesOfInterest.push(g);
            }
            this.queryHelperGeneInput = "";
            this.queryHelperGeneSuggestions = [];
        },
        removeQueryHelperGene(gene) {
            const target = String(gene || "");
            this.queryHelperGenesOfInterest = (this.queryHelperGenesOfInterest || []).filter((x) => String(x) !== target);
        },
        async refreshQueryHelperFactors() {
            return fetchQueryHelperFactorRows(this);
        },
        buildHelperFallbackQuery(options) {
            return buildHelperFallbackQuery(options);
        },
        normalizeHelperGeneSymbolToken(raw) {
            const token = String(raw || "")
                .trim()
                .replace(/\(.*/g, "")
                .replace(/[^A-Za-z0-9-]/g, "")
                .toUpperCase();
            return token && token.length >= 2 ? token : "";
        },
        normalizeHelperSelectedGenes(list) {
            const input = Array.isArray(list) ? list : [];
            const out = [];
            const seen = new Set();
            input.forEach((entry) => {
                const text = String(entry || "").trim();
                if (!text) return;
                text
                    .split(/[\/,;]+/)
                    .map((part) => this.normalizeHelperGeneSymbolToken(part))
                    .filter(Boolean)
                    .forEach((g) => {
                        if (seen.has(g)) return;
                        seen.add(g);
                        out.push(g);
                    });
            });
            return out;
        },
        buildHelperSelectedMechanismTerms(selectedMechanisms, selectedFactors) {
            const out = [];
            const seen = new Set();
            const add = (raw) => {
                const s = String(raw || "").trim();
                if (!s) return;
                if (seen.has(s.toLowerCase())) return;
                seen.add(s.toLowerCase());
                out.push(s);
            };
            (Array.isArray(selectedMechanisms) ? selectedMechanisms : []).forEach(add);
            if (!out.length) {
                (Array.isArray(selectedFactors) ? selectedFactors : []).forEach((f) => {
                    const human =
                        f && f.factor_label != null && String(f.factor_label).trim() !== ""
                            ? resolveCfdeFactorClusterDisplayLabel(String(f.factor_label).trim())
                            : "";
                    const raw =
                        f && f.factor_label_raw != null && String(f.factor_label_raw).trim() !== ""
                            ? resolveCfdeFactorClusterDisplayLabel(String(f.factor_label_raw).trim())
                            : "";
                    const fallback =
                        f && f.factor_id != null && String(f.factor_id).trim() !== ""
                            ? resolveCfdeFactorClusterDisplayLabel(String(f.factor_id).trim())
                            : "";
                    add(human || raw || fallback);
                });
            }
            return out;
        },
        buildHelperDeterministicTerms({ selectedPhenotypes = [], selectedFactors = [], selectedMechanisms = [], selectedGenes = [] } = {}) {
            const normalizedGenes = this.normalizeHelperSelectedGenes(selectedGenes);
            const mechanismTerms = this.buildHelperSelectedMechanismTerms(selectedMechanisms, selectedFactors);
            const phenotypeIds = (Array.isArray(selectedPhenotypes) ? selectedPhenotypes : [])
                .map((p) => (p && p.id != null ? String(p.id).trim() : ""))
                .filter(Boolean);
            // Keep extracted phenotype terms strict to avoid broad kitchen-sink phenotypes when constraints exist.
            const phenotypeTermsForExtract = mechanismTerms.length ? [] : phenotypeIds;
            return {
                phenotypeTermsForExtract,
                phenotypeTermsForRetrieval: phenotypeIds,
                mechanismTerms,
                genesOfInterest: normalizedGenes,
            };
        },
        buildHelperConstraintSpec({ selectedFactors = [] } = {}) {
            if (!this.queryHelperHardConstraintEnabled) return null;
            if (!this.queryHelperHardConstraintEligible) return null;
            const associations = [];
            const allTopGeneSets = [];
            const seen = new Set();
            const seenGeneSets = new Set();
            (Array.isArray(selectedFactors) ? selectedFactors : []).forEach((f) => {
                const phenotypeId =
                    f && f.phenotype_id != null && String(f.phenotype_id).trim() !== ""
                        ? String(f.phenotype_id).trim()
                        : "";
                const factorId =
                    f && f.factor_id != null && String(f.factor_id).trim() !== ""
                        ? String(f.factor_id).trim()
                        : "";
                if (!phenotypeId || !factorId) return;
                const key = `${phenotypeId}||${factorId}`;
                if (seen.has(key)) return;
                seen.add(key);
                const topGeneSets = [];
                const rawTopGeneSets = f && f.top_gene_sets != null ? String(f.top_gene_sets) : "";
                rawTopGeneSets
                    .split(/[;,]/)
                    .map((s) => String(s || "").trim())
                    .filter(Boolean)
                    .forEach((gs) => {
                        const gsKey = gs.toLowerCase();
                        if (!topGeneSets.some((x) => x.toLowerCase() === gsKey)) {
                            topGeneSets.push(gs);
                        }
                        if (!seenGeneSets.has(gsKey)) {
                            seenGeneSets.add(gsKey);
                            allTopGeneSets.push(gs);
                        }
                    });
                associations.push({
                    phenotype_id: phenotypeId,
                    factor_id: factorId,
                    ...(topGeneSets.length ? { top_gene_sets: topGeneSets } : {}),
                });
            });
            if (!associations.length) return null;
            return {
                constraint_mode: "hard",
                constraint_scope: {
                    associations,
                    ...(allTopGeneSets.length ? { top_gene_sets: allTopGeneSets } : {}),
                },
            };
        },
        async continueWithQueryHelper() {
            return continueWithQueryHelper(this);
        },
        resetWorkflowStateForNewRun() {
            resetMqWorkflowSessionForNewRun(this);
        },
        async startWorkflowFromExtractedTerms(options = {}) {
            return orchestrateStartFromExtractedTerms(this, options);
        },
        startPlaceholderRotation() {
            if (this.placeholderIntervalId != null) return;
            if (String(this.userQuery || "").trim()) return;
            this.placeholderIntervalId = setInterval(() => {
                if (this.placeholderRotationPaused) return;
                if (String(this.userQuery || "").trim()) return;
                const n = Array.isArray(this.placeholderExamples) ? this.placeholderExamples.length : 0;
                if (!n) return;
                this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % n;
            }, 7000);
        },
        stopPlaceholderRotation() {
            if (this.placeholderIntervalId != null) {
                clearInterval(this.placeholderIntervalId);
                this.placeholderIntervalId = null;
            }
        },
        onQueryInputFocus() {
            if (this.suppressNextQueryFocusPause) {
                this.suppressNextQueryFocusPause = false;
                return;
            }
            this.placeholderRotationPaused = true;
        },
        onQueryInputBlur() {
            this.suppressNextQueryFocusPause = false;
            if (String(this.userQuery || "").trim()) return;
            this.placeholderRotationPaused = false;
            this.startPlaceholderRotation();
        },
        onQueryInput() {
            if (String(this.userQuery || "").trim()) {
                this.placeholderRotationPaused = true;
                return;
            }
            this.placeholderRotationPaused = false;
            this.startPlaceholderRotation();
        },
        onUserQueryUpdate(val) {
            this.userQuery = val;
            this.onQueryInput();
        },
        onSearchCriteriaTypeUpdate(value) {
            if (value === "gene_set") {
                this.searchPath = "genes";
                this.placeholderRotationPaused = true;
                return;
            }
            if (value === "free_text") {
                this.searchPath = "query";
                if (!String(this.userQuery || "").trim()) {
                    this.placeholderRotationPaused = false;
                    this.startPlaceholderRotation();
                }
            }
        },
        /**
         * CFDE C2M2 provenance API. Returns json.data (array) or null.
         * @see https://cfde-dev.hugeampkpnbi.org/api/bio/query/c2m2-provenance
         */
        async fetchProvenance(geneset) {
            return fetchC2m2Provenance(geneset);
        },
        /** Deduped nodes with dcc_url for provenance pills (Flattens data[].nodes). */
        flattenC2m2ProvenanceNodes(data) {
            if (!data || !data.length) return [];
            const out = [];
            const seen = new Set();
            data.forEach((entry) => {
                (entry.nodes || []).forEach((n) => {
                    const url = n.dcc_url != null ? String(n.dcc_url).trim() : "";
                    const id = n.id != null ? String(n.id) : "";
                    if (!url || !id) return;
                    if (seen.has(id)) return;
                    seen.add(id);
                    out.push({
                        id,
                        dcc_url: url,
                        labels: Array.isArray(n.labels) ? n.labels : [],
                    });
                });
            });
            return out;
        },
        c2m2ProvenanceEntry(geneSetId) {
            const key = geneSetId != null ? String(geneSetId) : "";
            return (key && this.c2m2ProvenanceByGeneSet[key]) || null;
        },
        /** Nodes with a DCC URL for the hover "download options" menu (relevant gene sets row). */
        c2m2GeneSetDownloadNodes(geneSetId) {
            const ent = this.c2m2ProvenanceEntry(geneSetId);
            if (!ent || ent.status !== "ok" || !Array.isArray(ent.nodes)) return [];
            return ent.nodes.filter((n) => n && n.dcc_url != null && String(n.dcc_url).trim() !== "");
        },
        truncateProvenanceNodeLabel(id, maxLen = 38) {
            const s = String(id || "");
            if (s.length <= maxLen) return s;
            return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
        },
        async ensureC2m2ProvenanceForGeneSet(geneSetId) {
            const key = String(geneSetId || "").trim();
            if (!key) return;
            const cur = this.c2m2ProvenanceByGeneSet[key];
            if (cur && (cur.status === "loading" || cur.status === "ok" || cur.status === "empty" || cur.status === "error")) {
                return;
            }
            this.$set(this.c2m2ProvenanceByGeneSet, key, { status: "loading", nodes: [] });
            try {
                const data = await this.fetchProvenance(key);
                const nodes = this.flattenC2m2ProvenanceNodes(data);
                this.$set(this.c2m2ProvenanceByGeneSet, key, {
                    status: nodes.length ? "ok" : "empty",
                    nodes,
                });
            } catch (e) {
                this.$set(this.c2m2ProvenanceByGeneSet, key, { status: "error", nodes: [] });
            }
        },
        prefetchC2m2ProvenanceForMechanisms() {
            const mechs = this.mechanisms;
            if (!Array.isArray(mechs)) return;
            const ids = new Set();
            mechs.forEach((m) => {
                (m.relevant_gene_sets || []).forEach((gs) => {
                    const id = String(gs || "").trim();
                    if (id) ids.add(id);
                });
                (m.cited_gene_set_names || []).forEach((gs) => {
                    const id = String(gs || "").trim();
                    if (id) ids.add(id);
                });
            });
            ids.forEach((id) => this.ensureC2m2ProvenanceForGeneSet(id));
        },
        formatProvenance(entry) {
            const nodesById = Object.fromEntries(
                entry.nodes.map(n => [n.id, n])
            )

            const geneSetNode = entry.nodes.find(n =>
                n.labels.includes('GeneSet')
            )

            const relations = entry.edges.map(edge => {
                const fileNode = nodesById[edge.object]

                return {
                    file: {
                        filename: fileNode?.properties?.filename,
                        id: fileNode?.properties?.persistent_id,
                        size: fileNode?.properties?.size_in_bytes,
                        dcc_url: fileNode?.dcc_url
                    },
                    method: {
                        script: edge.context?.script,
                        direction: edge.context?.direction,
                        type: edge.context?.type,
                        predicate: edge.predicate
                    }
                }
            })

            return {
                geneSet: geneSetNode?.properties?.name,
                geneSetUrl: geneSetNode?.properties?.parent_url,
                relations
            }
        },
        async onGeneSetRowToggled(row){
            row.toggleDetails();
            //if (!row._showDetails) return;
            const key = row.item.geneset;
            if(this.gene_set_sources[key]) {
                return;
            }
            const data = await this.fetchProvenance(key);
            const result = data && data.length>0 ? this.formatProvenance(data[0]) : null
            this.$set(this.gene_set_sources, key, result);
        },
        downloadLastHybridSearchRawJson() {
            let payload = null;
            let filenamePrefix = "hybrid-search-response";

            // Gene-set path only: slim factorization export (not nested factorData).
            if (this.searchPath === "genes") {
                const factorData =
                    this.factorData && typeof this.factorData === "object" ? this.factorData : {};
                const inputGenes =
                    this.geneSetEntry && Array.isArray(this.geneSetEntry.inputGenes)
                        ? this.geneSetEntry.inputGenes.slice()
                        : [];
                payload = buildGeneSetEntryRawExport(factorData, {
                    inputGenes,
                    source: "bayes_gene/pigean",
                    searchPath: "genes",
                });
                if (!payload) return;
                filenamePrefix = "gene-set-factorization-response";
            } else {
                payload = this.lastHybridSearchResponse;
                if (!payload || typeof payload !== "object") return;
            }

            try {
                const json = JSON.stringify(payload, null, 2);
                const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${filenamePrefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                /* ignore */
            }
        },
        async exportWorkflowSnapshot() {
            if (!this.canExportWorkflow || this.workflowExportImportBusy) return;
            this.workflowExportImportBusy = true;
            try {
                const result = await exportMultiQueryRevealWorkflow(this, {
                    label: this.userQuery,
                });
                if (result?.reason === "cancelled") return;
                if (!result?.ok) {
                    console.warn("REVEAL workflow export failed", result);
                }
            } catch (error) {
                console.error("REVEAL workflow export failed", error);
            } finally {
                this.workflowExportImportBusy = false;
            }
        },
        onWorkflowImportClick() {
            const bar = this.$refs.workflowQueryBar;
            if (bar && typeof bar.triggerImportPicker === "function") {
                bar.triggerImportPicker();
            }
        },
        async onWorkflowImportFile(file) {
            if (!file) return;
            if (this.workflowExportImportBusy) return;
            this.workflowExportImportBusy = true;
            try {
                this.bumpWorkflowRunId();
                this.abortWorkflowClients();
                if (this.stepApprovalGateActive) {
                    this.cancelStepGate(false);
                }
                const { workflow, label } = await parseMultiQueryRevealWorkflowImportFile(file);
                const result = applyMultiQueryRevealWorkflowImport(this, workflow, {
                    label,
                    setKeyParams: (map) => keyParams.set(map),
                });
                this.workflowVisualKey = (this.workflowVisualKey || 0) + 1;
                this.$nextTick(() => {
                    this.normalizeHeatmapSelectionAfterRegroup();
                });
                const tabNote = result.hasResults
                    ? " Open the Results tab to review hypotheses."
                    : result.hasData
                        ? " Open the Data tab to review results."
                        : "";
                this.setLoadStatus(`Imported workflow "${result.label}".${tabNote}`, true);
            } catch (error) {
                console.error("REVEAL workflow import failed", error);
                const message =
                    String(error?.message || error) || "Could not import workflow.";
                this.setLoadStatus(message, true);
            } finally {
                this.workflowExportImportBusy = false;
            }
        },
        async onWorkflowImportFileChange(event) {
            const file = event?.target?.files?.[0];
            if (event?.target) event.target.value = "";
            await this.onWorkflowImportFile(file);
        },
        resumeImportedWorkflowAfterDataGate() {
            orchestrateResumeImportedAfterDataGate(this);
        },
        async downloadReport() {
            if (!this.canDownloadMechanismReport) return;
            const prevTab = this.showTab;
            try {
                if (this.showTab !== "results") {
                    this.showTab = "results";
                    await this.$nextTick();
                    await this.$nextTick();
                }
                const researchContext =
                    (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                        ? String(this.searchCriteria[1].values)
                        : "";
                const mechanismImages = await this.collectMechanismReportImages();
                const html = this.buildHtmlReportDocument({
                    researchContext,
                    mechanismImages,
                    factorSummary: this.serializeFactorDataForPrompt(this.factorData || {}),
                    rawKgCsv: this.lastFlattenedKG && this.lastFlattenedKG.length
                        ? this.flattenedKGToCSV(this.lastFlattenedKG)
                        : "",
                });
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "factor-base-reveal-report.html";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch {
            } finally {
                if (this.showTab !== prevTab) {
                    this.showTab = prevTab;
                }
            }
        },
        /**
         * Capture a FactorBaseRevealNetwork instance as PNG (preferred) or SVG.
         * @param {string} refKey - this.$refs key (e.g. mechanismNetwork-0, mechanismHypothesisMap-0).
         * @param {{ nodes?: Array, edges?: Array }} net - For meta counts only.
         * @returns {Promise<{ dataUrl: string, format: string, nodeCount: number, edgeCount: number } | null>}
         */
        async exportNetworkImageFromRef(refKey, net) {
            let compRef = this.$refs[refKey];
            if (!compRef) {
                const panelRef = this.$refs.workflowResultsPanel;
                const panel = Array.isArray(panelRef) ? panelRef[0] : panelRef;
                compRef = panel && panel.$refs ? panel.$refs[refKey] : null;
            }
            const comp = Array.isArray(compRef) ? compRef[0] : compRef;
            if (!comp) return null;
            let blob = null;
            let format = "png";
            if (typeof comp.exportPng === "function") {
                blob = await comp.exportPng(3);
                format = "png";
            }
            if (!blob && typeof comp.exportSvg === "function") {
                blob = await comp.exportSvg();
                format = "svg";
            }
            if (!blob) return null;
            const dataUrl = await this.blobToDataUrl(blob);
            const n = net || {};
            return {
                dataUrl,
                format,
                nodeCount: Array.isArray(n.nodes) ? n.nodes.length : 0,
                edgeCount: Array.isArray(n.edges) ? n.edges.length : 0,
            };
        },
        async collectMechanismReportImages() {
            await this.$nextTick();
            return Promise.all(
                (this.mechanisms || []).map(async (m, idx) => {
                    const supportingNet = m.supporting_network || m.network || {};
                    const hypothesisNet = m.core_spine_network || { nodes: [], edges: [] };
                    const [supporting, hypothesisMap] = await Promise.all([
                        this.exportNetworkImageFromRef(`mechanismNetwork-${idx}`, supportingNet),
                        this.exportNetworkImageFromRef(`mechanismHypothesisMap-${idx}`, hypothesisNet),
                    ]);
                    return { idx, supporting, hypothesisMap };
                })
            );
        },
        blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        escapeHtml(value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        },
        buildReportList(items, transform = (x) => x) {
            const list = Array.isArray(items) ? items.map(transform).filter(Boolean) : [];
            if (!list.length) return '<span class="report-empty">—</span>';
            return `<ul>${list.map((item) => `<li>${this.escapeHtml(item)}</li>`).join("")}</ul>`;
        },
        buildReportGeneTableHtml(genes) {
            const rows = Array.isArray(genes) ? genes : [];
            if (!rows.length) return '<div class="report-empty">No genes listed.</div>';
            return `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Gene</th>
                            <th>Combined</th>
                            <th>GWAS</th>
                            <th>Functional</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((g) => `
                            <tr>
                                <td>${this.escapeHtml(g.gene)}</td>
                                <td>${this.escapeHtml(g.combined || "—")}</td>
                                <td>${this.escapeHtml(g.gwasSupport || "—")}</td>
                                <td>${this.escapeHtml(g.geneSetSupport || "—")}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        },
        buildReportGeneSetTableHtml(geneSets) {
            const rows = Array.isArray(geneSets) ? geneSets : [];
            if (!rows.length) return '<div class="report-empty">No gene sets listed.</div>';
            return `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Gene set</th>
                            <th>Program</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((gs) => `
                            <tr>
                                <td>${this.escapeHtml(gs.geneset || "—")}</td>
                                <td>${this.escapeHtml(gs.program || "—")}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        },
        buildReportFactorCards(rows, title) {
            const items = Array.isArray(rows) ? rows : [];
            const summaryTable = items.length ? `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Phenotype</th>
                            <th>Gene set cluster</th>
                            <th>Included</th>
                            <th>Rationale</th>
                            <th>Gene sets</th>
                            <th>Genes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((row) => `
                            <tr>
                                <td>${this.escapeHtml(this.getPhenotypeDisplay(row.phenotype || ""))}</td>
                                <td>${this.escapeHtml(this.getFactorClusterDisplay(row))}</td>
                                <td>${row.included ? "Yes" : "No"}</td>
                                <td>${this.escapeHtml(row.rationale || "—")}</td>
                                <td>${this.escapeHtml(this.getGenesetForFactor(row.phenotype, row.factor).length)}</td>
                                <td>${this.escapeHtml(this.getGenesForFactor(row.phenotype, row.factor).length)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            ` : '<div class="report-empty">No rows available.</div>';
            const cards = items.map((row) => {
                const phenotype = this.getPhenotypeDisplay(row.phenotype || "");
                const genes = this.getGenesForFactor(row.phenotype, row.factor);
                const geneSets = this.getGenesetForFactor(row.phenotype, row.factor);
                return `
                    <article class="report-card">
                        <h4>${this.escapeHtml(phenotype)} | ${this.escapeHtml(this.getFactorClusterDisplay(row))}</h4>
                        <div class="report-keyvals">
                            <div><strong>Included:</strong> ${row.included ? "Yes" : "No"}</div>
                            <div><strong>Rationale:</strong> ${this.escapeHtml(row.rationale || "—")}</div>
                        </div>
                        <div class="report-subsection">
                            <h5>Gene sets in cluster</h5>
                            ${this.buildReportGeneSetTableHtml(geneSets)}
                        </div>
                        <div class="report-subsection">
                            <h5>Genes in factor</h5>
                            ${this.buildReportGeneTableHtml(genes)}
                        </div>
                    </article>
                `;
            }).join("");
            return `
                <section class="report-section">
                    <h2>${this.escapeHtml(title)}</h2>
                    ${summaryTable}
                    <div class="report-subsection"></div>
                    ${cards || '<div class="report-empty">No rows available.</div>'}
                </section>
            `;
        },
        /**
         * One mechanism card for HTML reports (full report + per-hypothesis handoff).
         * @param {*} m - mechanism object
         * @param {number} idx - zero-based index
         * @param {{ dataUrl?: string, format?: string, nodeCount?: number, edgeCount?: number } | null} supImg - supporting network export
         * @param {{ dataUrl?: string, format?: string, nodeCount?: number, edgeCount?: number } | null} hypImg - biological flow map export
         */
        buildMechanismReportOneCardHtml(m, idx, supImg, hypImg) {
            return buildMechanismReportOneCardHtml(this, m, idx, supImg, hypImg);
        },
        buildMechanismReportSections(mechanismImages) {
            return buildMechanismReportSections(this, mechanismImages);
        },
        sanitizeHandoffNetwork(net) {
            return sanitizeHandoffNetwork(net);
        },
        sanitizeHandoffFlattenedRows(rows) {
            return sanitizeHandoffFlattenedRows(rows);
        },
        sanitizeHandoffSelectionRows(rows) {
            return sanitizeHandoffSelectionRows(rows);
        },
        sanitizeHandoffCandidateGenes(mechanism) {
            return sanitizeHandoffCandidateGenes(mechanism);
        },
        sanitizeHandoffGeneConnections(gc) {
            return sanitizeHandoffGeneConnections(gc);
        },
        buildMechanismHandoffAppendixObject(options) {
            return buildMechanismHandoffAppendixObject(this, options);
        },
        /**
         * Print-friendly single-hypothesis handoff HTML; JSON appendix via separate download link (data URL).
         */
        buildMechanismHandoffHtmlDocument(options) {
            return buildMechanismHandoffHtmlDocument(this, options);
        },
        buildHtmlReportDocument(options) {
            return buildHtmlReportDocument(this, options);
        },
        startStepTimer() {
            this.stopStepTimer();
            this.loadStepSeconds = 0;
            this.loadStepTimerId = setInterval(() => {
                this.loadStepSeconds += 1;
            }, 1000);
        },
        stopStepTimer() {
            if (this.loadStepTimerId != null) {
                clearInterval(this.loadStepTimerId);
                this.loadStepTimerId = null;
            }
        },
        startRemainingGenerateTimer() {
            this.stopRemainingGenerateTimer();
            this.remainingGenerateStartedAt = Date.now();
            this.remainingGenerateNow = Date.now();
            this.remainingGenerateTimerId = setInterval(() => {
                this.remainingGenerateNow = Date.now();
            }, 250);
        },
        stopRemainingGenerateTimer() {
            if (this.remainingGenerateTimerId != null) {
                clearInterval(this.remainingGenerateTimerId);
                this.remainingGenerateTimerId = null;
            }
            this.remainingGenerateStartedAt = null;
        },
        /** Elapsed time label for remaining-cluster Generate (same style as step timer). */
        formatRemainingGenerateElapsed() {
            if (this.remainingGenerateStartedAt == null) return "";
            const ms = Math.max(0, (this.remainingGenerateNow || Date.now()) - this.remainingGenerateStartedAt);
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}m${String(seconds).padStart(2, "0")}s`;
        },
        setLoadStatus(msg, stopTimer = false) {
            this.loadStatus = msg;
            //this.setLoadStep(`----${msg}`);
            if (stopTimer) this.stopStepTimer();
            else this.startStepTimer();
        },
        dismissGeneSetEntryProgressModal() {
            this.geneSetEntryProgressDismissed = true;
        },
        onSwitchGeneSetEntryToMainPath() {
            switchGeneSetEntryToMainPath(this);
        },
        onGeneSetEntryResearchIntentionUpdate(value) {
            if (!this.geneSetEntry) return;
            const text = value != null ? String(value) : "";
            this.$set(this.geneSetEntry, "researchIntention", text);
            this.sharedResearchContextTerm = text;
        },
        onGeneSetEntryLlmFeedScopeUpdate(value) {
            const allowed = Object.values(GENE_SET_ENTRY_LLM_FEED_SCOPE);
            const next = String(value || "");
            this.geneSetEntryLlmFeedScope = allowed.includes(next)
                ? next
                : GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER;
        },
        syncGeneSetEntryResearchIntentionToSession() {
            if (!this.geneSetEntry) return;
            const text =
                this.geneSetEntry.researchIntention != null
                    ? String(this.geneSetEntry.researchIntention).trim()
                    : "";
            this.sharedResearchContextTerm = text;
            if (!Array.isArray(this.searchCriteria) || this.searchCriteria.length < 2) {
                this.searchCriteria = [
                    { type: "genes", values: (this.geneSetEntry.inputGenes || []).join(", ") },
                    { type: "research_context", values: text },
                ];
                return;
            }
            if (!this.searchCriteria[1]) {
                this.$set(this.searchCriteria, 1, { type: "research_context", values: text });
            } else {
                this.$set(this.searchCriteria[1], "values", text);
            }
        },
        setLoadStep(msg, subMsg, time){
            const index = this.statusSteps.findIndex(o => o.msg === msg);
            if(index>-1){
                this.statusSteps[index].subMsg.push(subMsg);
            }else{
                this.statusSteps.push({
                    msg: msg,
                    subMsg: [subMsg],
                    expanded: false
                });
            }
        },
        setStep(step, toggleTimer = false) {
            return applyStepUpdate(this, step, toggleTimer);
        },
        formatTime(ms) {
            return formatStepElapsedMs(ms);
        },
        currStepTime(step) {
            return formatLiveStepTime(step, this.now);
        },
        /**
         * Hypothesis retry: step 4 already exists and setStep(..., true) on completion stopped stepsTimer.
         * Reset elapsed origin, clear completion substeps, and restart the interval so UI time updates again.
         */
        restartMechanismHypothesisStepTimer() {
            const idx = (this.steps || []).findIndex((s) => s && s.id === WORKFLOW_STEP_IDS.HYPOTHESES);
            const t = Date.now();
            if (idx !== -1) {
                this.$set(this.steps[idx], "timeStart", t);
                this.$set(this.steps[idx], "time", null);
                this.$set(this.steps[idx], "substeps", []);
            }
            this.now = t;
            this.stepsPausedAt = null;
            if (this.stepsTimer) {
                clearInterval(this.stepsTimer);
                this.stepsTimer = null;
            }
            this.stepsTimer = setInterval(() => {
                this.now = Date.now();
            }, 500);
        },
        expandStepById(stepId) {
            const idx = this.steps.findIndex((s) => s.id === stepId);
            if (idx !== -1) {
                this.$set(this.steps[idx], "expanded", true);
            }
        },
        expandStepToResult(stepId) {
            const idx = this.steps.findIndex((s) => s.id === stepId);
            if (idx === -1) return;
            this.$set(this.steps[idx], "expanded", true);
            (this.steps[idx].substeps || []).forEach((substep, subIdx) => {
                if (substep && substep.result) {
                    this.$set(this.steps[idx].substeps[subIdx], "expanded", true);
                }
            });
        },
        waitForStepApproval(stepId, message, expandToResult = false) {
            const sid = String(stepId);
            if (sid === WORKFLOW_STEP_IDS.EXTRACTION) this.switchRevealTab("terms");
            else if (sid === WORKFLOW_STEP_IDS.DATA) this.switchRevealTab("data");
            if (expandToResult) this.expandStepToResult(stepId);
            else this.expandStepById(stepId);
            this.pauseStepsElapsedForReview();
            this.stepApprovalGateActive = true;
            this.stepApprovalGateStepId = String(stepId);
            this.stepApprovalGateMessage = message || "Review this step, then continue.";
            this.setLoadStatus("Waiting for your approval to continue…", true);
            return new Promise((resolve) => {
                this.stepApprovalGateResolver = resolve;
            });
        },
        pauseStepsElapsedForReview() {
            if (this.stepsPausedAt != null) return;
            this.stepsPausedAt = Date.now();
            if (this.stepsTimer) {
                clearInterval(this.stepsTimer);
                this.stepsTimer = null;
            }
            this.now = this.stepsPausedAt;
        },
        resumeStepsElapsedAfterReview() {
            if (this.stepsPausedAt == null) return;
            const resumedAt = Date.now();
            const pausedMs = Math.max(0, resumedAt - this.stepsPausedAt);
            if (this.stepsTime != null) {
                this.stepsTime += pausedMs;
            }
            (this.steps || []).forEach((s) => {
                if (s && s.time == null && s.timeStart != null) {
                    s.timeStart += pausedMs;
                }
            });
            this.stepsPausedAt = null;
            this.now = resumedAt;
            this.stepsTimer = setInterval(() => {
                this.now = Date.now();
            }, 500);
        },
        buildSearchCriteriaEditRows() {
            const phen = Array.isArray(this.lastPhenotypeTerms) ? this.lastPhenotypeTerms : [];
            const mech = Array.isArray(this.lastMechanismTerms) ? this.lastMechanismTerms : [];
            const goi = Array.isArray(this.lastGenesOfInterest) ? this.lastGenesOfInterest : [];
            const researchContext =
                this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null
                    ? String(this.searchCriteria[1].values)
                    : "";
            const normalizedContext = researchContext === "(none extracted)" ? "" : researchContext;
            if (Array.isArray(this.multiQueryRoutes) && this.multiQueryRoutes.length) {
                this.multiQueryRouteEditRows = buildRouteEditRowsFromRoutes(
                    this.multiQueryRoutes,
                    this.normalizeLlmTermList.bind(this)
                );
                this.searchCriteriaEditRows = normalizedContext
                    ? [{ type: "Research context", term: normalizedContext }]
                    : [];
            } else {
                this.multiQueryRouteEditRows = [];
                this.searchCriteriaEditRows = [
                    { type: "Phenotype terms", term: phen.join(", ") },
                    { type: "Mechanism terms", term: mech.join(", ") },
                    { type: "Genes of interest", term: goi.join(", ") },
                    { type: "Research context", term: normalizedContext },
                ];
            }
            this.searchCriteriaEditRowsDefault = JSON.parse(JSON.stringify(this.searchCriteriaEditRows));
            this.multiQueryRouteEditRowsDefault = JSON.parse(JSON.stringify(this.multiQueryRouteEditRows || []));
        },
        toggleRouteTermsEditAccordion(routeId) {
            const key = String(routeId || "");
            this.$set(this.routeTermsEditAccordionOpen, key, !this.routeTermsEditAccordionOpen[key]);
        },
        onRouteEditFieldUpdate({ route, fieldKey, value }) {
            const row = findRouteEditRow(route, this.multiQueryRouteEditRows);
            if (!row || !fieldKey) return;
            this.$set(row, fieldKey, value);
        },
        parseCommaSeparatedTerms(raw) {
            return String(raw || "")
                .split(/[,;\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
        },
        applyRouteEditRowsToMultiQueryRoutes() {
            this.multiQueryRoutes = patchRoutesFromEditRows(
                this.multiQueryRoutes,
                this.multiQueryRouteEditRows
            );
        },
        syncUnionTermsFromMultiQueryRoutes() {
            return syncUnionTermsFromMultiQueryRoutes(this);
        },
        resetSearchCriteriaGateEdits() {
            this.searchCriteriaEditRows = JSON.parse(JSON.stringify(this.searchCriteriaEditRowsDefault || []));
            this.multiQueryRouteEditRows = JSON.parse(JSON.stringify(this.multiQueryRouteEditRowsDefault || []));
        },
        applySearchCriteriaGateEdits() {
            return applySearchCriteriaGateEdits(this);
        },
        normalizeAlternativeQueries(raw) {
            return normalizeAlternativeQueries(raw);
        },
        normalizeExtractionAmbiguity(raw) {
            return normalizeExtractionAmbiguity(raw);
        },
        mergeAlternativeQueries(...lists) {
            return mergeAlternativeQueries(...lists);
        },
        detectAntiAnchorTerms(queryText) {
            return detectAntiAnchorTerms(queryText);
        },
        buildAntiAnchorFallbackAlternatives(options) {
            return buildAntiAnchorFallbackAlternatives(options);
        },
        ensureAntiAnchorWarningMessage(warningMessage, antiAnchorTerms, alternativeQueries) {
            return ensureAntiAnchorWarningMessage(warningMessage, antiAnchorTerms, alternativeQueries);
        },
        onAlternativeQuerySelected(query) {
            const nextQuery = String(query || "").trim();
            if (!nextQuery) return;
            this.userQuery = nextQuery;
            if (this.stepApprovalGateActive && this.stepApprovalGateStepId === WORKFLOW_STEP_IDS.EXTRACTION) {
                this.cancelStepGate(false);
            }
            this.queryParse();
        },
        /**
         * From mechanism diagnostics: fill the main search box and restart the workflow (extraction-first via queryParse).
         */
        applySuggestedOptimizedQuery(text) {
            let q = text != null ? String(text).trim() : "";
            if (!q && this.mechanismDiagnosticAssessment && this.mechanismDiagnosticAssessment.suggested_optimized_query) {
                q = String(this.mechanismDiagnosticAssessment.suggested_optimized_query).trim();
            }
            if (!q) return;
            this.userQuery = q;
            this.showTab = "terms";
            this.queryParse();
            this.$nextTick(() => {
                const bar = this.$refs.workflowQueryBar;
                if (bar && typeof bar.focusQueryInput === "function") {
                    bar.focusQueryInput();
                }
            });
        },
        cancelStepGate(approved = false) {
            const resolver = this.stepApprovalGateResolver;
            this.stepApprovalGateActive = false;
            this.stepApprovalGateStepId = "";
            this.stepApprovalGateMessage = "";
            this.stepApprovalGateResolver = null;
            this.resumeStepsElapsedAfterReview();
            if (typeof resolver === "function") resolver(!!approved);
        },
        isPairIncluded(row) {
            const key = this.getRowKey(row);
            if (!key) return false;
            if (Object.prototype.hasOwnProperty.call(this.pairSelectionOverrides, key)) {
                return !!this.pairSelectionOverrides[key];
            }
            return !!(row && row.included);
        },
        onPairIncludedToggle(row, checked) {
            const key = this.getRowKey(row);
            if (!key) return;
            this.$set(this.pairSelectionOverrides, key, !!checked);
        },
        getDataViewNetworkForAnalyze() {
            const heatmapRef = this.$refs.factorBaseRevealHeatmap;
            const network = heatmapRef && heatmapRef.dataViewNetwork;
            if (network && Array.isArray(network.nodes) && network.nodes.length) {
                return network;
            }
            return { nodes: [], edges: [] };
        },
        onAnalyzeSelectedNodesExplain() {
            if (!(this.heatmapSelectedNodes || []).length) {
                this.setLoadStatus("Select at least one node before explaining.", true);
                return;
            }
            try {
                const network = this.getDataViewNetworkForAnalyze();
                const draft = buildSelectedNodesExplanationDraft(
                    network,
                    this.heatmapSelectedNodes,
                    { context: this.sharedResearchContextTerm || this.userQuery || "" }
                );
                this.selectedNodesExplainEntry = draft;
                this.selectedNodesExplainScope = EXPLAIN_SCOPE.KEY_NODES;
                this.selectedNodesExplainOpen = true;
            } catch (error) {
                this.setLoadStatus(String(error?.message || error) || "Could not start explanation.", true);
            }
        },
        closeSelectedNodesExplain() {
            if (this.selectedNodesExplainLoading) return;
            this.selectedNodesExplainOpen = false;
        },
        onSelectedNodesExplainEntryPatch(patch) {
            if (!this.selectedNodesExplainEntry) return;
            this.selectedNodesExplainEntry = patchExplanationEntry(this.selectedNodesExplainEntry, patch);
        },
        async runSelectedNodesExplanationModal() {
            if (this.selectedNodesExplainLoading || !this.selectedNodesExplainEntry) return;
            this.selectedNodesExplainLoading = true;
            this.selectedNodesExplainEntry = patchExplanationEntry(this.selectedNodesExplainEntry, {
                status: "loading",
                error: "",
            });
            try {
                const { entry } = await runSelectedNodesExplanation({
                    network: this.getDataViewNetworkForAnalyze(),
                    selectedNodes: this.heatmapSelectedNodes,
                    context: this.sharedResearchContextTerm || this.userQuery || "",
                    entry: this.selectedNodesExplainEntry,
                    llmClient: this.llmAnalyze,
                });
                this.selectedNodesExplainEntry = entry;
                const saved = buildSavedSelectedNodesExplanation({
                    entry,
                    selectedNodes: this.heatmapSelectedNodes,
                    context: this.sharedResearchContextTerm || this.userQuery || "",
                });
                if (saved) {
                    this.selectedNodesExplanations = appendSavedSelectedNodesExplanation(
                        this.selectedNodesExplanations,
                        saved
                    );
                }
            } catch (error) {
                this.selectedNodesExplainEntry = patchExplanationEntry(this.selectedNodesExplainEntry, {
                    status: "error",
                    error: String(error?.message || error) || "Explanation failed.",
                });
            } finally {
                this.selectedNodesExplainLoading = false;
            }
        },
        onOpenSavedSelectedNodesExplanation(id) {
            const saved = findSavedSelectedNodesExplanation(this.selectedNodesExplanations, id);
            if (!saved || !saved.entry) return;
            this.selectedNodesExplainEntry = JSON.parse(JSON.stringify(saved.entry));
            this.selectedNodesExplainScope = EXPLAIN_SCOPE.KEY_NODES;
            this.selectedNodesExplainOpen = true;
        },
        async onAnalyzeSelectedNodesProvenance() {
            const geneSetIds = geneSetIdsFromSelectedNodes(this.heatmapSelectedNodes);
            if (!geneSetIds.length) {
                this.setLoadStatus("Select a gene set to find dataset provenance.", true);
                return;
            }
            this.selectedNodesProvenanceGeneSetIds = geneSetIds;
            this.selectedNodesProvenanceItems = geneSetIds.map((geneSetId) => ({
                geneSetId,
                status: "loading",
                nodes: [],
            }));
            this.selectedNodesProvenanceOpen = true;
            await Promise.all(
                geneSetIds.map(async (geneSetId) => {
                    await this.ensureC2m2ProvenanceForGeneSet(geneSetId);
                    const nodes = this.c2m2GeneSetDownloadNodes(geneSetId);
                    const entry = this.c2m2ProvenanceEntry(geneSetId);
                    const status =
                        nodes.length > 0
                            ? "ok"
                            : entry && entry.status === "error"
                              ? "error"
                              : "empty";
                    const idx = this.selectedNodesProvenanceItems.findIndex(
                        (item) => item.geneSetId === geneSetId
                    );
                    if (idx < 0) return;
                    this.$set(this.selectedNodesProvenanceItems, idx, {
                        geneSetId,
                        status,
                        nodes,
                    });
                })
            );
            const saved = buildSavedSelectedNodesProvenanceRun({
                geneSetIds,
                items: this.selectedNodesProvenanceItems,
                selectedNodes: this.heatmapSelectedNodes,
            });
            if (saved) {
                this.selectedNodesProvenanceRuns = appendSavedSelectedNodesProvenanceRun(
                    this.selectedNodesProvenanceRuns,
                    saved
                );
            }
        },
        onOpenSavedSelectedNodesProvenance(id) {
            const saved = findSavedSelectedNodesProvenanceRun(this.selectedNodesProvenanceRuns, id);
            if (!saved) return;
            this.selectedNodesProvenanceGeneSetIds = [...(saved.geneSetIds || [])];
            this.selectedNodesProvenanceItems = JSON.parse(JSON.stringify(saved.items || []));
            this.selectedNodesProvenanceOpen = true;
        },
        snapshotFilteredSelectionBaseline() {
            const currentRows = this.factorDataTableRows || [];
            const nextOverrides = {};
            const baseline = [];
            currentRows.forEach((r) => {
                const key = this.getRowKey(r);
                if (!key) return;
                const included = !!r.included;
                nextOverrides[key] = included;
                if (included) baseline.push(key);
            });
            this.pairSelectionOverrides = nextOverrides;
            this.llmFilteredPairKeysBaseline = baseline;
        },
        normalizeHeatmapSelectionAfterRegroup() {
            this.$nextTick(() => {
                const ref = this.$refs.factorBaseRevealHeatmap;
                const comp = Array.isArray(ref) ? ref[0] : ref;
                if (!comp) return;
                const opts = Array.isArray(comp.phenotypeOptions) ? comp.phenotypeOptions : [];
                if (!opts.length) {
                    comp.selectedPhenotype = "";
                    return;
                }
                if (!opts.some((o) => o && o.value === comp.selectedPhenotype)) {
                    comp.selectedPhenotype = opts[0].value;
                }
            });
        },
        buildSelectedFactorDataFromRows(rows) {
            const subset = {};
            (rows || []).forEach((row) => {
                const phenotype = row && row.phenotype != null ? String(row.phenotype).trim() : "";
                if (!phenotype) return;
                const pData = this.factorData && this.factorData[phenotype];
                if (!pData) return;
                const factors = pData.factors || [];
                const allFactors = pData.allFactors || [];
                const factorItem =
                    factors.find((x) => x.factor === row.factor || String(x.factor) === String(row.factor)) ||
                    allFactors.find((x) => x.factor === row.factor || String(x.factor) === String(row.factor));
                if (!factorItem) return;
                if (!subset[phenotype]) subset[phenotype] = { genes: {}, factors: [] };
                if (!subset[phenotype].factors.some((f) => String(f.factor) === String(factorItem.factor))) {
                    subset[phenotype].factors.push(JSON.parse(JSON.stringify(factorItem)));
                }
                Object.keys(factorItem.genes || {}).forEach((g) => {
                    if (pData.genes && pData.genes[g] != null && subset[phenotype].genes[g] == null) {
                        subset[phenotype].genes[g] = JSON.parse(JSON.stringify(pData.genes[g]));
                    }
                });
            });
            return subset;
        },
        globalStepIndexForStep(step) {
            return (this.steps || []).findIndex((s) => s === step);
        },
        dataStepShowsSpinner(step) {
            const idx = this.globalStepIndexForStep(step);
            if (idx < 0) return false;
            return idx === this.steps.length - 1 && !this.loadComplete && !this.stepApprovalGateActive;
        },
        dataStepShowsGatePause(step) {
            const idx = this.globalStepIndexForStep(step);
            if (idx < 0) return false;
            return idx === this.steps.length - 1 && !this.loadComplete && this.stepApprovalGateActive;
        },
        approveStepGate() {
            if (!this.stepApprovalGateActive) return;
            const gateStepId = this.stepApprovalGateStepId;
            if (this.stepApprovalGateStepId === WORKFLOW_STEP_IDS.EXTRACTION) {
                this.applySearchCriteriaGateEdits();
                this.searchCriteriaExtractionGateDone = true;
                this.switchRevealTab("data");
                if (this.importedWorkflowPendingResearchRun) {
                    this.importedWorkflowPendingResearchRun = false;
                    this.$nextTick(() => {
                        if (!this.workflowRunIdStale(this.workflowRunId)) {
                            this.onResearch();
                        }
                    });
                }
            } else if (gateStepId === WORKFLOW_STEP_IDS.DATA) {
                if (this.isGeneSetEntryMode) {
                    this.syncGeneSetEntryResearchIntentionToSession();
                }
                if (this.searchPath === "genes") {
                    const preview = buildGeneSetEntryLlmFeed(this.factorData, {
                        scopeMode: this.geneSetEntryLlmFeedScope || GENE_SET_ENTRY_LLM_FEED_SCOPE.VISUALIZER,
                        selectedNodes: this.heatmapSelectedNodes || [],
                        viewFilters: this.heatmapViewFilters || {},
                        inputGenes:
                            this.geneSetEntry && Array.isArray(this.geneSetEntry.inputGenes)
                                ? this.geneSetEntry.inputGenes
                                : [],
                    });
                    if (!preview.feed) {
                        this.setLoadStatus(preview.emptyReason || "No evidence in the chosen LLM scope.", true);
                        return;
                    }
                }
                this.revealResultsTabUnlocked = true;
                this.switchRevealTab("results");
                if (this.importedWorkflowPendingHypothesisRun) {
                    this.importedWorkflowPendingHypothesisRun = false;
                    this.resumeImportedWorkflowAfterDataGate();
                }
            }
            const stepIdx = this.steps.findIndex((s) => s && s.id === gateStepId);
            if (stepIdx !== -1) {
                this.$set(this.steps[stepIdx], "expanded", false);
                const substeps = this.steps[stepIdx].substeps || [];
                substeps.forEach((_, subIdx) => {
                    this.$set(this.steps[stepIdx].substeps[subIdx], "expanded", false);
                });
            }
            this.cancelStepGate(true);
            this.setLoadStatus("Continuing workflow…");
        },
        switchRevealTab(tabName) {
            const nextTab = String(tabName || "").trim();
            if (!nextTab || this.showTab === nextTab) return;
            if (nextTab === "data" && this.isMechanismHypothesisLoading) return;
            const x = typeof window !== "undefined" ? window.scrollX : 0;
            const y = typeof window !== "undefined" ? window.scrollY : 0;
            this.showTab = nextTab;
            this.$nextTick(() => {
                if (typeof window !== "undefined") {
                    window.scrollTo(x, y);
                }
            });
        },
        toggleStep(i, ii=null){
            if(ii !== null){
                this.steps[i].substeps[ii].expanded = !this.steps[i].substeps[ii].expanded
            }else{
                this.steps[i].expanded = !this.steps[i].expanded
            }
        },
        toggleStatus(i) {
            this.statusSteps[i].expanded = !this.statusSteps[i].expanded
        },
        /** Return human-readable phenotype for display; use phenotype id for queries. Does not mutate stored data. */
        getPhenotypeDisplay(phenotypeId) {
            if (phenotypeId == null) return "";
            const idStr = String(phenotypeId).trim();
            if (!idStr) return "";
            const desc = this.phenotypeDescriptionById && this.phenotypeDescriptionById[phenotypeId];
            if (desc != null && String(desc).trim() !== "") return String(desc).trim();
            const cfdeLabel = resolveCfdePhenotypeLabel(phenotypeId);
            if (cfdeLabel) return String(cfdeLabel);
            return idStr;
        },
        /** Gene set cluster group column: resolve hybrid `label` (stored as factorLabel) via CFDE maps. */
        getFactorClusterDisplay(row) {
            if (!row) return "";
            const key =
                row.factorLabel != null && String(row.factorLabel).trim() !== ""
                    ? String(row.factorLabel).trim()
                    : row.factor != null
                      ? String(row.factor).trim()
                      : "";
            return resolveCfdeFactorClusterDisplayLabel(key);
        },
        getFetchDirectionDisplay(row) {
            if (!row) return "Primary search";
            const direction = row.fetched_direction || row.fetchDirection || row.route_category;
            const normalized = String(direction == null ? "" : direction).trim();
            return normalized || "Primary search";
        },
        getGeneSetCountForRow(row) {
            if (!row) return 0;
            return this.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction).length;
        },
        getGeneCountForRow(row) {
            if (!row) return 0;
            return this.getGenesForFactor(row.phenotype, row.factor, row.fetched_direction).length;
        },
        /** Gene-set entry: "search:context" counts for the Number of genes column. */
        getGeneSearchContextCountDisplay(row) {
            const genes = this.getGenesForFactor(
                row && row.phenotype,
                row && row.factor,
                row && row.fetched_direction
            );
            let search = 0;
            let context = 0;
            genes.forEach((g) => {
                if (g && g.userRequested === "Yes") search += 1;
                else context += 1;
            });
            return `${search}:${context}`;
        },
        /** Pills / KG strings: same resolution as table (Orphanet_*, gcat_*, etc.). */
        getFactorClusterDisplayString(raw) {
            return resolveCfdeFactorClusterDisplayLabel(raw);
        },
        /**
         * Gene-set path: show factorization cluster label (e.g. HP_ARTERIOSCLEROSIS) for FactorN ids.
         * Falls back to CFDE display resolution / raw id.
         */
        getGeneSetFactorDisplayLabel(factorId) {
            const id = factorId != null ? String(factorId).trim() : "";
            if (!id) return "—";
            const data = this.factorData || {};
            const pickLabel = (factorObj) => {
                if (!factorObj || typeof factorObj !== "object") return "";
                const raw =
                    factorObj.label != null && String(factorObj.label).trim()
                        ? String(factorObj.label).trim()
                        : factorObj.factorLabel != null && String(factorObj.factorLabel).trim()
                          ? String(factorObj.factorLabel).trim()
                          : factorObj.labelFromApi != null && String(factorObj.labelFromApi).trim()
                            ? String(factorObj.labelFromApi).trim()
                            : "";
                return raw;
            };
            const direct = data[id];
            if (direct) {
                const factors = [
                    ...(Array.isArray(direct.factors) ? direct.factors : []),
                    ...(Array.isArray(direct.allFactors) ? direct.allFactors : []),
                ];
                const hit =
                    factors.find((f) => f && String(f.factor || "").trim() === id) || factors[0] || null;
                const label = pickLabel(hit);
                if (label) {
                    return resolveCfdeFactorClusterDisplayLabel(label) || label;
                }
            }
            for (const key of Object.keys(data)) {
                const bucket = data[key];
                if (!bucket) continue;
                const factors = [
                    ...(Array.isArray(bucket.factors) ? bucket.factors : []),
                    ...(Array.isArray(bucket.allFactors) ? bucket.allFactors : []),
                ];
                const hit = factors.find((f) => f && String(f.factor || "").trim() === id);
                const label = pickLabel(hit);
                if (label) {
                    return resolveCfdeFactorClusterDisplayLabel(label) || label;
                }
            }
            return this.getFactorClusterDisplayString(id) || id;
        },
        /** Whether a candidate gene is in the gene-set search / input gene list. */
        isGeneInSearchSet(geneRow) {
            if (!geneRow || typeof geneRow !== "object") return null;
            if (typeof geneRow.is_input === "boolean") return geneRow.is_input;
            const sym =
                geneRow.gene != null
                    ? String(geneRow.gene).trim().toUpperCase()
                    : geneRow.symbol != null
                      ? String(geneRow.symbol).trim().toUpperCase()
                      : "";
            if (!sym) return null;
            const inputs =
                this.geneSetEntry && Array.isArray(this.geneSetEntry.inputGenes)
                    ? this.geneSetEntry.inputGenes
                    : [];
            if (!inputs.length) return null;
            return inputs.some((g) => String(g || "").trim().toUpperCase() === sym);
        },
        /** Comma-separated list of phenotype descriptions for on-screen report. */
        getRelevantPhenotypesDisplay(phenotypeIds) {
            if (!Array.isArray(phenotypeIds) || !phenotypeIds.length) return [];
            return phenotypeIds.map((id) => this.getPhenotypeDisplay(id));
        },
        /** Query anchor tokens for report phenotype filtering (phenotype/mechanism terms + user question). */
        buildReportQueryAnchorTokens() {
            const tokens = new Set();
            const addText = (text) => {
                String(text || "")
                    .toLowerCase()
                    .split(/[^a-z0-9]+/)
                    .forEach((t) => {
                        if (t.length >= 3) tokens.add(t);
                    });
            };
            (this.lastPhenotypeTerms || []).forEach(addText);
            (this.lastMechanismTerms || []).forEach(addText);
            addText(this.userQuery || "");
            return tokens;
        },
        phenotypeMatchesQueryAnchors(phenotypeId, anchorTokens) {
            const tokens =
                anchorTokens instanceof Set ? anchorTokens : this.buildReportQueryAnchorTokens();
            if (!tokens.size) return true;
            const label = this.getPhenotypeDisplay(phenotypeId).toLowerCase();
            const id = String(phenotypeId || "").trim().toLowerCase();
            for (const t of tokens) {
                if (label.includes(t) || id.includes(t)) return true;
            }
            return false;
        },
        /** Phenotype ids from the user's filtered Data tab selection. */
        selectedTablePhenotypeIds() {
            const ids = new Set();
            (this.factorDataTableRowsFiltered || []).forEach((row) => {
                const p = row && row.phenotype != null ? String(row.phenotype).trim() : "";
                if (p) ids.add(p);
            });
            return ids;
        },
        /**
         * Keep report/network phenotypes aligned with user selection and query anchors (Case 3 hub gravity).
         * @param {string[]} rawPhenotypes - Phenotypes inferred from KG supporting rows.
         * @param {Array<{phenotype?: string, factor?: string}>} associatedPairs - LLM associated_pairs.
         */
        filterMechanismReportPhenotypes(rawPhenotypes, associatedPairs) {
            const selectedIds = this.selectedTablePhenotypeIds();
            const fromPairs = new Set(
                (associatedPairs || [])
                    .map((p) => (p && p.phenotype != null ? String(p.phenotype).trim() : ""))
                    .filter(Boolean)
            );
            const anchorTokens = this.buildReportQueryAnchorTokens();
            const raw = (rawPhenotypes || []).map((p) => String(p).trim()).filter(Boolean);
            let filtered = raw.filter((id) => selectedIds.has(id) || fromPairs.has(id));
            if (!filtered.length && raw.length) {
                filtered = raw.filter((id) => this.phenotypeMatchesQueryAnchors(id, anchorTokens));
            }
            if (!filtered.length && selectedIds.size) {
                filtered = [...selectedIds];
            }
            filtered = filtered.filter(
                (id) => selectedIds.has(id) || this.phenotypeMatchesQueryAnchors(id, anchorTokens)
            );
            return [...new Set(filtered)].sort();
        },
        /** Session overview text for Results tab and HTML reports. */
        getReportSessionSummary() {
            if (this.mechanisms_summary != null && String(this.mechanisms_summary).trim() !== "") {
                return String(this.mechanisms_summary).trim();
            }
            const mechanisms = Array.isArray(this.mechanisms) ? this.mechanisms : [];
            if (mechanisms.length) {
                const names = mechanisms
                    .map((m) => (m && m.group_name != null ? String(m.group_name).trim() : ""))
                    .filter(Boolean);
                if (names.length) {
                    const n = mechanisms.length;
                    return `Generated ${n} mechanistic hypothesis${n === 1 ? "" : "es"}: ${names.join("; ")}.`;
                }
            }
            const d = this.mechanismDiagnosticAssessment;
            if (d && d.warning_flag != null && String(d.warning_flag).trim() !== "") {
                return String(d.warning_flag).trim();
            }
            if (d && d.rejection_reason != null && String(d.rejection_reason).trim() !== "") {
                return String(d.rejection_reason).trim();
            }
            const phenos = (this.lastPhenotypeTerms || []).join(", ");
            const genes = (this.lastGenesOfInterest || []).join(", ");
            if (phenos || genes) {
                const catN = this.factorCount || 0;
                const catLabel = catN === 1 ? "data category" : "data categories";
                return `Explored ${phenos || "selected phenotypes"}${genes ? ` with focus on ${genes}` : ""} across ${catN} ${catLabel}.`;
            }
            return "—";
        },
        geneAppearsInFactorRow(row, geneSymbol) {
            if (!row) return false;
            const g = String(geneSymbol || "").trim();
            if (!g) return false;
            const f = this.getFactorForPhenotypeRow(row.phenotype, row.factor, row.fetched_direction);
            return !!(f && f.genes && Object.prototype.hasOwnProperty.call(f.genes, g));
        },
        geneSetsForGeneOnFactorRow(row, geneSymbol) {
            if (!this.geneAppearsInFactorRow(row, geneSymbol)) return [];
            const sets = this.getGenesetForFactor(row.phenotype, row.factor, row.fetched_direction);
            const f = this.getFactorForPhenotypeRow(row.phenotype, row.factor, row.fetched_direction);
            const rel = f && f.genes ? f.genes[geneSymbol] : null;
            const explicitIds = rel && Array.isArray(rel.geneSetIds)
                ? rel.geneSetIds.map((x) => String(x || "").trim()).filter(Boolean)
                : [];
            if (explicitIds.length) {
                return sets.filter((s) => explicitIds.includes(s.geneset)).map((s) => s.geneset);
            }
            return sets.map((s) => s.geneset).filter(Boolean);
        },
        /**
         * Per-gene gene-set links scoped to associated UI rows (phenotype × data category × direction).
         * @param {Object} mechanism
         * @param {Array<{gene?: string}>} candidateGenes
         */
        buildGeneConnectionsFromAssociatedRows(mechanism, candidateGenes) {
            const assocRows = this.getMechanismAssociatedSelectionRows(mechanism);
            const useRows = assocRows.length ? assocRows : (this.factorDataTableRowsFiltered || []);
            const genes = (candidateGenes || [])
                .map((g) => (g && g.gene != null ? String(g.gene).trim() : ""))
                .filter(Boolean);
            const out = {};
            genes.forEach((gene) => {
                const factors = new Set();
                const gene_sets = new Set();
                useRows.forEach((row) => {
                    if (!this.geneAppearsInFactorRow(row, gene)) return;
                    const label = this.getFactorClusterDisplay(row);
                    if (label) factors.add(label);
                    this.geneSetsForGeneOnFactorRow(row, gene).forEach((gs) => gene_sets.add(gs));
                });
                out[gene] = {
                    factors: [...factors].sort(),
                    gene_sets: [...gene_sets].sort(),
                };
            });
            return out;
        },
        getGeneConnectionForMechanism(mechanism, geneName) {
            const g = geneName != null ? String(geneName).trim() : "";
            if (!g || !mechanism || !mechanism.gene_connections) return { factors: [], gene_sets: [] };
            const conn = mechanism.gene_connections[g];
            if (!conn) return { factors: [], gene_sets: [] };
            return {
                factors: Array.isArray(conn.factors) ? conn.factors : [],
                gene_sets: Array.isArray(conn.gene_sets) ? conn.gene_sets : [],
            };
        },
        /**
         * Soft-wrap long gene-set IDs at underscores (ZWSP after `_`). Gene symbols are not passed here.
         */
        formatGeneSetNamesForTableWrap(geneSets) {
            const list = Array.isArray(geneSets) ? geneSets : [];
            if (!list.length) return "—";
            const zwsp = "\u200B";
            return list
                .map((gs) => String(gs == null ? "" : gs).replace(/_/g, `_${zwsp}`))
                .filter(Boolean)
                .join(", ");
        },
        buildCrossRouteCrosstalkFallback(routeBundles) {
            const bundles = Array.isArray(routeBundles) ? routeBundles : [];
            if (bundles.length < 2) return null;
            const lines = bundles.map((b) => {
                const cat =
                    (b && (b.category || b.route_category || b.route_id)) != null
                        ? String(b.category || b.route_category || b.route_id).trim()
                        : "Route";
                const hits = Array.isArray(b.top_hits)
                    ? b.top_hits
                          .slice(0, 5)
                          .map((h) => (h && (h.gene || h.symbol)) != null ? String(h.gene || h.symbol).trim() : "")
                          .filter(Boolean)
                    : [];
                return `${cat}: ${hits.length ? hits.join(", ") : "no top hits listed"}`;
            });
            return `Multi-direction retrieval compared ${bundles.length} routes (${lines.join(" | ")}). Treat as a provisional axis comparison—not confirmed causal crosstalk without independent validation.`;
        },
        normalizeCellularAssignment(raw) {
            if (raw == null || typeof raw !== "object") return null;
            const pick = (k) => (raw[k] != null && String(raw[k]).trim() !== "" ? String(raw[k]).trim() : null);
            const out = {
                producer: pick("producer"),
                matrix_builder: pick("matrix_builder"),
                metabolic_target: pick("metabolic_target"),
                confidence: pick("confidence"),
                caveat: pick("caveat"),
            };
            return Object.values(out).some(Boolean) ? out : null;
        },
        normalizeDepotContrast(raw) {
            if (raw == null || typeof raw !== "object") return null;
            const pick = (k) => (raw[k] != null && String(raw[k]).trim() !== "" ? String(raw[k]).trim() : null);
            const out = {
                subcutaneous: pick("subcutaneous"),
                visceral: pick("visceral"),
                comparison: pick("comparison"),
                evidence_basis: pick("evidence_basis"),
            };
            return Object.values(out).some(Boolean) ? out : null;
        },
        normalizeEffectDirectionNotes(raw) {
            if (!Array.isArray(raw)) return [];
            return raw
                .map((entry) => {
                    if (entry == null || typeof entry !== "object") return null;
                    const gene = entry.gene != null ? String(entry.gene).trim() : "";
                    if (!gene) return null;
                    const direction =
                        entry.direction != null && String(entry.direction).trim() !== ""
                            ? String(entry.direction).trim()
                            : entry.effect != null && String(entry.effect).trim() !== ""
                              ? String(entry.effect).trim()
                              : "unknown";
                    const note =
                        entry.note != null && String(entry.note).trim() !== ""
                            ? String(entry.note).trim()
                            : null;
                    return { gene, direction, note };
                })
                .filter(Boolean);
        },
        formatCellularAssignmentDisplay(ca) {
            if (!ca || typeof ca !== "object") return "";
            const parts = [];
            if (ca.producer) parts.push(`Producer: ${ca.producer}`);
            if (ca.matrix_builder) parts.push(`Matrix builder: ${ca.matrix_builder}`);
            if (ca.metabolic_target) parts.push(`Metabolic target: ${ca.metabolic_target}`);
            if (ca.confidence) parts.push(`Confidence: ${ca.confidence}`);
            if (ca.caveat) parts.push(`Caveat: ${ca.caveat}`);
            return parts.join(" · ");
        },
        formatDepotContrastDisplay(dc) {
            if (!dc || typeof dc !== "object") return "";
            const parts = [];
            if (dc.subcutaneous) parts.push(`Subcutaneous: ${dc.subcutaneous}`);
            if (dc.visceral) parts.push(`Visceral: ${dc.visceral}`);
            if (dc.comparison) parts.push(`Comparison: ${dc.comparison}`);
            if (dc.evidence_basis) parts.push(`Evidence: ${dc.evidence_basis}`);
            return parts.join(" · ");
        },
        /** Format relevant gene sets for display: "id (description)" when description exists. */
        formatRelevantGeneSetsForDisplay(geneSetIds) {
            if (!Array.isArray(geneSetIds) || !geneSetIds.length) return "";
            const infoMap = this.buildGeneSetInfoMap();
            return geneSetIds.map((gs) => {
                const info = infoMap[gs];
                const desc = (info.description != null && String(info.description).trim() !== "") ? String(info.description).trim() : "";
                const program = (info.gene_set_program != null && String(info.gene_set_program).trim() !== "") ? String(info.gene_set_program).trim() : "";
                const geneSet = {};
                geneSet.gs = gs;
                if (desc) geneSet.desc = desc;
                if (program) geneSet.program = program;
                return geneSet;
            })
            /*
            return geneSetIds.map((gs) => {
                const info = infoMap[gs];
                if (!info) return gs;
                const desc = (info.description != null && String(info.description).trim() !== "") ? String(info.description).trim() : "";
                const program = (info.gene_set_program != null && String(info.gene_set_program).trim() !== "") ? String(info.gene_set_program).trim() : "";
                if (desc && program) return `${gs} (${desc}, ${program})`;
                if (desc) return `${gs} (${desc})`;
                if (program) return `${gs} (${program})`;
                return gs;
            }).join(", ");
            */
        },
        /**
         * Build a map from gene set id to { description, gene_set_program } using factorData.
         * @returns {{ [geneSetId: string]: { description: string, gene_set_program: string } }}
         */
        buildGeneSetInfoMap() {
            const map = {};
            const data = this.factorData || {};
            Object.keys(data).forEach((phenotype) => {
                const factors = data[phenotype] && data[phenotype].factors || [];
                factors.forEach((f) => {
                    const ids = (typeof f.top_gene_sets === "string" && f.top_gene_sets)
                        ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                        : [];
                    const descs = (typeof f.gene_set_description === "string" && f.gene_set_description)
                        ? f.gene_set_description.split(/\s*\|\s*/).map((s) => s.trim())
                        : [];
                    const programs = (typeof f.gene_set_program === "string" && f.gene_set_program)
                        ? f.gene_set_program.split(/\s*\|\s*/).map((s) => s.trim())
                        : [];
                    ids.forEach((id, i) => {
                        if (!id) return;
                        if (!map[id]) {
                            map[id] = { description: descs[i] != null ? descs[i] : "", gene_set_program: programs[i] != null ? programs[i] : "" };
                        } else {
                            if ((descs[i] != null && descs[i] !== "") && !map[id].description) map[id].description = descs[i];
                            if ((programs[i] != null && programs[i] !== "") && !map[id].gene_set_program) map[id].gene_set_program = programs[i];
                        }
                    });
                });
            });
            return map;
        },
        /**
         * Build a map from gene set id to description using factorData (top_gene_sets and gene_set_description per factor).
         * @returns {{ [geneSetId: string]: string }}
         */
        buildGeneSetDescriptionMap() {
            const infoMap = this.buildGeneSetInfoMap();
            const map = {};
            Object.keys(infoMap).forEach((id) => { map[id] = infoMap[id].description || ""; });
            return map;
        },
        /** True if factorData[phenotypeKey] lists this gene set on any factor's top_gene_sets. */
        factorDataHasGeneSet(phenotypeKey, geneSetId) {
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            if (!g || !this.factorData || !this.factorData[phenotypeKey]) return false;
            const factors = (this.factorData[phenotypeKey].factors || []);
            return factors.some((f) => {
                const ids = (typeof f.top_gene_sets === "string" && f.top_gene_sets)
                    ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                    : [];
                return ids.includes(g);
            });
        },
        /**
         * Phenotype **id** for Explore associations (not display name). Picks relevant phenotypes whose factor data include this gene set when possible.
         */
        resolvePhenotypeIdForCfdeExploreAssociation(mechanism, geneSetId) {
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            if (!g) return "";
            const rel = Array.isArray(mechanism && mechanism.relevant_phenotypes) ? mechanism.relevant_phenotypes : [];
            if (rel.length === 1) return String(rel[0]);
            for (let i = 0; i < rel.length; i++) {
                const pid = String(rel[i]);
                if (this.factorDataHasGeneSet(pid, g)) return pid;
            }
            const data = this.factorData || {};
            const keys = Object.keys(data);
            for (let i = 0; i < keys.length; i++) {
                if (this.factorDataHasGeneSet(keys[i], g)) return keys[i];
            }
            if (rel.length) return String(rel[0]);
            return keys.length ? keys[0] : "";
        },
        resolveSourceForCfdeExploreGeneSet(geneSetId) {
            const infoMap = this.buildGeneSetInfoMap();
            const id = geneSetId != null ? String(geneSetId).trim() : "";
            const info = id ? infoMap[id] : null;
            const prog = info && info.gene_set_program != null ? String(info.gene_set_program).trim() : "";
            return prog || "cfde";
        },
        /** Research context for CFDE Explore / Design (`researchContext` query param in cfdeExplore.vue). */
        getRevealResearchContextForExplore() {
            if (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values != null) {
                return String(this.searchCriteria[1].values).trim();
            }
            return "";
        },
        /**
         * CFDE Explore: `associations`, optional `hypothesis` + `researchContext` (same names as utilsBox.keyParams in cfdeExplore).
         */
        cfdeExploreAssociationHref(phenotypeId, geneSetId, program, hypothesisOptional) {
            const p = phenotypeId != null ? String(phenotypeId).trim() : "";
            const g = geneSetId != null ? String(geneSetId).trim() : "";
            const s = (program != null && String(program).trim() !== "") ? String(program).trim() : "cfde";
            if (!g) return "#";
            const triple = `${p},${g},${s}`;
            const params = new URLSearchParams();
            params.set("associations", triple);
            const hypothesis = hypothesisOptional != null ? String(hypothesisOptional).trim() : "";
            if (hypothesis) params.set("hypothesis", hypothesis);
            const researchContext = this.getRevealResearchContextForExplore();
            if (researchContext) params.set("researchContext", researchContext);
            return kcURL(`/r/cfde_explore?${params.toString()}`);
        },
        /** Hypothesis-card gene set link; includes mechanism hypothesis when present. */
        cfdeExploreGeneSetHref(mechanism, geneSetId, explicitProgram) {
            const phenotype = this.resolvePhenotypeIdForCfdeExploreAssociation(mechanism, geneSetId);
            const geneSet = geneSetId != null ? String(geneSetId).trim() : "";
            if (!geneSet) return "#";
            const source =
                (explicitProgram != null && String(explicitProgram).trim() !== "")
                    ? String(explicitProgram).trim()
                    : this.resolveSourceForCfdeExploreGeneSet(geneSet);
            const hypothesis = mechanism && mechanism.hypothesis != null ? String(mechanism.hypothesis).trim() : "";
            return this.cfdeExploreAssociationHref(phenotype, geneSet, source, hypothesis);
        },
        isNextStepExperimentalValidation(step) {
            const c = step && step.category != null ? String(step.category).trim().toLowerCase() : "";
            return c === "experimental validation";
        },
        /** Plain text for cfde_design ?constraints= from one next_steps item (no category line). */
        formatExperimentalValidationStepForDesignConstraints(step) {
            if (!step || typeof step !== "object") return "";
            const action = step.action != null ? String(step.action).trim() : "";
            const reason = step.reason != null ? String(step.reason).trim() : "";
            const lines = [];
            if (action) lines.push(`Action: ${action}`);
            if (reason) lines.push(`Reason: ${reason}`);
            return lines.join("\n");
        },
        /**
         * Open DESIGN in a new tab. Pass optional `experimentalValidationStep` to send `constraints` (that step's text).
         */
        openDesignProtocolForMechanism(mechanism, experimentalValidationStep) {
            if (!mechanism || typeof mechanism !== "object") return;

            const researchContext = this.getRevealResearchContextForExplore();
            const hypothesis = mechanism.hypothesis != null ? String(mechanism.hypothesis) : "";
            const genesRaw = Array.isArray(mechanism.candidate_genes) && mechanism.candidate_genes.length
                ? mechanism.candidate_genes
                : (Array.isArray(mechanism.genes) ? mechanism.genes : []);
            const genes = Array.from(
                new Set(
                    genesRaw
                        .map((item) => {
                            if (typeof item === "string") return item.trim();
                            if (item && item.gene != null) return String(item.gene).trim();
                            return "";
                        })
                        .filter(Boolean)
                )
            ).join(",");

            const params = new URLSearchParams();
            params.set("researchContext", researchContext);
            params.set("hypothesis", hypothesis);
            params.set("genes", genes);
            if (
                experimentalValidationStep &&
                this.isNextStepExperimentalValidation(experimentalValidationStep)
            ) {
                const cons = this.formatExperimentalValidationStepForDesignConstraints(
                    experimentalValidationStep
                );
                if (cons) params.set("constraints", cons);
            }

            const designUrl = kcURL(`/r/cfde_design?${params.toString()}`);
            window.open(designUrl, "_blank", "noopener");
        },
        getMechanismTopGenes(mechanism, limit = 10) {
            return getMechanismTopGenes(mechanism, limit);
        },
        buildMechanismClipboardText(mechanism, idx) {
            const researchContext =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values).trim()
                    : "";
            const topGenes = this.getMechanismTopGenes(mechanism, 10);
            return buildMechanismClipboardText(mechanism, idx, researchContext, topGenes, {
                geneSetPath: this.searchPath === "genes",
                formatFactorLabel: (id) => this.getGeneSetFactorDisplayLabel(id),
            });
        },
        isMechanismBiolinkMapped(mechanism) {
            return !!(
                mechanism &&
                mechanism.biolink_map_meta &&
                Number(mechanism.biolink_map_meta.mappedNodeCount || 0) > 0
            );
        },
        hasMechanismBiolinkNetwork(mechanism) {
            return !!(
                mechanism &&
                mechanism.biolink_core_spine_network &&
                Array.isArray(mechanism.biolink_core_spine_network.nodes) &&
                mechanism.biolink_core_spine_network.nodes.length > 0
            );
        },
        isMechanismUsingBiolinkMap(mechanism) {
            return !!(
                mechanism &&
                mechanism.map_view_mode === "biolink" &&
                this.hasMechanismBiolinkNetwork(mechanism)
            );
        },
        cloneNetworkForMapView(net) {
            const n = net || {};
            return {
                ...(n || {}),
                nodes: Array.isArray(n.nodes) ? n.nodes.map((x) => ({ ...x })) : [],
                edges: Array.isArray(n.edges) ? n.edges.map((x) => ({ ...x })) : [],
            };
        },
        setMechanismMapViewMode(idx, mode) {
            if (!Array.isArray(this.mechanisms) || !this.mechanisms[idx]) return;
            const mechanism = this.mechanisms[idx];
            const next = { ...mechanism };
            if (mode === "biolink" && this.hasMechanismBiolinkNetwork(mechanism)) {
                next.map_view_mode = "biolink";
                next.core_spine_network = this.cloneNetworkForMapView(mechanism.biolink_core_spine_network);
            } else {
                const original = mechanism.original_core_spine_network || mechanism.core_spine_network || { nodes: [], edges: [] };
                next.map_view_mode = "original";
                next.core_spine_network = this.cloneNetworkForMapView(original);
            }
            this.$set(this.mechanisms, idx, next);
        },
        normalizeBiolinkLookupLabel(label) {
            return normalizeBiolinkLookupLabel(label);
        },
        classifyBiolinkNodeType(className, fallbackType = "Entity") {
            return classifyBiolinkNodeType(className, fallbackType);
        },
        inferBiolinkPredicate(actionLabel) {
            return inferBiolinkPredicate(actionLabel);
        },
        extractTopHitFromNameResolutionResponse(json, queryLabel) {
            return extractTopHitFromNameResolutionResponse(json, queryLabel);
        },
        async resolveLabelViaNameResolution(label) {
            return resolveLabelViaNameResolution(this, label);
        },
        inferBiolinkClassHintFromCurie(curie) {
            return inferBiolinkClassHintFromCurie(curie);
        },
        pickPrimaryBiolinkType(types) {
            return pickPrimaryBiolinkType(types);
        },
        findNormalizedNodeEntry(normPayload, requestedCurie) {
            return findNormalizedNodeEntry(normPayload, requestedCurie);
        },
        async fetchBiolinkNodeDetails(curies) {
            return fetchBiolinkNodeDetails(this, curies);
        },
        trapiKnowledgeIndicatesEdgeSupport(trapiJson) {
            return trapiKnowledgeIndicatesEdgeSupport(trapiJson);
        },
        trapiCategoriesArray(biolinkClass) {
            return trapiCategoriesArray(biolinkClass);
        },
        isTrapiGeneLikeCategory(biolinkClass) {
            return isTrapiGeneLikeCategory(biolinkClass);
        },
        isTrapiDiseaseLikeCategory(biolinkClass) {
            return isTrapiDiseaseLikeCategory(biolinkClass);
        },
        async trapiRelayPostTrapiMessage(trapiEnvelope) {
            return trapiRelayPostTrapiMessage(this, trapiEnvelope);
        },
        async edgeSupportedByTrapiRelay(subjectId, subjectBiolinkCategory, objectId, objectBiolinkCategory, predicate) {
            return edgeSupportedByTrapiRelay(this, subjectId, subjectBiolinkCategory, objectId, objectBiolinkCategory, predicate);
        },
        edgeEndpointIdsFromMappedNode(node) {
            return edgeEndpointIdsFromMappedNode(node);
        },
        async validateSingleMappedBiolinkEdge(edge, nodeById) {
            return validateSingleMappedBiolinkEdge(this, edge, nodeById);
        },
        async validateBiolinkMappedEdgesViaRelay(mappedNodes, mappedEdges) {
            return validateBiolinkMappedEdgesViaRelay(this, mappedNodes, mappedEdges);
        },
        biolinkEdgeVisualSignature(edges) {
            return biolinkEdgeVisualSignature(edges);
        },
        patchMechanismBiolinkTrapiProgress(idx, edges, mappedNodes, trapiStats) {
            return patchMechanismBiolinkTrapiProgress(this, idx, edges, mappedNodes, trapiStats);
        },
        async runBiolinkTrapiValidationForMechanism(idx, gen) {
            return runBiolinkTrapiValidationForMechanism(this, idx, gen);
        },
        queueBiolinkTrapiValidation(idx, gen) {
            return queueBiolinkTrapiValidation(this, idx, gen);
        },
        async mapMechanismBiolinkPhase1Only(idx) {
            return mapMechanismBiolinkPhase1Only(this, idx);
        },
        async autoMapAllMechanismsToBiolink() {
            return autoMapAllMechanismsToBiolink(this);
        },
        async copyMechanismForLlm(mechanism, idx) {
            const text = this.buildMechanismClipboardText(mechanism, idx);
            try {
                if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                    await navigator.clipboard.writeText(text);
                } else {
                    throw new Error("Clipboard API unavailable");
                }
            } catch (e) {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("readonly", "");
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            this.handoffCopiedMechanismIndex = idx;
            if (this.handoffCopiedResetTimerId != null) clearTimeout(this.handoffCopiedResetTimerId);
            this.handoffCopiedResetTimerId = setTimeout(() => {
                this.handoffCopiedMechanismIndex = null;
                this.handoffCopiedResetTimerId = null;
            }, 1800);
        },
        getMechanismAssociatedSelectionRows(mechanism) {
            const pairs = Array.isArray(mechanism?.associated_pairs) ? mechanism.associated_pairs : [];
            if (!pairs.length) return [];
            const normalize = (s) => String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " ");
            const pairSet = new Set(
                pairs.map((p) => `${normalize(p.phenotype)}|${normalize(p.factor)}`)
            );
            return (this.factorDataTableRowsFiltered || []).filter((r) => {
                const p = normalize(r.phenotype);
                const f1 = normalize(r.factorLabel);
                const f2 = normalize(r.factor);
                return pairSet.has(`${p}|${f1}`) || pairSet.has(`${p}|${f2}`);
            });
        },
        async downloadMechanismHandoffPackage(mechanism, idx) {
            if (!mechanism || typeof mechanism !== "object") return;
            const context =
                (this.searchCriteria && this.searchCriteria[1] && this.searchCriteria[1].values) != null
                    ? String(this.searchCriteria[1].values).trim()
                    : "";
            const supportingNet = mechanism.supporting_network || mechanism.network || { nodes: [], edges: [] };
            const hypothesisNet = mechanism.core_spine_network || { nodes: [], edges: [] };
            const [supportingImage, hypothesisImage] = await Promise.all([
                this.exportNetworkImageFromRef(`mechanismNetwork-${idx}`, supportingNet),
                this.exportNetworkImageFromRef(`mechanismHypothesisMap-${idx}`, hypothesisNet),
            ]);
            const supportIds = Array.isArray(mechanism.supporting_row_ids)
                ? mechanism.supporting_row_ids.map(Number).filter((n) => !Number.isNaN(n))
                : [];
            const supportSet = new Set(supportIds);
            const supportingRows = Array.isArray(this.lastFlattenedKG)
                ? this.lastFlattenedKG.filter((r) => supportSet.has(Number(r.id)))
                : [];
            const assocRows = this.getMechanismAssociatedSelectionRows(mechanism);
            const appendix = this.buildMechanismHandoffAppendixObject({
                idx,
                mechanism,
                researchContext: context,
                supportingNet,
                hypothesisNet,
                supportingRows,
                assocRows,
                supportingImage,
                hypothesisImage,
            });
            const html = this.buildMechanismHandoffHtmlDocument({
                idx,
                mechanism,
                researchContext: context,
                supportingImage,
                hypothesisImage,
                appendix,
            });
            try {
                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const slug = String(mechanism.group_name || `hypothesis-${idx + 1}`)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80);
                a.download = `reveal-handoff-${slug || `hypothesis-${idx + 1}`}-${new Date().toISOString().replace(/[:.]/g, "-")}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch {
            }
        },
        openNetworkPopup(mechanismIndexOrPayload, options = {}) {
            let mechanismIndex = mechanismIndexOrPayload;
            let opts = options && typeof options === "object" ? options : {};
            // Prefer a single payload object so Vue listeners that only forward $event
            // still receive hypothesisMap / index together.
            if (
                mechanismIndexOrPayload != null &&
                typeof mechanismIndexOrPayload === "object" &&
                !Array.isArray(mechanismIndexOrPayload)
            ) {
                const payload = mechanismIndexOrPayload;
                mechanismIndex =
                    payload.index != null
                        ? payload.index
                        : payload.mechanismIndex != null
                          ? payload.mechanismIndex
                          : null;
                opts = payload;
            }
            if (mechanismIndex == null || Number.isNaN(Number(mechanismIndex))) return;
            this.networkPopupMechanismIndex = Number(mechanismIndex);
            this.networkPopupIsHypothesisMap = !!opts.hypothesisMap;
            this.popupNetworkWidth = Math.max(
                400,
                Math.round(
                    typeof window !== "undefined" && window.innerWidth ? window.innerWidth * 0.9 : 960
                )
            );
            this.popupNetworkHeight = Math.max(
                300,
                Math.round(
                    typeof window !== "undefined" && window.innerHeight
                        ? window.innerHeight * 0.9 - 56
                        : 640
                )
            );
        },
        closeNetworkPopup() {
            this.networkPopupMechanismIndex = null;
            this.networkPopupIsHypothesisMap = false;
        },
        openFactorConnectivityPopup(item) {
            if (!item) return;
            const network = this.getFactorConnectivityNetwork(item);
            if (!network || !Array.isArray(network.nodes) || !network.nodes.length) return;
            this.factorConnectivityPopupRow = item;
            this.factorConnectivityPopupNetwork = network;
            this.popupNetworkWidth = Math.max(
                400,
                Math.round((typeof window !== "undefined" && window.innerWidth) ? window.innerWidth * 0.9 : 960)
            );
            this.popupNetworkHeight = Math.max(
                300,
                Math.round((typeof window !== "undefined" && window.innerHeight) ? window.innerHeight * 0.72 : 640)
            );
            this.factorConnectivityPopupOpen = true;
        },
        getRowKey(item) {
            if (!item || item.phenotype == null || item.factor == null) return "";
            const direction = item.fetched_direction || item.fetchDirection || item.route_category || "";
            return `${item.phenotype}|${item.factor}|${direction}`;
        },
        onSubtablePageUpdate({ rowKey, page }) {
            if (!rowKey) return;
            this.$set(this.subtableCurrentPages, rowKey, page);
        },
        getSubtableCurrentPage(item) {
            const key = this.getRowKey(item);
            return (this.subtableCurrentPages || {})[key] || 1;
        },
        getGeneSetSubtableCurrentPage(item) {
            const key = `${this.getRowKey(item)}|gs`;
            return (this.subtableCurrentPages || {})[key] || 1;
        },
        toggleFactorGenesRow(row) {
            if (!row) return;
            const key = this.getRowKey(row.item);
            if (!this.subtableCurrentPages[key]) {
                this.$set(this.subtableCurrentPages, key, 1);
            }
            const gsKey = `${key}|gs`;
            if (!this.subtableCurrentPages[gsKey]) {
                this.$set(this.subtableCurrentPages, gsKey, 1);
            }
            const willExpand = !this.expandedFactorRowKeys[key];
            this.$set(this.expandedFactorRowKeys, key, willExpand);
            if (row.item) {
                this.$set(row.item, "_showDetails", willExpand);
            }
            if (willExpand && row.item && !this.factorConnectivityNetworks[key]) {
                this.$set(this.factorConnectivityNetworks, key, this.buildFactorConnectivityNetwork(row.item));
            }
            if (willExpand && this.getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length === 0) {
                this.loadGenesForOneFactor(row.item.phenotype, row.item.factor, row.item);
            }
        },
        getFactorConnectivityNetwork(item) {
            if (!item) return null;
            const key = this.getRowKey(item);
            return this.factorConnectivityNetworks && this.factorConnectivityNetworks[key]
                ? this.factorConnectivityNetworks[key]
                : null;
        },
        buildFactorConnectivityNetwork(item) {
            return buildFactorConnectivityNetwork(this, item);
        },
        isFactorRowExpanded(item) {
            return !!this.expandedFactorRowKeys[this.getRowKey(item)];
        },
        getFactorForPhenotypeRow(phenotype, factor, fetchedDirection = null) {
            const data = this.factorData || {};
            const pData = data[phenotype];
            if (!pData) return null;
            const factors = pData.factors || [];
            const allFactors = pData.allFactors || [];
            const direction = fetchedDirection != null && String(fetchedDirection).trim() !== ""
                ? String(fetchedDirection).trim()
                : "";
            const matches = (x) => {
                if (!(x.factor === factor || String(x.factor) === String(factor))) return false;
                if (!direction) return true;
                const rowDirection = x.fetched_direction || x.route_category || "";
                return String(rowDirection).trim() === direction;
            };
            return factors.find(matches) || allFactors.find(matches) || null;
        },
        getGenesetForFactor(phenotype, factor, fetchedDirection = null){
            if (this.isGeneSetEntryMode && !this.normalizedHeatmapViewFilters.showGeneSets) {
                return [];
            }
            const f = this.getFactorForPhenotypeRow(phenotype, factor, fetchedDirection);
            if (!f) return [];
            const topGeneSetsStr = f.top_gene_sets;
            const topGeneSetProgramsStr = f.gene_set_program;
            const topGeneSets = (typeof topGeneSetsStr === "string" && topGeneSetsStr)
                ? topGeneSetsStr.split(";").map((s) => s.trim()).filter(Boolean)
                : [];
            const topGeneSetPrograms = (typeof topGeneSetProgramsStr === "string" && topGeneSetProgramsStr)
                ? topGeneSetProgramsStr.split("|").map((s) => s.trim()).filter(Boolean)
                : [];
            const geneSetsMeta = f.geneSets || {};
            let result = topGeneSets.map((g, i) => {
                const meta = geneSetsMeta[g] || {};
                const rawFv = meta.factor_value;
                const fvNum =
                    rawFv != null && rawFv !== "" && !isNaN(Number(rawFv)) ? Number(rawFv) : null;
                const pRaw = meta.p_value;
                const pNum =
                    pRaw != null && pRaw !== "" && !isNaN(Number(pRaw)) ? Number(pRaw) : null;
                return {
                    geneset: g,
                    program: topGeneSetPrograms[i],
                    factor_value: fvNum != null ? Number(fvNum.toFixed(3)) : null,
                    factor_value_display: fvNum != null ? fvNum.toFixed(3) : "—",
                    p_value: pNum,
                    p_value_display:
                        pNum == null
                            ? "—"
                            : pNum > 0 && pNum < 0.001
                              ? pNum.toExponential(2)
                              : pNum != null
                                ? pNum.toFixed(3)
                                : "—",
                    _sortAbs: fvNum != null ? Math.abs(fvNum) : -1,
                };
            });
            if (
                this.isGeneSetEntryMode &&
                this.normalizedHeatmapViewFilters.onlySelected &&
                (this.heatmapSelectedNodes || []).length
            ) {
                const selected = this.heatmapSelectedNodes;
                const hasColSel = selected.some(
                    (n) =>
                        n &&
                        (n.kind === "gene-set" || n.kind === "gene" || n.kind === "crossing")
                );
                if (hasColSel) {
                    result = result.filter((row) =>
                        isHeatmapColHighlighted(row.geneset, 0, 1, selected)
                    );
                }
            }
            result.sort((a, b) => b._sortAbs - a._sortAbs);
            return result.map(({ _sortAbs, ...row }) => row);
        },
        getGenesForFactor(phenotype, factor, fetchedDirection = null) {
            const vf = this.normalizedHeatmapViewFilters;
            if (this.isGeneSetEntryMode && !vf.genesInSearchOnly && !vf.showGenes) {
                return [];
            }
            const data = this.factorData || {};
            const pData = data[phenotype];
            if (!pData) return [];
            const f = this.getFactorForPhenotypeRow(phenotype, factor, fetchedDirection);
            if (!f || !f.genes) return [];
            const globalGenes = pData.genes || {};
            const geneSetPath = this.isGeneSetEntryMode;
            let rows = Object.keys(f.genes).map((geneName) => {
                const rel = f.genes[geneName];
                const global = globalGenes[geneName] || {};
                const rawVal = rel.factor_value ?? rel.factorRelevance;
                const fvNum =
                    rawVal != null && rawVal !== "" && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
                const factorValueDisplay = fvNum != null ? fvNum.toFixed(3) : "—";
                const pinned = rel.includedFromRequest === true;
                const geneScoreRaw =
                    rel.gene_score != null && !isNaN(Number(rel.gene_score))
                        ? Number(rel.gene_score)
                        : global.gene_score != null && !isNaN(Number(global.gene_score))
                          ? Number(global.gene_score)
                          : null;
                const combinedNum = global.combined != null && !isNaN(Number(global.combined))
                    ? Number(global.combined)
                    : fvNum;
                if (!geneSetPath && !associationTierPasses(combinedNum, this.phenotypeAssociationFilters)) {
                    return null;
                }
                return {
                    gene: geneName,
                    userRequested: pinned ? "Yes" : "—",
                    inSearch: pinned,
                    factor_value: fvNum != null ? Number(fvNum.toFixed(3)) : null,
                    factor_value_display: factorValueDisplay,
                    factorRelevance: factorValueDisplay,
                    gene_score: geneScoreRaw,
                    gene_score_display:
                        geneScoreRaw != null ? Number(geneScoreRaw).toFixed(3) : "—",
                    combined: global.combined != null ? Number(global.combined).toFixed(2) : "—",
                    gwasSupport: global.gwasSupport != null ? Number(global.gwasSupport).toFixed(2) : "—",
                    geneSetSupport: global.geneSetSupport != null ? Number(global.geneSetSupport).toFixed(2) : "—",
                    _sortPin: pinned ? 1 : 0,
                    _sortAbs: fvNum != null ? Math.abs(fvNum) : 0,
                };
            }).filter(Boolean);
            if (geneSetPath && vf.genesInSearchOnly) {
                rows = rows.filter((r) => r.inSearch);
            }
            if (
                geneSetPath &&
                vf.onlySelected &&
                (this.heatmapSelectedNodes || []).length
            ) {
                const selected = this.heatmapSelectedNodes;
                const hasColSel = selected.some(
                    (n) =>
                        n &&
                        (n.kind === "gene-set" || n.kind === "gene" || n.kind === "crossing")
                );
                if (hasColSel) {
                    rows = rows.filter((r) => isHeatmapColHighlighted(r.gene, 1, 0, selected));
                }
            }
            rows.sort((a, b) => {
                if (geneSetPath) return b._sortAbs - a._sortAbs;
                if (b._sortPin !== a._sortPin) return b._sortPin - a._sortPin;
                return b._sortAbs - a._sortAbs;
            });
            return rows.map((r) => ({
                gene: r.gene,
                userRequested: r.userRequested,
                inSearch: r.inSearch,
                factor_value: r.factor_value,
                factor_value_display: r.factor_value_display,
                factorRelevance: r.factorRelevance,
                gene_score: r.gene_score,
                gene_score_display: r.gene_score_display,
                combined: r.combined,
                gwasSupport: r.gwasSupport,
                geneSetSupport: r.geneSetSupport,
            }));
        },
        /**
         * Ensure row expansion state for a single (phenotype, factor) without extra API loading.
         * Hybrid retrieval already provides factor, gene set, and gene payloads.
         */
        async loadGenesForOneFactor(phenotype, factorId, rowMeta = null) {
            const key = this.getRowKey({ phenotype, factor: factorId });
            if (this.loadingGenesForFactor && this.loadingGenesForFactor[key]) return;
            if (!this.factorData) this.factorData = {};
            if (!this.factorData[phenotype]) {
                this.$set(this.factorData, phenotype, { genes: {}, factors: [], allFactors: [] });
            }
            const pData = this.factorData[phenotype];
            const factors = pData.factors || [];
            const allFactors = pData.allFactors || [];
            let factorItem = factors.find((x) => x.factor === factorId || String(x.factor) === String(factorId))
                || allFactors.find((x) => x.factor === factorId || String(x.factor) === String(factorId));
            if (!factorItem && rowMeta) {
                if (!pData.allFactors) this.$set(pData, "allFactors", []);
                factorItem = {
                    factor: factorId,
                    label:
                        rowMeta.factorLabel != null && String(rowMeta.factorLabel).trim() !== ""
                            ? String(rowMeta.factorLabel).trim()
                            : String(factorId),
                    labelFromApi:
                        rowMeta.factorLabelFromApi != null && String(rowMeta.factorLabelFromApi).trim() !== ""
                            ? String(rowMeta.factorLabelFromApi).trim()
                            : null,
                    top_gene_sets: "",
                    gene_set_description: "",
                    gene_set_program: "",
                    genes: {},
                    geneSets: {},
                };
                pData.allFactors.push(factorItem);
            }
            if (!factorItem) return;
            if (!factorItem.genes) this.$set(factorItem, "genes", {});
            if (!factorItem.geneSets) this.$set(factorItem, "geneSets", {});
            this.$set(this.loadingGenesForFactor, key, true);
            try {
                return;
            } finally {
                this.$set(this.loadingGenesForFactor, key, false);
            }
        },
        async queryParse() {
            const q = String(this.userQuery || "").trim();
            if (!q) return;
            if (this.stepApprovalGateActive) {
                this.cancelStepGate(false);
            }
            this.bumpWorkflowRunId();
            this.abortWorkflowClients();

            // Gene set: require Reveal → write ?genes= and run gene-set entry to Data.
            // URL ?genes= on load still auto-runs without Reveal (see mounted).
            if (this.searchPath === "genes") {
                const genes = parseGenesParam(this, q);
                if (!genes.length) {
                    this.setLoadStatus("Enter one or more gene symbols separated by commas.", true);
                    return;
                }
                this.resetWorkflowStateForNewRun();
                this.searchPath = "genes";
                this.userQuery = genes.join(", ");
                this.placeholderRotationPaused = true;
                this.geneSetEntryProgressDismissed = false;
                if (keyParams && typeof keyParams.set === "function") {
                    keyParams.set({
                        genes: genes.join(","),
                        query: null,
                        geneSetEntryFail: null,
                    });
                }
                await runGeneSetEntryWorkflow(this, genes.join(","));
                return;
            }

            this.resetWorkflowStateForNewRun();
            this.searchPath = "query";
            this.userQuery = q;
            if (keyParams && typeof keyParams.set === "function") {
                keyParams.set({
                    query: q,
                    genes: null,
                    geneSetEntryFail: null,
                });
            }
            this.beginFlow();
        },
        bumpWorkflowRunId() {
            this.workflowRunId = (this.workflowRunId || 0) + 1;
        },
        workflowRunIdStale(runId) {
            return runId !== this.workflowRunId;
        },
        abortWorkflowClients() {
            try {
                if (this.llmExtract && typeof this.llmExtract.abort === "function") {
                    this.llmExtract.abort();
                }
            } catch (e) {
                /* ignore */
            }
            try {
                if (this.llmAnalyze && typeof this.llmAnalyze.abort === "function") {
                    this.llmAnalyze.abort();
                }
            } catch (e) {
                /* ignore */
            }
            this.loading_search_criteria = false;
        },
        beginFlow() {
            beginExtractionFlow(this);
        },
        parseLLMResponse(rawString) {
            const result = parseLlmJsonResponse(rawString);
            if (!result.ok) {
                this.setStep({
                    type: "error",
                    title: "Malformed response from LLM",
                });
                return null;
            }
            return result.json;
        },
        async onExtractResponse(response) {
            return processExtractionResponse(this, response);
        },
        onExtractError(err) {
            reportExtractionError(this, err);
        },
        onExtractEnd() {
            this.loading_search_criteria = false;
        },
        onExtractState(/* state */) {},
        editSearchCriteria() {
            this.prev_search_criteria = JSON.parse(JSON.stringify(this.searchCriteria));
            this.edit_search_criteria = true;
        },
        cancelEditSearchCriteria() {
            this.edit_search_criteria = false;
            this.searchCriteria = JSON.parse(JSON.stringify(this.prev_search_criteria));
        },
        saveSearchCriteria() {
            this.edit_search_criteria = false;
            const terms = this.searchCriteria[0].values;
            this.searchTerm = Array.isArray(terms) ? terms.join(", ") : String(terms);
        },
        removeSearchTerm(term) {
            if (!this.edit_search_criteria || !this.searchCriteria || !this.searchCriteria[0]) return;
            const idx = this.searchCriteria[0].values.indexOf(term);
            if (idx !== -1) this.searchCriteria[0].values.splice(idx, 1);
        },
        addSearchTerm(event) {
            if (!this.edit_search_criteria || !this.searchCriteria || !this.searchCriteria[0]) return;
            const val = event.target && event.target.value ? event.target.value.trim() : "";
            if (val) {
                this.searchCriteria[0].values.push(val);
            }
            if (event.target) {
                event.target.value = "";
                event.target.blur();
            }
        },
        buildHybridQueryText(opts) {
            return buildHybridQueryText(opts);
        },
        /**
         * LLM may return null, a string (comma-separated), or an array for term fields.
         */
        normalizeLlmTermList(raw) {
            return normalizeLlmTermList(raw);
        },
        inferExplicitUserGenes(genesOfInterest = []) {
            return inferExplicitUserGenes(this.userQuery, genesOfInterest);
        },
        routingDerivedGenes() {
            const explicit = new Set((this.lastExplicitUserGenes || []).map((g) => String(g).toUpperCase()));
            return (this.lastGenesOfInterest || []).filter((g) => !explicit.has(String(g).toUpperCase()));
        },
        reportGeneAnchorRows() {
            return `
                <tr><th>Genes explicitly named by user</th><td>${this.escapeHtml((this.lastExplicitUserGenes || []).join(", ") || "—")}</td></tr>
                <tr><th>Additional gene anchors introduced by routing</th><td>${this.escapeHtml(this.routingDerivedGenes().join(", ") || "—")}</td></tr>
            `;
        },
        sanitizeEmbeddingText(text) {
            return sanitizeHybridEmbeddingText(text);
        },
        normalizeRouteCategory(category, index = 0) {
            return normalizeRouteCategory(category, index);
        },
        normalizeMultiQueryRoutes(rawRoutes, fallbackJson = {}) {
            return normalizeMultiQueryRoutes(rawRoutes, fallbackJson, {
                maxRoutes: this.multiQueryEvidenceLimits.maxRoutes,
                userQuery: this.userQuery,
            });
        },
        getRouteConstraintSpec(category) {
            return getRouteConstraintSpec(category);
        },
        isConstraintValidationError(err) {
            return isHybridConstraintValidationError(err);
        },
        resolveHybridPhenotypeFilterTerms(phenotypeTerms, mechanismTerms, researchContext) {
            return resolveHybridPhenotypeTerms(
                phenotypeTerms,
                mechanismTerms,
                researchContext,
                this.userQuery
            );
        },
        resolveMultiRouteHybridPhenotypeFilterTerms(route, topLevelPhenotypeTerms = []) {
            return resolveMultiRoutePhenotypeTerms(route, topLevelPhenotypeTerms);
        },
        routeGenesOfInterestForFetch(route) {
            return genesOfInterestForRouteFetch(route, this.lastExplicitUserGenes);
        },
        routeResearchContextForFetch(route, sharedResearchContext = "") {
            return researchContextForRouteFetch(route, sharedResearchContext);
        },
        /**
         * Server rule: need query_embedding OR non-empty mechanism_terms OR non-whitespace research_context
         * (phenotype_terms alone is not enough without embedding when server-side embedding is off).
         */
        prepareHybridSearchRequestFields(phenotypeTerms, mechanismTerms, researchContext, queryEmbedding) {
            const useClient = !!this.hybridSearchUseClientEmbedding;
            return prepareHybridSearchRequestFields(
                phenotypeTerms,
                mechanismTerms,
                researchContext,
                useClient ? queryEmbedding : null
            );
        },
        buildHybridSearchRequestBody(
            phenotypeTerms,
            mechanismTerms,
            researchContext,
            queryEmbedding,
            genesOfInterest = null,
            constraintSpec = null
        ) {
            return composeHybridSearchRequestBody({
                phenotypeTerms,
                mechanismTerms,
                researchContext,
                queryEmbedding,
                genesOfInterest: genesOfInterest != null ? genesOfInterest : this.lastGenesOfInterest,
                constraintSpec,
                useClientEmbedding: !!this.hybridSearchUseClientEmbedding,
            });
        },
        async fetchWithTimeout(url, options = {}, timeoutMs) {
            return fetchUrlWithTimeout(url, options, timeoutMs != null ? timeoutMs : this.hybridSearchTimeoutMs);
        },
        hybridSearchErrorMessage(status, json) {
            return formatHybridSearchErrorMessage(status, json);
        },
        async fetchHybridQueryEmbedding(queryText) {
            return fetchClientHybridEmbedding(this, queryText);
        },
        async callHybridRevealSearch(params) {
            return postHybridRevealSearch(this, params);
        },
        normalizeHybridFactorsToFactorData(hybridJson, phenotypeTerms = []) {
            return mapHybridFactorsToFactorData(hybridJson, phenotypeTerms);
        },
        async runHybridRetrievalWorkflow(options = {}) {
            return orchestrateHybridRetrieval(this, options);
        },
        setMultiQueryRouteStatus(routeId, status, patch = {}) {
            updateMultiQueryRouteStatus(this, routeId, status, patch);
        },
        routeFactorSupportScore(factor = {}, phenotypeData = {}) {
            return scoreRouteFactorSupport(factor, phenotypeData);
        },
        factorMatchesEvidenceHit(factor = {}, hit = {}) {
            return routeFactorMatchesHit(factor, hit);
        },
        filterRouteFactorDataToEvidenceHits(routeResult = {}) {
            return filterRouteFactorDataByHits(routeResult);
        },
        annotateFactorDataWithFetchedDirection(factorData = {}, route = {}) {
            return annotateRouteFactorData(factorData, route);
        },
        mergeRouteFactorData(routeResults) {
            return mergeMultiRouteFactorData(routeResults);
        },
        buildCompactRouteEvidence(opts = {}) {
            return buildRouteEvidenceBundle({
                ...opts,
                evidenceLimits: this.multiQueryEvidenceLimits,
                lastExplicitUserGenes: this.lastExplicitUserGenes,
            });
        },
        async runMultiQueryRetrievalWorkflow(routes = []) {
            return orchestrateMultiQueryRetrieval(this, routes);
        },
        /**
         * Hybrid-only retrieval path:
         * POST hybrid-search (hybridSearchEndpointUrl, or hybridSearchBaseUrl + /api/reveal/hybrid-search).
         * Body: phenotype_terms, genes_of_interest, mechanism_terms, research_context; optional query_embedding if VUE_APP_HYBRID_CLIENT_EMBEDDING=true.
         */
        async onResearch(phenotypeTermsFromExtract, options = {}) {
            return orchestrateOnResearch(this, phenotypeTermsFromExtract, options);
        },
        /**
         * Kept as an alias for callers that used the mechanism-only hybrid path; resolution of empty phenotype_terms happens inside runHybridRetrievalWorkflow.
         */
        async onResearchPhenotypeFactorsOnly() {
            return this.onResearch();
        },
        /**
         * Map cited flattened KG rows plus merged factorData to main-table keys used by remaining-row coverage
         * (phenotype|collapsed factor id or cluster label).
         */
        /** Gene-set-cluster display strings under phenotype that list geneSymbol in merged factor gene maps. */
        factorLabelsForPhenotypeGene(factorData, phenotype, geneSymbol) {
            return factorLabelsForPhenotypeGene(factorData, phenotype, geneSymbol);
        },
        addTableRowKeysFromCitedFlatRows(keysSet, flat, idSet, factorData) {
            (flat || []).forEach((row) => {
                if (!idSet.has(Number(row.id))) return;
                const pred = String(row.predicate || "").trim();
                const sub = row.subject != null ? String(row.subject).trim() : "";
                const obj = row.object != null ? String(row.object).trim() : "";
                Object.keys(factorData || {}).forEach((pheno) => {
                    const pData = factorData[pheno];
                    if (!pData || !Array.isArray(pData.factors)) return;
                    pData.factors.forEach((f) => {
                        const fid = f.factor != null ? String(f.factor).trim() : "";
                        if (!fid) return;
                        const gss =
                            typeof f.top_gene_sets === "string" && f.top_gene_sets
                                ? f.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                                : [];
                        const geneKeys = Object.keys(f.genes || {});
                        let hit = false;
                        if (pred === "associated_with" && sub === pheno && gss.includes(obj)) hit = true;
                        if (pred === "contains_gene" && sub === pheno && geneKeys.includes(obj)) hit = true;
                        if (pred === "contributes_to_pathway" && geneKeys.includes(sub) && gss.includes(obj)) {
                            hit = true;
                        }
                        if (!hit) return;
                        keysSet.add(`${pheno}|${this.collapseWsLower(fid)}`);
                        if (f.label != null && String(f.label).trim() !== "") {
                            keysSet.add(`${pheno}|${this.collapseWsLower(String(f.label).trim())}`);
                        }
                    });
                });
            });
        },
        /**
         * Flatten an array of objects to CSV (header row + data rows). Escapes fields containing comma or quote.
         * @param {Array<Object>} rows - e.g. [{ id, factor_label, phenotype, top_gene_sets, gene_set_description, score }, ...]
         * @param {string[]} columns - column keys in order
         * @returns {string}
         */
        collapseWsLower(s) {
            return String(s || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");
        },

        retryMechanismHypothesesRelaxed() {
            orchestrateRetryMechanismHypothesesRelaxed(this);
        },
        retryMechanismHypotheses() {
            orchestrateRetryMechanismHypotheses(this);
        },
        flattenKGData(data) {
            return flattenKGData(data);
        },
        flattenedKGToCSV(flattened) {
            return flattenedKGToCSV(flattened);
        },
        buildMechanismLlmContextBlock(kgBlock, phenoGeneSetSummary, researchContext) {
            return buildMechanismLlmContextBlock(kgBlock, phenoGeneSetSummary, researchContext);
        },
        beginMechanismHypothesisGeneration() {
            startMechanismHypothesisGeneration(this);
        },
        requestMechanismHypotheses(factorData, kgTriples, routeEvidenceBundles = null) {
            orchestrateMechanismHypotheses(this, factorData, kgTriples, routeEvidenceBundles);
        },
        /**
         * Build factorData containing only one (phenotype, factor) for ad-hoc mechanism generation.
         * @param {{ phenotype: string, factor: string|number }} row - Table row with phenotype and factor id.
         * @returns {Object|null} - Same shape as factorData slice, or null if not found.
         */
        buildSinglePairFactorData(row) {
            if (!row || row.phenotype == null || row.factor == null) return null;
            const phenotype = String(row.phenotype).trim();
            const factorId = row.factor;
            const pData = this.factorData && this.factorData[phenotype];
            if (!pData) return null;
            const factors = pData.factors || [];
            const factorItem = factors.find((x) => x.factor === factorId || String(x.factor) === String(factorId));
            if (!factorItem) return null;
            const genesInFactor = Object.keys(factorItem.genes || {});
            const globalGenes = pData.genes || {};
            const subsetGlobal = {};
            genesInFactor.forEach((g) => {
                if (globalGenes[g] != null) {
                    subsetGlobal[g] = JSON.parse(JSON.stringify(globalGenes[g]));
                }
            });
            const factorClone = JSON.parse(JSON.stringify(factorItem));
            return {
                [phenotype]: {
                    genes: subsetGlobal,
                    factors: [factorClone],
                },
            };
        },
        /**
         * Generate mechanistic hypothesis for one remaining phenotype–factor pair (same LLM step as main run, subset data only).
         */
        generateHypothesisForRemainingPair(row) {
            return orchestrateGenerateHypothesisForRemainingPair(this, row);
        },
        /**
         * Extract relevant phenotype ids, gene-set-cluster labels (inferred from merged factorData), and gene set names
         * from flattened KG rows by supporting row ids (hybrid KG: phenotype–gene set via associated_with).
         * @param {Object} [factorData] - Merged phenotype/factor payload; when omitted, relevant_factors stays empty.
         */
        extractRelevantFactorsAndGeneSetsFromFlattened(flattened, rowIds, factorData) {
            return extractRelevantFactorsAndGeneSetsFromFlattened(flattened, rowIds, factorData);
        },
        /**
         * Build per-gene connections (gene-set-cluster labels + gene sets) from flattened KG rows by supporting ids.
         * Cluster labels are recovered from factorData for contains_gene (phenotype → gene) edges.
         */
        extractGeneConnectionsFromFlattened(flattened, rowIds, factorData) {
            return extractGeneConnectionsFromFlattened(flattened, rowIds, factorData);
        },
        /**
         * LLM biological mechanism map: nodes (id, label, group) and edges (from, to, label) → network for vis.
         * @param {Object} hik - hypothesis_in_kg from LLM.
         * @returns {{ nodes: Array, edges: Array } | null}
         */
        buildMechanismFlowNetworkFromHypothesisKg(hik) {
            return buildMechanismFlowNetworkFromHypothesisKg(hik);
        },
        normalizeCandidateInventory(raw) {
            return normalizeCandidateInventory(raw);
        },
        candidateInventoryRows(inventory) {
            return candidateInventoryRows(inventory);
        },
        /**
         * Build network { nodes, edges } from flattened KG rows by row ids (for LLM response with supporting_row_ids).
         * @param {Array} flattened - Flat rows from flattenKGData (id, subject, predicate, object, context_*).
         * @param {Array<number>} rowIds - Row id values from LLM (supporting_row_ids).
         * @returns {{ nodes: Array, edges: Array }} - Shape expected by FactorBaseRevealNetwork.
         */
        buildNetworkFromFlattenedRowIds(flattened, rowIds) {
            return buildNetworkFromFlattenedRowIds(flattened, rowIds);
        },
        /**
         * Keep only Gene nodes whose symbols appear in candidate_genes; drop other genes and edges that reference them.
         * Phenotype / Pathway (gene set) nodes are unchanged; legacy Factor nodes, if present, are unchanged.
         */
        filterSupportingNetworkToCandidateGenes(network, candidateGenes) {
            return filterSupportingNetworkToCandidateGenes(network, candidateGenes);
        },
        /**
         * Get combined, gwas, functional scores for a gene from flattened KG (contains_gene rows with context_*).
         * @param {Array} flattened - Flat rows from flattenKGData.
         * @param {string} geneSymbol - Gene symbol (object of contains_gene row).
         * @returns {{ combined: number|null, gwas: number|null, functional: number|null }}
         */
        getGeneScoresFromFlattenedKG(flattened, geneSymbol) {
            return getGeneScoresFromFlattenedKG(flattened, geneSymbol);
        },
        /** Pill colors for mechanism hypothesis gene rows (legacy GWAS/functional buckets + new canonical segregation labels). */
        /** Gene pill colors match supporting network nodes (see @/utils/factorRevealGeneColors). */
        mechanismGeneGroupPillStyle(group) {
            return { background: colorForGeneRole(group), color: "#fff" };
        },
        /**
         * Normalize mechanism hypotheses for display. LLM returns genes (no scores); we attach scores from the KG.
         * @param {Array} hypotheses - Raw hypotheses from LLM.
         * @param {Array|null|undefined} flattenedOverride - If provided, use for scoring/networks instead of lastFlattenedKG (ad-hoc single-pair runs).
         */
        normalizeMechanismHypotheses(hypotheses, flattenedOverride) {
            return normalizeMechanismHypotheses(this, hypotheses, flattenedOverride);
        },
        /**
         * Compact JSON for the mechanism prompt: per phenotype, merged gene-set names, global gene scores map (no per-cluster list).
         */
        serializeFactorDataForPrompt(factorData) {
            const summary = {};
            Object.keys(factorData || {}).forEach((phenotype) => {
                const p = factorData[phenotype];
                if (!p) return;
                const geneSets = new Set();
                (p.factors || []).forEach((f) => {
                    if (typeof f.top_gene_sets !== "string" || !f.top_gene_sets) return;
                    f.top_gene_sets.split(";").forEach((s) => {
                        const t = s.trim();
                        if (t) geneSets.add(t);
                    });
                });
                summary[phenotype] = {
                    gene_count: Object.keys(p.genes || {}).length,
                    merged_gene_sets: [...geneSets].sort(),
                    genes: p.genes || {},
                };
            });
            return JSON.stringify(summary, null, 2);
        },
        /**
         * Builds a factor-free KG from merged hybrid data: phenotype–gene set (\`associated_with\`),
         * phenotype–gene (\`contains_gene\`), gene–gene set (\`contributes_to_pathway\`). Per-cluster
         * rows in factor arrays are merged and deduped at the phenotype layer.
         * @param {Object} mergedData - factorData: { [phenotype]: { genes: {}, factors: [] } }
         * @returns {Array<{ subject, predicate, object, context }>}
         */
        transformMergedDataToKG(mergedData, factorsKey, options) {
            return buildKgTriplesFromFactorData(mergedData, factorsKey, options);
        },
        /**
         * Normalize factor id for matching API response rows to factor objects. API may return
         * factor as number (1) while we store 'factor1'; this returns the numeric part for comparison.
         * Request query must use full id: q=$phenotype,2,small,factor1 (not 1).
         * @param {string|number} factor - factor id (e.g. 'factor1', 2)
         * @returns {string} - numeric part if pattern factorN, else string form (for matching only)
         */
        getFactorQueryValue(factor) {
            if (factor == null) return "";
            const s = String(factor).trim();
            const m = s.match(/^factor(\d+)$/i);
            return m ? m[1] : s;
        },
    },
});
</script>

<style scoped>
.factor-base-reveal {
    --reveal-min-font-size: 14px;
}
.factor-base-reveal .small,
.factor-base-reveal .btn-sm,
.factor-base-reveal .form-control-sm,
.factor-base-reveal .text-muted,
.factor-base-reveal .page-link,
.factor-base-reveal td,
.factor-base-reveal th,
.factor-base-reveal label,
.factor-base-reveal li,
.factor-base-reveal a,
.factor-base-reveal p,
.factor-base-reveal input,
.factor-base-reveal textarea,
.factor-base-reveal select,
.factor-base-reveal button {
    font-size: max(var(--reveal-min-font-size), 1em);
}
.closed {
    overflow: hidden;
    height: 50px;
    box-shadow: inset 0px -20px 20px -20px #ccc;
}

.reveal-tab {
    border-bottom: 5px solid transparent;
    cursor: pointer;
}
.reveal-tab:not(.tab-inactive):not(.tab-active):hover {
    border-bottom: 5px solid #f1682280;
}
.tab-active {
    border-bottom: 5px solid #f16822;
    cursor: default;
}
.tab-inactive {
    opacity: 0.5;
    cursor: default;
}

.btn-cfde {
  background-color: #f16822;
  border-color: #f16822;
  color: #fff;
}
.btn-cfde:hover,
.btn-cfde:focus,
.btn-cfde:active {
  background-color: #d15618;
  border-color: #f16822;
  color: #fff;
}
.btn-outline-cfde {
    background: #fff;
    border-color: #f16822;
    color: #f16822;
}
.btn-outline-cfde:hover,
.btn-outline-cfde:focus,
.btn-outline-cfde:active {
    background: #f16822;
    border-color: #f16822;
    color: #fff;
}

.pill {
    display: inline-block;
    padding: 0.25em 0.6em;
    border-radius: 1em;
    background: #e9ecef;
    width: fit-content;
}
.pill.editable {
    cursor: pointer;
}
.pill.new {
    width: 2em;
    padding: 0.25em;
}
.cfde-explore-geneset-link {
    cursor: pointer;
}
.cfde-explore-geneset-link:hover {
    filter: brightness(1.08);
    text-decoration: underline;
}

.reveal-alt-query-links {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0;
}
.reveal-alt-query-links li {
    margin: 0 0 0.35rem 0;
}
.reveal-alt-query-links li:last-child {
    margin-bottom: 0;
}
.reveal-alt-query-link {
    color: #f16822 !important;
    font-style: italic;
    cursor: pointer;
    text-decoration: none;
    white-space: normal;
    line-height: 1.35;
}
.reveal-alt-query-link:hover,
.reveal-alt-query-link:focus {
    color: #d15618 !important;
    text-decoration: underline;
}

.ai-gen {
    display: inline;
    background: #cce5ff;
    color: #004085;
    padding: 0 3px;
    border-radius: 3px;
    font-size: inherit;
    margin: 0 0 0 3px;
    position: relative;
    border: 0;
    line-height: inherit;
}
.ai-gen:hover::after {
    content: 'Written by a AI';
    position: absolute;
    background: #cce5ff;
    color: #004085;
    width: max-content;
    padding: 0 3px;
    top: 0;
    left: 0;
    font-size: inherit;
    line-height: initial;
    border-radius: 3px;
}
.criteria-detail.collapsed {
    display: none;
}
.section-header {
    cursor: pointer;
}
.mechanism-card {
    border: 1px solid #dee2e6;
}
.mechanism-card-header {
    background: #6c757d;
}
.network-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}
.network-popup-box {
    width: 90vw;
    height: 90vh;
    max-width: 100%;
    max-height: 100%;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.network-popup-header {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #dee2e6;
    background: #f8f9fa;
}
.network-popup-body {
    flex: 1;
    min-height: 0;
    padding: 1rem;
    overflow: auto;
}

/* Candidate genes table: header color coding and legend */
.candidate-genes-legend {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}
.candidate-genes-legend-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    font-size: 11pt;
    font-weight: 500;
}
.candidate-genes-legend-pill.ai-generated {
    background: #cce5ff;
    color: #004085;
}
.candidate-genes-legend-pill.raw-data {
    background: #e2e3e5;
    color: #383d41;
}
::v-deep .candidate-genes-th-ai {
    background: #cce5ff !important;
    color: #004085;
}
::v-deep .candidate-genes-th-raw {
    background: #e2e3e5 !important;
    color: #383d41;
}

.query-guidelines-panel {
    width: 100%;
}
.reveal-extraction-section-gap {
    margin-bottom: 25px;
}
.reveal-shared-research-context-section {
    margin-bottom: 25px;
}
.query-guidelines-toggle {
    border: none;
    box-shadow: none;
    padding: 0.35rem 0;
    background: transparent;
}
.query-guidelines-toggle:hover,
.query-guidelines-toggle:focus {
    text-decoration: none;
    background: transparent;
}
.query-guidelines-content {
    overflow: visible;
}
.route-terms-edit-toggle {
    color: #f16822;
    font-size: inherit;
}
.route-terms-edit-toggle:hover,
.route-terms-edit-toggle:focus {
    color: #c45212;
    text-decoration: none;
    background: transparent;
}
.route-terms-edit-content {
    border-color: #dee2e6 !important;
}
.reveal-data-step-pre {
    background: #eee;
    max-height: 160px;
    overflow: auto;
    overflow-wrap: anywhere;
    padding: 10px;
    resize: vertical;
    white-space: pre-wrap;
}
.query-guidelines-example {
    border-left: 3px solid #f16822;
    margin: 0;
}

/* Relevant gene sets: program source pill + hover menu for C2M2 file links */
.fbr-program-download-wrap {
    position: relative;
    display: inline-block;
    max-width: 100%;
}
.fbr-program-download-trigger {
    cursor: default;
    max-width: min(280px, 100%);
}
.fbr-program-download-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
.fbr-program-download-menu {
    display: none;
    position: absolute;
    z-index: 1060;
    right: 0;
    top: 100%;
    margin-top: -1px;
    min-width: 220px;
    max-width: min(500px, 85vw);
}
.fbr-program-download-wrap:hover .fbr-program-download-menu,
.fbr-program-download-wrap:focus-within .fbr-program-download-menu {
    display: block;
}
.fbr-program-download-menu-heading {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
}
.fbr-provenance-menu-link {
    word-break: break-word;
}
.fbr-provenance-menu-link:hover {
    background: #f3f4f6;
}

/* Strict / Relaxed toggle: B-V .custom-switch positions the track with negative left (~2.25rem); keep that bleed inside .reveal-switch-slot only. */
.reveal-hypothesis-mode-toggle {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.35rem;
    max-width: 100%;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label {
    flex: 0 0 auto;
    white-space: nowrap;
    line-height: 1.25;
    user-select: none;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label-strict {
    text-align: right;
    padding-right: 0.2rem;
}
.reveal-hypothesis-mode-toggle .reveal-mode-label-relaxed {
    min-width: 3.25rem;
    text-align: left;
    padding-left: 0.2rem;
}
.reveal-hypothesis-mode-toggle .reveal-switch-slot {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Room for switch track drawn left of the control’s box (BS4 custom-switch). */
    /*- ;min-width: 3.5rem;
    padding: 0 0.35rem 0 2.65rem;*/
    margin-left: 30px;
    margin-right: -10px;
    box-sizing: content-box;
}
.reveal-hypothesis-mode-toggle .reveal-mode-switch {
    flex: 0 0 auto;
    margin: 0;
    padding: 0;
}

.query-helper-link {
    font-size: 0.9rem;
    white-space: nowrap;
    line-height: 1;
}
.reveal-query-input-wrap {
    position: relative;
}
.reveal-query-input-actions {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: 12px;
}
.reveal-query-submit-btn {
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
}
.reveal-gate-box {
    background: #f16822;
    border: 1px solid #f16822;
    border-radius: 4px;
    padding: 8px 12px;
    margin-bottom: 25px !important;
}
.reveal-gate-box-tight {
    margin-bottom: 6px !important;
}
.reveal-gate-text {
    color: #fff;
}
.reveal-gate-link {
    color: #fff;
    text-decoration: underline;
    font-weight: 600;
}
.reveal-gate-link:hover,
.reveal-gate-link:focus {
    color: #fff;
    opacity: 0.92;
}
.reveal-gate-btn {
    background: #e9ecef;
    border: 1px solid #d1d5db;
    color: #333;
    padding: 0.35rem 0.9rem;
    font-weight: 400;
    line-height: 1.5;
}
.reveal-gate-btn:hover,
.reveal-gate-btn:focus {
    background: #dde2e6;
    border-color: #c7ccd1;
    color: #222;
}
.query-helper-pill {
    display: inline-flex;
    align-items: center;
}
.query-helper-suggest-list {
    max-height: 180px;
    overflow-y: auto;
    background: #fff;
}
.query-helper-suggest-item:hover {
    background: #f8f9fa;
}
.query-helper-factor-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

</style>
