<template>
    <div ref="workspace" class="kp-variant-sifter-workspace">
        <header
            ref="vksHeader"
            class="vks-header"
            :class="{ 'is-pinned': chromePinned }"
            :style="pinnedChromeStyle.header"
        >
            <div class="vks-header-start">
                <div class="vks-brand">
                    <span class="vks-mark">KP</span>
                    <span class="vks-title">Variant Sifter</span>
                </div>
                <VariantSifterMenuBar
                    :recent-searches="recentSearches"
                    @action="onMenuAction"
                />
            </div>
            <p
                v-if="searchSessionLabel"
                class="vks-header-session"
                :title="searchSessionLabel"
            >
                {{ searchSessionLabel }}
            </p>
            <VariantSifterViewportControls
                v-if="canvasActive"
                class="vks-header-controls"
                :region-zoom="regionZoom"
                :region-zoom-out="regionZoomOut"
                :zoom-out-at-limit="zoomOutAtLimit"
                :region-view-area="regionViewArea"
                :data-table-open="dataTableOpen"
                :ai-assistant-open="aiAssistantOpen"
                :settings-open="settingsOpen"
                @update:regionZoom="onRegionZoomUpdate"
                @update:regionZoomOut="onRegionZoomOutUpdate"
                @zoom-slider-commit="onRegionZoomSliderCommit"
                @update:dataTableOpen="dataTableOpen = $event"
                @toggle-assistant="aiAssistantOpen = !aiAssistantOpen"
                @toggle-settings="settingsOpen = !settingsOpen"
            />
        </header>
        <div
            v-show="chromePinned"
            class="vks-header-spacer"
            :style="{ height: `${headerHeightPx}px` }"
            aria-hidden="true"
        ></div>

        <VariantSifterWorkspaceGuide
            v-if="canvasActive"
            :open="workspaceGuideOpen"
            @close="workspaceGuideOpen = false"
        />

        <input
            ref="sessionImportInput"
            type="file"
            accept=".json,application/json"
            class="vks-session-import-input"
            @change="onSessionFileSelected"
        />

        <div class="vks-main">
            <div class="vks-stage">
                <VariantSifterCanvas
                    :sections="sections"
                    :visible-section-ids="visibleSectionIds"
                    :canvas-active="canvasActive"
                    :welcome-open="welcomeOpen"
                    :phenotypes="phenotypes"
                    :utils="utilsBox"
                    :welcome-initial-values="welcomeInitialValues"
                    :project-id="projectId"
                    :gene-lookup-bio-index-host="bioIndexHostFor('gene')"
                    :tissue-regions-host="bioIndexHostFor('tissue-regions')"
                    :search-session="searchSession"
                    :region-zoom="regionZoom"
                    :region-shift-bp="regionShiftBp"
                    :region-view-area="regionViewArea"
                    :view-region="viewRegion"
                    :data-table-open="dataTableOpen"
                    :mapping-state="mappingState"
                    :workspace-mapping-filter="workspaceMappingFilter"
                    :associations-state="associationsState"
                    :genes-state="genesState"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-markers="plotMarkersState"
                    :credible-sets-state="credibleSetsState"
                    :credible-set-colors="credibleSetDotColors"
                    :credible-set-pill-colors="credibleSetPillColors"
                    :global-enrichment-state="globalEnrichmentState"
                    :v2g-state="v2gState"
                    :s2g-state="s2gState"
                    :region-load-progress-active="regionLoadProgress.active"
                    @update:regionShiftBp="onRegionShiftBpUpdate"
                    @update:regionViewArea="onRegionViewAreaUpdate"
                    @pan-end="onRegionPanEnd"
                    @toggle-position-marker="onTogglePositionMarker"
                    @toggle-star-variant="onToggleStarVariant"
                    @set-reference-variant="onSetReferenceVariant"
                    @update:associationsFiltersIndex="onAssociationsFiltersIndexUpdate"
                    @update:geSelectedBiosamples="onGeSelectedBiosamplesUpdate"
                    @update:geActiveAnnotation="onGeActiveAnnotationUpdate"
                    @update:geSelectedTissues="onGeSelectedTissuesUpdate"
                    @update:geSelectedAnnotations="onGeSelectedAnnotationsUpdate"
                    @select-ge-plot-tissue="onSelectGePlotTissue"
                    @update:geBiosampleFilterOptions="onGeBiosampleFilterOptionsUpdate"
                    @update:geBiosampleTissueRegions="onGeBiosampleTissueRegionsUpdate"
                    @update:geBiosampleLoading="onGeBiosampleLoadingUpdate"
                    @update:mappingState="onMappingStateUpdate"
                    @update:workspaceFilterActive="onWorkspaceFilterActiveUpdate"
                    @update:v2gSelectedLinks="onV2gSelectedLinksUpdate"
                    @update:s2gSelectedLinks="onS2gSelectedLinksUpdate"
                    @add-credible-set="onAddCredibleSet"
                    @remove-credible-set="onRemoveCredibleSet"
                    @remove-mapping-category="onRemoveMappingCategory"
                    @close-data-table="dataTableOpen = false"
                    @start-search="onStartSearch"
                    @import-session="openSessionImport"
                />
                <VariantSifterAiAssistantPanel
                    :open="aiAssistantOpen"
                    :active-tab="assistantState.activeTab"
                    :thread-entries="assistantState.threadEntries"
                    :executing="assistantState.executing"
                    :execution-progress-label="assistantState.executionProgressLabel"
                    :llm-available="assistantState.llmAvailable"
                    :can-run-actions="assistantCanRunActions"
                    :plan="assistantState.plan"
                    :step-states="assistantState.stepStates"
                    :cs2ct-star-prompt="assistantState.cs2ctStarPrompt"
                    :understudied-star-prompt="assistantState.understudiedStarPrompt"
                    :panel-style="assistantPanelStyle"
                    @close="aiAssistantOpen = false"
                    @update:activeTab="onAssistantActiveTabUpdate"
                    @execute-all="onAssistantExecuteAll"
                    @execute-step="onAssistantExecuteStep"
                    @plan-request="onAssistantPlanRequest"
                    @execute-catalog-action="onExecuteCatalogAction"
                    @confirm-cs2ct-star="onConfirmCs2ctStar"
                    @dismiss-cs2ct-star="onDismissCs2ctStar"
                    @confirm-understudied-star="onConfirmUnderstudiedStar"
                    @dismiss-understudied-star="onDismissUnderstudiedStar"
                    @open-correlated-phenotype="onOpenCorrelatedPhenotype"
                />
            </div>
            <div v-if="canvasActive" class="vks-drawer-rail-slot">
                <VariantSifterSectionDrawers
                    :sections="visibleSections"
                    :open-drawer-id="openDrawerId"
                    :search-session="searchSession"
                    :associations-state="associationsState"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-markers="plotMarkersState"
                    :credible-sets-state="credibleSetsState"
                    :credible-set-pill-colors="credibleSetPillColors"
                    :genes-state="genesState"
                    :global-enrichment-state="globalEnrichmentState"
                    :v2g-state="v2gState"
                    :s2g-state="s2gState"
                    :mapping-state="mappingState"
                    :workspace-mapping-filter="workspaceMappingFilter"
                    :view-region="viewRegion"
                    :utils="utilsBox"
                    :region-load-progress-active="regionLoadProgress.active"
                    :rail-pinned="chromePinned"
                    :rail-pin-style="pinnedChromeStyle.drawer"
                    @toggle-drawer="onToggleDrawer"
                    @update:associationsFiltersIndex="onAssociationsFiltersIndexUpdate"
                    @toggle-star-variant="onToggleStarVariant"
                    @set-reference-variant="onSetReferenceVariant"
                    @toggle-association-ancestry="onToggleAssociationAncestry"
                    @add-credible-set="onAddCredibleSet"
                    @remove-credible-set="onRemoveCredibleSet"
                    @update:genesSelectedTypes="onGenesSelectedTypesUpdate"
                    @update:geEnabledMutedAnnotations="onGeEnabledMutedAnnotationsUpdate"
                    @update:geEnabledMutedAnnotationTissues="
                        onGeEnabledMutedAnnotationTissuesUpdate
                    "
                    @update:geDisabledAnnotationTissues="
                        onGeDisabledAnnotationTissuesUpdate
                    "
                    @update:geSelectedAnnotations="onGeSelectedAnnotationsUpdate"
                    @update:geTissueTrackSort="onGeTissueTrackSortUpdate"
                    @update:geTrackPValueMax="onGeTrackPValueMaxUpdate"
                    @update:geSelectedMethods="onGeSelectedMethodsUpdate"
                    @update:geSelectedSources="onGeSelectedSourcesUpdate"
                    @update:mappingState="onMappingStateUpdate"
                    @update:workspaceFilterActive="onWorkspaceFilterActiveUpdate"
                    @remove-mapping-category="onRemoveMappingCategory"
                    @update:v2gSelectedTissues="onV2gSelectedTissuesUpdate"
                    @update:v2gDeselectedMethods="onV2gDeselectedMethodsUpdate"
                    @update:v2gDeselectedGenes="onV2gDeselectedGenesUpdate"
                    @update:v2gDeselectedTissues="onV2gDeselectedTissuesUpdate"
                    @update:v2gDeselectedBiosamples="onV2gDeselectedBiosamplesUpdate"
                    @update:v2gSelectedLinks="onV2gSelectedLinksUpdate"
                    @update:v2gViewMode="onV2gViewModeUpdate"
                    @load-s2g="onS2gLoad"
                    @clear-s2g="onS2gClear"
                    @update:s2gDeselectedMethods="onS2gDeselectedMethodsUpdate"
                    @update:s2gDeselectedGenes="onS2gDeselectedGenesUpdate"
                    @update:s2gSelectedLinks="onS2gSelectedLinksUpdate"
                />
            </div>
        </div>

        <VariantSifterRegionLoadBubble
            :progress="regionLoadProgress"
            @dismiss="dismissRegionLoadProgress"
        />

        <VariantSifterExportSessionModal
            :open="exportSessionOpen"
            :default-filename="exportSessionDefaultFilename"
            :summary="exportSessionSummary"
            :exporting="exportSessionBusy"
            @close="exportSessionOpen = false"
            @export="onExportSessionConfirm"
        />

        <VariantSifterSettingsPanel
            :open="settingsOpen"
            :sections="sections"
            :visible-section-ids="visibleSectionIds"
            :search-session="searchSession"
            :bio-index-host="bioIndexHost"
            :default-bio-index-host="defaultBioIndexHost"
            :project-id="projectId"
            :resolve-host-for-index="bioIndexHostFor"
            @close="settingsOpen = false"
            @update:visibleSectionIds="onVisibleSectionIdsUpdate"
            @update:projectId="onProjectIdUpdate"
        />
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

import VariantSifterMenuBar from "./kpVariantSifter/VariantSifterMenuBar.vue";
import VariantSifterWorkspaceGuide from "./kpVariantSifter/VariantSifterWorkspaceGuide.vue";
import VariantSifterViewportControls from "./kpVariantSifter/VariantSifterViewportControls.vue";
import VariantSifterCanvas from "./kpVariantSifter/VariantSifterCanvas.vue";
import VariantSifterSectionDrawers from "./kpVariantSifter/VariantSifterSectionDrawers.vue";
import VariantSifterAiAssistantPanel from "./kpVariantSifter/VariantSifterAiAssistantPanel.vue";
import VariantSifterExportSessionModal from "./kpVariantSifter/VariantSifterExportSessionModal.vue";
import VariantSifterRegionLoadBubble from "./kpVariantSifter/VariantSifterRegionLoadBubble.vue";
import VariantSifterSettingsPanel from "./kpVariantSifter/VariantSifterSettingsPanel.vue";
import { VARIANT_SIFTER_SECTIONS } from "./kpVariantSifter/variantSifterSections.js";
import {
    defaultVisibleSectionIds,
    isSectionVisible,
    normalizeVisibleSectionIds,
} from "./kpVariantSifter/variantSifterToolSettings.js";
import { parseRegionParam, formatRegion, formatSearchSessionLabel, formatSubAncestriesParam, parseSubAncestriesParam } from "./kpVariantSifter/variantSifterSearchUtils.js";
import {
    associationRowAncestry,
    fetchAssociations,
    fetchGlobalAssociations,
    primaryAssociationAncestry,
    probeAncestryAssociationAvailability,
} from "./kpVariantSifter/variantSifterAssociationsApi.js";
import { formatAssociationRows } from "./kpVariantSifter/variantSifterAssociationsTable.js";
import { createFiltersIndex } from "./kpVariantSifter/variantSifterAssociationsFilters.js";
import { enrichAssociationRowsWithLdScores, enrichAssociationRowsWithLdScoresForRef } from "./kpVariantSifter/variantSifterLdServer.js";
import {
    emptyPlotMarkersState,
    createStarredVariant,
    isVariantStarred,
    togglePositionMarker,
    toggleStarredVariant,
} from "./kpVariantSifter/variantSifterPlotMarkers.js";
import {
    buildSessionExportFilename,
    countActiveAssociationFilters,
    exportVariantSifterSession,
    importVariantSifterSession,
    readSessionFile,
    saveJsonBundle,
} from "./kpVariantSifter/variantSifterSession.js";
import {
    clampRegionZoom,
    clampRegionViewArea,
    sliderValueFromZoom,
    zoomFromSliderValue,
    VKS_REGION_ZOOM_SLIDER_MAX,
    VKS_REGION_ZOOM_SLIDER_MIN,
} from "./kpVariantSifter/variantSifterRegionZoom.js";
import {
    cloneGenomicRegion,
    computeActiveRegion,
    computeFetchGaps,
    computeViewRegion,
    clampRegionViewportForDataLimit,
    filterAssociationRowsInRegion,
    filterGenesInRegion,
    genomicRegionsEqual,
    isRegionZoomOutBlocked,
    mergeAssociationRowsByVariantAndAncestry,
    mergeGenesByName,
    mergeRecombData,
    resolveActiveDataRegion,
    resolveZoomOutLimitRegion,
    trimRecombData,
    unionGenomicRegions,
    regionExceedsActiveDataLimit,
    activeRegionDataLimitMessage,
} from "./kpVariantSifter/variantSifterRegionPan.js";
import { fetchGenesTrackData } from "./kpVariantSifter/variantSifterGenes.js";
import {
    fetchGlobalEnrichment,
    fetchLocusAnnotations,
} from "./kpVariantSifter/variantSifterGlobalEnrichmentApi.js";
import { fetchGeneLinks } from "./kpVariantSifter/variantSifterV2gApi.js";
import { fetchVariantLinks } from "./kpVariantSifter/variantSifterS2gApi.js";
import {
    collectGenesFromTissueData,
    collectMethodsFromTissueData,
    emptyV2gState,
    normalizeV2gViewMode,
} from "./kpVariantSifter/variantSifterV2gData.js";
import {
    buildS2gTissueData,
    emptyS2gState,
    hasS2gTrackData,
    VKS_S2G_TISSUE_LABEL,
} from "./kpVariantSifter/variantSifterS2gData.js";
import {
    applyGlobalEnrichmentAnnoRows,
    buildAnnoDataFromRows,
    buildGeLlmLoadingState,
    buildGeLlmRelevanceShowAllState,
    emptyGeLlmRelevanceState,
    extractGeCatalog,
    filterAnnoRowsInRegion,
    mergeAnnoRows,
    normalizeGeFilterStringList,
    normalizeGeSelectedBiosamples,
    normalizeGeTissueTrackSort,
    normalizeGeTrackPValueMax,
    resolveSelectedTissuesByAnnotation,
    selectedTissuesForAnnotation,
    setSelectedTissuesForAnnotation,
    upsertGeBiosampleTissueRegions,
} from "./kpVariantSifter/variantSifterGlobalEnrichmentData.js";
import {
    emptyMappingState,
    normalizeMappingState,
    emptyWorkspaceMappingFilter,
    normalizeWorkspaceMappingFilter,
    buildWorkspaceMappingFilter,
    collectMappingCategories,
    parseMappingCategoryId,
} from "./kpVariantSifter/variantSifterMappingData.js";
import {
    normalizeProjectId,
    projectPhenotypes,
    resolveProjectBioIndexHost,
    resolveProjectPrimaryBioIndexHost,
    VKS_PROJECT_DEFAULT_ID,
} from "./kpVariantSifter/variantSifterProjects.js";
import {
    loadRecentSearches,
    pushRecentSearch,
} from "./kpVariantSifter/variantSifterRecentSearches.js";
import { exportVariantSifterHtmlReport } from "./kpVariantSifter/variantSifterHtmlReport.js";
import { normalizeV2gSelectedLinks } from "./kpVariantSifter/variantSifterV2gData.js";
import { fetchInteractiveLlmHealth } from "./kpVariantSifter/variantSifterGeRelevanceLlm.js";
import {
    buildCs2ctStarPromptMessage,
    buildGeRelevanceIntroMessage,
    buildGeRelevanceOfferMessage,
    buildGeRelevanceReportMessage,
    buildGeRelevanceRunningMessage,
} from "./kpVariantSifter/variantSifterAssistantGeRelevance.js";
import {
    buildUnderstudiedIntroMessage,
    buildUnderstudiedNoneFoundMessage,
    buildUnderstudiedOfferMessage,
    buildUnderstudiedReportMessage,
    buildUnderstudiedRunningMessage,
    buildUnderstudiedStarPrompt,
    filterUnderstudiedBottomLineInRegion,
} from "./kpVariantSifter/variantSifterAssistantUnderstudied.js";
import {
    buildGeneticCorrelationIntroMessage,
    buildGeneticCorrelationPhenotypeGroups,
    buildGeneticCorrelationResultEntry,
    buildGeneticCorrelationRunningMessage,
    fetchGeneticCorrelation,
    filterSignificantGeneticCorrelations,
} from "./kpVariantSifter/variantSifterAssistantGeneticCorrelation.js";
import { runCs2ctTissueClassification } from "./kpVariantSifter/variantSifterCs2ctClassify.js";
import {
    appendAssistantEntries,
    createAssistantMessage,
    createAssistantPlan,
    createAssistantStatusMessage,
    createAssistantStepMessage,
    createUserMessage,
    emptyAssistantState,
    replacePendingAssistantEntry,
    clearAssistantResultEntries,
} from "./kpVariantSifter/variantSifterAssistantConversation.js";
import {
    findAssistantAction,
    matchVksAssistantRequest,
} from "./kpVariantSifter/variantSifterAssistantActionCatalog.js";
import { fetchRecombinationRate } from "./kpVariantSifter/variantSifterPlotShared.js";
import {
    pickLeadVariantRow,
    resolveLdReferenceRow,
    rowToLdVariant,
} from "./kpVariantSifter/variantSifterLdServer.js";
import { buildAssociationsRegionPlotConfig } from "./kpVariantSifter/variantSifterAssociationsPlotConfig.js";
import {
    fetchCredibleSetsList,
    fetchCredibleSetsListForAncestries,
    fetchCredibleSetVariants,
    mergeCredibleSetAvailableLists,
    tagCredibleSetEntries,
} from "./kpVariantSifter/variantSifterCredibleSetsApi.js";
import {
    credibleSetOptionLabel,
    credibleSetShortLabel,
    formatCredibleVariantRows,
    makeCredibleSetSelectionKey,
} from "./kpVariantSifter/variantSifterCredibleSetsFormat.js";
import { buildCredibleSetColorMap } from "./kpVariantSifter/variantSifterCredibleSetsColors.js";
import { pruneCredibleSetsForRegion } from "./kpVariantSifter/variantSifterCredibleSetsRegion.js";
import {
    normalizeSelectedGeneTypes,
    resolveSelectedGeneTypesForData,
    VKS_DEFAULT_GENE_TYPES,
} from "./kpVariantSifter/variantSifterGenesFilter.js";
import {
    emptyRegionLoadProgress,
    finishRegionLoadProgress,
    patchRegionLoadStep,
    regionLoadProgressSettled,
    regionLoadProgressCanAutoDismiss,
    startRegionLoadProgress,
    VKS_REGION_LOAD_STATUS,
} from "./kpVariantSifter/variantSifterRegionLoadProgress.js";
import "./kpVariantSifter/vksSharedStyles.css";

function emptyAssociationsState() {
    return {
        loading: false,
        ldLoading: false,
        error: null,
        ldError: null,
        rows: [],
        index: null,
        query: null,
        filtersIndex: createFiltersIndex(),
        ancestryAvailability: [],
        ancestryAvailabilityLoading: false,
        ancestryAvailabilityError: null,
        selectedAncestries: [],
        ancestrySeriesLoading: {},
        ancestrySeriesErrors: {},
    };
}

function emptyGenesState() {
    return {
        ready: false,
        loading: false,
        error: null,
        data: null,
        selectedTypes: [...VKS_DEFAULT_GENE_TYPES],
    };
}

function emptyPlotOverlaysState() {
    return {
        ready: false,
        loading: false,
        error: null,
        recombData: null,
        refVariant: null,
        refVariantUserSet: false,
    };
}

function emptyCredibleSetsState() {
    return {
        listLoading: false,
        listError: null,
        available: [],
        selectedIds: [],
        variantsBySet: {},
        variantsLoading: false,
        variantsError: null,
    };
}

function emptyGlobalEnrichmentState() {
    return {
        loading: false,
        error: null,
        geRows: [],
        annoRows: [],
        annoData: {},
        catalog: { annotations: [], tissues: [], pairCount: 0 },
        llmRelevance: emptyGeLlmRelevanceState(),
        enabledMutedAnnotations: [],
        enabledMutedAnnotationTissues: {},
        disabledAnnotationTissues: {},
        selectedAnnotations: [],
        tissueTrackSort: "alphabetical",
        geTrackPValueMax: 0.5,
        selectedMethods: null,
        selectedSources: null,
        activeAnnotation: null,
        selectedTissues: [],
        selectedTissuesByAnnotation: {},
        selectedBiosamples: [],
        biosampleMethodOptions: [],
        biosampleSourceOptions: [],
        biosampleRegionsByAnnotation: {},
        biosampleLoading: false,
    };
}

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default Vue.component("kp-variant-sifter", {
    props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
    components: {
        VariantSifterMenuBar,
        VariantSifterWorkspaceGuide,
        VariantSifterViewportControls,
        VariantSifterCanvas,
        VariantSifterSectionDrawers,
        VariantSifterAiAssistantPanel,
        VariantSifterExportSessionModal,
        VariantSifterRegionLoadBubble,
        VariantSifterSettingsPanel,
    },
    data() {
        return {
            sections: VARIANT_SIFTER_SECTIONS,
            visibleSectionIds: defaultVisibleSectionIds(),
            settingsOpen: false,
            canvasActive: false,
            welcomeOpen: true,
            searchSession: null,
            welcomeInitialValues: null,
            projectId: VKS_PROJECT_DEFAULT_ID,
            recentSearches: loadRecentSearches(),
            regionZoom: 0,
            regionZoomOut: 0,
            regionViewArea: 0,
            regionShiftBp: 0,
            dataRegion: null,
            regionLoadProgress: emptyRegionLoadProgress(),
            regionLoadDismissTimer: null,
            regionExtendToken: 0,
            regionPanSyncTimer: null,
            pendingPanSliderReset: false,
            dataTableOpen: false,
            mappingState: emptyMappingState(),
            workspaceMappingFilter: emptyWorkspaceMappingFilter(),
            aiAssistantOpen: false,
            assistantState: emptyAssistantState(),
            assistantActionToken: 0,
            openDrawerId: null,
            associationsState: emptyAssociationsState(),
            genesState: emptyGenesState(),
            plotOverlaysState: emptyPlotOverlaysState(),
            plotMarkersState: emptyPlotMarkersState(),
            credibleSetsState: emptyCredibleSetsState(),
            globalEnrichmentState: emptyGlobalEnrichmentState(),
            v2gState: emptyV2gState(),
            s2gState: emptyS2gState(),
            associationsRequestToken: 0,
            genesRequestToken: 0,
            plotOverlaysRequestToken: 0,
            credibleSetsRequestToken: 0,
            globalEnrichmentRequestToken: 0,
            v2gRequestToken: 0,
            s2gRequestToken: 0,
            pendingSubAncestries: [],
            lastCredibleSetsListRegion: null,
            exportSessionOpen: false,
            exportSessionBusy: false,
            workspaceGuideOpen: false,
            chromePinned: false,
            headerHeightPx: 53,
            assistantPanelTopPx: 53,
            pinnedChromeStyle: {
                header: {},
                drawer: {},
            },
        };
    },
    computed: {
        assistantPanelStyle() {
            return {
                top: `${this.assistantPanelTopPx}px`,
                bottom: "30px",
                height: "auto",
            };
        },
        phenotypes() {
            return projectPhenotypes(this.projectId, this.phenotypesInUse || []);
        },
        defaultBioIndexHost() {
            return this.utilsBox?.uiUtils?.biDomain?.() || "";
        },
        bioIndexHost() {
            return resolveProjectPrimaryBioIndexHost(
                this.projectId,
                this.defaultBioIndexHost
            );
        },
        visibleSections() {
            return this.sections.filter((section) =>
                isSectionVisible(this.visibleSectionIds, section.id)
            );
        },
        exportSessionDefaultFilename() {
            if (!this.searchSession) {
                return "vks-session-export.json";
            }
            return buildSessionExportFilename(this.searchSession);
        },
        exportSessionSummary() {
            const rows = this.associationsState?.rows?.length || 0;
            if (!rows) {
                return "";
            }
            const filterCount = countActiveAssociationFilters(
                this.associationsState.filtersIndex
            );
            const geneCount = this.genesState?.data?.length || 0;
            const parts = [`${rows.toLocaleString()} association rows`];
            if (geneCount > 0) {
                parts.push(`${geneCount.toLocaleString()} genes`);
            }
            if (filterCount) {
                parts.push(
                    filterCount === 1 ? "1 active filter" : `${filterCount} active filters`
                );
            }
            const gePairs = this.globalEnrichmentState?.catalog?.pairCount || 0;
            if (gePairs > 0) {
                parts.push(`${gePairs.toLocaleString()} GE pairs`);
            }
            const v2gTissues = (this.v2gState?.selectedTissues || []).length;
            if (v2gTissues > 0) {
                parts.push(
                    v2gTissues === 1 ? "1 V2G tissue" : `${v2gTissues} V2G tissues`
                );
            }
            if (hasS2gTrackData(this.s2gState)) {
                parts.push("SNP 2 gene links");
            }
            return parts.join(" · ");
        },
        searchSessionLabel() {
            return formatSearchSessionLabel(this.searchSession);
        },
        assistantCanRunActions() {
            return Boolean(this.searchSession || this.canvasActive);
        },
        activeRegion() {
            if (!this.searchSession?.region) {
                return null;
            }
            return resolveActiveDataRegion(
                this.searchSession.region,
                this.regionShiftBp,
                this.regionZoomOut,
                this.zoomOutLimitRegion
            );
        },
        zoomOutLimitRegion() {
            if (!this.searchSession?.region) {
                return null;
            }
            return resolveZoomOutLimitRegion(
                this.searchSession.region,
                this.searchSession.regionExpandBp
            );
        },
        zoomOutAtLimit() {
            if (!this.searchSession?.region) {
                return true;
            }
            return isRegionZoomOutBlocked(
                this.searchSession.region,
                this.regionShiftBp,
                this.regionZoomOut,
                this.zoomOutLimitRegion
            );
        },
        viewRegion() {
            if (!this.searchSession?.region) {
                return null;
            }
            return computeViewRegion(
                this.searchSession.region,
                this.regionShiftBp,
                this.regionZoom,
                this.regionViewArea,
                this.regionZoomOut,
                this.zoomOutLimitRegion
            );
        },
        credibleSetDotColors() {
            return buildCredibleSetColorMap(
                this.credibleSetsState.available,
                this.credibleSetsState.selectedIds
            ).dotMap;
        },
        credibleSetPillColors() {
            return buildCredibleSetColorMap(
                this.credibleSetsState.available,
                this.credibleSetsState.selectedIds
            ).pillMap;
        },
    },
    mounted() {
        this.applyProjectFromUrl();
        this.applyUrlSearchParams();
        this.$nextTick(() => this.setupChromePin());
        this.refreshAssistantLlmHealth();
    },
    beforeDestroy() {
        if (this.regionPanSyncTimer) {
            clearTimeout(this.regionPanSyncTimer);
            this.regionPanSyncTimer = null;
        }
        this.teardownChromePin();
        if (this.regionLoadDismissTimer) {
            clearTimeout(this.regionLoadDismissTimer);
            this.regionLoadDismissTimer = null;
        }
    },
    watch: {
        phenotypes() {
            this.applyProjectFromUrl();
            this.applyUrlSearchParams();
        },
        canvasActive() {
            this.$nextTick(() => {
                this.refreshChromePinListeners();
                this.updateChromePin();
            });
        },
    },
    methods: {
        bioIndexHostFor(index) {
            return resolveProjectBioIndexHost(
                index,
                this.projectId,
                this.defaultBioIndexHost
            );
        },
        applyProjectFromUrl() {
            const params = this.utilsBox?.keyParams;
            if (!params) {
                return;
            }
            const next = normalizeProjectId(params.project);
            if (next === this.projectId) {
                return;
            }
            if (this.searchSession || this.canvasActive) {
                return;
            }
            this.projectId = next;
        },
        syncUrlProjectParam() {
            if (!this.utilsBox?.keyParams) {
                return;
            }
            this.utilsBox.keyParams.set({
                project: this.projectId || undefined,
            });
        },
        onProjectIdUpdate(projectId) {
            const next = normalizeProjectId(projectId);
            if (next === this.projectId) {
                return;
            }
            const hadSession = Boolean(this.searchSession || this.canvasActive);
            this.projectId = next;
            this.syncUrlProjectParam();
            if (hadSession) {
                this.resetSearch();
            }
        },
        scheduleChromePinUpdate() {
            if (this.chromePinFrame) {
                return;
            }
            this.chromePinFrame = requestAnimationFrame(() => {
                this.chromePinFrame = null;
                this.updateChromePin();
            });
        },
        collectChromePinScrollTargets() {
            const targets = new Set([window]);
            const workspace = this.$refs.workspace;
            let node = workspace?.parentElement;

            while (node) {
                const style = window.getComputedStyle(node);
                const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
                if (/(auto|scroll|overlay)/.test(overflow)) {
                    targets.add(node);
                }
                if (node === document.body || node === document.documentElement) {
                    break;
                }
                node = node.parentElement;
            }

            return Array.from(targets);
        },
        refreshChromePinListeners() {
            this.teardownChromePinListeners();
            this.onChromePinScroll = () => this.scheduleChromePinUpdate();
            this.chromePinScrollTargets = this.collectChromePinScrollTargets();
            this.chromePinScrollTargets.forEach((target) => {
                target.addEventListener("scroll", this.onChromePinScroll, { passive: true });
            });
            window.addEventListener("resize", this.onChromePinScroll, { passive: true });
        },
        setupChromePin() {
            const workspace = this.$refs.workspace;
            if (!workspace) {
                return;
            }

            this.refreshChromePinListeners();

            if (typeof IntersectionObserver !== "undefined") {
                this.chromePinObserver = new IntersectionObserver(
                    () => this.scheduleChromePinUpdate(),
                    { threshold: [0, 1] }
                );
                this.chromePinObserver.observe(workspace);
            }

            this.updateChromePin();
        },
        teardownChromePinListeners() {
            if (this.chromePinScrollTargets?.length && this.onChromePinScroll) {
                this.chromePinScrollTargets.forEach((target) => {
                    target.removeEventListener("scroll", this.onChromePinScroll);
                });
            }
            if (this.onChromePinScroll) {
                window.removeEventListener("resize", this.onChromePinScroll);
            }
            this.chromePinScrollTargets = [];
            this.onChromePinScroll = null;
            if (this.chromePinFrame) {
                cancelAnimationFrame(this.chromePinFrame);
                this.chromePinFrame = null;
            }
        },
        teardownChromePin() {
            this.teardownChromePinListeners();
            if (this.chromePinObserver) {
                this.chromePinObserver.disconnect();
                this.chromePinObserver = null;
            }
        },
        buildPinnedChromeStyle(workspaceRect, headerHeight) {
            const tabWidth = 30;
            return {
                header: {
                    position: "fixed",
                    top: "0px",
                    left: `${workspaceRect.left}px`,
                    width: `${workspaceRect.width}px`,
                    zIndex: 1000,
                },
                drawer: {
                    position: "fixed",
                    top: `${headerHeight}px`,
                    left: `${workspaceRect.right - tabWidth}px`,
                    width: `${tabWidth}px`,
                    height: `calc(100vh - ${headerHeight}px)`,
                    zIndex: 999,
                },
            };
        },
        updateChromePin() {
            const workspace = this.$refs.workspace;
            const header = this.$refs.vksHeader;
            if (!header) {
                return;
            }

            const headerHeight = header.offsetHeight || 53;
            this.headerHeightPx = headerHeight;
            const headerRect = header.getBoundingClientRect();
            this.assistantPanelTopPx = Math.max(
                0,
                Math.round(headerRect.bottom)
            );

            if (!workspace) {
                return;
            }

            const workspaceRect = workspace.getBoundingClientRect();

            const shouldPin =
                this.canvasActive &&
                workspaceRect.top <= 0 &&
                workspaceRect.bottom > headerHeight + 48;

            if (shouldPin) {
                this.chromePinned = true;
                this.pinnedChromeStyle = this.buildPinnedChromeStyle(
                    workspaceRect,
                    headerHeight
                );
                return;
            }

            this.chromePinned = false;
            this.pinnedChromeStyle = {
                header: {},
                drawer: {},
            };
        },
        onToggleDrawer(sectionId) {
            this.openDrawerId = this.openDrawerId === sectionId ? null : sectionId;
        },
        onRegionZoomUpdate(nextZoom) {
            this.pendingPanSliderReset = false;
            this.regionZoom = clampRegionZoom(nextZoom);
            if (this.regionZoom > 0) {
                this.regionZoomOut = 0;
            }
        },
        onRegionZoomOutUpdate(nextZoomOut) {
            this.pendingPanSliderReset = false;
            const viewport = clampRegionViewportForDataLimit(
                this.searchSession?.region,
                {
                    regionShiftBp: this.regionShiftBp,
                    regionZoomOut: nextZoomOut,
                },
                this.zoomOutLimitRegion
            );
            this.regionZoomOut = viewport.regionZoomOut;
            this.regionShiftBp = viewport.regionShiftBp;
            if (this.regionZoomOut > 0) {
                this.regionZoom = 0;
                this.regionViewArea = 0;
            }
        },
        onRegionZoomSliderCommit() {
            this.scheduleRegionDataSync(0);
        },
        onRegionViewAreaUpdate(nextViewArea) {
            this.regionViewArea = clampRegionViewArea(nextViewArea);
        },
        resetRegionViewport() {
            this.regionZoom = 0;
            this.regionZoomOut = 0;
            this.regionViewArea = 0;
            this.regionShiftBp = 0;
            if (this.searchSession?.region) {
                this.applyDataRegion(this.activeRegion);
            }
        },
        onRegionShiftBpUpdate(nextShiftBp) {
            // Locus translate + gap fetch only when not zoomed in.
            if (this.regionZoom > 0) {
                return;
            }
            const viewport = clampRegionViewportForDataLimit(
                this.searchSession?.region,
                {
                    regionShiftBp: nextShiftBp,
                    regionZoomOut: this.regionZoomOut,
                },
                this.zoomOutLimitRegion
            );
            if (viewport.regionShiftBp !== this.regionShiftBp) {
                this.pendingPanSliderReset = true;
            }
            this.regionShiftBp = viewport.regionShiftBp;
            this.regionZoomOut = viewport.regionZoomOut;
        },
        finishRegionExtendSync() {
            const hadZoomOut = this.regionZoomOut > 0;
            const hadPanPendingReset = this.pendingPanSliderReset;

            if (!hadZoomOut && !hadPanPendingReset) {
                return;
            }

            const activeRegion = this.activeRegion;
            if (hadZoomOut && activeRegion && this.searchSession?.region) {
                this.searchSession = {
                    ...this.searchSession,
                    region: cloneGenomicRegion(activeRegion),
                    regionLabel: formatRegion(activeRegion),
                };
                this.regionShiftBp = 0;
                this.syncUrlSearchParams(this.searchSession);
            }

            // Zoom-out commit / unzoomed locus pan: collapse slider to identity.
            // Do not clear zoom-in; Hand pan while zoomed never reaches here.
            this.regionZoom = 0;
            this.regionZoomOut = 0;
            this.regionViewArea = 0;
            this.pendingPanSliderReset = false;
        },
        onRegionPanEnd() {
            if (this.regionZoom > 0) {
                return;
            }
            this.scheduleRegionDataSync(0);
        },
        onTogglePositionMarker(position) {
            const viewRegion = this.viewRegion || this.searchSession?.region;
            if (!viewRegion) {
                return;
            }
            this.plotMarkersState = {
                ...this.plotMarkersState,
                positionMarkers: togglePositionMarker(
                    this.plotMarkersState.positionMarkers,
                    position,
                    viewRegion
                ),
            };
        },
        onToggleStarVariant(row) {
            this.plotMarkersState = {
                ...this.plotMarkersState,
                starredVariants: toggleStarredVariant(
                    this.plotMarkersState.starredVariants,
                    row
                ),
            };
        },
        async onSetReferenceVariant(row) {
            if (!row || !this.searchSession) {
                return;
            }

            const refVariant = rowToLdVariant(row);
            const region = this.dataRegion || this.searchSession.region;
            this.associationsState = {
                ...this.associationsState,
                ldLoading: true,
                ldError: null,
            };

            try {
                const rowsWithLd = await enrichAssociationRowsWithLdScoresForRef(
                    this.associationsState.rows,
                    this.searchSession,
                    row,
                    region
                );
                const ldAvailable = rowsWithLd.some(
                    (entry) => entry.LDS != null && !Number.isNaN(entry.LDS)
                );
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: ldAvailable
                        ? null
                        : "LD scores could not be loaded for the selected reference variant.",
                    rows: rowsWithLd,
                };
                if (ldAvailable) {
                    this.plotOverlaysState = {
                        ...this.plotOverlaysState,
                        refVariant,
                        refVariantUserSet: true,
                    };
                }
            } catch (ldError) {
                console.warn("Variant Sifter reference LD fetch failed", ldError);
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: "LD scores could not be loaded for the selected reference variant.",
                };
            }
        },
        scheduleRegionDataSync(delayMs = 300) {
            if (this.regionPanSyncTimer) {
                clearTimeout(this.regionPanSyncTimer);
                this.regionPanSyncTimer = null;
            }
            if (delayMs <= 0) {
                this.$nextTick(() => {
                    this.syncRegionDataToView();
                });
                return;
            }
            this.regionPanSyncTimer = setTimeout(() => {
                this.regionPanSyncTimer = null;
                this.syncRegionDataToView();
            }, delayMs);
        },
        applyDataRegion(targetDataRegion) {
            if (!targetDataRegion) {
                return;
            }

            const nextDataRegion = cloneGenomicRegion(targetDataRegion);
            if (genomicRegionsEqual(this.dataRegion, nextDataRegion)) {
                return;
            }

            this.dataRegion = nextDataRegion;
            const rows = filterAssociationRowsInRegion(
                this.associationsState.rows,
                nextDataRegion
            );
            const genes = filterGenesInRegion(this.genesState.data, nextDataRegion);
            const recombData = trimRecombData(
                this.plotOverlaysState.recombData,
                nextDataRegion
            );

            this.associationsState = {
                ...this.associationsState,
                rows,
            };
            this.genesState = {
                ...this.genesState,
                data: genes.length ? genes : null,
            };
            this.plotOverlaysState = {
                ...this.plotOverlaysState,
                recombData,
            };
            this.applyGlobalEnrichmentDataRegion(nextDataRegion);
        },
        applyGlobalEnrichmentDataRegion(targetDataRegion) {
            const state = this.globalEnrichmentState;
            if (!state?.annoRows?.length || !targetDataRegion) {
                return;
            }

            const annoRows = filterAnnoRowsInRegion(state.annoRows, targetDataRegion);
            this.globalEnrichmentState = applyGlobalEnrichmentAnnoRows(state, annoRows);
        },
        flushStreamedAnnoRows(mergedAnnoRows, activeRegion) {
            const annoRows = filterAnnoRowsInRegion(mergedAnnoRows, activeRegion);
            this.globalEnrichmentState = {
                ...applyGlobalEnrichmentAnnoRows(this.globalEnrichmentState, annoRows),
                loading: false,
            };
        },
        setRegionLoadStep(stepId, status) {
            this.regionLoadProgress = patchRegionLoadStep(
                this.regionLoadProgress,
                stepId,
                status
            );
        },
        closeRegionLoadProgressIfSettled() {
            if (
                !this.regionLoadProgress.active ||
                !regionLoadProgressSettled(this.regionLoadProgress) ||
                !regionLoadProgressCanAutoDismiss(this.regionLoadProgress)
            ) {
                return;
            }
            if (this.regionLoadDismissTimer) {
                return;
            }
            this.regionLoadDismissTimer = setTimeout(() => {
                this.regionLoadProgress = finishRegionLoadProgress(this.regionLoadProgress);
                this.regionLoadDismissTimer = null;
            }, 700);
        },
        dismissRegionLoadProgress() {
            if (this.regionLoadDismissTimer) {
                clearTimeout(this.regionLoadDismissTimer);
                this.regionLoadDismissTimer = null;
            }
            this.regionLoadProgress = finishRegionLoadProgress(this.regionLoadProgress);
        },
        flushStreamedAssociationRows(mergedRows, activeRegion, gapRegion = null) {
            const rowsForRegion = filterAssociationRowsInRegion(mergedRows, activeRegion);
            if (gapRegion) {
                this.dataRegion = unionGenomicRegions(this.dataRegion, gapRegion);
            }
            this.associationsState = {
                ...this.associationsState,
                rows: rowsForRegion,
                ldLoading: false,
                ldError: null,
            };
        },
        flushStreamedGenes(mergedGenes, activeRegion) {
            const genesForRegion = filterGenesInRegion(mergedGenes, activeRegion);
            this.genesState = {
                ...this.genesState,
                ready: true,
                loading: false,
                data: genesForRegion.length ? genesForRegion : null,
                error: genesForRegion.length ? null : this.genesState.error,
            };
        },
        flushStreamedRecomb(mergedRecomb, activeRegion) {
            this.plotOverlaysState = {
                ...this.plotOverlaysState,
                ready: true,
                loading: false,
                recombData: trimRecombData(mergedRecomb, activeRegion),
            };
        },
        async syncRegionDataToView() {
            if (!this.searchSession?.region || !this.dataRegion) {
                return;
            }

            const activeRegion = this.activeRegion;
            if (!activeRegion) {
                return;
            }

            const gaps = computeFetchGaps(this.dataRegion, activeRegion);

            if (!gaps.length) {
                this.applyDataRegion(activeRegion);
                this.syncCredibleSetsToActiveRegion(activeRegion);
                this.finishRegionExtendSync();
                return;
            }

            const token = ++this.regionExtendToken;
            if (this.regionLoadDismissTimer) {
                clearTimeout(this.regionLoadDismissTimer);
                this.regionLoadDismissTimer = null;
            }
            this.regionLoadProgress = startRegionLoadProgress();
            const associationsHost = this.bioIndexHostFor("associations");
            const genesHost = this.bioIndexHostFor("genes");
            const regionsHost = this.bioIndexHostFor("regions");
            if (!associationsHost) {
                this.regionLoadProgress = finishRegionLoadProgress(this.regionLoadProgress);
                return;
            }

            const plotConfig = buildAssociationsRegionPlotConfig(this.searchSession);
            let mergedRows = this.associationsState.rows;
            let mergedGenes = this.genesState.data || [];
            let mergedRecomb = this.plotOverlaysState.recombData;
            let mergedAnnoRows = this.globalEnrichmentState?.annoRows || [];
            let extendedAssociationRows = false;
            let associationFetchFailed = false;

            this.setRegionLoadStep("associations", VKS_REGION_LOAD_STATUS.LOADING);

            try {
                for (const gap of gaps) {
                    if (token !== this.regionExtendToken) {
                        return;
                    }

                    const gapRegion = {
                        chr: activeRegion.chr,
                        start: gap.start,
                        end: gap.end,
                    };
                    const gapSession = {
                        ...this.searchSession,
                        region: gapRegion,
                    };

                    try {
                        const result = await fetchAssociations(gapSession, associationsHost, this.projectId);
                        const formattedRows = formatAssociationRows(result.rows, gapSession);
                        if (formattedRows.length) {
                            extendedAssociationRows = true;
                        }
                        mergedRows = mergeAssociationRowsByVariantAndAncestry(
                            mergedRows,
                            formattedRows,
                            primaryAssociationAncestry(this.searchSession)
                        );
                        this.flushStreamedAssociationRows(mergedRows, activeRegion, gapRegion);

                        for (const ancestry of this.associationsState.selectedAncestries || []) {
                            if (token !== this.regionExtendToken) {
                                return;
                            }
                            if (!ancestry || ancestry === primaryAssociationAncestry(this.searchSession)) {
                                continue;
                            }
                            try {
                                const ancestrySession = {
                                    ...gapSession,
                                    ancestry,
                                };
                                const ancestryResult = await fetchAssociations(
                                    ancestrySession,
                                    associationsHost,
                                    this.projectId
                                );
                                const ancestryRows = formatAssociationRows(
                                    ancestryResult.rows,
                                    ancestrySession
                                );
                                if (ancestryRows.length) {
                                    extendedAssociationRows = true;
                                }
                                mergedRows = mergeAssociationRowsByVariantAndAncestry(
                                    mergedRows,
                                    ancestryRows,
                                    primaryAssociationAncestry(this.searchSession)
                                );
                                this.flushStreamedAssociationRows(
                                    mergedRows,
                                    activeRegion,
                                    gapRegion
                                );
                            } catch (ancestryError) {
                                console.warn(
                                    `Variant Sifter ${ancestry} association gap fetch failed`,
                                    ancestryError
                                );
                            }
                        }
                    } catch (assocError) {
                        associationFetchFailed = true;
                        console.warn("Variant Sifter association gap fetch failed", assocError);
                    }
                }

                if (token !== this.regionExtendToken) {
                    return;
                }

                mergedRows = filterAssociationRowsInRegion(mergedRows, activeRegion);
                this.dataRegion = cloneGenomicRegion(activeRegion);
                this.flushStreamedAssociationRows(mergedRows, activeRegion);
                this.setRegionLoadStep(
                    "associations",
                    associationFetchFailed && !extendedAssociationRows
                        ? VKS_REGION_LOAD_STATUS.FAILED
                        : VKS_REGION_LOAD_STATUS.DONE
                );

                let genesFetchFailed = false;
                let recombFetchFailed = false;

                this.setRegionLoadStep("genes", VKS_REGION_LOAD_STATUS.LOADING);
                this.setRegionLoadStep("recomb", VKS_REGION_LOAD_STATUS.LOADING);
                this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.LOADING);

                await Promise.all([
                    (async () => {
                        for (const gap of gaps) {
                            if (token !== this.regionExtendToken) {
                                return;
                            }
                            const gapRegion = {
                                chr: activeRegion.chr,
                                start: gap.start,
                                end: gap.end,
                            };
                            try {
                                const newGenes = await fetchGenesTrackData(
                                    gapRegion,
                                    plotConfig["genome reference"],
                                    genesHost
                                );
                                mergedGenes = mergeGenesByName(mergedGenes, newGenes);
                                this.flushStreamedGenes(mergedGenes, activeRegion);
                            } catch (genesError) {
                                genesFetchFailed = true;
                                console.warn("Variant Sifter genes gap fetch failed", genesError);
                            }
                        }
                        if (token !== this.regionExtendToken) {
                            return;
                        }
                        this.setRegionLoadStep(
                            "genes",
                            genesFetchFailed && !mergedGenes.length
                                ? VKS_REGION_LOAD_STATUS.FAILED
                                : VKS_REGION_LOAD_STATUS.DONE
                        );
                    })(),
                    (async () => {
                        for (const gap of gaps) {
                            if (token !== this.regionExtendToken) {
                                return;
                            }
                            const gapRegion = {
                                chr: activeRegion.chr,
                                start: gap.start,
                                end: gap.end,
                            };
                            try {
                                const newRecomb = await fetchRecombinationRate(gapRegion);
                                if (newRecomb) {
                                    mergedRecomb = mergeRecombData(mergedRecomb, newRecomb);
                                    this.flushStreamedRecomb(mergedRecomb, activeRegion);
                                }
                            } catch (recombError) {
                                recombFetchFailed = true;
                                console.warn("Variant Sifter recomb gap fetch failed", recombError);
                            }
                        }
                        if (token !== this.regionExtendToken) {
                            return;
                        }
                        this.setRegionLoadStep(
                            "recomb",
                            recombFetchFailed && !mergedRecomb?.position?.length
                                ? VKS_REGION_LOAD_STATUS.FAILED
                                : VKS_REGION_LOAD_STATUS.DONE
                        );
                    })(),
                    (async () => {
                        let annoFetchFailed = false;
                        for (const gap of gaps) {
                            if (token !== this.regionExtendToken) {
                                return;
                            }
                            const gapRegion = {
                                chr: activeRegion.chr,
                                start: gap.start,
                                end: gap.end,
                            };
                            try {
                                const newAnnoRows = await fetchLocusAnnotations(gapRegion, regionsHost);
                                if (newAnnoRows?.length) {
                                    mergedAnnoRows = mergeAnnoRows(mergedAnnoRows, newAnnoRows);
                                    this.flushStreamedAnnoRows(mergedAnnoRows, activeRegion);
                                }
                            } catch (annoError) {
                                annoFetchFailed = true;
                                console.warn(
                                    "Variant Sifter annotation gap fetch failed",
                                    annoError
                                );
                            }
                        }
                        if (token !== this.regionExtendToken) {
                            return;
                        }
                        this.flushStreamedAnnoRows(mergedAnnoRows, activeRegion);
                        this.setRegionLoadStep(
                            "globalEnrichment",
                            annoFetchFailed && !mergedAnnoRows.length
                                ? VKS_REGION_LOAD_STATUS.FAILED
                                : VKS_REGION_LOAD_STATUS.DONE
                        );
                    })(),
                ]);

                if (token !== this.regionExtendToken) {
                    return;
                }

                if (extendedAssociationRows) {
                    this.setRegionLoadStep("ld", VKS_REGION_LOAD_STATUS.LOADING);
                    const ldOk = await this.refreshRegionLdScores(
                        mergedRows,
                        activeRegion,
                        () => token !== this.regionExtendToken
                    );
                    if (token !== this.regionExtendToken) {
                        return;
                    }
                    this.setRegionLoadStep(
                        "ld",
                        ldOk ? VKS_REGION_LOAD_STATUS.DONE : VKS_REGION_LOAD_STATUS.FAILED
                    );
                } else {
                    this.setRegionLoadStep("ld", VKS_REGION_LOAD_STATUS.DONE);
                }

                this.setRegionLoadStep("credibleSets", VKS_REGION_LOAD_STATUS.LOADING);
                const credibleSetsOk = await this.loadCredibleSetsList(
                    {
                        ...this.searchSession,
                        region: activeRegion,
                    },
                    { preserveSelection: true }
                );
                if (token !== this.regionExtendToken) {
                    return;
                }
                this.setRegionLoadStep(
                    "credibleSets",
                    credibleSetsOk
                        ? VKS_REGION_LOAD_STATUS.DONE
                        : VKS_REGION_LOAD_STATUS.FAILED
                );

                this.finishRegionExtendSync();
            } catch (error) {
                if (token !== this.regionExtendToken) {
                    return;
                }
                console.warn("Variant Sifter region extension failed", error);
                this.regionLoadProgress = {
                    ...this.regionLoadProgress,
                    steps: this.regionLoadProgress.steps.map((step) =>
                        step.status === VKS_REGION_LOAD_STATUS.LOADING
                            ? { ...step, status: VKS_REGION_LOAD_STATUS.FAILED }
                            : step
                    ),
                };
                this.finishRegionExtendSync();
                this.closeRegionLoadProgressIfSettled();
            } finally {
                if (token === this.regionExtendToken) {
                    this.closeRegionLoadProgressIfSettled();
                }
            }
        },
        onMenuAction(payload) {
            if (payload.action === "resetSearch") {
                this.resetSearch();
                return;
            }
            if (payload.action === "applyRecentSearch") {
                this.applyRecentSearch(payload.recentSearch);
                return;
            }
            if (payload.action === "exportSession") {
                this.exportSession();
                return;
            }
            if (payload.action === "exportHtmlReport") {
                this.exportHtmlReport();
                return;
            }
            if (payload.action === "importSession") {
                this.openSessionImport();
                return;
            }
            if (payload.action === "gettingAround") {
                this.workspaceGuideOpen = true;
            }
        },
        applyRecentSearch(entry) {
            if (!entry?.phenotypeName || !entry?.region) {
                return;
            }

            const nextProjectId = normalizeProjectId(entry.projectId);
            if (nextProjectId !== this.projectId) {
                this.projectId = nextProjectId;
                this.syncUrlProjectParam();
            }

            const phenotypes = projectPhenotypes(
                this.projectId,
                this.phenotypesInUse || []
            );
            const phenotype = phenotypes.find(
                (item) => item.name === entry.phenotypeName
            );
            if (!phenotype) {
                this.welcomeInitialValues = {
                    phenotype: entry.phenotypeName,
                    ancestry: entry.ancestry || "",
                    geneOrVariantQuery:
                        entry.geneOrVariantQuery || entry.regionLabel || "",
                    regionExpandBp: entry.regionExpandBp ?? null,
                    errorMessage: `Phenotype "${entry.phenotypeName}" is not available in the current project.`,
                };
                this.welcomeOpen = true;
                this.canvasActive = false;
                return;
            }

            this.onStartSearch(
                {
                    phenotype,
                    ancestry: entry.ancestry || null,
                    region: {
                        chr: entry.region.chr,
                        start: Number(entry.region.start),
                        end: Number(entry.region.end),
                    },
                    regionLabel: entry.regionLabel || formatRegion(entry.region),
                    geneOrVariantQuery:
                        entry.geneOrVariantQuery || entry.regionLabel || "",
                    regionExpandBp: entry.regionExpandBp ?? null,
                },
                { subAncestries: entry.subAncestries || [] }
            );
        },
        onVisibleSectionIdsUpdate(ids) {
            this.visibleSectionIds = normalizeVisibleSectionIds(ids, this.sections);
            if (
                this.openDrawerId &&
                !isSectionVisible(this.visibleSectionIds, this.openDrawerId)
            ) {
                this.openDrawerId = null;
            }
        },
        exportSession() {
            try {
                exportVariantSifterSession({
                    projectId: this.projectId,
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    plotMarkersState: this.plotMarkersState,
                    credibleSetsState: this.credibleSetsState,
                    globalEnrichmentState: this.globalEnrichmentState,
                    v2gState: this.v2gState,
                    s2gState: this.s2gState,
                    regionZoom: this.regionZoom,
                    regionZoomOut: this.regionZoomOut,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
                    visibleSectionIds: this.visibleSectionIds,
                    mappingState: this.mappingState,
                    workspaceMappingFilter: this.workspaceMappingFilter,
                });
                this.exportSessionOpen = true;
            } catch (error) {
                window.alert(error.message || "Could not export session.");
            }
        },
        async exportHtmlReport() {
            if (!this.canvasActive || !this.searchSession) {
                window.alert("Run a search before exporting an HTML report.");
                return;
            }

            try {
                // Close overlays that can cover tracks; canvases stay painted.
                const wasDataTableOpen = this.dataTableOpen;
                const wasAssistantOpen = this.aiAssistantOpen;
                this.dataTableOpen = false;
                this.aiAssistantOpen = false;
                await this.$nextTick();

                const result = await exportVariantSifterHtmlReport({
                    rootEl: this.$refs.workspace || this.$el,
                    searchSession: this.searchSession,
                    projectId: this.projectId,
                    viewRegion: this.viewRegion || this.searchSession.region,
                    associationRows: this.associationsState?.rows || [],
                    mappingState: this.mappingState,
                    credibleSetsState: this.credibleSetsState,
                    globalEnrichmentState: this.globalEnrichmentState,
                    v2gState: this.v2gState,
                    s2gState: this.s2gState,
                    workspaceMappingFilter: this.workspaceMappingFilter,
                });

                this.dataTableOpen = wasDataTableOpen;
                this.aiAssistantOpen = wasAssistantOpen;

                if (!result?.ok && result?.reason === "cancelled") {
                    return;
                }
                if (!result?.ok) {
                    window.alert("Could not save the HTML report.");
                }
            } catch (error) {
                window.alert(error?.message || "Could not export HTML report.");
            }
        },
        async onExportSessionConfirm({ filename }) {
            if (this.exportSessionBusy) {
                return;
            }

            try {
                const payload = exportVariantSifterSession({
                    projectId: this.projectId,
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    plotMarkersState: this.plotMarkersState,
                    credibleSetsState: this.credibleSetsState,
                    globalEnrichmentState: this.globalEnrichmentState,
                    v2gState: this.v2gState,
                    s2gState: this.s2gState,
                    regionZoom: this.regionZoom,
                    regionZoomOut: this.regionZoomOut,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
                    visibleSectionIds: this.visibleSectionIds,
                    mappingState: this.mappingState,
                    workspaceMappingFilter: this.workspaceMappingFilter,
                });
                this.exportSessionBusy = true;
                const result = await saveJsonBundle(filename, payload);
                if (result.ok) {
                    this.exportSessionOpen = false;
                }
            } catch (error) {
                window.alert(error.message || "Could not export session.");
            } finally {
                this.exportSessionBusy = false;
            }
        },
        openSessionImport() {
            const input = this.$refs.sessionImportInput;
            if (input) {
                input.value = "";
                input.click();
            }
        },
        async onSessionFileSelected(event) {
            const file = event.target.files?.[0];
            if (!file) {
                return;
            }

            try {
                const payload = await readSessionFile(file);
                const projectId = normalizeProjectId(payload.projectId);
                const phenotypes = projectPhenotypes(
                    projectId,
                    this.phenotypesInUse || []
                );
                const restored = importVariantSifterSession(payload, phenotypes);
                this.projectId = projectId;
                this.syncUrlProjectParam();
                this.applyImportedSession(restored);
            } catch (error) {
                window.alert(error.message || "Could not import session.");
            } finally {
                event.target.value = "";
            }
        },
        applyImportedSession(restored) {
            if (regionExceedsActiveDataLimit(restored.searchSession?.region)) {
                throw new Error(activeRegionDataLimitMessage());
            }

            if (restored.projectId != null) {
                this.projectId = normalizeProjectId(restored.projectId);
            }

            const limitRegion = resolveZoomOutLimitRegion(
                restored.searchSession.region,
                restored.searchSession.regionExpandBp
            );
            const viewport = clampRegionViewportForDataLimit(
                restored.searchSession.region,
                {
                    regionShiftBp: restored.regionShiftBp ?? restored.viewOffsetBp ?? 0,
                    regionZoomOut: restored.regionZoomOut ?? 0,
                },
                limitRegion
            );

            this.associationsRequestToken += 1;
            this.genesRequestToken += 1;
            this.plotOverlaysRequestToken += 1;
            this.credibleSetsRequestToken += 1;
            this.searchSession = restored.searchSession;
            this.associationsState = restored.associationsState;
            this.genesState = restored.genesState || emptyGenesState();
            this.plotOverlaysState =
                restored.plotOverlaysState || emptyPlotOverlaysState();
            this.plotMarkersState =
                restored.plotMarkersState || emptyPlotMarkersState();
            this.credibleSetsState =
                restored.credibleSetsState || emptyCredibleSetsState();
            this.globalEnrichmentState =
                restored.globalEnrichmentState || emptyGlobalEnrichmentState();
            this.v2gState = restored.v2gState || emptyV2gState();
            this.s2gState = restored.s2gState || emptyS2gState();
            this.globalEnrichmentRequestToken += 1;
            this.v2gRequestToken += 1;
            this.s2gRequestToken += 1;
            this.regionZoom = restored.regionZoom ?? 0;
            this.regionViewArea = restored.regionViewArea ?? 0;
            this.regionShiftBp = viewport.regionShiftBp;
            this.regionZoomOut = viewport.regionZoomOut;
            this.pendingPanSliderReset = false;
            this.dataRegion = restored.dataRegion
                ? cloneGenomicRegion(restored.dataRegion)
                : cloneGenomicRegion(restored.searchSession.region);
            this.lastCredibleSetsListRegion = computeActiveRegion(
                restored.searchSession.region,
                restored.regionShiftBp ?? restored.viewOffsetBp ?? 0
            );
            this.openDrawerId = restored.openDrawerId;
            this.visibleSectionIds = normalizeVisibleSectionIds(
                restored.visibleSectionIds,
                this.sections
            );
            if (
                this.openDrawerId &&
                !isSectionVisible(this.visibleSectionIds, this.openDrawerId)
            ) {
                this.openDrawerId = null;
            }
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.welcomeInitialValues = null;
            this.dataTableOpen = restored.dataTableOpen ?? false;
            this.mappingState = normalizeMappingState(restored.mappingState);
            this.workspaceMappingFilter = normalizeWorkspaceMappingFilter(
                restored.workspaceMappingFilter
            );
            this.assistantState = emptyAssistantState();
            this.aiAssistantOpen = false;
            this.syncUrlSearchParams(restored.searchSession);
            this.afterSessionRestored(restored);
        },
        afterSessionRestored(restored) {
            if (restored.searchSession) {
                this.probeAncestryAssociationAvailabilityForSession(restored.searchSession);
            }
            if (restored.globalEnrichmentState) {
                this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.DONE);
                return;
            }
            this.loadGlobalEnrichmentForSession(restored.searchSession);
        },
        offerGeTissueClassifyAction(session, catalog) {
            if (!session || !catalog?.tissues?.length) {
                return;
            }
            const geAction = findAssistantAction("filter_ge_relevance");
            const understudiedAction = findAssistantAction(
                "find_understudied_bottom_line"
            );
            const credibleSetCount = (this.credibleSetsState?.available || []).length;
            const steps = [
                {
                    id: "step-filter-ge-relevance",
                    actionId: "filter_ge_relevance",
                    label:
                        geAction?.label ||
                        "Classify tissues by phenotype relevance",
                },
                {
                    id: "step-find-understudied-bottom-line",
                    actionId: "find_understudied_bottom_line",
                    label:
                        understudiedAction?.label ||
                        "Find understudied bottom-line variants in this locus",
                },
            ];
            const stepStates = {};
            steps.forEach((step) => {
                stepStates[step.id] = "pending";
            });
            this.aiAssistantOpen = true;
            this.assistantState = {
                ...this.assistantState,
                activeTab: "request",
                executing: false,
                executionProgressLabel: "",
                cs2ctStarPrompt: null,
                understudiedStarPrompt: null,
                understudiedAncestry: null,
                plan: createAssistantPlan(steps, { executeLabel: "Execute" }),
                stepStates,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantMessage(
                        buildGeRelevanceOfferMessage(session, catalog, {
                            credibleSetCount,
                        })
                    ),
                    createAssistantMessage(buildUnderstudiedOfferMessage(session)),
                ]),
            };
        },
        offerUnderstudiedForAncestry(ancestry) {
            if (!this.searchSession || !ancestry) {
                return;
            }
            const understudiedAction = findAssistantAction(
                "find_understudied_bottom_line"
            );
            if (!understudiedAction) {
                return;
            }

            const stepId = this.researchActionStepId("find_understudied_bottom_line");
            const existingSteps = this.assistantState?.plan?.steps || [];
            const hasUnderstudiedStep = existingSteps.some(
                (step) => step.actionId === "find_understudied_bottom_line"
            );
            const nextSteps = hasUnderstudiedStep
                ? existingSteps
                : [
                      ...existingSteps,
                      {
                          id: stepId,
                          actionId: "find_understudied_bottom_line",
                          label: understudiedAction.label,
                      },
                  ];
            const stepStates = {
                ...(this.assistantState.stepStates || {}),
                [stepId]: "pending",
            };

            this.aiAssistantOpen = true;
            this.assistantState = {
                ...this.assistantState,
                activeTab: "request",
                executing: false,
                executionProgressLabel: "",
                understudiedStarPrompt: null,
                understudiedAncestry: null,
                plan: createAssistantPlan(nextSteps, { executeLabel: "Execute" }),
                stepStates,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantMessage(
                        [
                            `${ancestry} association data is loaded.`,
                            buildUnderstudiedOfferMessage({
                                ...this.searchSession,
                                ancestry: primaryAssociationAncestry(this.searchSession),
                            }),
                            `Loaded ancestries: ${this.listUnderstudiedTargetAncestries().join(
                                ", "
                            )}.`,
                        ].join(" ")
                    ),
                ]),
            };
        },
        researchActionStepId(actionId) {
            if (actionId === "filter_ge_relevance") {
                return "step-filter-ge-relevance";
            }
            if (actionId === "find_understudied_bottom_line") {
                return "step-find-understudied-bottom-line";
            }
            if (actionId === "find_genetic_correlations") {
                return "step-find-genetic-correlations";
            }
            return `step-${actionId}`;
        },
        isResearchActionStepDone(actionId) {
            const stepId = this.researchActionStepId(actionId);
            return (this.assistantState?.stepStates || {})[stepId] === "done";
        },
        offerRemainingResearchAction(completedActionId) {
            const remainingId =
                completedActionId === "filter_ge_relevance"
                    ? "find_understudied_bottom_line"
                    : completedActionId === "find_understudied_bottom_line"
                      ? "filter_ge_relevance"
                      : null;
            if (!remainingId || this.isResearchActionStepDone(remainingId)) {
                return;
            }

            if (
                remainingId === "filter_ge_relevance" &&
                !this.globalEnrichmentState?.catalog?.tissues?.length
            ) {
                return;
            }

            const remainingAction = findAssistantAction(remainingId);
            if (!remainingAction || !this.searchSession) {
                return;
            }

            const remainingStepId = this.researchActionStepId(remainingId);
            const existingSteps = this.assistantState?.plan?.steps || [];
            const hasRemainingStep = existingSteps.some(
                (step) => step.actionId === remainingId
            );
            const nextSteps = hasRemainingStep
                ? existingSteps
                : [
                      ...existingSteps,
                      {
                          id: remainingStepId,
                          actionId: remainingId,
                          label: remainingAction.label,
                      },
                  ];
            const stepStates = {
                ...(this.assistantState.stepStates || {}),
            };
            if (stepStates[remainingStepId] !== "done") {
                stepStates[remainingStepId] = "pending";
            }

            const offerText = hasRemainingStep
                ? `Optional next: run “${remainingAction.label}” from the steps above.`
                : remainingId === "find_understudied_bottom_line"
                  ? buildUnderstudiedOfferMessage(this.searchSession)
                  : buildGeRelevanceOfferMessage(
                        this.searchSession,
                        this.globalEnrichmentState?.catalog,
                        {
                            credibleSetCount: (
                                this.credibleSetsState?.available || []
                            ).length,
                        }
                    );

            this.aiAssistantOpen = true;
            this.assistantState = {
                ...this.assistantState,
                activeTab: "request",
                plan: createAssistantPlan(nextSteps, { executeLabel: "Execute" }),
                stepStates,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantMessage(
                        hasRemainingStep
                            ? offerText
                            : `Next optional step: ${remainingAction.label}. ${offerText}`
                    ),
                ]),
            };
        },
        async loadGlobalEnrichmentForSession(
            session,
            { offerClassifyAction = false, requestToken } = {}
        ) {
            if (!session?.region) {
                return false;
            }

            const geToken = requestToken ?? ++this.globalEnrichmentRequestToken;
            const geHost = this.bioIndexHostFor("global-enrichment");
            const regionsHost = this.bioIndexHostFor("regions");
            if (!geHost && !regionsHost) {
                this.globalEnrichmentState = {
                    ...emptyGlobalEnrichmentState(),
                    error: "BioIndex host is not available.",
                };
                this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.FAILED);
                return false;
            }

            this.globalEnrichmentState = {
                ...emptyGlobalEnrichmentState(),
                loading: true,
            };
            this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.LOADING);

            try {
                const [geRows, annoRows] = await Promise.all([
                    fetchGlobalEnrichment(session, geHost),
                    fetchLocusAnnotations(session.region, regionsHost),
                ]);
                if (geToken !== this.globalEnrichmentRequestToken) {
                    return false;
                }

                const annoData = buildAnnoDataFromRows(annoRows);
                const catalog = extractGeCatalog(annoData);
                this.globalEnrichmentState = {
                    loading: false,
                    error: Object.keys(annoData).length
                        ? null
                        : "No regulatory annotations were found for this locus.",
                    geRows,
                    annoRows,
                    annoData,
                    catalog,
                    llmRelevance: emptyGeLlmRelevanceState(),
                    enabledMutedAnnotations: [],
                    enabledMutedAnnotationTissues: {},
                    disabledAnnotationTissues: {},
                    selectedAnnotations: [...catalog.annotations],
                    tissueTrackSort: normalizeGeTissueTrackSort(
                        this.globalEnrichmentState?.tissueTrackSort
                    ),
                    geTrackPValueMax: normalizeGeTrackPValueMax(
                        this.globalEnrichmentState?.geTrackPValueMax
                    ),
                    selectedMethods: null,
                    selectedSources: null,
                    activeAnnotation: null,
                    selectedTissues: [],
                    selectedTissuesByAnnotation: {},
                    selectedBiosamples: [],
                    biosampleMethodOptions: [],
                    biosampleSourceOptions: [],
                    biosampleRegionsByAnnotation: {},
                    biosampleLoading: false,
                };
                this.setRegionLoadStep(
                    "globalEnrichment",
                    Object.keys(annoData).length
                        ? VKS_REGION_LOAD_STATUS.DONE
                        : VKS_REGION_LOAD_STATUS.FAILED
                );

                if (offerClassifyAction && Object.keys(annoData).length && catalog.tissues?.length) {
                    this.$nextTick(() => {
                        if (geToken !== this.globalEnrichmentRequestToken) {
                            return;
                        }
                        this.offerGeTissueClassifyAction(session, catalog);
                    });
                }
                return true;
            } catch (error) {
                if (geToken !== this.globalEnrichmentRequestToken) {
                    return false;
                }
                console.warn("Variant Sifter global enrichment load failed", error);
                this.globalEnrichmentState = {
                    ...emptyGlobalEnrichmentState(),
                    error: "Failed to load global enrichment for this locus.",
                };
                this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.FAILED);
                return false;
            }
        },
        resetSearch() {
            this.associationsRequestToken += 1;
            this.genesRequestToken += 1;
            this.plotOverlaysRequestToken += 1;
            this.credibleSetsRequestToken += 1;
            this.globalEnrichmentRequestToken += 1;
            this.v2gRequestToken += 1;
            this.s2gRequestToken += 1;
            this.assistantActionToken += 1;
            this.searchSession = null;
            this.associationsState = emptyAssociationsState();
            this.genesState = emptyGenesState();
            this.plotOverlaysState = emptyPlotOverlaysState();
            this.plotMarkersState = emptyPlotMarkersState();
            this.credibleSetsState = emptyCredibleSetsState();
            this.globalEnrichmentState = emptyGlobalEnrichmentState();
            this.v2gState = emptyV2gState();
            this.s2gState = emptyS2gState();
            this.assistantState = emptyAssistantState();
            this.aiAssistantOpen = false;
            this.lastCredibleSetsListRegion = null;
            this.pendingSubAncestries = [];
            this.dataRegion = null;
            this.regionShiftBp = 0;
            this.regionLoadProgress = emptyRegionLoadProgress();
            this.resetRegionViewport();
            this.openDrawerId = null;
            this.dataTableOpen = false;
            this.mappingState = emptyMappingState();
            this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
            this.settingsOpen = false;
            this.visibleSectionIds = defaultVisibleSectionIds(this.sections);
            this.welcomeInitialValues = null;
            this.welcomeOpen = true;
            this.canvasActive = false;
            this.clearUrlSearchParams();
        },
        clearUrlSearchParams() {
            if (!this.utilsBox?.keyParams) {
                return;
            }
            this.utilsBox.keyParams.set({
                phenotype: undefined,
                region: undefined,
                ancestry: undefined,
                sub_ancestries: undefined,
            });
            this.syncUrlProjectParam();
        },
        onStartSearch(session, { subAncestries = [] } = {}) {
            if (regionExceedsActiveDataLimit(session.region)) {
                this.welcomeInitialValues = {
                    phenotype: session.phenotype?.name || "",
                    ancestry: session.ancestry || "",
                    geneOrVariantQuery: session.geneOrVariantQuery || session.regionLabel || "",
                    regionExpandBp: session.regionExpandBp ?? null,
                    errorMessage: activeRegionDataLimitMessage(),
                };
                this.welcomeOpen = true;
                this.canvasActive = false;
                return;
            }

            this.searchSession = session;
            this.pendingSubAncestries = parseSubAncestriesParam(
                subAncestries,
                session.ancestry || "Mixed"
            );
            this.assistantActionToken += 1;
            this.assistantState = emptyAssistantState();
            this.aiAssistantOpen = false;
            this.regionZoom = 0;
            this.regionZoomOut = 0;
            this.regionViewArea = 0;
            this.regionShiftBp = 0;
            this.dataRegion = cloneGenomicRegion(session.region);
            this.genesState = emptyGenesState();
            this.plotOverlaysState = emptyPlotOverlaysState();
            this.plotMarkersState = emptyPlotMarkersState();
            this.credibleSetsState = emptyCredibleSetsState();
            this.globalEnrichmentState = emptyGlobalEnrichmentState();
            this.v2gState = emptyV2gState();
            this.s2gState = emptyS2gState();
            this.mappingState = emptyMappingState();
            this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
            this.v2gRequestToken += 1;
            this.s2gRequestToken += 1;
            this.lastCredibleSetsListRegion = null;
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.syncUrlSearchParams(session);
            this.recentSearches = pushRecentSearch(session, {
                projectId: this.projectId,
                subAncestries: this.pendingSubAncestries,
            });
            this.loadInitialSearchData(session);
        },
        syncCredibleSetsToActiveRegion(activeRegion) {
            if (!this.searchSession?.phenotype || !activeRegion) {
                return;
            }
            if (genomicRegionsEqual(this.lastCredibleSetsListRegion, activeRegion)) {
                return;
            }

            this.loadCredibleSetsList(
                {
                    ...this.searchSession,
                    region: activeRegion,
                },
                { preserveSelection: true }
            );
        },
        async loadCredibleSetsList(session, options = {}) {
            const { preserveSelection = false } = options;
            const token = ++this.credibleSetsRequestToken;

            if (preserveSelection) {
                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    listLoading: true,
                    listError: null,
                };
            } else {
                this.credibleSetsState = {
                    ...emptyCredibleSetsState(),
                    listLoading: true,
                };
                this.lastCredibleSetsListRegion = null;
            }

            const host = this.bioIndexHostFor("credible-sets");
            if (!host) {
                if (token !== this.credibleSetsRequestToken) {
                    return false;
                }
                this.credibleSetsState = {
                    ...(preserveSelection ? this.credibleSetsState : emptyCredibleSetsState()),
                    listError: "BioIndex host is not available.",
                };
                return false;
            }

            try {
                const selectedAncestries =
                    this.associationsState.selectedAncestries || [];
                const available = await fetchCredibleSetsListForAncestries(
                    session,
                    host,
                    selectedAncestries
                );
                if (token !== this.credibleSetsRequestToken) {
                    return false;
                }

                const region = cloneGenomicRegion(session.region);
                let selectedIds = this.credibleSetsState.selectedIds || [];
                let variantsBySet = this.credibleSetsState.variantsBySet || {};

                if (preserveSelection) {
                    ({ selectedIds, variantsBySet } = pruneCredibleSetsForRegion(
                        { selectedIds, variantsBySet },
                        region
                    ));
                }

                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    listLoading: false,
                    listError: null,
                    available,
                    selectedIds,
                    variantsBySet,
                };
                this.lastCredibleSetsListRegion = region;
                return true;
            } catch (error) {
                if (token !== this.credibleSetsRequestToken) {
                    return false;
                }
                console.warn("Variant Sifter credible sets list failed", error);
                this.credibleSetsState = {
                    ...(preserveSelection ? this.credibleSetsState : emptyCredibleSetsState()),
                    listLoading: false,
                    listError: "Failed to load credible sets for this locus.",
                };
                return false;
            }
        },
        async onAddCredibleSet({ credibleSetId, phenotype, ancestry }) {
            if (!credibleSetId || !this.searchSession) {
                return;
            }

            const host = this.bioIndexHostFor("credible-variants");
            if (!host) {
                return;
            }

            const resolvedAncestry = ancestry || "Mixed";
            const availableEntry =
                this.credibleSetsState.available.find(
                    (entry) =>
                        entry.credibleSetId === credibleSetId &&
                        (entry.ancestry || "Mixed") === resolvedAncestry
                ) ||
                this.credibleSetsState.available.find(
                    (entry) => entry.credibleSetId === credibleSetId
                );
            const resolvedPhenotype = phenotype || availableEntry?.phenotype || null;
            const entryAncestry = availableEntry?.ancestry || resolvedAncestry;
            const selectionKey = makeCredibleSetSelectionKey(
                credibleSetId,
                entryAncestry
            );

            if (this.credibleSetsState.selectedIds.includes(selectionKey)) {
                return;
            }

            const metaEntry = availableEntry || {
                credibleSetId,
                phenotype: resolvedPhenotype,
                ancestry: entryAncestry,
            };
            const label = credibleSetShortLabel(metaEntry);

            this.credibleSetsState = {
                ...this.credibleSetsState,
                selectedIds: [...this.credibleSetsState.selectedIds, selectionKey],
                variantsLoading: true,
                variantsError: null,
            };

            try {
                const rawVariants = await fetchCredibleSetVariants(
                    this.searchSession,
                    credibleSetId,
                    host,
                    { ancestry: entryAncestry }
                );
                const formattedVariants = formatCredibleVariantRows(rawVariants);
                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    variantsLoading: false,
                    variantsBySet: {
                        ...this.credibleSetsState.variantsBySet,
                        [selectionKey]: {
                            meta: {
                                selectionKey,
                                credibleSetId,
                                phenotype: resolvedPhenotype,
                                ancestry: entryAncestry,
                                label,
                                optionLabel: credibleSetOptionLabel(metaEntry),
                            },
                            rawVariants,
                            formattedVariants,
                        },
                    },
                };
            } catch (error) {
                console.warn("Variant Sifter credible variants load failed", error);
                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    variantsLoading: false,
                    variantsError: "Failed to load credible variants for this set.",
                    selectedIds: this.credibleSetsState.selectedIds.filter(
                        (id) => id !== selectionKey
                    ),
                };
            }
        },
        async mergeCredibleSetsForAncestry(ancestry) {
            if (!ancestry || ancestry === "Mixed" || !this.searchSession) {
                return;
            }

            const host = this.bioIndexHostFor("credible-sets");
            if (!host) {
                return;
            }

            const session = {
                ...this.searchSession,
                region: this.dataRegion || this.searchSession.region,
            };

            try {
                const tagged = tagCredibleSetEntries(
                    await fetchCredibleSetsList(session, host, { ancestry }),
                    ancestry
                );
                const withoutAncestry = (this.credibleSetsState.available || []).filter(
                    (entry) => (entry.ancestry || "Mixed") !== ancestry
                );
                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    available: mergeCredibleSetAvailableLists([withoutAncestry, tagged]),
                };
            } catch (error) {
                console.warn(
                    `Variant Sifter ${ancestry} credible sets list failed`,
                    error
                );
            }
        },
        removeCredibleSetsForAncestry(ancestry) {
            if (!ancestry || ancestry === "Mixed") {
                return;
            }

            const available = (this.credibleSetsState.available || []).filter(
                (entry) => (entry.ancestry || "Mixed") !== ancestry
            );
            const nextVariantsBySet = { ...this.credibleSetsState.variantsBySet };
            const selectedIds = (this.credibleSetsState.selectedIds || []).filter(
                (selectionKey) => {
                    const meta = nextVariantsBySet[selectionKey]?.meta;
                    if ((meta?.ancestry || "Mixed") === ancestry) {
                        delete nextVariantsBySet[selectionKey];
                        return false;
                    }
                    return true;
                }
            );

            this.credibleSetsState = {
                ...this.credibleSetsState,
                available,
                selectedIds,
                variantsBySet: nextVariantsBySet,
            };
        },
        onRemoveCredibleSet(selectionKey) {
            if (!selectionKey) {
                return;
            }
            const nextVariantsBySet = { ...this.credibleSetsState.variantsBySet };
            delete nextVariantsBySet[selectionKey];
            this.credibleSetsState = {
                ...this.credibleSetsState,
                selectedIds: this.credibleSetsState.selectedIds.filter(
                    (id) => id !== selectionKey
                ),
                variantsBySet: nextVariantsBySet,
                variantsError: null,
            };
        },
        async loadGenesTrack(session) {
            const token = ++this.genesRequestToken;
            this.genesState = {
                ...emptyGenesState(),
                loading: true,
            };

            try {
                const plotConfig = buildAssociationsRegionPlotConfig(session);
                const data = await fetchGenesTrackData(
                    session.region,
                    plotConfig["genome reference"],
                    this.bioIndexHostFor("genes")
                );
                if (token !== this.genesRequestToken) {
                    return;
                }
                this.genesState = {
                    ...this.genesState,
                    ready: true,
                    loading: false,
                    error: data.length ? null : "No genes found for this locus.",
                    data: data.length ? data : null,
                    selectedTypes: resolveSelectedGeneTypesForData(
                        this.genesState.selectedTypes,
                        data
                    ),
                };
            } catch (error) {
                if (token !== this.genesRequestToken) {
                    return;
                }
                console.warn("Variant Sifter genes track load failed", error);
                this.genesState = {
                    ...emptyGenesState(),
                    error: "Failed to load genes track for this locus.",
                };
            }
        },
        async loadPlotOverlays(session, rows) {
            const token = ++this.plotOverlaysRequestToken;
            this.plotOverlaysState = {
                ...emptyPlotOverlaysState(),
                loading: true,
            };

            let recombData = null;
            let overlayError = null;

            try {
                recombData = await fetchRecombinationRate(session.region);
            } catch (error) {
                console.warn("Variant Sifter plot overlays load failed", error);
                overlayError = "Recombination overlay could not be loaded for this locus.";
            }

            if (token !== this.plotOverlaysRequestToken) {
                return;
            }

            const leadRow = pickLeadVariantRow(rows);
            this.plotOverlaysState = {
                ready: true,
                loading: false,
                error: overlayError,
                recombData,
                refVariant: rowToLdVariant(leadRow),
                refVariantUserSet: false,
            };
        },
        async refreshRegionLdScores(rows, activeRegion, isCancelled = () => false) {
            if (!rows?.length || !activeRegion || !this.searchSession) {
                return false;
            }

            const primary = primaryAssociationAncestry(this.searchSession);
            const refRow = resolveLdReferenceRow(rows, {
                refVariant: this.plotOverlaysState.refVariant,
                refVariantUserSet: this.plotOverlaysState.refVariantUserSet,
            });
            if (!refRow) {
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: "LD scores could not be loaded for the extended region.",
                };
                return false;
            }

            const refVariant = rowToLdVariant(refRow);
            this.associationsState = {
                ...this.associationsState,
                ldLoading: true,
                ldError: null,
            };

            try {
                const ancestries = [
                    primary,
                    ...(this.associationsState.selectedAncestries || []),
                ].filter((code, index, all) => code && all.indexOf(code) === index);

                let enrichedRows = [];
                for (const ancestry of ancestries) {
                    if (isCancelled()) {
                        return false;
                    }
                    const seriesRows = rows.filter(
                        (row) => associationRowAncestry(row, primary) === ancestry
                    );
                    if (!seriesRows.length) {
                        continue;
                    }
                    const ancestrySession = {
                        ...this.searchSession,
                        ancestry: ancestry === "Mixed" ? null : ancestry,
                        region: activeRegion,
                    };
                    if (ancestry === primary) {
                        ancestrySession.ancestry = this.searchSession.ancestry;
                    }
                    const seriesWithLd = await enrichAssociationRowsWithLdScoresForRef(
                        seriesRows,
                        ancestrySession,
                        refRow,
                        activeRegion
                    );
                    enrichedRows = enrichedRows.concat(seriesWithLd);
                }

                if (isCancelled()) {
                    return false;
                }

                enrichedRows = mergeAssociationRowsByVariantAndAncestry(
                    [],
                    enrichedRows,
                    primary
                );
                const ldAvailable = enrichedRows.some(
                    (row) => row.LDS != null && !Number.isNaN(row.LDS)
                );
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: ldAvailable
                        ? null
                        : "LD scores could not be loaded for the extended region.",
                    rows: filterAssociationRowsInRegion(enrichedRows, activeRegion),
                };
                this.plotOverlaysState = {
                    ...this.plotOverlaysState,
                    refVariant,
                };
                return ldAvailable;
            } catch (ldError) {
                if (isCancelled()) {
                    return false;
                }
                console.warn("Variant Sifter LD score fetch failed", ldError);
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: "LD scores could not be loaded for the extended region.",
                };
                return false;
            }
        },
        async loadInitialSearchData(session) {
            const token = ++this.associationsRequestToken;
            ++this.genesRequestToken;
            ++this.plotOverlaysRequestToken;
            ++this.credibleSetsRequestToken;
            ++this.globalEnrichmentRequestToken;

            if (this.regionLoadDismissTimer) {
                clearTimeout(this.regionLoadDismissTimer);
                this.regionLoadDismissTimer = null;
            }
            this.regionLoadProgress = startRegionLoadProgress();
            this.associationsState = emptyAssociationsState();

            const host = this.bioIndexHostFor("associations");
            if (!host) {
                this.associationsState = {
                    ...emptyAssociationsState(),
                    error: "BioIndex host is not available.",
                };
                for (const step of this.regionLoadProgress.steps) {
                    this.setRegionLoadStep(step.id, VKS_REGION_LOAD_STATUS.FAILED);
                }
                this.closeRegionLoadProgressIfSettled();
                return;
            }

            let formattedRows = [];
            let associationFailed = false;

            this.setRegionLoadStep("associations", VKS_REGION_LOAD_STATUS.LOADING);
            try {
                const result = await fetchAssociations(session, host, this.projectId);
                if (token !== this.associationsRequestToken) {
                    return;
                }

                formattedRows = formatAssociationRows(result.rows, session);
                if (!this.dataRegion) {
                    this.dataRegion = cloneGenomicRegion(session.region);
                }
                this.associationsState = {
                    ...this.associationsState,
                    error: null,
                    ldError: null,
                    rows: formattedRows,
                    index: result.index,
                    query: result.q,
                };
                this.setRegionLoadStep("associations", VKS_REGION_LOAD_STATUS.DONE);
            } catch (error) {
                if (token !== this.associationsRequestToken) {
                    return;
                }
                associationFailed = true;
                console.warn("Variant Sifter associations load failed", error);
                this.associationsState = {
                    ...emptyAssociationsState(),
                    error: "Failed to load associations. Please try again.",
                };
                this.setRegionLoadStep("associations", VKS_REGION_LOAD_STATUS.FAILED);
            }

            if (token !== this.associationsRequestToken) {
                return;
            }

            const plotConfig = buildAssociationsRegionPlotConfig(session);
            const genesToken = ++this.genesRequestToken;
            const recombToken = ++this.plotOverlaysRequestToken;
            const credibleSetsToken = ++this.credibleSetsRequestToken;
            const globalEnrichmentToken = ++this.globalEnrichmentRequestToken;

            this.setRegionLoadStep("genes", VKS_REGION_LOAD_STATUS.LOADING);
            this.setRegionLoadStep("recomb", VKS_REGION_LOAD_STATUS.LOADING);
            this.setRegionLoadStep("credibleSets", VKS_REGION_LOAD_STATUS.LOADING);
            this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.LOADING);

            await Promise.all([
                (async () => {
                    try {
                        const data = await fetchGenesTrackData(
                            session.region,
                            plotConfig["genome reference"],
                            this.bioIndexHostFor("genes")
                        );
                        if (genesToken !== this.genesRequestToken) {
                            return;
                        }
                        this.genesState = {
                            ...this.genesState,
                            ready: true,
                            loading: false,
                            error: data.length ? null : "No genes found for this locus.",
                            data: data.length ? data : null,
                            selectedTypes: resolveSelectedGeneTypesForData(
                                this.genesState.selectedTypes,
                                data
                            ),
                        };
                        this.setRegionLoadStep("genes", VKS_REGION_LOAD_STATUS.DONE);
                    } catch (error) {
                        if (genesToken !== this.genesRequestToken) {
                            return;
                        }
                        console.warn("Variant Sifter genes track load failed", error);
                        this.genesState = {
                            ...emptyGenesState(),
                            error: "Failed to load genes track for this locus.",
                        };
                        this.setRegionLoadStep("genes", VKS_REGION_LOAD_STATUS.FAILED);
                    }
                })(),
                (async () => {
                    try {
                        const recombData = await fetchRecombinationRate(session.region);
                        if (recombToken !== this.plotOverlaysRequestToken) {
                            return;
                        }
                        const leadRow = pickLeadVariantRow(formattedRows);
                        this.plotOverlaysState = {
                            ready: true,
                            loading: false,
                            error: null,
                            recombData,
                            refVariant: rowToLdVariant(leadRow),
                            refVariantUserSet: false,
                        };
                        this.setRegionLoadStep("recomb", VKS_REGION_LOAD_STATUS.DONE);
                    } catch (error) {
                        if (recombToken !== this.plotOverlaysRequestToken) {
                            return;
                        }
                        console.warn("Variant Sifter plot overlays load failed", error);
                        this.plotOverlaysState = {
                            ...emptyPlotOverlaysState(),
                            ready: true,
                            error: "Recombination overlay could not be loaded for this locus.",
                        };
                        this.setRegionLoadStep("recomb", VKS_REGION_LOAD_STATUS.FAILED);
                    }
                })(),
                (async () => {
                    this.credibleSetsState = {
                        ...emptyCredibleSetsState(),
                        listLoading: true,
                    };
                    try {
                        const available = tagCredibleSetEntries(
                            await fetchCredibleSetsList(session, host),
                            "Mixed"
                        );
                        if (credibleSetsToken !== this.credibleSetsRequestToken) {
                            return;
                        }
                        this.credibleSetsState = {
                            ...emptyCredibleSetsState(),
                            available,
                        };
                        this.lastCredibleSetsListRegion = cloneGenomicRegion(session.region);
                        this.setRegionLoadStep("credibleSets", VKS_REGION_LOAD_STATUS.DONE);
                    } catch (error) {
                        if (credibleSetsToken !== this.credibleSetsRequestToken) {
                            return;
                        }
                        console.warn("Variant Sifter credible sets list failed", error);
                        this.credibleSetsState = {
                            ...emptyCredibleSetsState(),
                            listError: "Failed to load credible sets for this locus.",
                        };
                        this.setRegionLoadStep("credibleSets", VKS_REGION_LOAD_STATUS.FAILED);
                    }
                })(),
                (async () => {
                    await this.loadGlobalEnrichmentForSession(session, {
                        offerClassifyAction: true,
                        requestToken: globalEnrichmentToken,
                    });
                })(),
            ]);

            if (token !== this.associationsRequestToken) {
                return;
            }

            if (!associationFailed && formattedRows.length) {
                this.setRegionLoadStep("ld", VKS_REGION_LOAD_STATUS.LOADING);
                try {
                    const rowsWithLd = await enrichAssociationRowsWithLdScores(
                        formattedRows,
                        session
                    );
                    if (token !== this.associationsRequestToken) {
                        return;
                    }
                    const ldAvailable = rowsWithLd.some(
                        (row) => row.LDS != null && !Number.isNaN(row.LDS)
                    );
                    const leadRow = pickLeadVariantRow(rowsWithLd);
                    this.associationsState = {
                        ...this.associationsState,
                        ldError: ldAvailable
                            ? null
                            : "LD scores could not be loaded for this locus.",
                        rows: rowsWithLd,
                    };
                    this.plotOverlaysState = {
                        ...this.plotOverlaysState,
                        refVariant: rowToLdVariant(leadRow),
                    };
                    this.setRegionLoadStep(
                        "ld",
                        ldAvailable
                            ? VKS_REGION_LOAD_STATUS.DONE
                            : VKS_REGION_LOAD_STATUS.FAILED
                    );
                } catch (ldError) {
                    if (token !== this.associationsRequestToken) {
                        return;
                    }
                    console.warn("Variant Sifter LD score fetch failed", ldError);
                    this.associationsState = {
                        ...this.associationsState,
                        ldError: "LD scores could not be loaded for this locus.",
                    };
                    this.setRegionLoadStep("ld", VKS_REGION_LOAD_STATUS.FAILED);
                }
            } else {
                this.setRegionLoadStep(
                    "ld",
                    associationFailed
                        ? VKS_REGION_LOAD_STATUS.FAILED
                        : VKS_REGION_LOAD_STATUS.DONE
                );
            }

            this.closeRegionLoadProgressIfSettled();
            if (!associationFailed) {
                this.probeAncestryAssociationAvailabilityForSession(session);
            }
            // Primary page data is loaded; now fetch URL/session sub-ancestries.
            this.loadPendingSubAncestries();
        },
        async loadPendingSubAncestries() {
            const pending = parseSubAncestriesParam(
                this.pendingSubAncestries,
                primaryAssociationAncestry(this.searchSession)
            );
            this.pendingSubAncestries = [];
            if (!pending.length || !this.searchSession) {
                this.syncUrlSearchParams(this.searchSession);
                return;
            }

            const token = this.associationsRequestToken;
            for (const ancestry of pending) {
                if (token !== this.associationsRequestToken) {
                    return;
                }
                if ((this.associationsState.selectedAncestries || []).includes(ancestry)) {
                    continue;
                }
                await this.loadAssociationAncestrySeries(ancestry);
            }
            if (token === this.associationsRequestToken) {
                this.syncUrlSearchParams(this.searchSession);
            }
        },
        async probeAncestryAssociationAvailabilityForSession(session) {
            const host = this.bioIndexHostFor("ancestry-associations");
            const token = this.associationsRequestToken;
            if (!session?.phenotype || !session?.region || !host) {
                return;
            }

            this.associationsState = {
                ...this.associationsState,
                ancestryAvailabilityLoading: true,
                ancestryAvailabilityError: null,
            };

            try {
                const availability = await probeAncestryAssociationAvailability(
                    session,
                    host,
                    this.projectId
                );
                if (token !== this.associationsRequestToken) {
                    return;
                }
                this.associationsState = {
                    ...this.associationsState,
                    ancestryAvailability: availability,
                    ancestryAvailabilityLoading: false,
                    ancestryAvailabilityError: null,
                };
            } catch (error) {
                if (token !== this.associationsRequestToken) {
                    return;
                }
                console.warn("Variant Sifter ancestry availability probe failed", error);
                this.associationsState = {
                    ...this.associationsState,
                    ancestryAvailability: [],
                    ancestryAvailabilityLoading: false,
                    ancestryAvailabilityError:
                        "Could not check ancestry-specific association availability.",
                };
            }
        },
        async onToggleAssociationAncestry(ancestry) {
            const primary = primaryAssociationAncestry(this.searchSession);
            if (!ancestry || ancestry === primary || !this.searchSession) {
                return;
            }

            const selected = this.associationsState.selectedAncestries || [];
            if (selected.includes(ancestry)) {
                this.associationsState = {
                    ...this.associationsState,
                    selectedAncestries: selected.filter((code) => code !== ancestry),
                    rows: this.associationsState.rows.filter(
                        (row) => associationRowAncestry(row, primary) !== ancestry
                    ),
                    ancestrySeriesErrors: {
                        ...this.associationsState.ancestrySeriesErrors,
                        [ancestry]: null,
                    },
                };
                this.removeCredibleSetsForAncestry(ancestry);
                this.syncUrlSearchParams(this.searchSession);
                return;
            }

            await this.loadAssociationAncestrySeries(ancestry);
            this.syncUrlSearchParams(this.searchSession);
        },
        async loadAssociationAncestrySeries(ancestry) {
            const primary = primaryAssociationAncestry(this.searchSession);
            if (!ancestry || ancestry === primary || !this.searchSession) {
                return false;
            }
            if ((this.associationsState.selectedAncestries || []).includes(ancestry)) {
                return true;
            }

            const host = this.bioIndexHostFor("ancestry-associations");
            if (!host) {
                return false;
            }

            const token = this.associationsRequestToken;
            const selected = this.associationsState.selectedAncestries || [];
            this.associationsState = {
                ...this.associationsState,
                ancestrySeriesLoading: {
                    ...this.associationsState.ancestrySeriesLoading,
                    [ancestry]: true,
                },
                ancestrySeriesErrors: {
                    ...this.associationsState.ancestrySeriesErrors,
                    [ancestry]: null,
                },
            };

            try {
                const ancestrySession = {
                    ...this.searchSession,
                    ancestry,
                    region: this.dataRegion || this.searchSession.region,
                };
                const result = await fetchAssociations(ancestrySession, host, this.projectId);
                if (token !== this.associationsRequestToken) {
                    return false;
                }

                let formattedRows = formatAssociationRows(result.rows, ancestrySession);
                try {
                    const refRow = resolveLdReferenceRow(this.associationsState.rows, {
                        refVariant: this.plotOverlaysState?.refVariant,
                        refVariantUserSet: this.plotOverlaysState?.refVariantUserSet,
                    });
                    if (refRow) {
                        formattedRows = await enrichAssociationRowsWithLdScoresForRef(
                            formattedRows,
                            ancestrySession,
                            refRow,
                            ancestrySession.region
                        );
                    } else {
                        formattedRows = await enrichAssociationRowsWithLdScores(
                            formattedRows,
                            ancestrySession
                        );
                    }
                } catch (ldError) {
                    console.warn(`Variant Sifter ${ancestry} LD enrich failed`, ldError);
                }

                if (token !== this.associationsRequestToken) {
                    return false;
                }

                const mergedRows = mergeAssociationRowsByVariantAndAncestry(
                    this.associationsState.rows,
                    formattedRows,
                    primary
                );
                this.associationsState = {
                    ...this.associationsState,
                    selectedAncestries: [...selected, ancestry],
                    rows: mergedRows,
                    ancestrySeriesLoading: {
                        ...this.associationsState.ancestrySeriesLoading,
                        [ancestry]: false,
                    },
                    ancestrySeriesErrors: {
                        ...this.associationsState.ancestrySeriesErrors,
                        [ancestry]: formattedRows.length
                            ? null
                            : "No associations returned for this ancestry.",
                    },
                };
                await this.mergeCredibleSetsForAncestry(ancestry);
                this.offerUnderstudiedForAncestry(ancestry);
                return true;
            } catch (error) {
                if (token !== this.associationsRequestToken) {
                    return false;
                }
                console.warn(`Variant Sifter ${ancestry} associations load failed`, error);
                this.associationsState = {
                    ...this.associationsState,
                    ancestrySeriesLoading: {
                        ...this.associationsState.ancestrySeriesLoading,
                        [ancestry]: false,
                    },
                    ancestrySeriesErrors: {
                        ...this.associationsState.ancestrySeriesErrors,
                        [ancestry]: "Failed to load associations for this ancestry.",
                    },
                };
                return false;
            }
        },
        applyUrlSearchParams() {
            if (this.canvasActive || this.searchSession) {
                return;
            }

            const params = this.utilsBox?.keyParams;
            if (!params?.phenotype || !params?.region) {
                return;
            }

            const region = parseRegionParam(params.region);
            if (!region) {
                return;
            }

            const phenotype = (this.phenotypes || []).find(
                (entry) => entry.name === params.phenotype
            );
            if (!phenotype) {
                this.welcomeInitialValues = {
                    phenotype: params.phenotype,
                    ancestry: params.ancestry || "",
                    geneOrVariantQuery: params.region,
                };
                return;
            }

            this.onStartSearch(
                {
                    phenotype,
                    ancestry: params.ancestry || null,
                    region,
                    regionLabel: formatRegion(region),
                    geneOrVariantQuery: params.region,
                    regionExpandBp: null,
                },
                {
                    subAncestries: parseSubAncestriesParam(
                        params.sub_ancestries,
                        params.ancestry || "Mixed"
                    ),
                }
            );
        },
        syncUrlSearchParams(session) {
            if (!this.utilsBox?.keyParams || !session?.phenotype || !session?.regionLabel) {
                return;
            }

            const nextParams = {
                phenotype: session.phenotype.name,
                region: session.regionLabel,
                project: this.projectId || undefined,
            };
            if (session.ancestry) {
                nextParams.ancestry = session.ancestry;
            } else {
                nextParams.ancestry = undefined;
            }

            const selected = this.associationsState?.selectedAncestries || [];
            const pending = this.pendingSubAncestries || [];
            const subAncestries = parseSubAncestriesParam(
                [...selected, ...pending],
                session.ancestry || "Mixed"
            );
            const subParam = formatSubAncestriesParam(subAncestries);
            nextParams.sub_ancestries = subParam || undefined;

            this.utilsBox.keyParams.set(nextParams);
        },
        onAssociationsFiltersIndexUpdate(filtersIndex) {
            this.associationsState = {
                ...this.associationsState,
                filtersIndex,
            };
        },
        onGenesSelectedTypesUpdate(selectedTypes) {
            this.genesState = {
                ...this.genesState,
                selectedTypes: resolveSelectedGeneTypesForData(
                    selectedTypes,
                    this.genesState.data
                ),
            };
        },
        async refreshAssistantLlmHealth() {
            const health = await fetchInteractiveLlmHealth();
            this.assistantState = {
                ...this.assistantState,
                llmAvailable: Boolean(health?.llm_available),
            };
        },
        onAssistantActiveTabUpdate(activeTab) {
            this.assistantState = {
                ...this.assistantState,
                activeTab,
            };
        },
        onAssistantExecuteAll() {
            const steps = this.assistantState?.plan?.steps || [];
            const next = steps.find(
                (step) => (this.assistantState.stepStates || {})[step.id] !== "done"
            );
            if (next) {
                this.runAssistantAction(next.actionId, {
                    auto: false,
                    stepId: next.id,
                });
            }
        },
        onAssistantExecuteStep(stepId) {
            const step = (this.assistantState?.plan?.steps || []).find(
                (item) => item.id === stepId
            );
            if (!step) {
                return;
            }
            this.runAssistantAction(step.actionId, { auto: false, stepId: step.id });
        },
        onExecuteCatalogAction(actionId) {
            const action = findAssistantAction(actionId);
            if (!action?.runnable || !this.searchSession) {
                return;
            }
            const stepId = this.researchActionStepId(actionId);
            const plan = createAssistantPlan(
                [
                    {
                        id: stepId,
                        actionId,
                        label: action.label,
                    },
                ],
                { executeLabel: "Execute" }
            );
            const clearedEntries = clearAssistantResultEntries(
                this.assistantState.threadEntries
            );
            this.aiAssistantOpen = true;
            this.assistantState = {
                ...this.assistantState,
                activeTab: "request",
                executing: false,
                executionProgressLabel: "",
                cs2ctStarPrompt: null,
                understudiedStarPrompt: null,
                plan,
                stepStates: { [stepId]: "pending" },
                threadEntries: appendAssistantEntries(clearedEntries, [
                    createUserMessage(action.label),
                    createAssistantMessage(`Running “${action.label}”.`),
                ]),
            };
            this.runAssistantAction(actionId, { auto: false, stepId });
        },
        onAssistantPlanRequest({ text } = {}) {
            const requestText = String(text || "").trim();
            if (!requestText) {
                return;
            }

            const matches = matchVksAssistantRequest(requestText);
            const clearedEntries = clearAssistantResultEntries(
                this.assistantState.threadEntries
            );
            this.aiAssistantOpen = true;
            this.assistantState = {
                ...this.assistantState,
                activeTab: "request",
                cs2ctStarPrompt: null,
                understudiedStarPrompt: null,
                threadEntries: appendAssistantEntries(clearedEntries, [
                    createUserMessage(requestText),
                ]),
            };

            if (!matches.length) {
                this.assistantState = {
                    ...this.assistantState,
                    plan: null,
                    stepStates: {},
                    threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                        createAssistantMessage(
                            "I could not match that to a Variant Sifter action yet. Browse the Actions tab for supported requests, or try phrasing like “Classify tissues by phenotype relevance”, “Find understudied bottom-line variants in this locus”, or “Open Global enrich.”",
                            { isClarify: true }
                        ),
                    ]),
                };
                return;
            }

            if (
                matches.length === 1 &&
                matches[0].id !== "filter_ge_relevance" &&
                matches[0].id !== "find_understudied_bottom_line" &&
                matches[0].id !== "find_genetic_correlations"
            ) {
                const action = matches[0];
                this.assistantState = {
                    ...this.assistantState,
                    plan: null,
                    stepStates: {},
                    threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                        createAssistantMessage(`Running “${action.label}”.`),
                    ]),
                };
                this.runAssistantAction(action.id, { auto: false });
                return;
            }

            const plan = createAssistantPlan(
                matches.map((action) => ({
                    id: `step-${action.id}`,
                    actionId: action.id,
                    label: action.label,
                })),
                { executeLabel: matches.length > 1 ? "Execute all" : "Execute" }
            );
            const stepStates = {};
            (plan?.steps || []).forEach((step) => {
                stepStates[step.id] = "pending";
            });
            this.assistantState = {
                ...this.assistantState,
                plan,
                stepStates,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantMessage(
                        matches.length === 1
                            ? `Matched “${matches[0].label}”. Run Execute below when you are ready.`
                            : `Matched ${matches.length} actions. Review the steps below, then Execute.`
                    ),
                ]),
            };
        },
        markAssistantStepState(stepId, status) {
            if (!stepId) {
                return;
            }
            this.assistantState = {
                ...this.assistantState,
                stepStates: {
                    ...(this.assistantState.stepStates || {}),
                    [stepId]: status,
                },
            };
        },
        applyAssistantZoomStep(direction) {
            const step = 10;
            const delta = direction < 0 ? -step : step;
            const current = sliderValueFromZoom(this.regionZoom, this.regionZoomOut);
            let next = Math.max(
                VKS_REGION_ZOOM_SLIDER_MIN,
                Math.min(VKS_REGION_ZOOM_SLIDER_MAX, current + delta)
            );
            if (next < 0 && this.zoomOutAtLimit) {
                next = Math.max(next, current < 0 ? current : 0);
            }
            const { regionZoom, regionZoomOut } = zoomFromSliderValue(next);
            this.onRegionZoomUpdate(regionZoom);
            this.onRegionZoomOutUpdate(regionZoomOut);
            this.onRegionZoomSliderCommit();
        },
        async runAssistantAction(actionId, { auto = false, requestToken, silent = false, stepId } = {}) {
            if (actionId === "export_session") {
                this.exportSession();
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "import_session") {
                this.openSessionImport();
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "reset_search") {
                this.resetSearch();
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "zoom_in") {
                this.applyAssistantZoomStep(1);
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "zoom_out") {
                this.applyAssistantZoomStep(-1);
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "toggle_data_table") {
                this.dataTableOpen = !this.dataTableOpen;
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "open_getting_around") {
                this.workspaceGuideOpen = true;
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "open_global_enrichment") {
                this.openDrawerId = "global-enrichment";
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "open_associations") {
                this.openDrawerId = "associations";
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "open_credible_sets") {
                this.openDrawerId = "credible-sets";
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "open_genes") {
                this.openDrawerId = "genes";
                this.markAssistantStepState(stepId, "done");
                return;
            }
            if (actionId === "find_understudied_bottom_line") {
                await this.runFindUnderstudiedBottomLineAction({
                    auto,
                    silent,
                    stepId,
                });
                return;
            }
            if (actionId === "find_genetic_correlations") {
                await this.runFindGeneticCorrelationsAction({
                    silent,
                    stepId,
                });
                return;
            }
            if (actionId !== "filter_ge_relevance") {
                return;
            }

            const session = this.searchSession;
            const catalog = this.globalEnrichmentState?.catalog;
            if (
                !session ||
                (!catalog?.annotations?.length && !catalog?.tissues?.length)
            ) {
                return;
            }

            const geToken = requestToken ?? this.globalEnrichmentRequestToken;
            const actionToken = ++this.assistantActionToken;
            const runningLabel = buildGeRelevanceRunningMessage();
            const annotationLabels = catalog.annotations || [];
            this.markAssistantStepState(stepId, "running");

            if (!silent) {
                this.aiAssistantOpen = true;
                this.assistantState = {
                    ...this.assistantState,
                    activeTab: "request",
                    executing: true,
                    executionProgressLabel: runningLabel,
                    cs2ctStarPrompt: null,
                    understudiedStarPrompt: null,
                    threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                        createAssistantStatusMessage(
                            buildGeRelevanceIntroMessage(session, catalog),
                            { pending: true, isStepResult: true }
                        ),
                    ]),
                };
            }

            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                llmRelevance: buildGeLlmLoadingState(annotationLabels),
            };

            try {
                let availableSets = this.credibleSetsState?.available || [];
                if (!availableSets.length) {
                    await this.loadCredibleSetsList(session, {
                        preserveSelection: true,
                    });
                    if (
                        actionToken !== this.assistantActionToken ||
                        geToken !== this.globalEnrichmentRequestToken
                    ) {
                        return;
                    }
                    availableSets = this.credibleSetsState?.available || [];
                }

                const classification = await runCs2ctTissueClassification({
                    session,
                    credibleSets: availableSets,
                    host: this.bioIndexHostFor("c2ct-credible-set"),
                    catalogTissues: catalog.tissues || [],
                    catalogAnnotations: annotationLabels,
                    associationRows: this.associationsState?.rows || [],
                    region: this.dataRegion || session.region,
                });
                if (
                    actionToken !== this.assistantActionToken ||
                    geToken !== this.globalEnrichmentRequestToken
                ) {
                    return;
                }

                const llmRelevance = {
                    loading: false,
                    error: null,
                    llmUsed: true,
                    tissueOnly: true,
                    filterComplete: true,
                    relevantAnnotations: annotationLabels,
                    relevantTissues: classification.relevantTissues || [],
                    relevantTissuesByAnnotation:
                        classification.relevantTissuesByAnnotation || {},
                    rationaleById: {},
                    source: "c2ct-credible-set",
                };

                this.globalEnrichmentState = {
                    ...this.globalEnrichmentState,
                    llmRelevance,
                    enabledMutedAnnotations: [],
                    enabledMutedAnnotationTissues: {},
                    disabledAnnotationTissues: {},
                };

                this.markAssistantStepState(stepId, "done");

                const starOptions = classification.starOptions || [];
                const cs2ctStarPrompt = starOptions.length
                    ? {
                          message: buildCs2ctStarPromptMessage(starOptions),
                          options: starOptions,
                      }
                    : null;

                if (!silent) {
                    const report = buildGeRelevanceReportMessage({
                        session,
                        catalog,
                        llmRelevance,
                        annoData: this.globalEnrichmentState?.annoData || {},
                        geRows: this.globalEnrichmentState?.geRows || [],
                        classification,
                    });
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        cs2ctStarPrompt,
                        understudiedStarPrompt: null,
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            report
                        ),
                    };
                    if (!cs2ctStarPrompt) {
                        this.offerRemainingResearchAction("filter_ge_relevance");
                    }
                } else {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        cs2ctStarPrompt,
                        understudiedStarPrompt: null,
                    };
                    if (!cs2ctStarPrompt) {
                        this.offerRemainingResearchAction("filter_ge_relevance");
                    }
                }
            } catch (error) {
                if (
                    actionToken !== this.assistantActionToken ||
                    geToken !== this.globalEnrichmentRequestToken
                ) {
                    return;
                }
                console.warn("Variant Sifter CS2CT tissue classification failed", error);
                const errorMessage =
                    error?.message ||
                    "CS2CT tissue filtering is unavailable; using enrichment p-value filtering only.";
                this.globalEnrichmentState = {
                    ...this.globalEnrichmentState,
                    llmRelevance: buildGeLlmRelevanceShowAllState(annotationLabels, {
                        error: errorMessage,
                    }),
                };
                this.markAssistantStepState(stepId, "error");
                if (!silent) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        cs2ctStarPrompt: null,
                        understudiedStarPrompt: null,
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            `${errorMessage} Annotation tracks show tissues with enrichment p < 0.5 for each annotation.`,
                            { isClarify: true }
                        ),
                    };
                    this.offerRemainingResearchAction("filter_ge_relevance");
                } else if (this.assistantState.executing) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        cs2ctStarPrompt: null,
                        understudiedStarPrompt: null,
                    };
                    this.offerRemainingResearchAction("filter_ge_relevance");
                }
            }
        },
        listUnderstudiedTargetAncestries() {
            const primary = primaryAssociationAncestry(this.searchSession) || "Mixed";
            const selected = this.associationsState?.selectedAncestries || [];
            const codes = [];
            const add = (ancestry) => {
                if (ancestry && !codes.includes(ancestry)) {
                    codes.push(ancestry);
                }
            };

            add(primary);
            selected.forEach(add);

            // Also include ancestries present in loaded association rows
            // (covers cases where series data is present but selection lists lag).
            (this.associationsState?.rows || []).forEach((row) => {
                add(associationRowAncestry(row, primary));
            });

            return codes.length ? codes : ["Mixed"];
        },
        async runFindUnderstudiedBottomLineAction({
            silent = false,
            stepId,
        } = {}) {
            const baseSession = this.searchSession;
            if (!baseSession?.phenotype?.name || !baseSession?.region) {
                return;
            }

            const ancestries = this.listUnderstudiedTargetAncestries();
            const actionToken = ++this.assistantActionToken;
            const resolvedStepId =
                stepId || this.researchActionStepId("find_understudied_bottom_line");
            this.markAssistantStepState(resolvedStepId, "running");

            const host =
                this.bioIndexHostFor("global-associations") ||
                this.bioIndexHostFor("associations");
            if (!host) {
                if (!silent) {
                    this.aiAssistantOpen = true;
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        understudiedStarPrompt: null,
                        understudiedAncestry: null,
                        threadEntries: appendAssistantEntries(
                            this.assistantState.threadEntries,
                            [
                                createAssistantStepMessage(
                                    "BioIndex host is not available.",
                                    { isClarify: true }
                                ),
                            ]
                        ),
                    };
                }
                this.markAssistantStepState(resolvedStepId, "error");
                this.offerRemainingResearchAction("find_understudied_bottom_line");
                return;
            }

            const allStarRows = [];
            let hadError = false;

            if (!silent) {
                this.aiAssistantOpen = true;
                this.assistantState = {
                    ...this.assistantState,
                    activeTab: "request",
                    executing: true,
                    cs2ctStarPrompt: null,
                    understudiedStarPrompt: null,
                };
            }

            try {
                for (let index = 0; index < ancestries.length; index += 1) {
                    if (actionToken !== this.assistantActionToken) {
                        return;
                    }
                    const ancestry = ancestries[index];
                    const session = { ...baseSession, ancestry };
                    const intro = buildUnderstudiedIntroMessage(session);
                    const runningLabel = buildUnderstudiedRunningMessage();

                    if (!silent) {
                        this.assistantState = {
                            ...this.assistantState,
                            executing: true,
                            executionProgressLabel: runningLabel,
                            threadEntries: appendAssistantEntries(
                                this.assistantState.threadEntries,
                                [
                                    createAssistantStatusMessage(intro, {
                                        pending: true,
                                        isStepResult: true,
                                    }),
                                ]
                            ),
                        };
                    }

                    try {
                        const { rows } = await fetchGlobalAssociations(session, host, {
                            limit: 1000,
                        });
                        if (actionToken !== this.assistantActionToken) {
                            return;
                        }

                        const matched = filterUnderstudiedBottomLineInRegion(
                            rows,
                            session.region
                        );
                        matched.forEach((row) => {
                            const starRow = {
                                ...row,
                                ancestry,
                            };
                            allStarRows.push(starRow);
                        });

                        if (!silent) {
                            const report = matched.length
                                ? buildUnderstudiedReportMessage(session, matched)
                                : buildUnderstudiedNoneFoundMessage(session);
                            this.assistantState = {
                                ...this.assistantState,
                                threadEntries: replacePendingAssistantEntry(
                                    this.assistantState.threadEntries,
                                    report
                                ),
                            };
                        }
                    } catch (error) {
                        if (actionToken !== this.assistantActionToken) {
                            return;
                        }
                        hadError = true;
                        console.warn(
                            `Variant Sifter understudied bottom-line search failed (${ancestry})`,
                            error
                        );
                        const errorMessage =
                            error?.message ||
                            `Could not load phenotype-wide associations for ${ancestry}.`;
                        if (!silent) {
                            this.assistantState = {
                                ...this.assistantState,
                                threadEntries: replacePendingAssistantEntry(
                                    this.assistantState.threadEntries,
                                    errorMessage,
                                    { isClarify: true }
                                ),
                            };
                        }
                    }
                }

                if (actionToken !== this.assistantActionToken) {
                    return;
                }

                const understudiedStarPrompt = buildUnderstudiedStarPrompt(allStarRows);
                this.markAssistantStepState(
                    resolvedStepId,
                    hadError && !allStarRows.length ? "error" : "done"
                );

                this.assistantState = {
                    ...this.assistantState,
                    executing: false,
                    executionProgressLabel: "",
                    understudiedStarPrompt: silent ? null : understudiedStarPrompt,
                    understudiedAncestry: null,
                };

                if (!silent && !understudiedStarPrompt) {
                    this.offerRemainingResearchAction("find_understudied_bottom_line");
                }
            } catch (error) {
                if (actionToken !== this.assistantActionToken) {
                    return;
                }
                console.warn(
                    "Variant Sifter understudied bottom-line search failed",
                    error
                );
                const errorMessage =
                    error?.message ||
                    "Could not load phenotype-wide associations for understudied bottom-line variants.";
                this.markAssistantStepState(resolvedStepId, "error");
                if (!silent) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        understudiedStarPrompt: null,
                        understudiedAncestry: null,
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            errorMessage,
                            { isClarify: true }
                        ),
                    };
                    this.offerRemainingResearchAction("find_understudied_bottom_line");
                } else if (this.assistantState.executing) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        understudiedStarPrompt: null,
                        understudiedAncestry: null,
                    };
                    this.offerRemainingResearchAction("find_understudied_bottom_line");
                }
            }
        },
        onConfirmCs2ctStar(selectedCredibleSetIds = []) {
            const prompt = this.assistantState?.cs2ctStarPrompt;
            const options = prompt?.options || [];
            if (!options.length) {
                this.onDismissCs2ctStar();
                return;
            }

            const selected = new Set(
                (Array.isArray(selectedCredibleSetIds)
                    ? selectedCredibleSetIds
                    : []
                ).map(String)
            );
            let starred = [...(this.plotMarkersState.starredVariants || [])];
            let added = 0;

            options.forEach((option) => {
                if (!selected.has(String(option.credibleSetId))) {
                    return;
                }
                (option.variants || []).forEach((row) => {
                    if (isVariantStarred(starred, row?.["Variant ID"])) {
                        return;
                    }
                    const entry = createStarredVariant(row, "cs2ct");
                    if (entry) {
                        starred.push(entry);
                        added += 1;
                    }
                });
            });

            this.plotMarkersState = {
                ...this.plotMarkersState,
                starredVariants: starred,
            };
            this.assistantState = {
                ...this.assistantState,
                cs2ctStarPrompt: null,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantStepMessage(
                        added
                            ? `Starred ${added} overlap lead SNP${added === 1 ? "" : "s"} from the selected credible sets.`
                            : "No new overlap lead SNPs were starred (they may already be starred)."
                    ),
                ]),
            };
            this.offerRemainingResearchAction("filter_ge_relevance");
        },
        onDismissCs2ctStar() {
            if (!this.assistantState?.cs2ctStarPrompt) {
                return;
            }
            this.assistantState = {
                ...this.assistantState,
                cs2ctStarPrompt: null,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantStepMessage("Skipped starring CS2CT overlap lead SNPs."),
                ]),
            };
            this.offerRemainingResearchAction("filter_ge_relevance");
        },
        onConfirmUnderstudiedStar() {
            const prompt = this.assistantState?.understudiedStarPrompt;
            const variants = prompt?.variants || [];
            if (!variants.length) {
                this.onDismissUnderstudiedStar();
                return;
            }

            let starred = [...(this.plotMarkersState.starredVariants || [])];
            let added = 0;
            variants.forEach((row) => {
                if (isVariantStarred(starred, row?.["Variant ID"])) {
                    return;
                }
                const entry = createStarredVariant(row, "understudied-bottom-line");
                if (entry) {
                    starred.push(entry);
                    added += 1;
                }
            });

            this.plotMarkersState = {
                ...this.plotMarkersState,
                starredVariants: starred,
            };
            this.assistantState = {
                ...this.assistantState,
                understudiedStarPrompt: null,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantStepMessage(
                        added
                            ? `Starred ${added} understudied bottom-line variant${
                                  added === 1 ? "" : "s"
                              }.`
                            : "No new understudied bottom-line variants were starred (they may already be starred)."
                    ),
                ]),
            };
            this.offerRemainingResearchAction("find_understudied_bottom_line");
        },
        onDismissUnderstudiedStar() {
            if (!this.assistantState?.understudiedStarPrompt) {
                return;
            }
            this.assistantState = {
                ...this.assistantState,
                understudiedStarPrompt: null,
                threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                    createAssistantStepMessage(
                        "Skipped starring understudied bottom-line variants."
                    ),
                ]),
            };
            this.offerRemainingResearchAction("find_understudied_bottom_line");
        },
        phenotypeMapForCorrelations() {
            const map = {};
            (this.phenotypes || []).forEach((phenotype) => {
                if (phenotype?.name) {
                    map[phenotype.name] = phenotype;
                }
            });
            return map;
        },
        async runFindGeneticCorrelationsAction({ silent = false, stepId } = {}) {
            const session = this.searchSession;
            if (!session?.phenotype?.name) {
                return;
            }

            const ancestries = this.listUnderstudiedTargetAncestries();
            const actionToken = ++this.assistantActionToken;
            const resolvedStepId =
                stepId || this.researchActionStepId("find_genetic_correlations");
            const runningLabel = buildGeneticCorrelationRunningMessage();
            this.markAssistantStepState(resolvedStepId, "running");

            const host =
                this.bioIndexHostFor("genetic-correlation") ||
                this.bioIndexHostFor("associations");
            if (!host) {
                this.markAssistantStepState(resolvedStepId, "error");
                if (!silent) {
                    this.aiAssistantOpen = true;
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        threadEntries: appendAssistantEntries(
                            this.assistantState.threadEntries,
                            [
                                createAssistantStepMessage(
                                    "BioIndex host is not available.",
                                    { isClarify: true }
                                ),
                            ]
                        ),
                    };
                }
                return;
            }

            if (!silent) {
                this.aiAssistantOpen = true;
                this.assistantState = {
                    ...this.assistantState,
                    activeTab: "request",
                    executing: true,
                    executionProgressLabel: runningLabel,
                    cs2ctStarPrompt: null,
                    understudiedStarPrompt: null,
                    threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                        createAssistantStatusMessage(
                            buildGeneticCorrelationIntroMessage(session, ancestries),
                            { pending: true, isStepResult: true }
                        ),
                    ]),
                };
            }

            const phenotypeMap = this.phenotypeMapForCorrelations();
            const groups = [];

            try {
                for (const ancestry of ancestries) {
                    if (actionToken !== this.assistantActionToken) {
                        return;
                    }
                    try {
                        const { rows } = await fetchGeneticCorrelation(
                            session.phenotype.name,
                            ancestry,
                            host
                        );
                        if (actionToken !== this.assistantActionToken) {
                            return;
                        }
                        const filtered = filterSignificantGeneticCorrelations(rows, {
                            phenotypeMap,
                        });
                        groups.push(
                            buildGeneticCorrelationPhenotypeGroups({
                                ancestry,
                                rows: filtered,
                                phenotypeMap,
                            })
                        );
                    } catch (error) {
                        console.warn(
                            `Variant Sifter genetic correlation failed (${ancestry})`,
                            error
                        );
                        groups.push({
                            ancestry,
                            phenotypes: [],
                            error: error?.message || "Failed to load genetic correlations.",
                        });
                    }
                }

                if (actionToken !== this.assistantActionToken) {
                    return;
                }

                const result = buildGeneticCorrelationResultEntry({
                    session,
                    groups,
                });
                this.markAssistantStepState(resolvedStepId, "done");
                if (!silent) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            result.text,
                            { phenotypeGroups: result.phenotypeGroups }
                        ),
                    };
                } else {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                    };
                }
            } catch (error) {
                if (actionToken !== this.assistantActionToken) {
                    return;
                }
                console.warn("Variant Sifter genetic correlation search failed", error);
                this.markAssistantStepState(resolvedStepId, "error");
                if (!silent) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            error?.message ||
                                "Could not load genetically correlated phenotypes.",
                            { isClarify: true }
                        ),
                    };
                } else if (this.assistantState.executing) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                    };
                }
            }
        },
        onOpenCorrelatedPhenotype(phenotype) {
            if (!phenotype?.name || !this.searchSession?.regionLabel) {
                return;
            }
            const url = new URL(window.location.href);
            url.searchParams.set("phenotype", phenotype.name);
            url.searchParams.set("region", this.searchSession.regionLabel);
            if (this.projectId) {
                url.searchParams.set("project", this.projectId);
            } else {
                url.searchParams.delete("project");
            }
            const ancestry = phenotype.ancestry || "Mixed";
            if (ancestry && ancestry !== "Mixed") {
                url.searchParams.set("ancestry", ancestry);
            } else {
                url.searchParams.set("ancestry", "Mixed");
            }
            url.searchParams.delete("sub_ancestries");
            window.open(url.toString(), "_blank", "noopener,noreferrer");
        },
        onGeSelectedAnnotationsUpdate(selectedAnnotations) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedAnnotations: [...selectedAnnotations],
            };
        },
        onSelectGePlotTissue({
            annotation,
            tissue,
            selected = true,
            selectedAnnotations,
            selectedTissues,
            enabledMutedAnnotationTissues,
            disabledAnnotationTissues,
        } = {}) {
            if (!annotation || !tissue) {
                return;
            }
            const nextMap = setSelectedTissuesForAnnotation(
                this.globalEnrichmentState?.selectedTissuesByAnnotation,
                annotation,
                selected
                    ? [
                          ...new Set([
                              ...selectedTissuesForAnnotation(
                                  this.globalEnrichmentState
                                      ?.selectedTissuesByAnnotation,
                                  annotation
                              ),
                              tissue,
                          ]),
                      ]
                    : selectedTissuesForAnnotation(
                          this.globalEnrichmentState?.selectedTissuesByAnnotation,
                          annotation
                      ).filter((item) => item !== tissue)
            );
            // Prefer explicit list from the plot handler when provided.
            const resolvedMap = Array.isArray(selectedTissues)
                ? setSelectedTissuesForAnnotation(
                      this.globalEnrichmentState?.selectedTissuesByAnnotation,
                      annotation,
                      selectedTissues
                  )
                : nextMap;
            const nextActive = selected
                ? annotation
                : this.globalEnrichmentState.activeAnnotation || annotation;
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedAnnotations: Array.isArray(selectedAnnotations)
                    ? [...selectedAnnotations]
                    : this.globalEnrichmentState.selectedAnnotations,
                enabledMutedAnnotationTissues: {
                    ...(enabledMutedAnnotationTissues ||
                        this.globalEnrichmentState.enabledMutedAnnotationTissues ||
                        {}),
                },
                disabledAnnotationTissues: {
                    ...(disabledAnnotationTissues ||
                        this.globalEnrichmentState.disabledAnnotationTissues ||
                        {}),
                },
                activeAnnotation: nextActive,
                selectedTissuesByAnnotation: resolvedMap,
                selectedTissues: selectedTissuesForAnnotation(
                    resolvedMap,
                    nextActive
                ),
            };
        },
        onGeEnabledMutedAnnotationsUpdate(enabledMutedAnnotations) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                enabledMutedAnnotations: [...enabledMutedAnnotations],
            };
        },
        onGeEnabledMutedAnnotationTissuesUpdate(enabledMutedAnnotationTissues) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                enabledMutedAnnotationTissues: {
                    ...(enabledMutedAnnotationTissues || {}),
                },
            };
        },
        onGeDisabledAnnotationTissuesUpdate(disabledAnnotationTissues) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                disabledAnnotationTissues: {
                    ...(disabledAnnotationTissues || {}),
                },
            };
        },
        onGeTissueTrackSortUpdate(tissueTrackSort) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                tissueTrackSort: normalizeGeTissueTrackSort(tissueTrackSort),
            };
        },
        onGeTrackPValueMaxUpdate(geTrackPValueMax) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                geTrackPValueMax: normalizeGeTrackPValueMax(geTrackPValueMax),
                enabledMutedAnnotationTissues: {},
                disabledAnnotationTissues: {},
            };
        },
        onGeSelectedMethodsUpdate(selectedMethods) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedMethods: normalizeGeFilterStringList(selectedMethods),
            };
        },
        onGeSelectedSourcesUpdate(selectedSources) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedSources: normalizeGeFilterStringList(selectedSources),
            };
        },
        pruneV2gDeselections(tissueData, deselectedMethods, deselectedGenes) {
            const methods = new Set(collectMethodsFromTissueData(tissueData));
            const genes = new Set(collectGenesFromTissueData(tissueData));
            return {
                deselectedMethods: (deselectedMethods || []).filter((method) =>
                    methods.has(method)
                ),
                deselectedGenes: (deselectedGenes || []).filter((gene) => genes.has(gene)),
            };
        },
        async onV2gSelectedTissuesUpdate(selectedTissues) {
            const nextSelected = Array.isArray(selectedTissues)
                ? [...new Set(selectedTissues.filter(Boolean))]
                : [];
            const prevSelected = this.v2gState?.selectedTissues || [];
            const prevData = { ...(this.v2gState?.tissueData || {}) };
            const removed = prevSelected.filter((tissue) => !nextSelected.includes(tissue));
            removed.forEach((tissue) => {
                delete prevData[tissue];
            });

            const pruned = this.pruneV2gDeselections(
                prevData,
                this.v2gState?.deselectedMethods,
                this.v2gState?.deselectedGenes
            );

            this.v2gState = {
                ...this.v2gState,
                selectedTissues: nextSelected,
                tissueData: prevData,
                tissueErrors: Object.fromEntries(
                    Object.entries(this.v2gState?.tissueErrors || {}).filter(([tissue]) =>
                        nextSelected.includes(tissue)
                    )
                ),
                error: null,
                ...pruned,
            };

            const toFetch = nextSelected.filter((tissue) => !Array.isArray(prevData[tissue]));
            if (!toFetch.length) {
                return;
            }

            const host = this.bioIndexHostFor("gene-links");
            const region = this.dataRegion || this.searchSession?.region;
            if (!host || !region) {
                this.v2gState = {
                    ...this.v2gState,
                    error: host
                        ? "No region is available for gene-links."
                        : "BioIndex host is not available.",
                    selectedTissues: nextSelected.filter((tissue) =>
                        Array.isArray(this.v2gState.tissueData?.[tissue])
                    ),
                };
                return;
            }

            const token = ++this.v2gRequestToken;
            for (const tissue of toFetch) {
                if (token !== this.v2gRequestToken) {
                    return;
                }
                this.v2gState = {
                    ...this.v2gState,
                    loadingTissue: tissue,
                    error: null,
                };
                try {
                    const rows = await fetchGeneLinks(tissue, region, host);
                    if (token !== this.v2gRequestToken) {
                        return;
                    }
                    if (!rows.length) {
                        const tissueErrors = {
                            ...(this.v2gState.tissueErrors || {}),
                            [tissue]: `${tissue} has no linked genes.`,
                        };
                        const selectedWithoutEmpty = (
                            this.v2gState.selectedTissues || []
                        ).filter((entry) => entry !== tissue);
                        this.v2gState = {
                            ...this.v2gState,
                            loadingTissue: null,
                            selectedTissues: selectedWithoutEmpty,
                            tissueErrors,
                            error: tissueErrors[tissue],
                        };
                        continue;
                    }
                    const tissueData = {
                        ...(this.v2gState.tissueData || {}),
                        [tissue]: rows,
                    };
                    const nextPruned = this.pruneV2gDeselections(
                        tissueData,
                        this.v2gState.deselectedMethods,
                        this.v2gState.deselectedGenes
                    );
                    this.v2gState = {
                        ...this.v2gState,
                        loadingTissue: null,
                        tissueData,
                        error: null,
                        ...nextPruned,
                    };
                } catch (error) {
                    if (token !== this.v2gRequestToken) {
                        return;
                    }
                    console.warn("Variant Sifter gene-links fetch failed", tissue, error);
                    const selectedWithoutFailed = (this.v2gState.selectedTissues || []).filter(
                        (entry) => entry !== tissue
                    );
                    this.v2gState = {
                        ...this.v2gState,
                        loadingTissue: null,
                        selectedTissues: selectedWithoutFailed,
                        error: `Failed to load gene links for ${tissue}.`,
                    };
                }
            }

            if (token === this.v2gRequestToken) {
                this.v2gState = {
                    ...this.v2gState,
                    loadingTissue: null,
                };
            }
        },
        onV2gDeselectedMethodsUpdate(deselectedMethods) {
            this.v2gState = {
                ...this.v2gState,
                deselectedMethods: Array.isArray(deselectedMethods)
                    ? [...deselectedMethods]
                    : [],
            };
        },
        onV2gDeselectedGenesUpdate(deselectedGenes) {
            this.v2gState = {
                ...this.v2gState,
                deselectedGenes: Array.isArray(deselectedGenes) ? [...deselectedGenes] : [],
            };
        },
        onV2gDeselectedTissuesUpdate(deselectedTissues) {
            this.v2gState = {
                ...this.v2gState,
                deselectedTissues: Array.isArray(deselectedTissues)
                    ? [...deselectedTissues]
                    : [],
            };
        },
        onV2gDeselectedBiosamplesUpdate(deselectedBiosamples) {
            this.v2gState = {
                ...this.v2gState,
                deselectedBiosamples: Array.isArray(deselectedBiosamples)
                    ? [...deselectedBiosamples]
                    : [],
            };
        },
        onV2gViewModeUpdate(viewMode) {
            this.v2gState = {
                ...this.v2gState,
                viewMode: normalizeV2gViewMode(viewMode),
            };
        },
        async onS2gLoad() {
            const region = this.viewRegion || this.searchSession?.region;
            if (!region) {
                return;
            }
            const host = this.bioIndexHostFor("variant-links");
            const token = ++this.s2gRequestToken;
            this.s2gState = {
                ...this.s2gState,
                loadingTissue: VKS_S2G_TISSUE_LABEL,
                error: null,
            };
            try {
                const rows = await fetchVariantLinks(region, host);
                if (token !== this.s2gRequestToken) {
                    return;
                }
                if (!rows.length) {
                    this.s2gState = {
                        ...emptyS2gState(),
                        error: "No SNP-to-gene links found in this region.",
                    };
                    return;
                }
                const tissueData = buildS2gTissueData(rows);
                const methods = collectMethodsFromTissueData(tissueData);
                const genes = collectGenesFromTissueData(tissueData);
                const deselectedMethods = (this.s2gState.deselectedMethods || []).filter(
                    (method) => methods.includes(method)
                );
                const deselectedGenes = (this.s2gState.deselectedGenes || []).filter((gene) =>
                    genes.includes(gene)
                );
                this.s2gState = {
                    ...this.s2gState,
                    loadingTissue: null,
                    tissueData,
                    selectedTissues: [VKS_S2G_TISSUE_LABEL],
                    error: null,
                    tissueErrors: {},
                    deselectedMethods,
                    deselectedGenes,
                    viewMode: "tracks",
                };
            } catch (error) {
                if (token !== this.s2gRequestToken) {
                    return;
                }
                console.warn("Variant Sifter variant-links fetch failed", error);
                this.s2gState = {
                    ...this.s2gState,
                    loadingTissue: null,
                    error: "Failed to load SNP-to-gene links for this region.",
                };
            }
        },
        onS2gClear() {
            this.s2gRequestToken += 1;
            this.s2gState = emptyS2gState();
        },
        onS2gDeselectedMethodsUpdate(deselectedMethods) {
            this.s2gState = {
                ...this.s2gState,
                deselectedMethods: Array.isArray(deselectedMethods)
                    ? [...deselectedMethods]
                    : [],
            };
        },
        onS2gDeselectedGenesUpdate(deselectedGenes) {
            this.s2gState = {
                ...this.s2gState,
                deselectedGenes: Array.isArray(deselectedGenes) ? [...deselectedGenes] : [],
            };
        },
        onGeSelectedBiosamplesUpdate(selectedBiosamples) {
            const next = normalizeGeSelectedBiosamples(selectedBiosamples);
            const prev = this.globalEnrichmentState?.selectedBiosamples || [];
            if (
                next.length === prev.length &&
                next.every((item, index) => item === prev[index])
            ) {
                return;
            }
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedBiosamples: next,
            };
        },
        onGeActiveAnnotationUpdate(activeAnnotation) {
            const nextAnnotation = activeAnnotation || null;
            if (this.globalEnrichmentState?.activeAnnotation === nextAnnotation) {
                return;
            }
            const tissueMap = resolveSelectedTissuesByAnnotation({
                selectedTissuesByAnnotation:
                    this.globalEnrichmentState?.selectedTissuesByAnnotation,
                selectedTissues: this.globalEnrichmentState?.selectedTissues,
                activeAnnotation: this.globalEnrichmentState?.activeAnnotation,
            });
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                activeAnnotation: nextAnnotation,
                selectedTissuesByAnnotation: tissueMap,
                selectedTissues: selectedTissuesForAnnotation(
                    tissueMap,
                    nextAnnotation
                ),
                selectedBiosamples: [],
                biosampleLoading: false,
            };
        },
        onGeSelectedTissuesUpdate(selectedTissues) {
            const next = Array.isArray(selectedTissues)
                ? [...new Set(selectedTissues.filter(Boolean))]
                : [];
            const annotation = this.globalEnrichmentState?.activeAnnotation || null;
            const prev = selectedTissuesForAnnotation(
                this.globalEnrichmentState?.selectedTissuesByAnnotation,
                annotation
            );
            if (
                next.length === prev.length &&
                next.every((item, index) => item === prev[index])
            ) {
                return;
            }
            const nextMap = setSelectedTissuesForAnnotation(
                this.globalEnrichmentState?.selectedTissuesByAnnotation,
                annotation,
                next
            );
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedTissuesByAnnotation: nextMap,
                selectedTissues: next,
            };
        },
        onGeBiosampleTissueRegionsUpdate(payload = {}) {
            const previous = this.globalEnrichmentState?.biosampleRegionsByAnnotation;
            const next = upsertGeBiosampleTissueRegions(previous, payload);
            const annotation = payload?.annotation;
            const tissue = payload?.tissue;
            const prevEntry = annotation && tissue ? previous?.[annotation]?.[tissue] : null;
            const nextEntry = annotation && tissue ? next?.[annotation]?.[tissue] : null;
            if (
                prevEntry &&
                nextEntry &&
                prevEntry.regionKey === nextEntry.regionKey &&
                prevEntry.rows?.length === nextEntry.rows?.length
            ) {
                return;
            }
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                biosampleRegionsByAnnotation: next,
            };
        },
        onGeBiosampleLoadingUpdate(isLoading) {
            const next = Boolean(isLoading);
            if (Boolean(this.globalEnrichmentState?.biosampleLoading) === next) {
                return;
            }
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                biosampleLoading: next,
            };
        },
        onRemoveMappingCategory(categoryId) {
            const parsed = parseMappingCategoryId(categoryId);
            if (!parsed) {
                return;
            }

            const currentIds = normalizeMappingState(this.mappingState)
                .selectedCategoryIds;
            if (currentIds.includes(categoryId)) {
                this.onMappingStateUpdate({
                    ...normalizeMappingState(this.mappingState),
                    selectedCategoryIds: currentIds.filter(
                        (id) => id !== categoryId
                    ),
                });
            }

            if (parsed.source === "credible-sets") {
                this.onRemoveCredibleSet(parsed.selectionKey);
                return;
            }

            if (parsed.source === "global-enrichment") {
                const prevMap = resolveSelectedTissuesByAnnotation({
                    selectedTissuesByAnnotation:
                        this.globalEnrichmentState?.selectedTissuesByAnnotation,
                    selectedTissues: this.globalEnrichmentState?.selectedTissues,
                    activeAnnotation: this.globalEnrichmentState?.activeAnnotation,
                });
                const current = selectedTissuesForAnnotation(
                    prevMap,
                    parsed.annotation
                );
                if (!current.includes(parsed.tissue)) {
                    return;
                }
                const nextTissues = current.filter(
                    (tissue) => tissue !== parsed.tissue
                );
                const nextMap = setSelectedTissuesForAnnotation(
                    prevMap,
                    parsed.annotation,
                    nextTissues
                );
                const activeAnnotation =
                    this.globalEnrichmentState?.activeAnnotation || null;
                const tissuePrefix = `${parsed.tissue}:::`;
                const nextBiosamples = (
                    this.globalEnrichmentState?.selectedBiosamples || []
                ).filter((key) => !String(key).startsWith(tissuePrefix));
                this.globalEnrichmentState = {
                    ...this.globalEnrichmentState,
                    selectedTissuesByAnnotation: nextMap,
                    selectedTissues: selectedTissuesForAnnotation(
                        nextMap,
                        activeAnnotation
                    ),
                    selectedBiosamples: normalizeGeSelectedBiosamples(
                        nextBiosamples
                    ),
                };
                return;
            }

            if (parsed.source === "biosamples") {
                const prev =
                    this.globalEnrichmentState?.selectedBiosamples || [];
                const next = prev.filter(
                    (key) => key !== parsed.selectionKey
                );
                if (next.length === prev.length) {
                    return;
                }
                this.onGeSelectedBiosamplesUpdate(next);
                return;
            }

            if (parsed.source === "variant-to-gene-links") {
                const next = normalizeV2gSelectedLinks(
                    this.v2gState?.selectedLinks
                ).filter((key) => key !== parsed.selectionKey);
                this.onV2gSelectedLinksUpdate(next);
                return;
            }

            if (parsed.source === "snp2gene-links") {
                const next = normalizeV2gSelectedLinks(
                    this.s2gState?.selectedLinks
                ).filter((key) => key !== parsed.selectionKey);
                this.onS2gSelectedLinksUpdate(next);
            }
        },
        onMappingStateUpdate(mappingState) {
            const next = normalizeMappingState(mappingState);
            const prev = normalizeMappingState(this.mappingState);
            if (
                next.mappingMode === prev.mappingMode &&
                next.selectedCategoryIds.length === prev.selectedCategoryIds.length &&
                next.selectedCategoryIds.every(
                    (id, index) => id === prev.selectedCategoryIds[index]
                )
            ) {
                return;
            }
            this.mappingState = next;
            if (normalizeWorkspaceMappingFilter(this.workspaceMappingFilter)) {
                if (!next.selectedCategoryIds.length) {
                    this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
                    return;
                }
                this.applyWorkspaceMappingFilter({ quiet: true });
            }
        },
        onWorkspaceFilterActiveUpdate(active) {
            if (active) {
                this.applyWorkspaceMappingFilter({ quiet: false });
                return;
            }
            this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
        },
        applyWorkspaceMappingFilter({ quiet = false } = {}) {
            // Layer 3 only: build a derived filter snapshot from current mapping
            // selections + association rows. Does not mutate loaded data or chip/track
            // selections (layers 1 and 2).
            if (!this.mappingState?.selectedCategoryIds?.length) {
                this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
                if (!quiet) {
                    window.alert(
                        "Select one or more mapping categories before filtering the workspace."
                    );
                }
                return;
            }
            const categories = collectMappingCategories({
                credibleSetsState: this.credibleSetsState,
                globalEnrichmentState: this.globalEnrichmentState,
                v2gState: this.v2gState,
                s2gState: this.s2gState,
            });
            const filter = buildWorkspaceMappingFilter(this.associationsState.rows, {
                mappingCategories: categories,
                selectedCategoryIds: this.mappingState.selectedCategoryIds,
                mappingMode: this.mappingState.mappingMode,
            });
            if (!filter) {
                this.workspaceMappingFilter = emptyWorkspaceMappingFilter();
                if (!quiet) {
                    window.alert(
                        "No mapped variants matched the selected categories."
                    );
                }
                return;
            }
            this.workspaceMappingFilter = filter;
        },
        onV2gSelectedLinksUpdate(selectedLinks) {
            const next = normalizeV2gSelectedLinks(selectedLinks);
            const prev = normalizeV2gSelectedLinks(this.v2gState?.selectedLinks);
            if (
                next.length === prev.length &&
                next.every((key, index) => key === prev[index])
            ) {
                return;
            }
            this.v2gState = {
                ...this.v2gState,
                selectedLinks: next,
            };
        },
        onS2gSelectedLinksUpdate(selectedLinks) {
            const next = normalizeV2gSelectedLinks(selectedLinks);
            const prev = normalizeV2gSelectedLinks(this.s2gState?.selectedLinks);
            if (
                next.length === prev.length &&
                next.every((key, index) => key === prev[index])
            ) {
                return;
            }
            this.s2gState = {
                ...this.s2gState,
                selectedLinks: next,
            };
        },
        onGeBiosampleFilterOptionsUpdate(options = {}) {
            const nextMethods = [
                ...new Set([
                    ...(this.globalEnrichmentState?.biosampleMethodOptions || []),
                    ...(Array.isArray(options.methods) ? options.methods : []),
                ]),
            ].sort();
            const nextSources = [
                ...new Set([
                    ...(this.globalEnrichmentState?.biosampleSourceOptions || []),
                    ...(Array.isArray(options.sources) ? options.sources : []),
                ]),
            ].sort();
            const prevMethods = this.globalEnrichmentState?.biosampleMethodOptions || [];
            const prevSources = this.globalEnrichmentState?.biosampleSourceOptions || [];
            if (
                nextMethods.length === prevMethods.length &&
                nextSources.length === prevSources.length &&
                nextMethods.every((item, index) => item === prevMethods[index]) &&
                nextSources.every((item, index) => item === prevSources[index])
            ) {
                return;
            }
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                biosampleMethodOptions: nextMethods,
                biosampleSourceOptions: nextSources,
            };
        },
    },
});
</script>

<style scoped>
.kp-variant-sifter-workspace {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    background: #ffffff;
    position: relative;
}

.vks-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: var(--cfde-header-bg, #f6f5f2);
    z-index: 20;
    border-radius: 11px 11px 0 0;
}

.vks-header.is-pinned {
    border-radius: 0;
    box-shadow: 0 2px 12px rgba(20, 22, 30, 0.12);
}

.vks-header-spacer {
    flex-shrink: 0;
}

.vks-header-start {
    display: flex;
    align-items: center;
    gap: 24px;
    min-width: 0;
    justify-self: start;
}

.vks-header-session {
    margin: 0;
    grid-column: 2;
    justify-self: center;
    max-width: min(560px, 42vw);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    line-height: 1.35;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
    text-align: center;
}

.vks-header-controls,
.vks-header >>> .vks-viewport-controls {
    grid-column: 3;
    justify-self: end;
    margin-left: 0;
}

.vks-brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 0;
}

.vks-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange, #e07b39);
    font-size: 1.05rem;
}

.vks-title {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    font-size: 1.05rem;
}

.vks-main {
    display: flex;
    align-items: flex-start;
    position: relative;
    background: #ffffff;
    border-radius: 0 0 11px 11px;
}

.vks-drawer-rail-slot {
    flex: 0 0 var(--vks-drawer-tab-width, 30px);
    width: var(--vks-drawer-tab-width, 30px);
    align-self: stretch;
}

.vks-stage {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    background: #ffffff;
}

.vks-session-import-input {
    display: none;
}
</style>
