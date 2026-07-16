<template>
    <div ref="container" class="vks-v2g-track">
        <ul
            v-if="methodLegendItems.length"
            class="vks-v2g-method-legend"
            :aria-label="legendAriaLabel"
        >
            <li
                v-for="item in methodLegendItems"
                :key="item.method"
                class="vks-v2g-method-legend-item"
                :class="{ 'is-muted': item.muted }"
            >
                <span
                    class="vks-v2g-method-legend-swatch"
                    :style="{ backgroundColor: item.color }"
                    aria-hidden="true"
                ></span>
                <span>{{ item.method }}</span>
            </li>
        </ul>
        <div v-if="loadingTissue" class="vks-v2g-track-status">
            {{ loadingStatusText }}
        </div>
        <div v-else-if="!hasRenderData" class="vks-v2g-track-empty">
            {{ emptyMessage }}
        </div>
        <div v-show="hasRenderData" ref="canvasWrap" class="vks-v2g-track-canvas-wrap">
            <canvas
                ref="canvas"
                class="vks-v2g-track-canvas"
                :class="{
                    'is-pannable': canPan,
                    'is-hover': Boolean(hoveredHit) && !isPanning && !xAxisBandHover,
                    'is-x-axis-hover': xAxisBandHover,
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
        </div>
        <div
            v-if="hoveredHit"
            ref="infoPanel"
            class="vks-v2g-track-info"
            role="status"
        >
            <p class="vks-v2g-track-info-title">
                {{ hoveredHit.targetGene }} / {{ hoveredHit.method }}
            </p>
            <p class="vks-v2g-track-info-row">
                <span class="vks-v2g-track-info-label">Tissue</span>
                <span>{{ hoveredHit.tissue }}</span>
            </p>
            <p class="vks-v2g-track-info-row">
                <span class="vks-v2g-track-info-label">Biosample</span>
                <span>{{ hoveredHit.biosample || "—" }}</span>
            </p>
            <p class="vks-v2g-track-info-row">
                <span class="vks-v2g-track-info-label">Regulatory element</span>
                <span>{{ hoveredHit.start }}–{{ hoveredHit.end }}</span>
            </p>
            <p class="vks-v2g-track-info-row">
                <span class="vks-v2g-track-info-label">Promoter</span>
                <span>
                    {{ hoveredHit.targetGeneStart }}–{{ hoveredHit.targetGeneEnd }}
                </span>
            </p>
        </div>
    </div>
</template>

<script>
import VariantSifterZoomCenterMarker from "./VariantSifterZoomCenterMarker.vue";
import {
    computeViewRegion,
    computeVisibleWindowWidth,
    resolveHandPanFromDrag,
} from "./variantSifterRegionPan.js";
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
    renderTrackHighlightBands,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import {
    canvasXToGenomicPosition,
    genomicPositionToCanvasX,
    isCanvasPointInXAxisInteractionZone,
    renderLivePositionGuideline,
    renderPlotMarkerLines,
    renderXAxisBandHoverHighlight,
} from "./variantSifterPlotMarkers.js";
import {
    buildV2gRenderData,
    collectGenesFromTissueData,
    collectMethodsFromTissueData,
    hasV2gTrackData,
    normalizeV2gSelectedLinks,
    normalizeV2gViewMode,
    solidV2gMethodColor,
    v2gLinkSelectionKey,
    v2gMethodColor,
    VKS_V2G_METHOD_COLORS,
} from "./variantSifterV2gData.js";
import {
    filterRegionsByMappedPositions,
    normalizeWorkspaceMappingFilter,
} from "./variantSifterMappingData.js";
import {
    computeV2gCanvasHeight,
    computeV2gGeneConnectionCanvasHeight,
    findV2gTrackRowAtY,
    renderV2gArcs,
    renderV2gRibbons,
    renderV2gTracks,
} from "./variantSifterV2gRender.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";

const V2G_TRACK_MARGIN = {
    leftMargin: 150,
    rightMargin: 80,
    topMargin: 20,
    bottomMargin: 40,
    bump: 11,
};

export default {
    name: "VariantSifterV2gTrack",
    components: {
        VariantSifterZoomCenterMarker,
    },
    props: {
        v2gState: {
            type: Object,
            default: null,
        },
        viewRegion: {
            type: Object,
            default: null,
        },
        region: {
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
        plotMargin: {
            type: Object,
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
        emptyMessage: {
            type: String,
            default:
                "Select one or more tissues in the Var-to-gene panel to load tracks.",
        },
        legendAriaLabel: {
            type: String,
            default: "Variant-to-gene methods",
        },
        loadingStatusTemplate: {
            type: String,
            default: "Loading gene links for {tissue}…",
        },
        workspaceMappingFilter: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            hitRegions: [],
            trackRows: [],
            hoveredHit: null,
            hoverAnchorX: 0,
            hoverAnchorY: 0,
            resizeObserver: null,
            canvasWidth: 0,
            plotWidth: 0,
            layoutCanvasHeight: 0,
            plotContentHeight: 0,
            isPanning: false,
            panStartX: 0,
            panStartRegionShiftBp: 0,
            panStartRegionViewArea: 0,
            panDidChangeShift: false,
            panMoved: false,
            suppressClick: false,
            livePositionMarkerX: null,
            xAxisBandHover: false,
        };
    },
    computed: {
        tissueData() {
            return this.v2gState?.tissueData || {};
        },
        loadingTissue() {
            return this.v2gState?.loadingTissue || null;
        },
        loadingStatusText() {
            const tissue = this.loadingTissue || "region";
            return String(this.loadingStatusTemplate).replace("{tissue}", tissue);
        },
        viewMode() {
            return normalizeV2gViewMode(this.v2gState?.viewMode);
        },
        methods() {
            return collectMethodsFromTissueData(this.tissueData);
        },
        deselectedMethods() {
            return Array.isArray(this.v2gState?.deselectedMethods)
                ? this.v2gState.deselectedMethods
                : [];
        },
        methodLegendItems() {
            return this.methods.map((method, index) => ({
                method,
                muted: this.deselectedMethods.includes(method),
                color: solidV2gMethodColor(
                    v2gMethodColor(method, this.methods, VKS_V2G_METHOD_COLORS) ||
                        VKS_V2G_METHOD_COLORS[index % VKS_V2G_METHOD_COLORS.length]
                ),
            }));
        },
        renderData() {
            const base = buildV2gRenderData(
                this.tissueData,
                this.v2gState?.deselectedMethods,
                this.v2gState?.deselectedGenes
            );
            const filter = normalizeWorkspaceMappingFilter(this.workspaceMappingFilter);
            if (!filter) {
                return base;
            }
            const next = {};
            Object.entries(base || {}).forEach(([tissue, genes]) => {
                const nextGenes = {};
                Object.entries(genes || {}).forEach(([gene, methods]) => {
                    const nextMethods = {};
                    Object.entries(methods || {}).forEach(([method, links]) => {
                        const filtered = filterRegionsByMappedPositions(links, filter);
                        if (filtered.length) {
                            nextMethods[method] = filtered;
                        }
                    });
                    if (Object.keys(nextMethods).length) {
                        nextGenes[gene] = nextMethods;
                    }
                });
                if (Object.keys(nextGenes).length) {
                    next[tissue] = nextGenes;
                }
            });
            return next;
        },
        selectedLinks() {
            return normalizeV2gSelectedLinks(this.v2gState?.selectedLinks);
        },
        genesArr() {
            return collectGenesFromTissueData(this.tissueData).filter(
                (gene) => !this.v2gState?.deselectedGenes?.includes(gene)
            );
        },
        hasRenderData() {
            return hasV2gTrackData(this.v2gState) && Object.keys(this.renderData).length > 0;
        },
        margin() {
            return normalizePlotMargin(this.plotMargin || V2G_TRACK_MARGIN);
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
        canPan() {
            return Boolean(this.visibleRegion && this.hasRenderData);
        },
    },
    watch: {
        renderData: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        viewMode() {
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
        selectedLinks: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
    },
    mounted() {
        this.renderTrack();
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            if (!this.sharedCanvasWidth) {
                this.renderTrack();
            }
        });
    },
    beforeDestroy() {
        this.endPanListeners();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    updated() {
        this.positionInfoPanel();
    },
    methods: {
        clearHover() {
            this.hoveredHit = null;
        },
        clearXAxisHover() {
            const hadHover = this.xAxisBandHover || this.livePositionMarkerX != null;
            this.xAxisBandHover = false;
            this.livePositionMarkerX = null;
            if (hadHover) {
                this.renderTrack();
            }
        },
        syncPlotMetrics() {
            const canvas = this.$refs.canvas;
            if (!canvas?.width) {
                return false;
            }
            this.canvasWidth = canvas.width;
            this.plotWidth = canvas.width - this.margin.left * 2;
            this.layoutCanvasHeight = canvas.height;
            this.plotContentHeight = Math.max(
                0,
                canvas.height - this.margin.top - this.margin.bottom
            );
            return true;
        },
        isInXAxisInteractionZone(x, y) {
            return isCanvasPointInXAxisInteractionZone(
                x,
                y,
                this.canvasWidth,
                this.layoutCanvasHeight,
                this.margin,
                this.plotContentHeight
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
        paintTrackBands(ctx) {
            if (!ctx || !this.visibleRegion || !this.plotWidth || !this.plotContentHeight) {
                return;
            }
            renderTrackHighlightBands(ctx, {
                intervals: this.recombPeakIntervals,
                visibleRegion: this.visibleRegion,
                margin: this.margin,
                plotWidth: this.plotWidth,
                plotHeight: this.plotContentHeight,
            });
        },
        paintTrackMarkers(ctx) {
            if (!ctx || !this.visibleRegion || !this.plotWidth || !this.plotContentHeight) {
                return;
            }
            const canvasHeight = this.layoutCanvasHeight;
            renderPlotMarkerLines(ctx, {
                starredVariants: this.plotMarkers?.starredVariants || [],
                positionMarkers: this.plotMarkers?.positionMarkers || [],
                visibleRegion: this.visibleRegion,
                margin: this.margin,
                plotWidth: this.plotWidth,
                plotHeight: this.plotContentHeight,
                canvasHeight,
            });
            if (this.xAxisBandHover) {
                renderXAxisBandHoverHighlight(ctx, {
                    margin: this.margin,
                    plotWidth: this.plotWidth,
                    plotHeight: this.plotContentHeight,
                    canvasHeight,
                });
            }
            if (this.xAxisBandHover && this.livePositionMarkerX != null) {
                renderLivePositionGuideline(ctx, this.livePositionMarkerX, {
                    margin: this.margin,
                    plotHeight: this.plotContentHeight,
                });
            }
        },
        paintTrackOverlays(ctx) {
            this.paintTrackBands(ctx);
            this.paintTrackMarkers(ctx);
        },
        onMouseOut(event) {
            if (this.isPanning) {
                return;
            }
            if (event.relatedTarget && this.$refs.container?.contains(event.relatedTarget)) {
                return;
            }
            this.clearHover();
            this.clearXAxisHover();
        },
        onMouseMove(event) {
            if (this.isPanning) {
                return;
            }
            const canvas = this.$refs.canvas;
            if (!canvas || !this.visibleRegion || !this.hasRenderData) {
                this.clearHover();
                this.clearXAxisHover();
                return;
            }
            if (!this.syncPlotMetrics()) {
                return;
            }
            const { x, y } = canvasPointerPosition(event, canvas);
            if (this.isInXAxisInteractionZone(x, y)) {
                this.clearHover();
                this.updateXAxisHover(x);
                return;
            }
            this.clearXAxisHover();
            if (!this.hitRegions.length) {
                this.clearHover();
                return;
            }
            const hit = this.hitRegions.find(
                (region) =>
                    y >= region.yTop &&
                    y <= region.yBottom &&
                    x >= region.xLeft &&
                    x <= region.xRight
            );
            if (!hit) {
                this.clearHover();
                return;
            }
            this.hoveredHit = hit;
            this.hoverAnchorX = x;
            this.hoverAnchorY = y;
            this.$nextTick(() => this.positionInfoPanel());
        },
        positionInfoPanel() {
            const panel = this.$refs.infoPanel;
            if (!panel || !this.hoveredHit) {
                return;
            }
            positionAnchoredPopupElement(
                panel,
                this.hoverAnchorX / 2,
                this.hoverAnchorY / 2,
                this.$refs.container
            );
        },
        resolveCanvasWidth() {
            if (this.sharedCanvasWidth) {
                return this.sharedCanvasWidth;
            }
            return measureVksPlotStackCanvasWidth(this.$refs.container);
        },
        onCanvasClick(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.visibleRegion) {
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
            if (!this.syncPlotMetrics()) {
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
            this.selectTrackAtCanvasPoint(x, y);
        },
        selectTrackAtCanvasPoint(x, y) {
            // Prefer a specific bar/ribbon hit (method-level), else full track row.
            const barHit = this.hitRegions.find(
                (region) =>
                    y >= region.yTop &&
                    y <= region.yBottom &&
                    x >= region.xLeft &&
                    x <= region.xRight
            );
            if (barHit?.tissue && barHit?.targetGene && barHit?.method) {
                this.toggleSelectedLinkKeys([
                    v2gLinkSelectionKey(
                        barHit.tissue,
                        barHit.targetGene,
                        barHit.method
                    ),
                ]);
                return true;
            }

            const rowHit = findV2gTrackRowAtY(this.trackRows, y);
            if (!rowHit?.tissue || !rowHit?.targetGene) {
                return false;
            }
            if (rowHit.method) {
                this.toggleSelectedLinkKeys([
                    v2gLinkSelectionKey(
                        rowHit.tissue,
                        rowHit.targetGene,
                        rowHit.method
                    ),
                ]);
                return true;
            }
            const methods = Array.isArray(rowHit.methods) ? rowHit.methods : [];
            if (!methods.length) {
                return false;
            }
            this.toggleSelectedLinkKeys(
                methods.map((method) =>
                    v2gLinkSelectionKey(rowHit.tissue, rowHit.targetGene, method)
                )
            );
            return true;
        },
        toggleSelectedLinkKeys(keys) {
            const nextKeys = normalizeV2gSelectedLinks(keys);
            if (!nextKeys.length) {
                return;
            }
            const selected = new Set(this.selectedLinks);
            const allSelected = nextKeys.every((key) => selected.has(key));
            nextKeys.forEach((key) => {
                if (allSelected) {
                    selected.delete(key);
                } else {
                    selected.add(key);
                }
            });
            this.$emit("update:selectedLinks", [...selected].sort());
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
            this.panDidChangeShift = false;
            this.panStartX = event.clientX;
            this.panStartRegionShiftBp = this.regionShiftBp;
            this.panStartRegionViewArea = this.regionViewArea;
            this.clearHover();
            this.clearXAxisHover();
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
        onDocumentMouseUp(event) {
            this.stopPanning(event);
        },
        onMouseUp(event) {
            this.stopPanning(event);
        },
        stopPanning(event) {
            if (!this.isPanning) {
                return;
            }
            const panMoved = this.panMoved;
            const didChangeShift = this.panDidChangeShift;
            this.isPanning = false;
            this.panMoved = false;
            this.panDidChangeShift = false;
            this.endPanListeners();

            // Select on a click-like mouseup so trackpad jitter / drag listeners
            // don't swallow the subsequent click event.
            if (!panMoved && event && this.$refs.canvas && this.syncPlotMetrics()) {
                const { x, y } = canvasPointerPosition(event, this.$refs.canvas);
                if (!this.isInXAxisInteractionZone(x, y)) {
                    this.selectTrackAtCanvasPoint(x, y);
                }
            }
            this.suppressClick = true;

            if (didChangeShift) {
                this.$emit("pan-end");
            }
        },
        endPanListeners() {
            document.removeEventListener("mousemove", this.onDocumentMouseMove);
            document.removeEventListener("mouseup", this.onDocumentMouseUp);
        },
        renderTrack() {
            const canvas = this.$refs.canvas;
            const container = this.$refs.container;
            if (!canvas || !container || !this.hasRenderData || !this.visibleRegion) {
                this.hitRegions = [];
                this.trackRows = [];
                this.canvasWidth = 0;
                this.plotWidth = 0;
                this.layoutCanvasHeight = 0;
                this.plotContentHeight = 0;
                this.clearHover();
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const margin = this.margin;
            const plotWidth = canvasWidth - margin.left * 2;
            this.canvasWidth = canvasWidth;
            this.plotWidth = plotWidth;
            const regionStart = Number(this.visibleRegion.start);
            const regionEnd = Number(this.visibleRegion.end);

            let canvasHeight;
            let hitRegions = [];
            let trackRows = [];

            if (this.viewMode === "ribbons" || this.viewMode === "arcs") {
                canvasHeight =
                    computeV2gGeneConnectionCanvasHeight(
                        this.renderData,
                        this.genesArr
                    ) || 40;
                const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
                this.layoutCanvasHeight = canvasHeight;
                this.plotContentHeight = Math.max(
                    0,
                    canvasHeight - margin.top - margin.bottom
                );
                this.paintTrackBands(ctx);
                const connectionOptions = {
                    renderData: this.renderData,
                    genesArr: this.genesArr,
                    colorMethodsArr: this.methods,
                    regionStart,
                    regionEnd,
                    plotWidth,
                    margin,
                    methodColors: VKS_V2G_METHOD_COLORS,
                    selectedLinks: this.selectedLinks,
                };
                ({ hitRegions, trackRows } =
                    this.viewMode === "arcs"
                        ? renderV2gArcs(ctx, connectionOptions)
                        : renderV2gRibbons(ctx, connectionOptions));
                this.paintTrackMarkers(ctx);
            } else {
                canvasHeight =
                    computeV2gCanvasHeight(this.renderData, this.tissueData) || 40;
                const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
                this.layoutCanvasHeight = canvasHeight;
                this.plotContentHeight = Math.max(
                    0,
                    canvasHeight - margin.top - margin.bottom
                );
                this.paintTrackBands(ctx);
                const renderResult = renderV2gTracks(ctx, {
                    renderData: this.renderData,
                    tissueData: this.tissueData,
                    regionStart,
                    regionEnd,
                    plotWidth,
                    margin,
                    methodColors: VKS_V2G_METHOD_COLORS,
                    selectedLinks: this.selectedLinks,
                });
                ({ hitRegions, trackRows } = renderResult);
                this.paintTrackMarkers(ctx);
            }

            this.hitRegions = hitRegions || [];
            this.trackRows = trackRows || [];
        },
    },
};
</script>

<style scoped>
.vks-v2g-track {
    position: relative;
    width: 100%;
    min-height: 48px;
}

.vks-v2g-method-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
}

.vks-v2g-method-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #3a4450;
}

.vks-v2g-method-legend-item.is-muted {
    opacity: 0.4;
}

.vks-v2g-method-legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
}

.vks-v2g-track-status,
.vks-v2g-track-empty {
    margin: 0;
    padding: 8px 4px 12px;
    color: #5c6670;
    font-size: 0.875rem;
}

.vks-v2g-track-canvas-wrap {
    position: relative;
}

.vks-v2g-track-canvas {
    display: block;
    width: 100%;
}

.vks-v2g-track-canvas.is-pannable {
    cursor: grab;
    user-select: none;
}

.vks-v2g-track-canvas.is-pannable:active {
    cursor: grabbing;
}

.vks-v2g-track-canvas.is-hover {
    cursor: crosshair;
}

.vks-v2g-track-canvas.is-x-axis-hover {
    cursor: crosshair;
}

.vks-v2g-track-info {
    position: absolute;
    z-index: 4;
    min-width: 200px;
    max-width: 280px;
    padding: 10px 12px;
    border: 1px solid #cfd6dd;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 4px 14px rgba(20, 30, 40, 0.12);
    pointer-events: none;
    font-size: 0.8rem;
    line-height: 1.35;
}

.vks-v2g-track-info-title {
    margin: 0 0 6px;
    font-weight: 600;
    color: #1b2430;
}

.vks-v2g-track-info-row {
    display: flex;
    gap: 8px;
    margin: 0 0 4px;
}

.vks-v2g-track-info-label {
    flex: 0 0 7.5rem;
    color: #69727c;
}
</style>
