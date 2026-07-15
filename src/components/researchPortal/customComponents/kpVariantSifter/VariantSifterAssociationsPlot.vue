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
                <div v-if="showAssociationsSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Associations</h3>
                    </header>
                    <div
                        v-for="series in plotSeries"
                        :key="`assoc-${series.ancestry}`"
                        class="vks-associations-plot-series"
                    >
                        <div
                            v-if="showAncestryHeaders"
                            class="vks-associations-ancestry-header"
                        >
                            <span
                                class="vks-associations-ancestry-bubble"
                                :title="`${series.label} · ${series.rows.length.toLocaleString()} associations`"
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
                        <VariantSifterAssociationRegionPlot
                            v-else
                            :plot-rows="series.plotData"
                            :show-legend="series.ancestry === firstPlotSeriesAncestry"
                            :recomb-peak-intervals="recombPeakIntervals"
                            :region="searchSession?.region"
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
                            @pan-end="$emit('pan-end')"
                            @toggle-position-marker="$emit('toggle-position-marker', $event)"
                            @toggle-star-variant="$emit('toggle-star-variant', $event)"
                            @set-reference-variant="$emit('set-reference-variant', $event)"
                        />
                    </div>
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
                        :search-session="searchSession"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :shared-canvas-width="stackCanvasWidth"
                        :plot-markers="plotMarkers"
                        :recomb-peak-intervals="recombPeakIntervals"
                        :utils="utils"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @update:selectedBiosamples="$emit('update:geSelectedBiosamples', $event)"
                        @update:biosampleFilterOptions="
                            $emit('update:geBiosampleFilterOptions', $event)
                        "
                    />
                </div>
                <div v-if="showV2gSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">Variant-to-gene links</h3>
                    </header>
                    <VariantSifterV2gTrack
                        :v2g-state="v2gState"
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
                    />
                </div>
                <div v-if="showS2gSection" class="vks-plot-section">
                    <header class="vks-plot-section-head">
                        <h3 class="vks-plot-section-title">SNP 2 gene links</h3>
                    </header>
                    <VariantSifterV2gTrack
                        :v2g-state="s2gState"
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
                        :recomb-peak-intervals="recombPeakIntervals"
                        :region="searchSession?.region"
                        :view-region="viewRegion"
                        :plot-margin="plotMargin"
                        :region-zoom="regionZoom"
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
import VariantSifterGenesTrack from "./VariantSifterGenesTrack.vue";
import VariantSifterCredibleSetsTrack from "./VariantSifterCredibleSetsTrack.vue";
import VariantSifterAssociationRegionPlot from "./VariantSifterAssociationRegionPlot.vue";
import VariantSifterAnnotationsWorkspaceTrack from "./VariantSifterAnnotationsWorkspaceTrack.vue";
import VariantSifterV2gTrack from "./VariantSifterV2gTrack.vue";
import { associationRowsToPlotData } from "./variantSifterAssociationsPlotData.js";
import {
    VARIANT_SIFTER_PLOT_MARGIN,
} from "./variantSifterAssociationsPlotConfig.js";
import {
    buildAssociationPlotSeries,
    primaryAssociationAncestry,
} from "./variantSifterAssociationsApi.js";
import {
    buildGeneTypeOptions,
    filterGenesByTypes,
} from "./variantSifterGenesFilter.js";
import { buildGeneTypeColorMap } from "./variantSifterGenesColors.js";
import {
    attachPlotResizeObserver,
    computeRecombSignalIntervals,
    measureVksPlotStackCanvasWidth,
} from "./variantSifterPlotShared.js";
import {
    buildPinnedGenesTrackDockStyle,
    collectOverflowScrollTargets,
    shouldPinGenesTrackDock,
} from "./variantSifterGenesTrackDock.js";
import { hasV2gTrackData } from "./variantSifterV2gData.js";
import { hasS2gTrackData } from "./variantSifterS2gData.js";
import { isSectionVisible } from "./variantSifterToolSettings.js";

export default {
    name: "VariantSifterAssociationsPlot",
    components: {
        VariantSifterGenesTrack,
        VariantSifterCredibleSetsTrack,
        VariantSifterAssociationRegionPlot,
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
        utils: {
            type: Object,
            default: null,
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
    },
    computed: {
        primaryAncestry() {
            return primaryAssociationAncestry(this.searchSession);
        },
        plotSeries() {
            return buildAssociationPlotSeries({
                rows: this.rows,
                primaryAncestry: this.primaryAncestry,
                selectedAncestries: this.selectedAncestries,
            }).map((series) => ({
                ...series,
                plotData: associationRowsToPlotData(series.rows),
            }));
        },
        showAncestryHeaders() {
            return this.plotSeries.length > 1;
        },
        firstPlotSeriesAncestry() {
            const firstWithRows = this.plotSeries.find((series) => series.rows.length > 0);
            return firstWithRows?.ancestry || null;
        },
        plotData() {
            return associationRowsToPlotData(this.rows);
        },
        hasPlotSeriesData() {
            return this.plotSeries.some((series) => series.rows.length > 0);
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
                return {
                    selectionKey,
                    credibleSetId: meta.credibleSetId || selectionKey,
                    label: meta.label || meta.credibleSetId || selectionKey,
                    ancestry: meta.ancestry || "Mixed",
                    variants: setState?.rawVariants || [],
                    formattedVariants: setState?.formattedVariants || [],
                };
            });
        },
        recombPeakIntervals() {
            const region = this.viewRegion || this.searchSession?.region;
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
    },
    mounted() {
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
        if (this.stackResizeObserver) {
            this.stackResizeObserver.disconnect();
        }
        if (this.genesDockResizeObserver) {
            this.genesDockResizeObserver.disconnect();
        }
        this.teardownGenesDockPinListeners();
    },
    methods: {
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
    background: rgba(255, 255, 255, 0.5);
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
