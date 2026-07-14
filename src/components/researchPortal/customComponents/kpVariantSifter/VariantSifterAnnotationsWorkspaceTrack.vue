<template>
    <div ref="container" class="vks-anno-workspace-track">
        <div v-if="annotations.length > 1" class="vks-anno-workspace-tab-bar">
            <div class="vks-anno-workspace-tabs" role="tablist" aria-label="Annotation tracks">
                <button
                    v-for="annotation in annotations"
                    :key="annotation"
                    type="button"
                    class="vks-anno-workspace-tab"
                    :class="{ 'is-active': annotation === activeAnnotation }"
                    role="tab"
                    :aria-selected="annotation === activeAnnotation"
                    @click="setActiveAnnotation(annotation)"
                >
                    {{ annotation }}
                </button>
            </div>
        </div>
        <p v-else-if="activeAnnotation" class="vks-anno-workspace-title">
            {{ activeAnnotation }}
        </p>
        <div class="vks-anno-workspace-panel">
            <canvas
                ref="canvas"
                class="vks-anno-workspace-canvas"
                :class="{
                    'is-pannable': canPan,
                    'is-x-axis-hover': xAxisBandHover,
                }"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseout="onMouseOut"
                @mouseup="onMouseUp"
                @click="onCanvasClick"
            ></canvas>
        </div>
    </div>
</template>

<script>
import { VARIANT_SIFTER_ANNO_TRACK_MARGIN } from "./variantSifterAssociationsPlotConfig.js";
import {
    annotationsForPlot,
    buildGeTissueStatsForAnnotation,
    computeAnnotationWorkspaceTrackHeight,
    filterGeTissuesForDisplay,
    VKS_ANNO_TRACK_PER_TISSUE,
    VKS_ANNO_TRACK_STATS_HEADER,
} from "./variantSifterGlobalEnrichmentData.js";
import {
    computeViewRegion,
    computeVisibleWindowWidth,
    panRegionShiftFromDrag,
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
    findAnnotationTissueHitAtY,
    renderAnnotationsWorkspaceTrack,
    setupAnnotationsWorkspaceCanvas,
} from "./variantSifterAnnotationsWorkspaceRender.js";

export default {
    name: "VariantSifterAnnotationsWorkspaceTrack",
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
    },
    data() {
        return {
            activeAnnotation: null,
            selectedTissue: null,
            tissueHits: [],
            canvasWidth: 0,
            plotWidth: 0,
            layoutCanvasHeight: 0,
            plotHeight: 0,
            suppressClick: false,
            isPanning: false,
            panStartX: 0,
            panStartRegionShiftBp: 0,
            panMoved: false,
            livePositionMarkerX: null,
            xAxisBandHover: false,
        };
    },
    computed: {
        margin() {
            return normalizePlotMargin(VARIANT_SIFTER_ANNO_TRACK_MARGIN);
        },
        annoData() {
            return this.globalEnrichmentState?.annoData || {};
        },
        annotations() {
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
        tissueKeys() {
            if (!this.activeAnnotation) {
                return [];
            }
            const tissues = Object.keys(this.annoData[this.activeAnnotation] || {}).sort();
            return filterGeTissuesForDisplay(tissues, {
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedTissues: this.globalEnrichmentState?.enabledMutedTissues || [],
                showFilteredTissuesInTracks: Boolean(
                    this.globalEnrichmentState?.showFilteredTissuesInTracks
                ),
            });
        },
        trackLayoutHeight() {
            return computeAnnotationWorkspaceTrackHeight(this.tissueKeys.length);
        },
        markerPlotHeight() {
            return VKS_ANNO_TRACK_STATS_HEADER + this.tissueKeys.length * VKS_ANNO_TRACK_PER_TISSUE;
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
    },
    watch: {
        annotations: {
            handler(nextAnnotations) {
                if (!nextAnnotations.length) {
                    this.activeAnnotation = null;
                    this.selectedTissue = null;
                    return;
                }
                if (!nextAnnotations.includes(this.activeAnnotation)) {
                    this.activeAnnotation = nextAnnotations[0];
                    this.selectedTissue = null;
                }
                this.$nextTick(() => this.renderTrack());
            },
            immediate: true,
        },
        activeAnnotation() {
            this.selectedTissue = null;
            this.$nextTick(() => this.renderTrack());
        },
        selectedTissue() {
            this.renderTrack();
        },
        visibleRegion: {
            handler() {
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
        "globalEnrichmentState.enabledMutedTissues": {
            handler() {
                this.clearSelectedTissueIfFiltered();
                this.renderTrack();
            },
            deep: true,
        },
        "globalEnrichmentState.showFilteredTissuesInTracks"() {
            this.clearSelectedTissueIfFiltered();
            this.renderTrack();
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
            if (
                this.selectedTissue &&
                !this.tissueKeys.includes(this.selectedTissue)
            ) {
                this.selectedTissue = null;
            }
        },
        setActiveAnnotation(annotation) {
            this.activeAnnotation = annotation;
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
        renderTrack() {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.hasTrackData || !this.visibleRegion) {
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
                this.tissueHits = [];
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
                annoData: this.annoData,
                annotation: this.activeAnnotation,
                annotations: this.annotations,
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
                selectedTissue: this.selectedTissue,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotations:
                    this.globalEnrichmentState?.enabledMutedAnnotations || [],
                enabledMutedTissues: this.globalEnrichmentState?.enabledMutedTissues || [],
                showFilteredTissuesInTracks: Boolean(
                    this.globalEnrichmentState?.showFilteredTissuesInTracks
                ),
                xAxisBandHover: this.xAxisBandHover,
                livePositionMarkerX: this.livePositionMarkerX,
            });

            this.syncPlotMetrics();
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
                this.selectedTissue =
                    this.selectedTissue === tissueHit.tissue ? null : tissueHit.tissue;
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
            this.isPanning = true;
            this.panMoved = false;
            this.panStartX = event.clientX;
            this.panStartRegionShiftBp = this.regionShiftBp;
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
            const nextShiftBp = panRegionShiftFromDrag(
                this.panStartRegionShiftBp,
                deltaX,
                this.plotWidth,
                this.visibleWidthBp
            );
            this.$emit("update:regionShiftBp", nextShiftBp);
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
            this.isPanning = false;
            this.panMoved = false;
            this.endPanListeners();
            this.$emit("pan-end");
        },
        endPanListeners() {
            document.removeEventListener("mousemove", this.onDocumentMouseMove);
            document.removeEventListener("mouseup", this.onDocumentMouseUp);
        },
        onMouseOut(event) {
            if (this.isPanning) {
                return;
            }
            if (event.relatedTarget && this.$refs.container?.contains(event.relatedTarget)) {
                return;
            }
            this.clearXAxisHover();
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
                this.updateXAxisHover(x);
                return;
            }

            this.clearXAxisHover();
        },
    },
};
</script>

<style scoped>
.vks-anno-workspace-track {
    width: 100%;
}

.vks-anno-workspace-tab-bar {
    border-bottom: 1px solid #dddddd;
    margin-bottom: 0;
}

.vks-anno-workspace-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0;
    margin: 0;
    padding: 0;
}

.vks-anno-workspace-tab {
    position: relative;
    border: 1px solid #dddddd;
    border-bottom: none;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    margin: 0 4px -1px 0;
    padding: 6px 12px;
    background: #eeeeee;
    color: #0069d9;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.3;
    cursor: pointer;
    white-space: nowrap;
}

.vks-anno-workspace-tab:hover {
    background: #f5f5f5;
}

.vks-anno-workspace-tab.is-active {
    background: #ffffff;
    border-color: #dddddd;
    border-bottom: 1px solid #ffffff;
    color: #333333;
    font-weight: 600;
    z-index: 1;
}

.vks-anno-workspace-title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: #333333;
}

.vks-anno-workspace-panel {
    width: 100%;
    background: #ffffff;
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
</style>
