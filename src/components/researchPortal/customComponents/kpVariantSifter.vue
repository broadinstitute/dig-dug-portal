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
                <VariantSifterMenuBar @action="onMenuAction" />
            </div>
            <p
                v-if="searchSessionLabel"
                class="vks-header-session"
                :title="searchSessionLabel"
            >
                {{ searchSessionLabel }}
            </p>
            <VariantSifterViewportControls
                :region-zoom="regionZoom"
                :region-zoom-out="regionZoomOut"
                :zoom-out-at-limit="zoomOutAtLimit"
                :region-view-area="regionViewArea"
                :data-table-open="dataTableOpen"
                :ai-assistant-open="aiAssistantOpen"
                @update:regionZoom="onRegionZoomUpdate"
                @update:regionZoomOut="onRegionZoomOutUpdate"
                @zoom-slider-commit="onRegionZoomSliderCommit"
                @update:dataTableOpen="dataTableOpen = $event"
                @toggle-assistant="aiAssistantOpen = !aiAssistantOpen"
            />
        </header>
        <div
            v-show="chromePinned"
            class="vks-header-spacer"
            :style="{ height: `${headerHeightPx}px` }"
            aria-hidden="true"
        ></div>

        <VariantSifterWorkspaceGuide v-if="canvasActive" />

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
                    :canvas-active="canvasActive"
                    :welcome-open="welcomeOpen"
                    :phenotypes="phenotypes"
                    :utils="utilsBox"
                    :welcome-initial-values="welcomeInitialValues"
                    :search-session="searchSession"
                    :region-zoom="regionZoom"
                    :region-shift-bp="regionShiftBp"
                    :region-view-area="regionViewArea"
                    :view-region="viewRegion"
                    :data-table-open="dataTableOpen"
                    :associations-state="associationsState"
                    :genes-state="genesState"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-markers="plotMarkersState"
                    :credible-sets-state="credibleSetsState"
                    :credible-set-colors="credibleSetDotColors"
                    :credible-set-pill-colors="credibleSetPillColors"
                    :global-enrichment-state="globalEnrichmentState"
                    :region-load-progress-active="regionLoadProgress.active"
                    @update:regionShiftBp="onRegionShiftBpUpdate"
                    @update:regionViewArea="onRegionViewAreaUpdate"
                    @pan-end="onRegionPanEnd"
                    @toggle-position-marker="onTogglePositionMarker"
                    @toggle-star-variant="onToggleStarVariant"
                    @set-reference-variant="onSetReferenceVariant"
                    @update:associationsFiltersIndex="onAssociationsFiltersIndexUpdate"
                    @add-credible-set="onAddCredibleSet"
                    @remove-credible-set="onRemoveCredibleSet"
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
                    @close="aiAssistantOpen = false"
                    @update:activeTab="onAssistantActiveTabUpdate"
                    @run-action="onAssistantRunAction"
                />
            </div>
            <div v-if="canvasActive" class="vks-drawer-rail-slot">
                <VariantSifterSectionDrawers
                    :sections="sections"
                    :open-drawer-id="openDrawerId"
                    :search-session="searchSession"
                    :associations-state="associationsState"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-markers="plotMarkersState"
                    :credible-sets-state="credibleSetsState"
                    :credible-set-pill-colors="credibleSetPillColors"
                    :genes-state="genesState"
                    :global-enrichment-state="globalEnrichmentState"
                    :utils="utilsBox"
                    :region-load-progress-active="regionLoadProgress.active"
                    :rail-pinned="chromePinned"
                    :rail-pin-style="pinnedChromeStyle.drawer"
                    @toggle-drawer="onToggleDrawer"
                    @update:associationsFiltersIndex="onAssociationsFiltersIndexUpdate"
                    @toggle-star-variant="onToggleStarVariant"
                    @set-reference-variant="onSetReferenceVariant"
                    @add-credible-set="onAddCredibleSet"
                    @remove-credible-set="onRemoveCredibleSet"
                    @update:genesSelectedTypes="onGenesSelectedTypesUpdate"
                    @update:geEnabledMutedAnnotations="onGeEnabledMutedAnnotationsUpdate"
                    @update:geEnabledMutedTissues="onGeEnabledMutedTissuesUpdate"
                    @update:geShowFilteredTissuesInTracks="onGeShowFilteredTissuesInTracksUpdate"
                    @update:geSelectedAnnotations="onGeSelectedAnnotationsUpdate"
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
import { VARIANT_SIFTER_SECTIONS } from "./kpVariantSifter/variantSifterSections.js";
import { parseRegionParam, formatRegion, formatSearchSessionLabel } from "./kpVariantSifter/variantSifterSearchUtils.js";
import { fetchAssociations } from "./kpVariantSifter/variantSifterAssociationsApi.js";
import { formatAssociationRows } from "./kpVariantSifter/variantSifterAssociationsTable.js";
import { createFiltersIndex } from "./kpVariantSifter/variantSifterAssociationsFilters.js";
import { enrichAssociationRowsWithLdScores, enrichAssociationRowsWithLdScoresForRef } from "./kpVariantSifter/variantSifterLdServer.js";
import {
    emptyPlotMarkersState,
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
import { clampRegionZoom, clampRegionViewArea } from "./kpVariantSifter/variantSifterRegionZoom.js";
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
    mergeAssociationRowsByVariantId,
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
import {
    applyGlobalEnrichmentAnnoRows,
    buildAnnoDataFromRows,
    buildGeLlmLoadingState,
    buildGeLlmRelevanceShowAllState,
    emptyGeLlmRelevanceState,
    extractGeCatalog,
    filterAnnoRowsInRegion,
    isGeLlmFilterComplete,
    mergeAnnoRows,
} from "./kpVariantSifter/variantSifterGlobalEnrichmentData.js";
import { fetchGeRelevanceFromLlm, fetchInteractiveLlmHealth } from "./kpVariantSifter/variantSifterGeRelevanceLlm.js";
import {
    buildGeRelevanceIntroMessage,
    buildGeRelevanceReportMessage,
    buildGeRelevanceRunningMessage,
} from "./kpVariantSifter/variantSifterAssistantGeRelevance.js";
import {
    appendAssistantEntries,
    createAssistantStatusMessage,
    createAssistantStepMessage,
    emptyAssistantState,
    removePendingAssistantEntry,
    replacePendingAssistantEntry,
} from "./kpVariantSifter/variantSifterAssistantConversation.js";
import { fetchRecombinationRate } from "./kpVariantSifter/variantSifterPlotShared.js";
import {
    pickLeadVariantRow,
    resolveLdReferenceRow,
    rowToLdVariant,
} from "./kpVariantSifter/variantSifterLdServer.js";
import { buildAssociationsRegionPlotConfig } from "./kpVariantSifter/variantSifterAssociationsPlotConfig.js";
import {
    fetchCredibleSetsList,
    fetchCredibleSetVariants,
} from "./kpVariantSifter/variantSifterCredibleSetsApi.js";
import {
    credibleSetOptionLabel,
    formatCredibleVariantRows,
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
        enabledMutedTissues: [],
        selectedAnnotations: [],
        showFilteredTissuesInTracks: false,
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
    },
    data() {
        return {
            sections: VARIANT_SIFTER_SECTIONS,
            canvasActive: false,
            welcomeOpen: true,
            searchSession: null,
            welcomeInitialValues: null,
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
            associationsRequestToken: 0,
            genesRequestToken: 0,
            plotOverlaysRequestToken: 0,
            credibleSetsRequestToken: 0,
            globalEnrichmentRequestToken: 0,
            lastCredibleSetsListRegion: null,
            exportSessionOpen: false,
            exportSessionBusy: false,
            chromePinned: false,
            headerHeightPx: 53,
            pinnedChromeStyle: {
                header: {},
                drawer: {},
            },
        };
    },
    computed: {
        phenotypes() {
            return this.phenotypesInUse || [];
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
            return parts.join(" · ");
        },
        searchSessionLabel() {
            return formatSearchSessionLabel(this.searchSession);
        },
        assistantCanRunActions() {
            const catalog = this.globalEnrichmentState?.catalog;
            return Boolean(
                this.searchSession &&
                    (catalog?.annotations?.length || catalog?.tissues?.length)
            );
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
            if (!workspace || !header) {
                return;
            }

            const workspaceRect = workspace.getBoundingClientRect();
            const headerHeight = header.offsetHeight || 53;
            this.headerHeightPx = headerHeight;

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

            this.regionZoom = 0;
            this.regionZoomOut = 0;
            this.regionViewArea = 0;
            this.pendingPanSliderReset = false;
        },
        onRegionPanEnd() {
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
            const host = this.utilsBox?.uiUtils?.biDomain?.();
            if (!host) {
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
                        const result = await fetchAssociations(gapSession, host);
                        const formattedRows = formatAssociationRows(result.rows, gapSession);
                        if (formattedRows.length) {
                            extendedAssociationRows = true;
                        }
                        mergedRows = mergeAssociationRowsByVariantId(mergedRows, formattedRows);
                        this.flushStreamedAssociationRows(mergedRows, activeRegion, gapRegion);
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
                                    plotConfig["genome reference"]
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
                                const newAnnoRows = await fetchLocusAnnotations(gapRegion, host);
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
            if (payload.action === "downloadTable") {
                this.dataTableOpen = true;
                return;
            }
            if (payload.action === "resetSearch") {
                this.resetSearch();
                return;
            }
            if (payload.action === "exportSession") {
                this.exportSession();
                return;
            }
            if (payload.action === "importSession") {
                this.openSessionImport();
            }
        },
        exportSession() {
            try {
                exportVariantSifterSession({
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    plotMarkersState: this.plotMarkersState,
                    credibleSetsState: this.credibleSetsState,
                    globalEnrichmentState: this.globalEnrichmentState,
                    regionZoom: this.regionZoom,
                    regionZoomOut: this.regionZoomOut,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
                });
                this.exportSessionOpen = true;
            } catch (error) {
                window.alert(error.message || "Could not export session.");
            }
        },
        async onExportSessionConfirm({ filename }) {
            if (this.exportSessionBusy) {
                return;
            }

            try {
                const payload = exportVariantSifterSession({
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    plotMarkersState: this.plotMarkersState,
                    credibleSetsState: this.credibleSetsState,
                    globalEnrichmentState: this.globalEnrichmentState,
                    regionZoom: this.regionZoom,
                    regionZoomOut: this.regionZoomOut,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
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
                const restored = importVariantSifterSession(payload, this.phenotypes);
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
            this.globalEnrichmentRequestToken += 1;
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
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.welcomeInitialValues = null;
            this.dataTableOpen = restored.dataTableOpen ?? false;
            this.syncUrlSearchParams(restored.searchSession);
            this.afterSessionRestored(restored);
        },
        afterSessionRestored(restored) {
            if (restored.globalEnrichmentState) {
                this.setRegionLoadStep("globalEnrichment", VKS_REGION_LOAD_STATUS.DONE);
                this.maybeRunBackgroundGeFilter();
                return;
            }
            this.loadGlobalEnrichmentForSession(restored.searchSession, {
                runFilterWhenReady: true,
                silentFilter: true,
            });
        },
        maybeRunBackgroundGeFilter() {
            const catalog = this.globalEnrichmentState?.catalog;
            if (
                !this.searchSession ||
                !catalog?.tissues?.length ||
                isGeLlmFilterComplete(this.globalEnrichmentState?.llmRelevance)
            ) {
                return;
            }
            this.$nextTick(() => {
                this.runAssistantAction("filter_ge_relevance", {
                    auto: true,
                    silent: true,
                });
            });
        },
        async loadGlobalEnrichmentForSession(
            session,
            { runFilterWhenReady = false, silentFilter = false, requestToken } = {}
        ) {
            if (!session?.region) {
                return false;
            }

            const geToken = requestToken ?? ++this.globalEnrichmentRequestToken;
            const host = this.utilsBox?.uiUtils?.biDomain?.();
            if (!host) {
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
                    fetchGlobalEnrichment(session, host),
                    fetchLocusAnnotations(session.region, host),
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
                    enabledMutedTissues: [],
                    selectedAnnotations: [...catalog.annotations],
                };
                this.setRegionLoadStep(
                    "globalEnrichment",
                    Object.keys(annoData).length
                        ? VKS_REGION_LOAD_STATUS.DONE
                        : VKS_REGION_LOAD_STATUS.FAILED
                );

                if (runFilterWhenReady && Object.keys(annoData).length) {
                    this.$nextTick(() => {
                        this.runAssistantAction("filter_ge_relevance", {
                            auto: true,
                            silent: silentFilter,
                            requestToken: geToken,
                        });
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
            this.assistantActionToken += 1;
            this.searchSession = null;
            this.associationsState = emptyAssociationsState();
            this.genesState = emptyGenesState();
            this.plotOverlaysState = emptyPlotOverlaysState();
            this.plotMarkersState = emptyPlotMarkersState();
            this.credibleSetsState = emptyCredibleSetsState();
            this.globalEnrichmentState = emptyGlobalEnrichmentState();
            this.assistantState = emptyAssistantState();
            this.aiAssistantOpen = false;
            this.lastCredibleSetsListRegion = null;
            this.dataRegion = null;
            this.regionShiftBp = 0;
            this.regionLoadProgress = emptyRegionLoadProgress();
            this.resetRegionViewport();
            this.openDrawerId = null;
            this.dataTableOpen = false;
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
            });
        },
        onStartSearch(session) {
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
            this.lastCredibleSetsListRegion = null;
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.syncUrlSearchParams(session);
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

            const host = this.utilsBox?.uiUtils?.biDomain?.();
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
                const available = await fetchCredibleSetsList(session, host);
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
        async onAddCredibleSet({ credibleSetId, phenotype }) {
            if (!credibleSetId || !this.searchSession) {
                return;
            }
            if (this.credibleSetsState.selectedIds.includes(credibleSetId)) {
                return;
            }

            const host = this.utilsBox?.uiUtils?.biDomain?.();
            if (!host) {
                return;
            }

            const availableEntry = this.credibleSetsState.available.find(
                (entry) => entry.credibleSetId === credibleSetId
            );
            const resolvedPhenotype = phenotype || availableEntry?.phenotype || null;

            this.credibleSetsState = {
                ...this.credibleSetsState,
                selectedIds: [...this.credibleSetsState.selectedIds, credibleSetId],
                variantsLoading: true,
                variantsError: null,
            };

            try {
                const rawVariants = await fetchCredibleSetVariants(
                    this.searchSession,
                    credibleSetId,
                    host
                );
                const formattedVariants = formatCredibleVariantRows(rawVariants);
                this.credibleSetsState = {
                    ...this.credibleSetsState,
                    variantsLoading: false,
                    variantsBySet: {
                        ...this.credibleSetsState.variantsBySet,
                        [credibleSetId]: {
                            meta: {
                                credibleSetId,
                                phenotype: resolvedPhenotype,
                                label: credibleSetOptionLabel(
                                    availableEntry || { credibleSetId }
                                ),
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
                        (id) => id !== credibleSetId
                    ),
                };
            }
        },
        onRemoveCredibleSet(credibleSetId) {
            if (!credibleSetId) {
                return;
            }
            const nextVariantsBySet = { ...this.credibleSetsState.variantsBySet };
            delete nextVariantsBySet[credibleSetId];
            this.credibleSetsState = {
                ...this.credibleSetsState,
                selectedIds: this.credibleSetsState.selectedIds.filter(
                    (id) => id !== credibleSetId
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
                    plotConfig["genome reference"]
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
                const rowsWithLd = await enrichAssociationRowsWithLdScoresForRef(
                    rows,
                    {
                        ...this.searchSession,
                        region: activeRegion,
                    },
                    refRow,
                    activeRegion
                );
                if (isCancelled()) {
                    return false;
                }

                const ldAvailable = rowsWithLd.some(
                    (row) => row.LDS != null && !Number.isNaN(row.LDS)
                );
                this.associationsState = {
                    ...this.associationsState,
                    ldLoading: false,
                    ldError: ldAvailable
                        ? null
                        : "LD scores could not be loaded for the extended region.",
                    rows: filterAssociationRowsInRegion(rowsWithLd, activeRegion),
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

            const host = this.utilsBox?.uiUtils?.biDomain?.();
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
                const result = await fetchAssociations(session, host);
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
                            plotConfig["genome reference"]
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
                        const available = await fetchCredibleSetsList(session, host);
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
                        runFilterWhenReady: true,
                        silentFilter: false,
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

            this.onStartSearch({
                phenotype,
                ancestry: params.ancestry || null,
                region,
                regionLabel: formatRegion(region),
                geneOrVariantQuery: params.region,
                regionExpandBp: null,
            });
        },
        syncUrlSearchParams(session) {
            if (!this.utilsBox?.keyParams || !session?.phenotype || !session?.regionLabel) {
                return;
            }

            const nextParams = {
                phenotype: session.phenotype.name,
                region: session.regionLabel,
            };
            if (session.ancestry) {
                nextParams.ancestry = session.ancestry;
            } else {
                nextParams.ancestry = undefined;
            }

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
        onAssistantRunAction(actionId) {
            this.runAssistantAction(actionId, { auto: false });
        },
        async runAssistantAction(actionId, { auto = false, requestToken, silent = false } = {}) {
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

            if (!silent) {
                this.aiAssistantOpen = true;
                this.assistantState = {
                    ...this.assistantState,
                    activeTab: "request",
                    executing: true,
                    executionProgressLabel: runningLabel,
                    threadEntries: appendAssistantEntries(this.assistantState.threadEntries, [
                        createAssistantStepMessage(
                            buildGeRelevanceIntroMessage(session, catalog)
                        ),
                        createAssistantStatusMessage(runningLabel, { pending: true }),
                    ]),
                };
            }

            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                llmRelevance: buildGeLlmLoadingState(annotationLabels),
            };

            try {
                const result = await fetchGeRelevanceFromLlm({
                    session,
                    annoData: this.globalEnrichmentState?.annoData || {},
                    annotations: catalog.annotations,
                    tissues: catalog.tissues,
                });
                if (
                    actionToken !== this.assistantActionToken ||
                    geToken !== this.globalEnrichmentRequestToken
                ) {
                    return;
                }

                const llmRelevance = {
                    loading: false,
                    error: result.error || null,
                    llmUsed: Boolean(result.llmUsed),
                    tissueOnly: result.tissueOnly !== false,
                    filterComplete: result.filterComplete !== false,
                    relevantAnnotations: result.relevantAnnotations || annotationLabels,
                    relevantTissues: result.relevantTissues || [],
                    rationaleById: result.rationaleById || {},
                };

                this.globalEnrichmentState = {
                    ...this.globalEnrichmentState,
                    llmRelevance,
                    enabledMutedAnnotations: [],
                    enabledMutedTissues: [],
                };

                if (!silent) {
                    const report = buildGeRelevanceReportMessage({
                        session,
                        catalog,
                        llmRelevance,
                    });
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        threadEntries: appendAssistantEntries(
                            removePendingAssistantEntry(this.assistantState.threadEntries),
                            [createAssistantStepMessage(report)]
                        ),
                    };
                } else if (this.assistantState.executing) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                    };
                }
            } catch (error) {
                if (
                    actionToken !== this.assistantActionToken ||
                    geToken !== this.globalEnrichmentRequestToken
                ) {
                    return;
                }
                console.warn("Variant Sifter GE LLM relevance failed", error);
                const errorMessage =
                    error?.message ||
                    "LLM relevance filtering is unavailable; showing all tissues and annotations.";
                this.globalEnrichmentState = {
                    ...this.globalEnrichmentState,
                    llmRelevance: buildGeLlmRelevanceShowAllState(annotationLabels, {
                        error: errorMessage,
                    }),
                };
                if (!silent) {
                    this.assistantState = {
                        ...this.assistantState,
                        executing: false,
                        executionProgressLabel: "",
                        threadEntries: replacePendingAssistantEntry(
                            this.assistantState.threadEntries,
                            `${errorMessage} Showing full global enrichment data.`,
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
        onGeSelectedAnnotationsUpdate(selectedAnnotations) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                selectedAnnotations: [...selectedAnnotations],
            };
        },
        onGeEnabledMutedAnnotationsUpdate(enabledMutedAnnotations) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                enabledMutedAnnotations: [...enabledMutedAnnotations],
            };
        },
        onGeEnabledMutedTissuesUpdate(enabledMutedTissues) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                enabledMutedTissues: [...enabledMutedTissues],
            };
        },
        onGeShowFilteredTissuesInTracksUpdate(showFilteredTissuesInTracks) {
            this.globalEnrichmentState = {
                ...this.globalEnrichmentState,
                showFilteredTissuesInTracks: Boolean(showFilteredTissuesInTracks),
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

.vks-header >>> .vks-viewport-controls {
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
