<template>
    <div ref="container" class="vks-anno-workspace-track">
        <p v-if="annotations.length" class="vks-anno-workspace-guide">
            Tracks show tissues with enrichment
            p&nbsp;&lt;&nbsp;{{ geTrackPValueMax }} for the selected annotation
            <template v-if="llmRelevanceUsed">
                that were classified as phenotype-relevant
            </template>
            . Open
            <strong>Global enrich.</strong>
            →
            <strong>Settings / Filters</strong>
            to adjust the p-value threshold, or
            <strong>Tissues</strong>
            to re-enable filtered tissues. Optional LLM tissue classification is offered in
            <strong>Assist</strong>
            as an executable step on the Request tab.
        </p>
        <div v-if="annotations.length > 1" class="vks-anno-workspace-tab-bar">
            <div class="vks-anno-workspace-tabs" role="tablist" aria-label="Annotation tracks">
                <button
                    v-for="(annotation, index) in annotations"
                    :key="annotation"
                    type="button"
                    class="vks-anno-workspace-tab"
                    :class="{ 'is-active': annotation === activeAnnotation }"
                    :style="annotationTabStyle(annotation)"
                    role="tab"
                    :aria-selected="annotation === activeAnnotation"
                    @click="setActiveAnnotation(annotation)"
                >
                    {{ annotation }}
                </button>
            </div>
        </div>
        <p
            v-else-if="activeAnnotation"
            class="vks-anno-workspace-title"
            :style="{ color: annotationColor(activeAnnotation) }"
        >
            {{ activeAnnotation }}
        </p>
        <div ref="trackPanel" class="vks-anno-workspace-panel">
            <canvas
                ref="canvas"
                class="vks-anno-workspace-canvas"
                :class="{
                    'is-pannable': canPan,
                    'is-x-axis-hover': xAxisBandHover,
                    'is-region-hover': Boolean(hoveredRegion),
                }"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseout="onMouseOut"
                @mouseup="onMouseUp"
                @click="onCanvasClick"
            ></canvas>
            <VariantSifterZoomCenterMarker
                :region-view-area="regionViewArea"
                :region-zoom="regionZoom"
                :plot-margin="margin"
                placement="track"
                @update:regionViewArea="$emit('update:regionViewArea', $event)"
            />
            <div
                v-if="orderedSelectedTissues.length"
                class="vks-anno-biosample-section"
            >
                <p class="vks-anno-biosample-intro">
                    Filter associated variants by location within regulatory regions
                    annotated in specific tissue or cell types within the tissue
                    categories selected above.
                </p>
                <div
                    v-for="tissue in orderedSelectedTissues"
                    :key="tissue"
                    class="vks-anno-biosample-group"
                >
                    <p
                        v-if="isBiosampleLoading(tissue)"
                        class="vks-anno-biosample-empty"
                    >
                        Loading biosample tracks for
                        {{ activeAnnotation }} / {{ tissue }}…
                    </p>
                    <p
                        v-else-if="biosampleErrorForTissue(tissue)"
                        class="vks-anno-biosample-empty"
                    >
                        {{ biosampleErrorForTissue(tissue) }}
                    </p>
                    <p
                        v-else-if="!biosampleGroupsForTissue(tissue).length"
                        class="vks-anno-biosample-empty"
                    >
                        No biosample regions found for
                        {{ activeAnnotation }} / {{ tissue }}.
                    </p>
                    <canvas
                        v-show="
                            !isBiosampleLoading(tissue) &&
                                !biosampleErrorForTissue(tissue) &&
                                biosampleGroupsForTissue(tissue).length
                        "
                        :ref="'biosampleCanvas_' + tissue"
                        class="vks-anno-workspace-canvas vks-anno-biosample-canvas"
                        :class="{
                            'is-region-hover': Boolean(hoveredRegion),
                        }"
                        @click="onBiosampleCanvasClick($event, tissue)"
                        @mousemove="onBiosampleMouseMove($event, tissue)"
                        @mouseout="onBiosampleMouseOut"
                    ></canvas>
                </div>
            </div>
            <div
                v-if="hoveredRegion"
                ref="infoPanel"
                class="vks-anno-workspace-info-panel"
                role="status"
            >
                <p class="vks-anno-workspace-info-tissue">{{ hoveredRegion.tissue }}</p>
                <p class="vks-anno-workspace-info-line">
                    {{ enrichedRegionLabel }}
                </p>
                <template v-if="hoveredRegionHasMeta">
                    <p class="vks-anno-workspace-info-line">
                        {{ enrichedRegionDatasetLabel }}
                    </p>
                    <p class="vks-anno-workspace-info-line">
                        {{ enrichedRegionSourceLabel }}
                    </p>
                    <p class="vks-anno-workspace-info-line">
                        {{ enrichedRegionMethodLabel }}
                    </p>
                    <p class="vks-anno-workspace-info-line">
                        {{ enrichedRegionStateLabel }}
                    </p>
                </template>
                <template v-else>
                    <p
                        v-if="enrichedRegionBiosampleLabel"
                        class="vks-anno-workspace-info-line"
                    >
                        {{ enrichedRegionBiosampleLabel }}
                    </p>
                    <p class="vks-anno-workspace-info-line">
                        {{ enrichedRegionStateLabel }}
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { VARIANT_SIFTER_ANNO_TRACK_MARGIN } from "./variantSifterAssociationsPlotConfig.js";
import {
    annotationsForPlot,
    annotationColorForKey,
    biosampleSelectionKey,
    buildGeTissueStatsForAnnotation,
    computeAnnotationBiosampleTrackHeight,
    computeAnnotationWorkspaceTrackHeight,
    groupAnnoRegionsByBiosample,
    listUniqueRegionPropValues,
    normalizeGeFilterStringList,
    normalizeGeSelectedBiosamples,
    normalizeGeTissueTrackSort,
    normalizeGeTrackPValueMax,
    resolveGeTissuesForDisplay,
    solidAnnotationColor,
    VKS_ANNOTATION_COLORS,
    VKS_ANNO_TRACK_PER_TISSUE,
    VKS_ANNO_TRACK_STATS_HEADER,
    VKS_ANNO_TRACK_X_AXIS_GAP,
} from "./variantSifterGlobalEnrichmentData.js";
import {
    buildMappedAnnoDataView,
    buildMappedBiosampleRegionsView,
    normalizeWorkspaceMappingFilter,
} from "./variantSifterMappingData.js";
import {
    computeViewRegion,
    computeVisibleWindowWidth,
    resolveHandPanFromDrag,
} from "./variantSifterRegionPan.js";
import {
    canvasXToGenomicPosition,
    genomicPositionToCanvasX,
    isCanvasPointInXAxisInteractionZone,
} from "./variantSifterPlotMarkers.js";
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
} from "./variantSifterPlotShared.js";
import {
    findAnnotationRegionHitAtPoint,
    findAnnotationTissueHitAtY,
    formatAnnotationEnrichedRegionLabel,
    formatAnnotationRegionMetaLabel,
    formatAnnotationRegionStateLabel,
    renderAnnotationBiosampleTracks,
    renderAnnotationsWorkspaceTrack,
    setupAnnotationsWorkspaceCanvas,
} from "./variantSifterAnnotationsWorkspaceRender.js";
import { fetchTissueRegions } from "./variantSifterGlobalEnrichmentApi.js";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";
import VariantSifterZoomCenterMarker from "./VariantSifterZoomCenterMarker.vue";

export default {
    name: "VariantSifterAnnotationsWorkspaceTrack",
    components: {
        VariantSifterZoomCenterMarker,
    },
    props: {
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                annoData: {},
                geRows: [],
            }),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        region: {
            type: Object,
            default: null,
        },
        viewRegion: {
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
        sharedCanvasWidth: {
            type: Number,
            default: null,
        },
        plotMarkers: {
            type: Object,
            default: () => ({
                starredVariants: [],
                positionMarkers: [],
            }),
        },
        recombPeakIntervals: {
            type: Array,
            default: () => [],
        },
        utils: {
            type: Object,
            default: null,
        },
        workspaceMappingFilter: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            tissueHits: [],
            biosampleHitsByTissue: {},
            biosampleRowsByTissue: {},
            biosampleLoadedKeyByTissue: {},
            biosampleLoadingByTissue: {},
            biosampleErrorByTissue: {},
            biosampleCache: {},
            biosampleRequestTokenByTissue: {},
            canvasWidth: 0,
            plotWidth: 0,
            layoutCanvasHeight: 0,
            plotHeight: 0,
            suppressClick: false,
            isPanning: false,
            panStartX: 0,
            panStartRegionShiftBp: 0,
            panStartRegionViewArea: 0,
            panDidChangeShift: false,
            panMoved: false,
            livePositionMarkerX: null,
            xAxisBandHover: false,
            hoveredRegion: null,
            hoverAnchorX: 0,
            hoverAnchorY: 0,
        };
    },
    computed: {
        activeAnnotation() {
            return this.globalEnrichmentState?.activeAnnotation || null;
        },
        selectedTissues() {
            return Array.isArray(this.globalEnrichmentState?.selectedTissues)
                ? this.globalEnrichmentState.selectedTissues
                : [];
        },
        margin() {
            return normalizePlotMargin(VARIANT_SIFTER_ANNO_TRACK_MARGIN);
        },
        tissueTrackSort() {
            return normalizeGeTissueTrackSort(
                this.globalEnrichmentState?.tissueTrackSort
            );
        },
        geTrackPValueMax() {
            return normalizeGeTrackPValueMax(
                this.globalEnrichmentState?.geTrackPValueMax
            );
        },
        llmRelevanceUsed() {
            return Boolean(this.globalEnrichmentState?.llmRelevance?.llmUsed);
        },
        selectedBiosamples() {
            return normalizeGeSelectedBiosamples(
                this.globalEnrichmentState?.selectedBiosamples
            );
        },
        selectedMethods() {
            return normalizeGeFilterStringList(
                this.globalEnrichmentState?.selectedMethods
            );
        },
        selectedSources() {
            return normalizeGeFilterStringList(
                this.globalEnrichmentState?.selectedSources
            );
        },
        enrichedRegionLabel() {
            return formatAnnotationEnrichedRegionLabel(this.hoveredRegion);
        },
        enrichedRegionBiosampleLabel() {
            const biosample = this.hoveredRegion?.biosample;
            if (biosample == null || biosample === "") {
                return "";
            }
            return String(biosample);
        },
        enrichedRegionStateLabel() {
            return formatAnnotationRegionStateLabel(this.hoveredRegion?.state);
        },
        enrichedRegionDatasetLabel() {
            return formatAnnotationRegionMetaLabel(
                "dataset",
                this.hoveredRegion?.dataset
            );
        },
        enrichedRegionSourceLabel() {
            return formatAnnotationRegionMetaLabel(
                "source",
                this.hoveredRegion?.source
            );
        },
        enrichedRegionMethodLabel() {
            return formatAnnotationRegionMetaLabel(
                "method",
                this.hoveredRegion?.method
            );
        },
        hoveredRegionHasMeta() {
            const region = this.hoveredRegion;
            if (!region) {
                return false;
            }
            return Boolean(region.dataset || region.method || region.source);
        },
        annoData() {
            // Layer 1: raw loaded GE annotation data (never mutated by mapping).
            return this.globalEnrichmentState?.annoData || {};
        },
        displayAnnoData() {
            // Layer 3: derived view for rendering only. Leaves annoData + selections intact.
            return buildMappedAnnoDataView(
                this.annoData,
                this.workspaceMappingFilter
            );
        },
        annotations() {
            // Annotation tabs follow loaded data (layer 1), not the temporary mapped view.
            return annotationsForPlot(
                this.annoData,
                this.globalEnrichmentState?.selectedAnnotations
            );
        },
        phenotype() {
            return this.searchSession?.phenotype?.name || "";
        },
        ancestry() {
            return this.searchSession?.ancestry || "Mixed";
        },
        visibleRegion() {
            if (this.viewRegion) {
                return this.viewRegion;
            }
            return computeViewRegion(
                this.region,
                this.regionShiftBp,
                this.regionZoom,
                this.regionViewArea
            );
        },
        visibleWidthBp() {
            const view = this.visibleRegion;
            if (view) {
                return Math.max(1, view.end - view.start);
            }
            return computeVisibleWindowWidth(this.region, this.regionZoom);
        },
        availableTissueKeys() {
            // Layer 1+GE display rules: tissues available for selection / mapping chips.
            if (!this.activeAnnotation) {
                return [];
            }
            const tissues = Object.keys(this.annoData[this.activeAnnotation] || {});
            return resolveGeTissuesForDisplay(tissues, {
                annotation: this.activeAnnotation,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotationTissues:
                    this.globalEnrichmentState?.enabledMutedAnnotationTissues || {},
                disabledAnnotationTissues:
                    this.globalEnrichmentState?.disabledAnnotationTissues || {},
                geTissueStats: this.geTissueStats,
                sort: this.tissueTrackSort,
                pValueMax: this.geTrackPValueMax,
            });
        },
        tissueKeys() {
            // Layer 3 render list: may be a subset while workspace filter is on.
            if (!this.activeAnnotation) {
                return [];
            }
            const tissues = Object.keys(
                this.displayAnnoData[this.activeAnnotation] || {}
            );
            return resolveGeTissuesForDisplay(tissues, {
                annotation: this.activeAnnotation,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotationTissues:
                    this.globalEnrichmentState?.enabledMutedAnnotationTissues || {},
                disabledAnnotationTissues:
                    this.globalEnrichmentState?.disabledAnnotationTissues || {},
                geTissueStats: this.geTissueStats,
                sort: this.tissueTrackSort,
                pValueMax: this.geTrackPValueMax,
            });
        },
        trackLayoutHeight() {
            return computeAnnotationWorkspaceTrackHeight(this.tissueKeys.length);
        },
        orderedSelectedTissues() {
            if (!this.selectedTissues.length) {
                return [];
            }
            const selected = new Set(this.selectedTissues);
            // Biosample sections follow the currently displayed (possibly filtered) tissues.
            const tissues = this.tissueKeys.filter((tissue) => selected.has(tissue));
            const filter = normalizeWorkspaceMappingFilter(this.workspaceMappingFilter);
            if (!filter) {
                return tissues;
            }
            return tissues.filter(
                (tissue) =>
                    this.isBiosampleLoading(tissue) ||
                    this.biosampleGroupsForTissue(tissue).length > 0
            );
        },
        markerPlotHeight() {
            return (
                VKS_ANNO_TRACK_STATS_HEADER +
                this.tissueKeys.length * VKS_ANNO_TRACK_PER_TISSUE +
                VKS_ANNO_TRACK_X_AXIS_GAP
            );
        },
        geTissueStats() {
            if (!this.activeAnnotation || !this.phenotype) {
                return {};
            }
            return buildGeTissueStatsForAnnotation({
                geRows: this.globalEnrichmentState?.geRows || [],
                annotation: this.activeAnnotation,
                phenotype: this.phenotype,
                ancestry: this.ancestry,
            });
        },
        canPan() {
            return Boolean(this.visibleRegion && this.tissueKeys.length);
        },
        hasTrackData() {
            return this.annotations.length > 0 && this.tissueKeys.length > 0;
        },
        annotationKeys() {
            return this.annotations.join("|");
        },
    },
    watch: {
        annotationKeys: {
            handler(nextKeys) {
                const nextAnnotations = nextKeys ? nextKeys.split("|") : [];
                if (!nextAnnotations.length) {
                    if (this.activeAnnotation) {
                        this.setActiveAnnotation(null);
                    }
                    if (this.selectedTissues.length) {
                        this.setSelectedTissues([]);
                    }
                    return;
                }
                if (!nextAnnotations.includes(this.activeAnnotation)) {
                    this.setActiveAnnotation(nextAnnotations[0]);
                }
                this.$nextTick(() => this.renderTrack());
            },
            immediate: true,
        },
        activeAnnotation(next, previous) {
            // Skip the initial sync and no-op identity changes to avoid reset/render storms.
            if (next === previous) {
                return;
            }
            this.resetBiosampleUiState();
            this.clearRegionHover();
            this.$nextTick(() => this.renderTrack());
        },
        selectedTissues(next, previous) {
            const nextKey = Array.isArray(next) ? next.join("|") : "";
            const previousKey = Array.isArray(previous) ? previous.join("|") : "";
            if (nextKey === previousKey) {
                return;
            }
            this.clearRegionHover();
            this.$nextTick(() => {
                this.renderTrack();
                this.loadBiosamplesForSelectedTissues();
                this.pruneSelectedBiosamples();
            });
        },
        selectedBiosamples(next, previous) {
            const nextKey = Array.isArray(next) ? next.join("|") : "";
            const previousKey = Array.isArray(previous) ? previous.join("|") : "";
            if (nextKey === previousKey) {
                return;
            }
            this.$nextTick(() => this.renderBiosampleTracks());
        },
        selectedMethods() {
            this.$nextTick(() => this.renderBiosampleTracks());
        },
        selectedSources() {
            this.$nextTick(() => this.renderBiosampleTracks());
        },
        geTrackPValueMax() {
            this.clearSelectedTissueIfFiltered();
            this.$nextTick(() => this.renderTrack());
        },
        region: {
            handler() {
                this.biosampleCache = {};
                this.biosampleLoadedKeyByTissue = {};
                if (this.selectedTissues.length) {
                    this.loadBiosamplesForSelectedTissues();
                }
            },
            deep: true,
        },
        tissueTrackSort() {
            this.clearSelectedTissueIfFiltered();
            this.clearRegionHover();
            this.renderTrack();
        },
        hoveredRegion() {
            this.$nextTick(() => this.positionInfoPanel());
        },
        visibleRegion: {
            handler() {
                this.clearRegionHover();
                this.renderTrack();
            },
            deep: true,
        },
        regionShiftBp() {
            this.renderTrack();
        },
        regionZoom() {
            this.renderTrack();
        },
        sharedCanvasWidth() {
            this.renderTrack();
        },
        plotMarkers: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        recombPeakIntervals: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        geTissueStats: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        "globalEnrichmentState.llmRelevance": {
            handler() {
                this.clearSelectedTissueIfFiltered();
                this.renderTrack();
            },
            deep: true,
        },
        "globalEnrichmentState.enabledMutedAnnotationTissues": {
            handler() {
                this.clearSelectedTissueIfFiltered();
                this.renderTrack();
            },
            deep: true,
        },
        "globalEnrichmentState.disabledAnnotationTissues": {
            handler() {
                this.clearSelectedTissueIfFiltered();
                this.renderTrack();
            },
            deep: true,
        },
        workspaceMappingFilter: {
            handler() {
                // Layer 3 only: re-render derived views. Never prune GE/biosample
                // selections (layer 2) or rewrite loaded annoData (layer 1).
                this.$nextTick(() => {
                    this.renderTrack();
                    this.renderBiosampleTracks();
                });
            },
            deep: true,
        },
    },
    mounted() {
        this.renderTrack();
        window.addEventListener("resize", this.onResize);
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            if (!this.sharedCanvasWidth) {
                this.renderTrack();
            }
        });
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
        this.endPanListeners();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        clearSelectedTissueIfFiltered() {
            if (!this.selectedTissues.length) {
                return;
            }
            const next = this.selectedTissues.filter((tissue) =>
                this.availableTissueKeys.includes(tissue)
            );
            if (next.length !== this.selectedTissues.length) {
                this.setSelectedTissues(next);
            }
        },
        setActiveAnnotation(annotation) {
            const next = annotation || null;
            if (next === this.activeAnnotation) {
                return;
            }
            this.$emit("update:activeAnnotation", next);
        },
        setSelectedTissues(next) {
            const normalized = Array.isArray(next) ? [...next] : [];
            const current = this.selectedTissues || [];
            if (
                normalized.length === current.length &&
                normalized.every((tissue, index) => tissue === current[index])
            ) {
                return;
            }
            this.$emit("update:selectedTissues", normalized);
        },
        annotationColor(annotation) {
            return solidAnnotationColor(
                annotationColorForKey(annotation, this.annotations, VKS_ANNOTATION_COLORS)
            );
        },
        annotationTabStyle(annotation) {
            const color = this.annotationColor(annotation);
            return {
                color,
                borderTopColor: color,
            };
        },
        onResize() {
            this.renderTrack();
        },
        resolveCanvasWidth() {
            if (this.sharedCanvasWidth) {
                return this.sharedCanvasWidth;
            }
            return measureVksPlotStackCanvasWidth(this.$refs.container);
        },
        syncPlotMetrics() {
            const canvas = this.$refs.canvas;
            if (!canvas?.width) {
                return false;
            }
            this.canvasWidth = canvas.width;
            this.plotWidth = canvas.width - this.margin.left * 2;
            this.layoutCanvasHeight = canvas.height;
            this.plotHeight = this.markerPlotHeight;
            return true;
        },
        resetBiosampleUiState() {
            this.biosampleRowsByTissue = {};
            this.biosampleLoadedKeyByTissue = {};
            this.biosampleLoadingByTissue = {};
            this.biosampleErrorByTissue = {};
            this.biosampleHitsByTissue = {};
            this.biosampleRequestTokenByTissue = {};
            this.clearBiosampleTracks();
        },
        biosampleCacheKey(tissue, region) {
            const regionLabel = formatRegion(region);
            if (!tissue || !regionLabel) {
                return "";
            }
            return `${tissue}|${regionLabel}`;
        },
        isBiosampleLoading(tissue) {
            return Boolean(this.biosampleLoadingByTissue[tissue]);
        },
        biosampleErrorForTissue(tissue) {
            return this.biosampleErrorByTissue[tissue] || "";
        },
        rawBiosampleRegionsForTissue(tissue) {
            // Layer 1: cached / loaded biosample regions (unfiltered).
            if (!this.activeAnnotation || !tissue) {
                return [];
            }
            const cacheKey = this.biosampleCacheKey(tissue, this.region);
            const loadedKey = this.biosampleLoadedKeyByTissue[tissue];
            if (cacheKey && loadedKey === cacheKey) {
                return this.biosampleRowsByTissue[tissue] || [];
            }
            return this.annoData?.[this.activeAnnotation]?.[tissue]?.region || [];
        },
        biosampleRegionsForTissue(tissue) {
            // Layer 3: derived biosample view for rendering only.
            if (!this.activeAnnotation || !tissue) {
                return [];
            }
            return buildMappedBiosampleRegionsView(
                this.rawBiosampleRegionsForTissue(tissue),
                {
                    filter: this.workspaceMappingFilter,
                    annotation: this.activeAnnotation,
                    tissue,
                }
            );
        },
        biosampleGroupsForTissue(tissue) {
            if (!this.activeAnnotation || !tissue) {
                return [];
            }
            return groupAnnoRegionsByBiosample(
                this.biosampleRegionsForTissue(tissue)
            );
        },
        availableBiosampleGroupsForTissue(tissue) {
            // Layer 1+2 availability for selections / mapping chips.
            if (!this.activeAnnotation || !tissue) {
                return [];
            }
            return groupAnnoRegionsByBiosample(
                this.rawBiosampleRegionsForTissue(tissue)
            );
        },
        biosampleCanvasRef(tissue) {
            const ref = this.$refs[`biosampleCanvas_${tissue}`];
            return Array.isArray(ref) ? ref[0] : ref;
        },
        renderTrack() {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.hasTrackData || !this.visibleRegion) {
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
                this.tissueHits = [];
                this.clearBiosampleTracks();
                this.clearRegionHover();
                this.canvasWidth = 0;
                this.plotWidth = 0;
                this.layoutCanvasHeight = 0;
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const canvasHeight = this.trackLayoutHeight;
            const ctx = setupAnnotationsWorkspaceCanvas(canvas, canvasWidth, canvasHeight);
            this.tissueHits = renderAnnotationsWorkspaceTrack(ctx, {
                annoData: this.displayAnnoData,
                annotation: this.activeAnnotation,
                visibleRegion: this.visibleRegion,
                canvasWidth,
                canvasHeight,
                margin: this.margin,
                geTissueStats: this.geTissueStats,
                phenotype: this.phenotype,
                ancestry: this.ancestry,
                utils: this.utils,
                recombPeakIntervals: this.recombPeakIntervals,
                plotMarkers: this.plotMarkers,
                selectedTissues: this.selectedTissues,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotations:
                    this.globalEnrichmentState?.enabledMutedAnnotations || [],
                enabledMutedAnnotationTissues:
                    this.globalEnrichmentState?.enabledMutedAnnotationTissues || {},
                disabledAnnotationTissues:
                    this.globalEnrichmentState?.disabledAnnotationTissues || {},
                xAxisBandHover: this.xAxisBandHover,
                livePositionMarkerX: this.livePositionMarkerX,
                tissueTrackSort: this.tissueTrackSort,
                pValueMax: this.geTrackPValueMax,
            });

            this.syncPlotMetrics();
            this.$nextTick(() => this.renderBiosampleTracks());
        },
        clearBiosampleTracks() {
            Object.keys(this.biosampleHitsByTissue || {}).forEach((tissue) => {
                const canvas = this.biosampleCanvasRef(tissue);
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
            });
            this.orderedSelectedTissues.forEach((tissue) => {
                const canvas = this.biosampleCanvasRef(tissue);
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
            });
            this.biosampleHitsByTissue = {};
        },
        async loadBiosamplesForSelectedTissues() {
            const tissues = [...this.orderedSelectedTissues];
            if (!tissues.length || !this.activeAnnotation || !this.region) {
                this.clearBiosampleTracks();
                return;
            }

            await Promise.all(tissues.map((tissue) => this.loadBiosamplesForTissue(tissue)));
            this.$nextTick(() => this.renderBiosampleTracks());
        },
        async loadBiosamplesForTissue(tissue) {
            const annotation = this.activeAnnotation;
            const searchRegion = this.region;
            if (!tissue || !annotation || !searchRegion) {
                return;
            }

            const cacheKey = this.biosampleCacheKey(tissue, searchRegion);
            const applyRows = (rows, { persist = true } = {}) => {
                const filtered = (rows || []).filter(
                    (row) => !row?.annotation || row.annotation === annotation
                );
                const normalized = filtered.map((row) => ({
                    start: Number(row.start),
                    end: Number(row.end),
                    state: row.state ?? "",
                    biosample: row.biosample ?? "",
                    dataset: row.dataset ?? "",
                    method: row.method ?? "",
                    source: row.source ?? "",
                    annotation: row.annotation || annotation,
                }));
                this.$set(this.biosampleRowsByTissue, tissue, normalized);
                this.$set(this.biosampleLoadedKeyByTissue, tissue, cacheKey);
                this.syncBiosampleFilterOptions(
                    this.biosampleRowsByTissue[tissue] || []
                );
                if (persist) {
                    this.$emit("update:biosampleTissueRegions", {
                        annotation,
                        tissue,
                        regionKey: cacheKey,
                        rows: normalized,
                    });
                }
                this.$nextTick(() => this.renderBiosampleTracks());
            };

            const stored =
                this.globalEnrichmentState?.biosampleRegionsByAnnotation?.[
                    annotation
                ]?.[tissue];
            if (
                stored &&
                Array.isArray(stored.rows) &&
                (!cacheKey || !stored.regionKey || stored.regionKey === cacheKey)
            ) {
                if (cacheKey) {
                    this.biosampleCache = {
                        ...this.biosampleCache,
                        [cacheKey]: stored.rows,
                    };
                }
                this.$set(this.biosampleLoadingByTissue, tissue, false);
                this.$set(this.biosampleErrorByTissue, tissue, null);
                applyRows(stored.rows, { persist: false });
                this.emitBiosampleLoadingState();
                return;
            }

            if (cacheKey && this.biosampleCache[cacheKey]) {
                this.$set(this.biosampleLoadingByTissue, tissue, false);
                this.$set(this.biosampleErrorByTissue, tissue, null);
                applyRows(this.biosampleCache[cacheKey]);
                this.emitBiosampleLoadingState();
                return;
            }

            this.$set(this.biosampleErrorByTissue, tissue, null);
            this.$nextTick(() => this.renderBiosampleTracks());

            const host = this.utils?.uiUtils?.biDomain?.();
            if (!host) {
                this.$set(this.biosampleLoadingByTissue, tissue, false);
                // Persist annotation-overlap fallback so export still has regions.
                applyRows(this.annoData?.[annotation]?.[tissue]?.region || []);
                this.emitBiosampleLoadingState();
                return;
            }

            const requestToken =
                (this.biosampleRequestTokenByTissue[tissue] || 0) + 1;
            this.$set(this.biosampleRequestTokenByTissue, tissue, requestToken);
            this.$set(this.biosampleLoadingByTissue, tissue, true);
            this.emitBiosampleLoadingState();

            try {
                const rows = await fetchTissueRegions(tissue, searchRegion, host);
                if (requestToken !== this.biosampleRequestTokenByTissue[tissue]) {
                    return;
                }
                if (cacheKey) {
                    this.biosampleCache = {
                        ...this.biosampleCache,
                        [cacheKey]: rows,
                    };
                }
                this.$set(this.biosampleLoadingByTissue, tissue, false);
                this.$set(this.biosampleErrorByTissue, tissue, null);
                applyRows(rows);
                this.emitBiosampleLoadingState();
            } catch (error) {
                if (requestToken !== this.biosampleRequestTokenByTissue[tissue]) {
                    return;
                }
                console.warn("Variant Sifter tissue-regions fetch failed", error);
                this.$set(this.biosampleLoadingByTissue, tissue, false);
                this.$set(this.biosampleErrorByTissue, tissue, null);
                this.$delete(this.biosampleLoadedKeyByTissue, tissue);
                applyRows(this.annoData?.[annotation]?.[tissue]?.region || []);
                this.emitBiosampleLoadingState();
            }
        },
        emitBiosampleLoadingState() {
            const loading = Object.values(this.biosampleLoadingByTissue || {}).some(
                Boolean
            );
            if (Boolean(this.globalEnrichmentState?.biosampleLoading) === loading) {
                return;
            }
            this.$emit("update:biosampleLoading", loading);
        },
        renderBiosampleTracks() {
            if (!this.orderedSelectedTissues.length || !this.visibleRegion) {
                this.clearBiosampleTracks();
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const nextHits = { ...this.biosampleHitsByTissue };

            this.orderedSelectedTissues.forEach((tissue) => {
                const groups = this.biosampleGroupsForTissue(tissue);
                const canvas = this.biosampleCanvasRef(tissue);
                if (
                    this.isBiosampleLoading(tissue) ||
                    this.biosampleErrorForTissue(tissue) ||
                    !groups.length ||
                    !canvas
                ) {
                    if (canvas) {
                        canvas.height = 0;
                        canvas.style.height = "0";
                    }
                    delete nextHits[tissue];
                    return;
                }

                const canvasHeight = computeAnnotationBiosampleTrackHeight(groups.length);
                const ctx = setupAnnotationsWorkspaceCanvas(
                    canvas,
                    canvasWidth,
                    canvasHeight
                );
                nextHits[tissue] = renderAnnotationBiosampleTracks(ctx, {
                    regions: groups.flatMap((group) => group.regions || []),
                    annotation: this.activeAnnotation,
                    tissue,
                    visibleRegion: this.visibleRegion,
                    canvasWidth,
                    canvasHeight,
                    margin: this.margin,
                    utils: this.utils,
                    recombPeakIntervals: this.recombPeakIntervals,
                    plotMarkers: this.plotMarkers,
                    selectedBiosamples: this.selectedBiosamples,
                    selectedMethods: this.selectedMethods,
                    selectedSources: this.selectedSources,
                });
            });

            this.biosampleHitsByTissue = nextHits;
        },
        syncBiosampleFilterOptions(regions = null) {
            const list = Array.isArray(regions)
                ? regions
                : Object.values(this.biosampleRowsByTissue || {}).flat();
            const methods = listUniqueRegionPropValues(list, "method");
            const sources = listUniqueRegionPropValues(list, "source");
            if (!methods.length && !sources.length) {
                return;
            }
            this.$emit("update:biosampleFilterOptions", {
                methods,
                sources,
            });
        },
        setSelectedBiosamples(next) {
            const normalized = normalizeGeSelectedBiosamples(next);
            const current = this.selectedBiosamples || [];
            if (
                normalized.length === current.length &&
                normalized.every((item, index) => item === current[index])
            ) {
                return;
            }
            this.$emit("update:selectedBiosamples", normalized);
        },
        pruneSelectedBiosamples() {
            if (!this.selectedBiosamples.length) {
                return;
            }
            const allowed = new Set();
            const selected = new Set(this.selectedTissues);
            // Prune only against layer-1 availability (e.g. tissue deselected), never
            // against the temporary workspace mapping view.
            this.availableTissueKeys.forEach((tissue) => {
                if (!selected.has(tissue)) {
                    return;
                }
                this.availableBiosampleGroupsForTissue(tissue).forEach((group) => {
                    allowed.add(biosampleSelectionKey(tissue, group.biosample));
                });
            });
            const next = this.selectedBiosamples.filter((key) => allowed.has(key));
            if (next.length !== this.selectedBiosamples.length) {
                this.setSelectedBiosamples(next);
            }
        },
        onBiosampleCanvasClick(event, tissue) {
            const canvas = this.biosampleCanvasRef(tissue);
            if (!canvas || !this.visibleRegion) {
                return;
            }
            const { y } = canvasPointerPosition(event, canvas);
            const biosampleHit = findAnnotationTissueHitAtY(
                this.biosampleHitsByTissue[tissue] || [],
                y
            );
            if (!biosampleHit) {
                return;
            }
            const key = biosampleSelectionKey(tissue, biosampleHit.biosample);
            const selected = new Set(this.selectedBiosamples);
            if (selected.has(key)) {
                selected.delete(key);
            } else {
                selected.add(key);
            }
            this.setSelectedBiosamples([...selected]);
        },
        isInXAxisInteractionZone(x, y) {
            return isCanvasPointInXAxisInteractionZone(
                x,
                y,
                this.canvasWidth,
                this.layoutCanvasHeight || this.trackLayoutHeight,
                this.margin,
                this.plotHeight
            );
        },
        clearXAxisHover() {
            const hadHover = this.xAxisBandHover || this.livePositionMarkerX != null;
            this.xAxisBandHover = false;
            this.livePositionMarkerX = null;
            if (hadHover) {
                this.renderTrack();
            }
        },
        clearRegionHover() {
            this.hoveredRegion = null;
        },
        positionInfoPanel() {
            const panel = this.$refs.infoPanel;
            if (!panel || !this.hoveredRegion) {
                return;
            }
            positionAnchoredPopupElement(
                panel,
                this.hoverAnchorX / 2,
                this.hoverAnchorY / 2,
                this.$refs.trackPanel
            );
        },
        updateXAxisHover(x) {
            const position = canvasXToGenomicPosition(
                x,
                this.canvasWidth,
                this.margin,
                this.visibleRegion
            );
            if (position == null) {
                this.clearXAxisHover();
                return;
            }
            const nextX = genomicPositionToCanvasX(
                position,
                this.visibleRegion,
                this.margin,
                this.plotWidth
            );
            if (this.livePositionMarkerX === nextX && this.xAxisBandHover) {
                return;
            }
            this.xAxisBandHover = true;
            this.livePositionMarkerX = nextX;
            this.renderTrack();
        },
        onCanvasClick(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.visibleRegion) {
                return;
            }

            if (!this.syncPlotMetrics()) {
                return;
            }

            if (this.suppressClick) {
                this.suppressClick = false;
                return;
            }

            if (this.panMoved) {
                this.panMoved = false;
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);

            if (this.isInXAxisInteractionZone(x, y)) {
                const position = canvasXToGenomicPosition(
                    x,
                    this.canvasWidth,
                    this.margin,
                    this.visibleRegion
                );
                if (position != null) {
                    this.$emit("toggle-position-marker", position);
                }
                return;
            }

            const tissueHit = findAnnotationTissueHitAtY(this.tissueHits, y);
            if (tissueHit) {
                const tissue = tissueHit.tissue;
                const selected = new Set(this.selectedTissues);
                if (selected.has(tissue)) {
                    selected.delete(tissue);
                } else {
                    selected.add(tissue);
                }
                this.setSelectedTissues(
                    this.availableTissueKeys.filter((key) => selected.has(key))
                );
            }
        },
        onMouseDown(event) {
            if (!this.canPan || event.button !== 0) {
                return;
            }
            const canvas = this.$refs.canvas;
            if (!canvas || !this.syncPlotMetrics()) {
                return;
            }
            const { x, y } = canvasPointerPosition(event, canvas);
            if (this.isInXAxisInteractionZone(x, y)) {
                return;
            }
            this.clearRegionHover();
            this.isPanning = true;
            this.panMoved = false;
            this.panDidChangeShift = false;
            this.panStartX = event.clientX;
            this.panStartRegionShiftBp = this.regionShiftBp;
            this.panStartRegionViewArea = this.regionViewArea;
            document.addEventListener("mousemove", this.onDocumentMouseMove);
            document.addEventListener("mouseup", this.onDocumentMouseUp);
        },
        onDocumentMouseMove(event) {
            if (!this.isPanning) {
                return;
            }
            const deltaX = event.clientX - this.panStartX;
            if (Math.abs(deltaX) > 3) {
                this.panMoved = true;
            }
            const pan = resolveHandPanFromDrag({
                regionZoom: this.regionZoom,
                panStartRegionViewArea: this.panStartRegionViewArea,
                panStartRegionShiftBp: this.panStartRegionShiftBp,
                deltaXPixels: deltaX,
                plotWidthPx: this.plotWidth,
                visibleWidthBp: this.visibleWidthBp,
            });
            if (pan.mode === "viewArea") {
                this.$emit("update:regionViewArea", pan.regionViewArea);
                return;
            }
            if (pan.regionShiftBp !== this.regionShiftBp) {
                this.panDidChangeShift = true;
            }
            this.$emit("update:regionShiftBp", pan.regionShiftBp);
        },
        onDocumentMouseUp() {
            this.stopPanning();
        },
        onMouseUp() {
            this.stopPanning();
        },
        stopPanning() {
            if (!this.isPanning) {
                return;
            }
            if (this.panMoved) {
                this.suppressClick = true;
            }
            const didChangeShift = this.panDidChangeShift;
            this.isPanning = false;
            this.panMoved = false;
            this.panDidChangeShift = false;
            this.endPanListeners();
            if (didChangeShift) {
                this.$emit("pan-end");
            }
        },
        endPanListeners() {
            document.removeEventListener("mousemove", this.onDocumentMouseMove);
            document.removeEventListener("mouseup", this.onDocumentMouseUp);
        },
        onMouseOut(event) {
            if (this.isPanning) {
                return;
            }
            if (
                event.relatedTarget &&
                (this.$refs.trackPanel?.contains(event.relatedTarget) ||
                    this.$refs.container?.contains(event.relatedTarget))
            ) {
                return;
            }
            this.clearXAxisHover();
            this.clearRegionHover();
        },
        onMouseMove(event) {
            if (this.isPanning) {
                return;
            }
            const canvas = this.$refs.canvas;
            if (!canvas || !this.visibleRegion) {
                return;
            }

            if (!this.syncPlotMetrics()) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);

            if (this.isInXAxisInteractionZone(x, y)) {
                this.clearRegionHover();
                this.updateXAxisHover(x);
                return;
            }

            this.clearXAxisHover();

            const regionHit = findAnnotationRegionHitAtPoint(this.tissueHits, x, y);
            if (!regionHit) {
                this.clearRegionHover();
                return;
            }

            this.hoverAnchorX = x;
            this.hoverAnchorY = y;
            this.hoveredRegion = regionHit;
            this.$nextTick(() => this.positionInfoPanel());
        },
        onBiosampleMouseMove(event, tissue) {
            const canvas = this.biosampleCanvasRef(tissue);
            if (!canvas || !this.visibleRegion) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const regionHit = findAnnotationRegionHitAtPoint(
                this.biosampleHitsByTissue[tissue] || [],
                x,
                y
            );
            if (!regionHit) {
                this.clearRegionHover();
                return;
            }

            this.hoverAnchorX = x;
            this.hoverAnchorY = y + canvas.offsetTop * 2;
            this.hoveredRegion = regionHit;
            this.$nextTick(() => this.positionInfoPanel());
        },
        onBiosampleMouseOut() {
            this.clearRegionHover();
        },
    },
};
</script>

<style scoped>
.vks-anno-workspace-track {
    width: 100%;
}

.vks-anno-workspace-guide {
    margin: 0 0 10px;
    padding: 0 2px;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    line-height: 1.45;
}

.vks-anno-workspace-guide strong {
    color: #4a4a4a;
    font-weight: 600;
}

.vks-anno-workspace-tab-bar {
    margin-bottom: 8px;
}

.vks-anno-workspace-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 3px;
    border-radius: var(--vks-radius-md, 8px);
    background: var(--cfde-header-bg, #f6f5f2);
}

.vks-anno-workspace-tab {
    position: relative;
    border: none;
    border-radius: var(--vks-radius-sm, 6px);
    margin: 0;
    padding: 7px 10px;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
    white-space: nowrap;
}

.vks-anno-workspace-tab:hover {
    color: var(--cfde-ink, #33363d);
}

.vks-anno-workspace-tab.is-active {
    background: var(--cfde-bg, #ffffff);
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
    z-index: 1;
}

.vks-anno-workspace-title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: #333333;
}

.vks-anno-workspace-panel {
    position: relative;
    width: 100%;
    margin-top: 6px;
    background: #ffffff;
}

.vks-anno-biosample-section {
    margin-top: 12px;
    padding-top: 4px;
}

.vks-anno-biosample-group + .vks-anno-biosample-group {
    margin-top: 14px;
}

.vks-anno-biosample-intro {
    margin: 0 0 10px;
    padding: 0 2px;
    color: #4a4a4a;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
}

.vks-anno-biosample-empty {
    margin: 0;
    padding: 0 2px;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}

.vks-anno-workspace-canvas {
    display: block;
    width: 100%;
}

.vks-anno-workspace-canvas.is-pannable {
    cursor: grab;
}

.vks-anno-workspace-canvas.is-pannable:active {
    cursor: grabbing;
}

.vks-anno-workspace-canvas.is-x-axis-hover {
    cursor: crosshair;
}

.vks-anno-workspace-canvas.is-region-hover {
    cursor: pointer;
}

.vks-anno-biosample-canvas {
    cursor: pointer;
}

.vks-anno-workspace-info-panel {
    position: absolute;
    z-index: 4;
    min-width: 180px;
    max-width: min(92%, 280px);
    padding: 10px 12px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    box-shadow: 0 8px 20px rgba(20, 22, 30, 0.14);
    pointer-events: none;
}

.vks-anno-workspace-info-tissue {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
}

.vks-anno-workspace-info-line {
    margin: 0 0 4px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.vks-anno-workspace-info-line:last-child {
    margin-bottom: 0;
}
</style>
