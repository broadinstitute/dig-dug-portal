<template>
    <div ref="container" class="vks-cs-track">
        <div ref="canvasWrap" class="vks-cs-track-canvas-wrap">
            <canvas
                ref="canvas"
                class="vks-cs-track-canvas"
                :class="{
                    'is-pannable': canPan,
                    'is-x-axis-hover': xAxisBandHover,
                    'is-dot-hover': dotHover,
                }"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseout="onMouseOut"
                @mouseup="onMouseUp"
                @click="onCanvasClick"
            ></canvas>
        </div>
        <VariantSifterVariantDotMenu
            :open="dotMenuOpen"
            :variant-id="dotMenuVariantId"
            :is-starred="dotMenuIsStarred"
            :anchor-x="dotMenuX"
            :anchor-y="dotMenuY"
            @set-reference="onDotMenuSetReference"
            @toggle-star="onDotMenuToggleStar"
        />
        <div ref="tooltip" class="vks-cs-track-tooltip hidden"></div>
    </div>
</template>

<script>
import VariantSifterVariantDotMenu from "./VariantSifterVariantDotMenu.vue";
import { VARIANT_SIFTER_CS_TRACK_MARGIN } from "./variantSifterAssociationsPlotConfig.js";
import {
    computeViewRegion,
    computeVisibleWindowWidth,
    panRegionShiftFromDrag,
} from "./variantSifterRegionPan.js";
import {
    canvasXToGenomicPosition,
    genomicPositionToCanvasX,
    isCanvasPointInXAxisInteractionZone,
    isVariantStarred,
} from "./variantSifterPlotMarkers.js";
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    getInternalPlotHeight,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
} from "./variantSifterPlotShared.js";
import {
    computeCredibleSetsTrackCanvasHeight,
    renderCredibleSetsTrack,
    setupCredibleSetsCanvas,
    VKS_CS_TRACK_DISPLAY_HEIGHT,
    VKS_DEFAULT_DOT_RADIUS,
} from "./variantSifterCredibleSetsRender.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";

export default {
    name: "VariantSifterCredibleSetsTrack",
    components: {
        VariantSifterVariantDotMenu,
    },
    props: {
        selectedSets: {
            type: Array,
            default: () => [],
        },
        colorBySetId: {
            type: Object,
            default: () => ({}),
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
        searchSession: {
            type: Object,
            default: null,
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
        utils: {
            type: Object,
            default: null,
        },
        recombPeakIntervals: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            dotPositions: [],
            canvasWidth: 0,
            plotWidth: 0,
            layoutCanvasHeight: 0,
            suppressClick: false,
            isPanning: false,
            panStartX: 0,
            panStartRegionShiftBp: 0,
            panMoved: false,
            dotMenuOpen: false,
            dotMenuRow: null,
            dotMenuX: 0,
            dotMenuY: 0,
            livePositionMarkerX: null,
            xAxisBandHover: false,
            dotHover: false,
        };
    },
    computed: {
        margin() {
            return normalizePlotMargin(VARIANT_SIFTER_CS_TRACK_MARGIN);
        },
        plotHeight() {
            return getInternalPlotHeight(VKS_CS_TRACK_DISPLAY_HEIGHT);
        },
        trackLayoutHeight() {
            return computeCredibleSetsTrackCanvasHeight(this.margin);
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
            return Boolean(this.visibleRegion && this.selectedSets?.length);
        },
        hasSelectedSets() {
            return Array.isArray(this.selectedSets) && this.selectedSets.length > 0;
        },
        starredVariants() {
            return this.plotMarkers?.starredVariants || [];
        },
        dotMenuVariantId() {
            return this.dotMenuRow?.["Variant ID"] || "";
        },
        dotMenuIsStarred() {
            return isVariantStarred(this.starredVariants, this.dotMenuVariantId);
        },
    },
    watch: {
        selectedSets: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        colorBySetId: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        viewRegion: {
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
    },
    mounted() {
        this.renderTrack();
        window.addEventListener("resize", this.onResize);
        document.addEventListener("mousedown", this.onDocumentMouseDown);
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            if (!this.sharedCanvasWidth) {
                this.renderTrack();
            }
        });
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("mousedown", this.onDocumentMouseDown);
        this.endPanListeners();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
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
            return true;
        },
        renderTrack() {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.hasSelectedSets || !this.visibleRegion) {
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
                this.dotPositions = [];
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
            const ctx = setupCredibleSetsCanvas(canvas, canvasWidth, canvasHeight);
            this.dotPositions = renderCredibleSetsTrack(ctx, {
                canvasWidth,
                canvasHeight,
                margin: this.margin,
                viewRegion: this.visibleRegion,
                selectedSets: this.selectedSets,
                colorBySetId: this.colorBySetId,
                plotMarkers: this.plotMarkers,
                recombPeakIntervals: this.recombPeakIntervals,
                utils: this.utils,
                starredVariants: this.starredVariants,
                xAxisBandHover: this.xAxisBandHover,
                livePositionMarkerX: this.livePositionMarkerX,
            });

            this.syncPlotMetrics();
        },
        findDotAtCanvasPoint(x, y) {
            const hitRadius = VKS_DEFAULT_DOT_RADIUS + 8;
            let bestHit = null;
            let bestDistance = hitRadius;

            this.dotPositions.forEach((dot) => {
                const distance = Math.hypot(dot.x - x, dot.y - y);
                if (distance <= bestDistance) {
                    bestHit = dot;
                    bestDistance = distance;
                }
            });

            return bestHit;
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
        setDotHover(isHovering) {
            if (this.dotHover !== isHovering) {
                this.dotHover = isHovering;
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
        closeDotMenu() {
            this.dotMenuOpen = false;
            this.dotMenuRow = null;
        },
        onDocumentMouseDown(event) {
            if (!this.dotMenuOpen) {
                return;
            }
            const menu = this.$el?.querySelector(".vks-variant-dot-menu");
            if (menu?.contains(event.target)) {
                return;
            }
            this.closeDotMenu();
        },
        openDotMenu(row, anchorX, anchorY) {
            this.dotMenuRow = row;
            this.dotMenuX = anchorX;
            this.dotMenuY = anchorY;
            this.dotMenuOpen = true;
        },
        onDotMenuSetReference() {
            const row = this.dotMenuRow;
            this.closeDotMenu();
            if (row) {
                this.$emit("set-reference-variant", row);
            }
        },
        onDotMenuToggleStar() {
            const row = this.dotMenuRow;
            this.closeDotMenu();
            if (row) {
                this.$emit("toggle-star-variant", row);
            }
        },
        onCanvasClick(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.visibleRegion) {
                return;
            }

            if (!this.syncPlotMetrics()) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.findDotAtCanvasPoint(x, y);
            if (hit) {
                this.panMoved = false;
                this.openDotMenu(hit.row, event.offsetX, event.offsetY);
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

            if (!this.isInXAxisInteractionZone(x, y)) {
                return;
            }

            const position = canvasXToGenomicPosition(
                x,
                this.canvasWidth,
                this.margin,
                this.visibleRegion
            );
            if (position == null) {
                return;
            }
            this.$emit("toggle-position-marker", position);
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
            if (this.findDotAtCanvasPoint(x, y)) {
                this.panMoved = false;
                return;
            }
            if (this.isInXAxisInteractionZone(x, y)) {
                return;
            }
            this.isPanning = true;
            this.panMoved = false;
            this.panStartX = event.clientX;
            this.panStartRegionShiftBp = this.regionShiftBp;
            this.hideTooltip();
            this.closeDotMenu();
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
            this.setDotHover(false);
            this.hideTooltip();
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
                this.setDotHover(false);
                this.hideTooltip();
                this.updateXAxisHover(x);
                return;
            }

            this.clearXAxisHover();

            const hit = this.findDotAtCanvasPoint(x, y);
            this.setDotHover(Boolean(hit));

            const tooltip = this.$refs.tooltip;
            if (!tooltip || !hit) {
                this.hideTooltip();
                return;
            }

            const row = hit.row;
            tooltip.innerHTML = [
                `<strong>${row["Variant ID"] || ""}</strong>`,
                hit.ppa != null ? `PPA: ${hit.ppa}` : null,
                row["P-Value"] != null ? `P-Value: ${row["P-Value"]}` : null,
            ]
                .filter(Boolean)
                .join("<br />");
            tooltip.classList.remove("hidden");
            const anchorX = canvas.offsetLeft + event.offsetX;
            const anchorY = canvas.offsetTop + event.offsetY;
            this.$nextTick(() => {
                positionAnchoredPopupElement(
                    tooltip,
                    anchorX,
                    anchorY,
                    this.$refs.container
                );
            });
        },
        hideTooltip() {
            const tooltip = this.$refs.tooltip;
            if (tooltip) {
                tooltip.classList.add("hidden");
            }
        },
    },
};
</script>

<style scoped>
.vks-cs-track {
    position: relative;
    width: 100%;
    z-index: 3;
    isolation: isolate;
}

.vks-cs-track-canvas-wrap {
    position: relative;
}

.vks-cs-track-canvas {
    display: block;
    width: 100%;
    pointer-events: auto;
}

.vks-cs-track-canvas.is-pannable {
    cursor: grab;
    user-select: none;
}

.vks-cs-track-canvas.is-x-axis-hover {
    cursor: crosshair;
}

.vks-cs-track-canvas.is-dot-hover {
    cursor: default;
}

.vks-cs-track-canvas.is-pannable:active {
    cursor: grabbing;
}

.vks-cs-track-tooltip {
    position: absolute;
    z-index: 5;
    padding: 6px 8px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    background: #ffffff;
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.vks-cs-track-tooltip.hidden {
    display: none;
}
</style>
