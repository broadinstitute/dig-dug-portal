<template>
    <div class="vks-associations-plot">
        <div v-if="loading && !hasPlotSeriesData && !hideLoadingStatus" class="vks-associations-plot-status">
            Loading associations…
        </div>
        <div
            v-else-if="error && !hasPlotSeriesData"
            class="vks-associations-plot-error"
            role="alert"
        >
            {{ error }}
        </div>
        <div
            v-else-if="!loading && !hasPlotSeriesData"
            class="vks-associations-plot-status"
        >
            No association data to plot for this locus.
        </div>
        <template v-else-if="hasPlotSeriesData">
            <div ref="plotStack" class="vks-associations-plot-stack">
                <div v-if="showGwasCeAssociationsSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">GWAS-CE associations</h3>
                    </header>
                    <div
                        v-if="loading && !gwasCePlotRows.length"
                        class="vks-associations-plot-status vks-associations-plot-status--inline"
                    >
                        Loading GWAS-CE associations…
                    </div>
                    <div
                        v-else-if="!gwasCePlotRows.length"
                        class="vks-associations-plot-status vks-associations-plot-status--inline vks-associations-plot-status--warning"
                        role="status"
                    >
                        No data found in GWAS-CE
                    </div>
                    <VariantSifterAssociationRegionPlot
                        v-else
                        :plot-rows="gwasCePlotData"
                        :show-legend="true"
                        :recomb-peak-intervals="recombPeakIntervals"
                        :region="searchSession?.region"
                        :search-session="searchSession"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :view-region="viewRegion"
                        :plot-overlays-state="gwasCePlotOverlaysState"
                        :plot-margin="plotMargin"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-markers="plotMarkers"
                        :utils="utils"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                    />
                </div>
                <div v-if="showKpAssociationsSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Associations</h3>
                    </header>
                    <div
                        v-for="(series, searchIndex) in searchingPlotSeries"
                        :key="`assoc-search-${series.phenotype || 'primary'}-${series.ancestry}`"
                        class="vks-associations-plot-series vks-associations-plot-series--searching"
                    >
                        <div
                            v-if="series.showPhenotypeHeader"
                            class="vks-associations-phenotype-header"
                        >
                            <span
                                class="vks-associations-phenotype-bubble"
                                :title="`${series.phenotypeLabel} · ${series.rows.length.toLocaleString()} associations (searching region)`"
                            >
                                {{ series.phenotypeLabel }}
                            </span>
                        </div>
                        <div
                            v-if="series.showAncestryHeader"
                            class="vks-associations-ancestry-header"
                        >
                            <span
                                class="vks-associations-ancestry-bubble"
                                :title="`${series.label} · ${series.rows.length.toLocaleString()} associations (searching region)`"
                            >
                                <span class="vks-associations-ancestry-bubble-code">{{ series.ancestry }}</span>
                                <span class="vks-associations-ancestry-bubble-label">{{ series.label }}</span>
                                <span class="vks-associations-ancestry-bubble-count">
                                    {{ series.rows.length.toLocaleString() }}
                                </span>
                            </span>
                        </div>
                        <div
                            v-if="!series.rows.length"
                            class="vks-associations-plot-status vks-associations-plot-status--inline"
                        >
                            No association points for {{ series.label }}.
                        </div>
                        <GP2BrowserAssociationRegionPlot
                            v-else
                            :plot-rows="series.plotData"
                            :display-height="24"
                            :pan-mode="'searching'"
                            :highlight-view-region="viewRegion"
                            :show-view-region-handle="true"
                            :show-view-region-bridge="searchIndex === searchingPlotSeries.length - 1"
                            :bridge-genes="bridgeGenesForPlot"
                            :viewing-center-bp="viewingCenterBp"
                            :viewing-region-half-width-bp="viewingRegionHalfWidthBp"
                            :show-legend="
                                series.ancestry === firstPlotSeriesAncestry &&
                                    series.phenotype === firstPlotSeriesPhenotype
                            "
                            :recomb-peak-intervals="searchingRecombPeakIntervals"
                            :region="searchingRegion"
                            :search-session="searchSession"
                            :region-zoom="0"
                            :region-shift-bp="regionShiftBp"
                            :region-view-area="0"
                            :view-region="searchingRegion"
                            :plot-overlays-state="plotOverlaysState"
                            :plot-margin="plotMargin"
                            :shared-canvas-width="stackCanvasWidth"
                            :plot-markers="plotMarkers"
                            :utils="utils"
                            @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                            @update:regionViewArea="$emit('update:regionViewArea', $event)"
                            @update:viewingCenterBp="$emit('update:viewingCenterBp', $event)"
                            @commit-viewing-region="$emit('commit-viewing-region')"
                            @pan-end="$emit('pan-end')"
                            @toggle-position-marker="$emit('toggle-position-marker', $event)"
                            @toggle-star-variant="$emit('toggle-star-variant', $event)"
                            @set-reference-variant="$emit('set-reference-variant', $event)"
                        />
                    </div>
                    <div
                        v-for="series in viewingPlotSeries"
                        :key="`assoc-view-${series.phenotype || 'primary'}-${series.ancestry}`"
                        class="vks-associations-plot-series vks-associations-plot-series--viewing"
                    >
                        <div
                            v-if="series.showPhenotypeHeader"
                            class="vks-associations-phenotype-header"
                        >
                            <span
                                class="vks-associations-phenotype-bubble"
                                :title="`${series.phenotypeLabel} · ${series.rows.length.toLocaleString()} associations in ${viewingRegionWidthLabel} viewing region`"
                            >
                                {{ series.phenotypeLabel }}
                            </span>
                        </div>
                        <div
                            v-if="series.showAncestryHeader"
                            class="vks-associations-ancestry-header"
                        >
                            <span
                                class="vks-associations-ancestry-bubble"
                                :title="`${series.label} · ${series.rows.length.toLocaleString()} associations in ${viewingRegionWidthLabel} viewing region`"
                            >
                                <span class="vks-associations-ancestry-bubble-code">{{ series.ancestry }}</span>
                                <span class="vks-associations-ancestry-bubble-label">{{ series.label }}</span>
                                <span class="vks-associations-ancestry-bubble-count">
                                    {{ series.rows.length.toLocaleString() }}
                                </span>
                            </span>
                        </div>
                        <div
                            v-if="!series.rows.length"
                            class="vks-associations-plot-status vks-associations-plot-status--inline"
                        >
                            No association points for {{ series.label }} in this {{ viewingRegionWidthLabel }} viewing region.
                        </div>
                        <GP2BrowserAssociationRegionPlot
                            v-else
                            :plot-rows="series.plotData"
                            :display-height="120"
                            :pan-mode="'viewing'"
                            :viewing-center-bp="viewingCenterBp"
                            :viewing-region-half-width-bp="viewingRegionHalfWidthBp"
                            :show-legend="false"
                            :recomb-peak-intervals="recombPeakIntervals"
                            :region="searchingRegion"
                            :search-session="searchSession"
                            :region-zoom="regionZoom"
                            :region-shift-bp="regionShiftBp"
                            :region-view-area="regionViewArea"
                            :view-region="viewRegion"
                            :plot-overlays-state="plotOverlaysState"
                            :plot-margin="plotMargin"
                            :shared-canvas-width="stackCanvasWidth"
                            :plot-markers="plotMarkers"
                            :utils="utils"
                            @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                            @update:regionViewArea="$emit('update:regionViewArea', $event)"
                            @update:viewingCenterBp="$emit('update:viewingCenterBp', $event)"
                            @commit-viewing-region="$emit('commit-viewing-region')"
                            @pan-end="$emit('pan-end')"
                            @toggle-position-marker="$emit('toggle-position-marker', $event)"
                            @toggle-star-variant="$emit('toggle-star-variant', $event)"
                            @set-reference-variant="$emit('set-reference-variant', $event)"
                        />
                    </div>
                </div>
                <div v-if="showQtlEvidencesSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">QTL evidences</h3>
                    </header>
                    <div
                        v-if="qtlState.loading"
                        class="vks-associations-plot-status vks-associations-plot-status--inline"
                    >
                        Loading QTL evidences…
                    </div>
                    <div
                        v-else-if="qtlState.error"
                        class="vks-associations-plot-status vks-associations-plot-status--inline vks-associations-plot-status--warning"
                        role="status"
                    >
                        {{ qtlState.error }}
                    </div>
                    <template v-else>
                        <div
                            v-if="!qtlSearchingPlotRows"
                            class="vks-associations-plot-status vks-associations-plot-status--inline"
                        >
                            No QTL evidence for this locus.
                        </div>
                        <GP2BrowserQtlRegionPlot
                            v-else
                            :plot-rows="qtlSearchingPlotRows"
                            :display-height="24"
                            pan-mode="searching"
                            :highlight-view-region="viewRegion"
                            :show-view-region-handle="true"
                            :show-view-region-bridge="true"
                            :bridge-genes="bridgeGenesForPlot"
                            :viewing-center-bp="viewingCenterBp"
                            :viewing-region-half-width-bp="viewingRegionHalfWidthBp"
                            :show-legend="true"
                            :recomb-peak-intervals="searchingRecombPeakIntervals"
                            :region="searchingRegion"
                            :region-zoom="0"
                            :region-shift-bp="regionShiftBp"
                            :region-view-area="0"
                            :view-region="searchingRegion"
                            :plot-margin="plotMargin"
                            :shared-canvas-width="stackCanvasWidth"
                            :plot-markers="plotMarkers"
                            :utils="utils"
                            @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                            @update:regionViewArea="$emit('update:regionViewArea', $event)"
                            @update:viewingCenterBp="$emit('update:viewingCenterBp', $event)"
                            @commit-viewing-region="$emit('commit-viewing-region')"
                            @pan-end="$emit('pan-end')"
                            @toggle-position-marker="$emit('toggle-position-marker', $event)"
                            @toggle-star-variant="$emit('toggle-qtl-star-variant', $event)"
                            @set-reference-variant="$emit('set-reference-variant', $event)"
                        />
                        <div
                            v-if="!qtlViewingPlotRows"
                            class="vks-associations-plot-status vks-associations-plot-status--inline"
                        >
                            No QTL evidence in this {{ viewingRegionWidthLabel }} viewing region.
                        </div>
                        <GP2BrowserQtlRegionPlot
                            v-else
                            :plot-rows="qtlViewingPlotRows"
                            :display-height="120"
                            pan-mode="viewing"
                            :viewing-center-bp="viewingCenterBp"
                            :viewing-region-half-width-bp="viewingRegionHalfWidthBp"
                            :show-legend="false"
                            :recomb-peak-intervals="recombPeakIntervals"
                            :region="searchingRegion"
                            :region-zoom="regionZoom"
                            :region-shift-bp="regionShiftBp"
                            :region-view-area="regionViewArea"
                            :view-region="viewRegion"
                            :plot-margin="plotMargin"
                            :shared-canvas-width="stackCanvasWidth"
                            :plot-markers="plotMarkers"
                            :utils="utils"
                            @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                            @update:regionViewArea="$emit('update:regionViewArea', $event)"
                            @update:viewingCenterBp="$emit('update:viewingCenterBp', $event)"
                            @commit-viewing-region="$emit('commit-viewing-region')"
                            @pan-end="$emit('pan-end')"
                            @toggle-position-marker="$emit('toggle-position-marker', $event)"
                            @toggle-star-variant="$emit('toggle-qtl-star-variant', $event)"
                            @set-reference-variant="$emit('set-reference-variant', $event)"
                        />
                    </template>
                </div>
                <div v-if="showCredibleSetsSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Credible sets</h3>
                    </header>
                    <VariantSifterCredibleSetsTrack
                        :selected-sets="credibleSetsTrackData"
                        :recomb-peak-intervals="recombPeakIntervals"
                        :color-by-set-id="credibleSetColors"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :search-session="searchSession"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-markers="plotMarkers"
                        :utils="utils"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                    />
                </div>
                <div v-if="showGlobalEnrichmentSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Global enrichment</h3>
                    </header>
                    <VariantSifterAnnotationsWorkspaceTrack
                        :global-enrichment-state="globalEnrichmentState"
                        :workspace-mapping-filter="workspaceMappingFilter"
                        :search-session="searchSession"
                        :selected-phenotypes="selectedPhenotypes"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-markers="plotMarkers"
                        :recomb-peak-intervals="recombPeakIntervals"
                        :utils="utils"
                        :tissue-regions-host="tissueRegionsHost"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @update:selectedBiosamples="$emit('update:geSelectedBiosamples', $event)"
                        @update:activeAnnotation="$emit('update:geActiveAnnotation', $event)"
                        @update:selectedTissues="$emit('update:geSelectedTissues', $event)"
                        @update:selectedAnnotations="
                            $emit('update:geSelectedAnnotations', $event)
                        "
                        @select-plot-tissue="$emit('select-ge-plot-tissue', $event)"
                        @update:biosampleFilterOptions="
                            $emit('update:geBiosampleFilterOptions', $event)
                        "
                        @update:biosampleTissueRegions="
                            $emit('update:geBiosampleTissueRegions', $event)
                        "
                        @update:biosampleLoading="$emit('update:geBiosampleLoading', $event)"
                    />
                </div>
                <div v-if="showV2gSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Gene links</h3>
                    </header>
                    <VariantSifterV2gTrack
                        :v2g-state="v2gState"
                        :workspace-mapping-filter="workspaceMappingFilter"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-margin="plotMargin"
                        :plot-markers="plotMarkers"
                        :recomb-peak-intervals="recombPeakIntervals"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @update:selectedLinks="$emit('update:v2gSelectedLinks', $event)"
                    />
                </div>
                <div v-if="showS2gSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">SNP 2 gene links</h3>
                    </header>
                    <VariantSifterV2gTrack
                        :v2g-state="s2gState"
                        :workspace-mapping-filter="workspaceMappingFilter"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-margin="plotMargin"
                        :plot-markers="plotMarkers"
                        :recomb-peak-intervals="recombPeakIntervals"
                        empty-message="Load SNP-to-gene links from the SNP 2 gene panel."
                        legend-aria-label="SNP-to-gene methods"
                        loading-status-template="Loading SNP-to-gene links…"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @update:selectedLinks="$emit('update:s2gSelectedLinks', $event)"
                    />
                </div>
            </div>
            <div v-if="showGenesSection" class="vks-genes-track-slot">
                <div
                    v-if="genesDockPinned"
                    class="vks-genes-track-spacer"
                    :style="{ height: `${genesTrackHeight}px` }"
                    aria-hidden="true"
                ></div>
                <div
                    ref="genesDock"
                    class="vks-genes-track-dock"
                    :class="{ 'is-pinned': genesDockPinned }"
                    :style="genesDockPinned ? genesDockPinnedStyle : null"
                >
                    <VariantSifterGenesTrack
                        :key="genesTrackKey"
                        :genes="genesTrackData"
                        :recomb-peak-intervals="searchingRecombPeakIntervals"
                        :region="searchingRegion"
                        :view-region="searchingRegion"
                        :plot-margin="plotMargin"
                        :region-zoom="0"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-markers="plotMarkers"
                        :color-by-gene-type="geneTypeColors"
                        @track-layout="onGenesTrackLayout"
                    />
                </div>
            </div>
            <p v-if="ldLoading" class="vks-associations-plot-note">
                Loading LD scores for table…
            </p>
            <p v-else-if="ldError" class="vks-associations-plot-note">
                {{ ldError }}
            </p>
        </template>
    </div>
</template>

<script>
import VariantSifterGenesTrack from "../kpVariantSifter/VariantSifterGenesTrack.vue";
import VariantSifterCredibleSetsTrack from "../kpVariantSifter/VariantSifterCredibleSetsTrack.vue";
import VariantSifterAssociationRegionPlot from "../kpVariantSifter/VariantSifterAssociationRegionPlot.vue";
import GP2BrowserAssociationRegionPlot from "./GP2BrowserAssociationRegionPlot.vue";
import GP2BrowserQtlRegionPlot from "./GP2BrowserQtlRegionPlot.vue";
import VariantSifterAnnotationsWorkspaceTrack from "../kpVariantSifter/VariantSifterAnnotationsWorkspaceTrack.vue";
import VariantSifterV2gTrack from "../kpVariantSifter/VariantSifterV2gTrack.vue";
import { associationRowsToPlotData } from "../kpVariantSifter/variantSifterAssociationsPlotData.js";
import {
    VARIANT_SIFTER_PLOT_MARGIN,
} from "../kpVariantSifter/variantSifterAssociationsPlotConfig.js";
import {
    buildAssociationPlotSeries,
    filterAssociationRowsByProject,
    primaryAssociationAncestry,
} from "../kpVariantSifter/variantSifterAssociationsApi.js";
import {
    VKS_ASSOCIATION_PROJECT_GWAS_CE,
    VKS_ASSOCIATION_PROJECT_KP,
    VKS_PROJECT_DEFAULT_ID,
    isGwasCeProject,
} from "../kpVariantSifter/variantSifterProjects.js";
import { pickLeadVariantRow, rowToLdVariant } from "../kpVariantSifter/variantSifterLdServer.js";
import {
    buildGeneTypeOptions,
    filterGenesByTypes,
} from "../kpVariantSifter/variantSifterGenesFilter.js";
import {
    buildGeneTypeColorMap,
    geneColorForGene,
} from "../kpVariantSifter/variantSifterGenesColors.js";
import {
    attachPlotResizeObserver,
    computeRecombSignalIntervals,
    measureVksPlotStackCanvasWidth,
} from "../kpVariantSifter/variantSifterPlotShared.js";
import {
    buildPinnedGenesTrackDockStyle,
    collectOverflowScrollTargets,
    shouldPinGenesTrackDock,
} from "../kpVariantSifter/variantSifterGenesTrackDock.js";
import { hasV2gTrackData } from "../kpVariantSifter/variantSifterV2gData.js";
import { hasS2gTrackData } from "../kpVariantSifter/variantSifterS2gData.js";
import { isSectionVisible } from "../kpVariantSifter/variantSifterToolSettings.js";
import { variantMatchesWorkspaceMapping } from "../kpVariantSifter/variantSifterMappingData.js";
import {
    buildZoom0SearchRegionPlotData,
    buildZoomedViewRegionPlotData,
    prepareRawPlotRows,
    roundZoomLevelBy10,
    stripZoomRefetchedRows,
} from "./gp2BrowserAssociationsDownsample.js";
import {
    filterQtlRows,
    filterQtlRowsByPValueMax,
    restrictQtlRowsToRegion,
} from "./gp2BrowserQtlApi.js";
import { qtlRowsToPlotData } from "./gp2BrowserQtlPlotData.js";
import { GP2_VIEWING_REGION_HALF_BP } from "./gp2BrowserViewingRegion.js";

const VIEW_MOVE_SETTLE_MS = 140;

export default {
    name: "GP2BrowserAssociationsPlot",
    components: {
        VariantSifterGenesTrack,
        VariantSifterCredibleSetsTrack,
        VariantSifterAssociationRegionPlot,
        GP2BrowserAssociationRegionPlot,
        GP2BrowserQtlRegionPlot,
        VariantSifterAnnotationsWorkspaceTrack,
        VariantSifterV2gTrack,
    },
    data() {
        return {
            stackCanvasWidth: null,
            genesTrackHeight: 0,
            genesDockPinned: false,
            genesDockPinnedStyle: {},
            genesDockPinFrame: null,
            isViewMoving: false,
            settledViewRegion: null,
            settledRoundedZoom: 0,
        };
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        selectedAncestries: {
            type: Array,
            default: () => [],
        },
        selectedPhenotypes: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        hideLoadingStatus: {
            type: Boolean,
            default: false,
        },
        ldLoading: {
            type: Boolean,
            default: false,
        },
        ldError: {
            type: String,
            default: null,
        },
        error: {
            type: String,
            default: null,
        },
        searchSession: {
            type: Object,
            default: null,
        },
        regionZoom: {
            type: Number,
            default: 0,
        },
        regionShiftBp: {
            type: Number,
            default: 0,
        },
        regionViewArea: {
            type: Number,
            default: 0,
        },
        viewRegion: {
            type: Object,
            default: null,
        },
        activeSearchRegion: {
            type: Object,
            default: null,
        },
        viewingCenterBp: {
            type: Number,
            default: null,
        },
        viewingRegionHalfWidthBp: {
            type: Number,
            default: null,
        },
        plotOverlaysState: {
            type: Object,
            default: () => ({
                ready: false,
                loading: false,
                error: null,
                recombData: null,
                refVariant: null,
            }),
        },
        plotMarkers: {
            type: Object,
            default: () => ({
                starredVariants: [],
                positionMarkers: [],
            }),
        },
        genesState: {
            type: Object,
            default: () => ({
                ready: false,
                loading: false,
                error: null,
                data: null,
            }),
        },
        qtlState: {
            type: Object,
            default: () => ({
                loading: false,
                error: null,
                rawRows: [],
                downsampledRows: [],
                selectedTypes: [],
                selectedTissues: [],
                pValueMax: "",
                loadedRegionKey: null,
            }),
        },
        utils: {
            type: Object,
            default: null,
        },
        tissueRegionsHost: {
            type: String,
            default: "",
        },
        credibleSetsState: {
            type: Object,
            default: () => ({
                selectedIds: [],
                variantsBySet: {},
            }),
        },
        credibleSetColors: {
            type: Object,
            default: () => ({}),
        },
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                annoData: {},
                geRows: [],
                catalog: { annotations: [] },
                selectedAnnotations: [],
            }),
        },
        v2gState: {
            type: Object,
            default: () => ({
                tissueData: {},
                selectedTissues: [],
                loadingTissue: null,
                error: null,
                deselectedMethods: [],
                deselectedGenes: [],
            }),
        },
        s2gState: {
            type: Object,
            default: () => ({
                tissueData: {},
                selectedTissues: [],
                loadingTissue: null,
                error: null,
                deselectedMethods: [],
                deselectedGenes: [],
            }),
        },
        visibleSectionIds: {
            type: Array,
            default: null,
        },
        workspaceMappingFilter: {
            type: Object,
            default: null,
        },
        projectId: {
            type: String,
            default: VKS_PROJECT_DEFAULT_ID,
        },
    },
    computed: {
        viewingRegionWidthLabel() {
            const halfWidthBp = Number(this.viewingRegionHalfWidthBp) || GP2_VIEWING_REGION_HALF_BP;
            return `${Math.round((halfWidthBp * 2) / 1000)} kb`;
        },
        primaryAncestry() {
            return primaryAssociationAncestry(this.searchSession);
        },
        isGwasCeProjectActive() {
            return isGwasCeProject(this.projectId);
        },
        searchingRegion() {
            return this.activeSearchRegion || this.searchSession?.region || null;
        },
        searchingRows() {
            return stripZoomRefetchedRows(this.rows);
        },
        searchingPlotSeries() {
            return buildAssociationPlotSeries({
                rows: this.searchingRows,
                primaryAncestry: this.primaryAncestry,
                selectedAncestries: this.selectedAncestries,
                primaryPhenotype: this.searchSession?.phenotype || null,
                selectedPhenotypes: this.selectedPhenotypes,
                project: VKS_ASSOCIATION_PROJECT_KP,
            }).map((series) => ({
                ...series,
                plotData: associationRowsToPlotData(series.rows),
            }));
        },
        viewingPlotSeries() {
            const view = this.viewRegion;
            return buildAssociationPlotSeries({
                rows: this.rows,
                primaryAncestry: this.primaryAncestry,
                selectedAncestries: this.selectedAncestries,
                primaryPhenotype: this.searchSession?.phenotype || null,
                selectedPhenotypes: this.selectedPhenotypes,
                project: VKS_ASSOCIATION_PROJECT_KP,
            }).map((series) => {
                const rowsInView = view
                    ? series.rows.filter(
                          (row) =>
                              row?.Position != null &&
                              row.Position >= view.start &&
                              row.Position <= view.end
                      )
                    : series.rows;
                return {
                    ...series,
                    rows: rowsInView,
                    plotData: associationRowsToPlotData(rowsInView),
                };
            });
        },
        plotSeries() {
            return this.searchingPlotSeries;
        },
        gwasCePlotRows() {
            return filterAssociationRowsByProject(
                this.rows,
                VKS_ASSOCIATION_PROJECT_GWAS_CE
            );
        },
        gwasCePlotData() {
            return associationRowsToPlotData(this.gwasCePlotRows);
        },
        gwasCePlotOverlaysState() {
            const leadRow = pickLeadVariantRow(this.gwasCePlotRows);
            return {
                ...this.plotOverlaysState,
                refVariant: rowToLdVariant(leadRow) || this.plotOverlaysState?.refVariant,
                refVariantUserSet: false,
            };
        },
        showGwasCeAssociationsSection() {
            return this.showAssociationsSection && this.isGwasCeProjectActive;
        },
        showKpAssociationsSection() {
            return (
                this.showAssociationsSection &&
                (this.plotSeries.some((series) => series.rows.length > 0) ||
                    this.selectedPhenotypes.length > 0)
            );
        },
        firstPlotSeriesAncestry() {
            const firstWithRows = this.plotSeries.find((series) => series.rows.length > 0);
            return firstWithRows?.ancestry || null;
        },
        firstPlotSeriesPhenotype() {
            const firstWithRows = this.plotSeries.find((series) => series.rows.length > 0);
            return firstWithRows?.phenotype || null;
        },
        plotData() {
            return associationRowsToPlotData(this.rows);
        },
        hasPlotSeriesData() {
            return (
                this.plotSeries.some((series) => series.rows.length > 0) ||
                this.gwasCePlotRows.length > 0 ||
                this.showGwasCeAssociationsSection ||
                this.selectedPhenotypes.length > 0
            );
        },
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
        genesTrackData() {
            const { loading, ready, data } = this.genesState || {};
            if (loading || ready) {
                const genes = Array.isArray(data) ? data : [];
                return filterGenesByTypes(genes, this.genesState?.selectedTypes);
            }
            return [];
        },
        genesTrackKey() {
            const region = this.searchSession?.region;
            const regionKey = region
                ? `${region.chr}:${region.start}-${region.end}`
                : "region";
            const count = this.genesState?.data?.length || 0;
            return `${regionKey}:${count}:${this.genesState?.loading ? "loading" : "ready"}:${(this.genesState?.selectedTypes || []).join(",")}:${Object.keys(this.geneTypeColors).join(",")}`;
        },
        geneTypeColors() {
            const genes = Array.isArray(this.genesState?.data) ? this.genesState.data : [];
            return buildGeneTypeColorMap(buildGeneTypeOptions(genes));
        },
        /** Genes (with exons + color) for the bridge hairline's collapsed exon marks. */
        bridgeGenesForPlot() {
            const genes = this.genesTrackData;
            if (!Array.isArray(genes) || !genes.length) {
                return [];
            }
            return genes
                .filter((gene) => gene?.gene_name)
                .map((gene) => ({
                    name: gene.gene_name,
                    color: geneColorForGene(gene, this.geneTypeColors),
                    exons: Array.isArray(gene.exons) ? gene.exons : [],
                }));
        },
        hasSelectedCredibleSets() {
            return (this.credibleSetsState?.selectedIds || []).length > 0;
        },
        hasAnnotationTrackData() {
            const annoData = this.globalEnrichmentState?.annoData;
            if (!annoData || typeof annoData !== "object") {
                return false;
            }
            const annotations = Object.keys(annoData);
            if (!annotations.length) {
                return false;
            }
            return annotations.some(
                (annotation) => Object.keys(annoData[annotation] || {}).length > 0
            );
        },
        showV2gWorkspaceSection() {
            if (hasV2gTrackData(this.v2gState) || this.v2gState?.loadingTissue) {
                return true;
            }
            return (this.v2gState?.selectedTissues || []).length > 0;
        },
        showS2gWorkspaceSection() {
            return hasS2gTrackData(this.s2gState) || Boolean(this.s2gState?.loadingTissue);
        },
        showAssociationsSection() {
            return isSectionVisible(this.visibleSectionIds, "associations");
        },
        qtlHasSelection() {
            return Boolean(
                (this.qtlState?.selectedTypes || []).length &&
                    (this.qtlState?.selectedTissues || []).length
            );
        },
        showQtlEvidencesSection() {
            return (
                isSectionVisible(this.visibleSectionIds, "qtl-evidences") &&
                this.qtlHasSelection
            );
        },
        qtlFilteredDownsampledRows() {
            const typeTissueFiltered = filterQtlRows(this.qtlState?.downsampledRows || [], {
                types: this.qtlState?.selectedTypes || [],
                tissues: this.qtlState?.selectedTissues || [],
            });
            return filterQtlRowsByPValueMax(typeTissueFiltered, this.qtlState?.pValueMax);
        },
        qtlFilteredRawRows() {
            const typeTissueFiltered = filterQtlRows(this.qtlState?.rawRows || [], {
                types: this.qtlState?.selectedTypes || [],
                tissues: this.qtlState?.selectedTissues || [],
            });
            return filterQtlRowsByPValueMax(typeTissueFiltered, this.qtlState?.pValueMax);
        },
        /** Compact searching-region overview: downsampled, like Associations. */
        qtlSearchingPlotRows() {
            return qtlRowsToPlotData(this.qtlFilteredDownsampledRows);
        },
        /** 50 kb viewing-region detail plot: raw (undownsampled), like Associations. */
        qtlViewingPlotRows() {
            return qtlRowsToPlotData(
                restrictQtlRowsToRegion(this.qtlFilteredRawRows, this.viewRegion)
            );
        },
        showCredibleSetsSection() {
            return (
                isSectionVisible(this.visibleSectionIds, "credible-sets") &&
                this.hasSelectedCredibleSets
            );
        },
        showGlobalEnrichmentSection() {
            return (
                isSectionVisible(this.visibleSectionIds, "global-enrichment") &&
                this.hasAnnotationTrackData
            );
        },
        showV2gSection() {
            return (
                isSectionVisible(this.visibleSectionIds, "variant-to-gene-links") &&
                this.showV2gWorkspaceSection
            );
        },
        showS2gSection() {
            return (
                isSectionVisible(this.visibleSectionIds, "snp2gene-links") &&
                this.showS2gWorkspaceSection
            );
        },
        showGenesSection() {
            return isSectionVisible(this.visibleSectionIds, "genes");
        },
        credibleSetsTrackData() {
            return (this.credibleSetsState?.selectedIds || []).map((selectionKey) => {
                const setState = this.credibleSetsState?.variantsBySet?.[selectionKey];
                const meta = setState?.meta || {};
                const rawVariants = setState?.rawVariants || [];
                const formattedVariants = setState?.formattedVariants || [];
                const nextVariants = [];
                const nextFormatted = [];
                if (rawVariants.length) {
                    rawVariants.forEach((variant, index) => {
                        const formatted = formattedVariants[index];
                        if (
                            !variantMatchesWorkspaceMapping(
                                variant,
                                this.workspaceMappingFilter
                            ) &&
                            !(
                                formatted &&
                                variantMatchesWorkspaceMapping(
                                    formatted,
                                    this.workspaceMappingFilter
                                )
                            )
                        ) {
                            return;
                        }
                        nextVariants.push(variant);
                        if (formatted) {
                            nextFormatted.push(formatted);
                        }
                    });
                } else {
                    formattedVariants.forEach((formatted) => {
                        if (
                            !variantMatchesWorkspaceMapping(
                                formatted,
                                this.workspaceMappingFilter
                            )
                        ) {
                            return;
                        }
                        nextFormatted.push(formatted);
                        nextVariants.push(formatted);
                    });
                }
                return {
                    selectionKey,
                    credibleSetId: meta.credibleSetId || selectionKey,
                    label: meta.label || meta.credibleSetId || selectionKey,
                    ancestry: meta.ancestry || "Mixed",
                    variants: nextVariants,
                    formattedVariants: nextFormatted,
                };
            });
        },
        searchingRecombPeakIntervals() {
            const region = this.searchingRegion;
            if (!region) {
                return [];
            }
            return computeRecombSignalIntervals(this.plotOverlaysState?.recombData, region);
        },
        recombPeakIntervals() {
            const region = this.viewRegion || this.searchingRegion;
            if (!region) {
                return [];
            }
            return computeRecombSignalIntervals(this.plotOverlaysState?.recombData, region);
        },
    },
    watch: {
        plotData: {
            handler(hasData) {
                if (!hasData?.length) {
                    this.genesDockPinned = false;
                    this.genesDockPinnedStyle = {};
                    return;
                }
                this.$nextTick(() => {
                    this.updateStackCanvasWidth();
                    this.setupGenesDockPinListeners();
                    this.updateGenesDockPin();
                });
            },
            immediate: true,
        },
        selectedSets: {
            handler() {
                this.$nextTick(() => this.updateStackCanvasWidth());
            },
            deep: true,
        },
        loading(isLoading) {
            if (!isLoading) {
                this.$nextTick(() => this.updateStackCanvasWidth());
            }
        },
        genesTrackKey() {
            this.$nextTick(() => this.scheduleGenesDockPinUpdate());
        },
        hasAnnotationTrackData() {
            this.$nextTick(() => this.scheduleGenesDockPinUpdate());
        },
        hasSelectedCredibleSets() {
            this.$nextTick(() => this.scheduleGenesDockPinUpdate());
        },
        showQtlEvidencesSection() {
            this.$nextTick(() => this.scheduleGenesDockPinUpdate());
        },
        regionZoom: {
            handler(nextZoom) {
                const rounded = roundZoomLevelBy10(nextZoom);
                if (rounded <= 0) {
                    this.clearViewMoveTimer();
                    this.isViewMoving = false;
                    this.settledRoundedZoom = 0;
                    this.settledViewRegion = this.viewRegion || this.searchSession?.region || null;
                    return;
                }
                this.markViewMovingAndScheduleSettle();
            },
            immediate: true,
        },
        regionViewArea() {
            if (roundZoomLevelBy10(this.regionZoom) > 0) {
                this.markViewMovingAndScheduleSettle();
            }
        },
        regionShiftBp() {
            if (roundZoomLevelBy10(this.regionZoom) > 0) {
                this.markViewMovingAndScheduleSettle();
            }
        },
        viewRegion: {
            handler(nextViewRegion) {
                if (!this.isViewMoving) {
                    this.settledViewRegion = nextViewRegion
                        ? { ...nextViewRegion }
                        : null;
                    this.settledRoundedZoom = roundZoomLevelBy10(this.regionZoom);
                }
            },
            immediate: true,
        },
    },
    mounted() {
        this.onGlobalPointerUp = () => {
            if (this.isViewMoving) {
                this.commitSettledViewRegion();
            }
        };
        window.addEventListener("mouseup", this.onGlobalPointerUp, { passive: true });
        window.addEventListener("pointerup", this.onGlobalPointerUp, { passive: true });
        this.updateStackCanvasWidth();
        this.stackResizeObserver = attachPlotResizeObserver(this, "plotStack", () => {
            this.updateStackCanvasWidth();
            this.scheduleGenesDockPinUpdate();
        });
        this.genesDockResizeObserver = attachPlotResizeObserver(this, "genesDock", () => {
            this.scheduleGenesDockPinUpdate();
        });
        this.$nextTick(() => {
            this.setupGenesDockPinListeners();
            this.updateGenesDockPin();
        });
    },
    beforeDestroy() {
        this.clearViewMoveTimer();
        if (this.onGlobalPointerUp) {
            window.removeEventListener("mouseup", this.onGlobalPointerUp);
            window.removeEventListener("pointerup", this.onGlobalPointerUp);
            this.onGlobalPointerUp = null;
        }
        if (this.stackResizeObserver) {
            this.stackResizeObserver.disconnect();
        }
        if (this.genesDockResizeObserver) {
            this.genesDockResizeObserver.disconnect();
        }
        this.teardownGenesDockPinListeners();
    },
    methods: {
        clearViewMoveTimer() {
            if (this.viewMoveSettleTimer) {
                clearTimeout(this.viewMoveSettleTimer);
                this.viewMoveSettleTimer = null;
            }
        },
        markViewMovingAndScheduleSettle() {
            if (!this.isViewMoving) {
                this.isViewMoving = true;
            }
            this.clearViewMoveTimer();
            this.viewMoveSettleTimer = setTimeout(() => {
                this.commitSettledViewRegion();
            }, VIEW_MOVE_SETTLE_MS);
        },
        commitSettledViewRegion() {
            this.clearViewMoveTimer();
            const rounded = roundZoomLevelBy10(this.regionZoom);
            this.settledRoundedZoom = rounded;
            this.settledViewRegion = this.viewRegion
                ? { ...this.viewRegion }
                : this.searchSession?.region
                  ? { ...this.searchSession.region }
                  : null;
            this.isViewMoving = false;
        },
        setupGenesDockPinListeners() {
            this.teardownGenesDockPinListeners();
            const plotStack = this.$refs.plotStack;
            if (!plotStack) {
                return;
            }
            this.onGenesDockPinScroll = () => this.scheduleGenesDockPinUpdate();
            this.genesDockScrollTargets = collectOverflowScrollTargets(plotStack);
            this.genesDockScrollTargets.forEach((target) => {
                target.addEventListener("scroll", this.onGenesDockPinScroll, { passive: true });
            });
            window.addEventListener("resize", this.onGenesDockPinScroll, { passive: true });
        },
        teardownGenesDockPinListeners() {
            if (this.genesDockScrollTargets?.length && this.onGenesDockPinScroll) {
                this.genesDockScrollTargets.forEach((target) => {
                    target.removeEventListener("scroll", this.onGenesDockPinScroll);
                });
            }
            if (this.onGenesDockPinScroll) {
                window.removeEventListener("resize", this.onGenesDockPinScroll);
            }
            this.genesDockScrollTargets = [];
            this.onGenesDockPinScroll = null;
            if (this.genesDockPinFrame) {
                cancelAnimationFrame(this.genesDockPinFrame);
                this.genesDockPinFrame = null;
            }
        },
        scheduleGenesDockPinUpdate() {
            if (this.genesDockPinFrame) {
                return;
            }
            this.genesDockPinFrame = requestAnimationFrame(() => {
                this.genesDockPinFrame = null;
                this.updateGenesDockPin();
            });
        },
        updateGenesDockPin() {
            const plotStack = this.$refs.plotStack;
            if (!plotStack || !this.plotData?.length) {
                this.genesDockPinned = false;
                this.genesDockPinnedStyle = {};
                return;
            }

            const plotStackRect = plotStack.getBoundingClientRect();
            const genesDockPinned = shouldPinGenesTrackDock(
                plotStackRect,
                this.genesTrackHeight
            );
            this.genesDockPinned = genesDockPinned;
            this.genesDockPinnedStyle = genesDockPinned
                ? buildPinnedGenesTrackDockStyle(plotStackRect)
                : {};
        },
        onGenesTrackLayout({ height }) {
            this.$nextTick(() => {
                const dockHeight = this.$refs.genesDock?.offsetHeight;
                const nextHeight = Number(dockHeight) || Number(height) || 0;
                if (this.genesTrackHeight === nextHeight) {
                    this.scheduleGenesDockPinUpdate();
                    return;
                }
                this.genesTrackHeight = nextHeight;
                this.scheduleGenesDockPinUpdate();
            });
        },
        updateStackCanvasWidth() {
            this.stackCanvasWidth = measureVksPlotStackCanvasWidth(this.$refs.plotStack);
            this.scheduleGenesDockPinUpdate();
        },
    },
};
</script>

<style scoped>
.vks-associations-plot {
    background: #ffffff;
    padding: 0 0 12px;
}

.vks-associations-plot-stack {
    min-height: 280px;
    padding: 0 8px;
    position: relative;
}

.vks-plot-section + .vks-plot-section {
    margin-top: 6px;
}

.vks-plot-section-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 6px 4px;
}

.vks-plot-section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.vks-associations-plot-series + .vks-associations-plot-series {
    margin-top: 10px;
}

.vks-associations-phenotype-header {
    margin: 0 0 8px;
    padding: 0;
}

.vks-associations-phenotype-bubble {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
}

.vks-associations-ancestry-header {
    margin: 0 0 8px;
    padding: 0;
}

.vks-associations-ancestry-bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 5px 10px;
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 999px;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 12px;
    line-height: 1.3;
}

.vks-associations-ancestry-bubble-code {
    font-weight: 700;
    letter-spacing: 0.02em;
}

.vks-associations-ancestry-bubble-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
}

.vks-associations-ancestry-bubble-count {
    opacity: 0.9;
    font-variant-numeric: tabular-nums;
}

.vks-associations-plot-status--inline {
    min-height: 0;
    padding: 12px 0 18px;
}

.vks-associations-plot-status--warning {
    color: #9a3412;
    font-weight: 600;
}

.vks-genes-track-slot {
    position: relative;
}

.vks-genes-track-spacer {
    width: 100%;
    pointer-events: none;
}

.vks-genes-track-dock {
    box-sizing: border-box;
    padding: 0 8px;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 -4px 12px rgba(20, 22, 30, 0.06);
}

.vks-genes-track-dock.is-pinned {
    position: fixed;
    bottom: 0;
    z-index: 6;
}

.vks-associations-plot-status,
.vks-associations-plot-note {
    margin: 0;
    padding: 24px 14px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    text-align: center;
}

.vks-associations-plot-error {
    margin: 0;
    padding: 24px 14px;
    font-size: 13px;
    color: #b42318;
    text-align: center;
}
</style>
