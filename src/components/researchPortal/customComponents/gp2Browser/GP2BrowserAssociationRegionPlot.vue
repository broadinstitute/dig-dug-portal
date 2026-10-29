<template>
    <div ref="container" class="vks-association-region-plot">
        <div v-if="showLegend" class="vks-association-region-plot-legend">
            <span class="vks-legend-item">
                <span class="plot-legend-diamond" aria-hidden="true"></span>
                <span>Reference variant</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #82409950"></span>
                <span>r2 == 1</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #d0363350"></span>
                <span>1 &gt; r2 &gt;= 0.8</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #ee982d50"></span>
                <span>0.8 &gt; r2 &gt;= 0.6</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #4db05250"></span>
                <span>0.6 &gt; r2 &gt;= 0.4</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #32afd550"></span>
                <span>0.4 &gt; r2 &gt;= 0.2</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #2074b650"></span>
                <span>0.2 &gt; r2 &gt; 0</span>
            </span>
            <span class="vks-legend-item">
                <span class="plot-legend-dot" style="background-color: #33333320"></span>
                <span>No data</span>
            </span>
        </div>
        <div ref="canvasWrap" class="vks-association-region-plot-canvas-wrap">
            <canvas
                ref="canvas"
                class="vks-association-region-plot-canvas"
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
            <div
                v-if="showViewRegionHandle && viewRegionHandleStyle"
                class="gp2-view-region-handle"
                :class="{
                    'is-dragging': isDraggingViewHandle,
                    'is-hovered': isHoveringViewHandle,
                }"
                :style="viewRegionHandleStyle"
                role="slider"
                tabindex="0"
                :aria-label="`Viewing region (${viewingRegionWidthLabel}) handle — drag to move viewing region`"
                :title="viewRegionHandleTitle"
                @mouseenter="isHoveringViewHandle = true"
                @mouseleave="isHoveringViewHandle = false"
                @mousedown.stop.prevent="onViewHandleMouseDown"
                @keydown="onViewHandleKeyDown"
            >
                <div class="gp2-view-region-handle-bracket" aria-hidden="true">
                    <span class="gp2-view-region-handle-edge gp2-view-region-handle-edge--left"></span>
                    <span class="gp2-view-region-handle-bar"></span>
                    <span class="gp2-view-region-handle-edge gp2-view-region-handle-edge--right"></span>
                </div>
            </div>
            <div
                v-if="showViewRegionBridge && viewRegionConnectorStyle"
                class="gp2-view-region-connector"
                :class="{
                    'is-active': isHoveringViewHandle || isDraggingViewHandle,
                }"
                :style="viewRegionConnectorStyle"
                aria-hidden="true"
            ></div>
            <div
                v-if="showViewRegionBridge && viewRegionBridgeStyle"
                class="gp2-view-region-bridge"
                :class="{
                    'is-active': isHoveringViewHandle || isDraggingViewHandle,
                }"
                :style="viewRegionBridgeStyle"
                aria-hidden="true"
            >
                <span class="gp2-view-region-bridge-top"></span>
                <span class="gp2-view-region-bridge-edge gp2-view-region-bridge-edge--left"></span>
                <span class="gp2-view-region-bridge-edge gp2-view-region-bridge-edge--right"></span>
                <span
                    v-for="mark in bridgeExonMarks"
                    :key="mark.key"
                    class="gp2-view-region-bridge-exon"
                    :style="{ left: `${mark.left}%`, width: `${mark.width}%`, backgroundColor: mark.color }"
                ></span>
            </div>
        </div>
        <div
            v-if="showViewRegionBridge && bridgeViewGenes.length"
            class="gp2-view-region-bridge-genes"
            aria-label="Genes overlapping the viewing region"
        >
            <span
                v-for="gene in bridgeViewGenes"
                :key="gene.name"
                class="gp2-view-region-bridge-gene"
                :style="{ color: gene.color }"
            >
                {{ gene.name }}
            </span>
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
        <div
            ref="tooltip"
            class="vks-association-region-plot-tooltip hidden"
        ></div>
        <p v-if="loading" class="vks-association-region-plot-status">
            Loading plot overlays…
        </p>
        <p v-if="error" class="vks-association-region-plot-error" role="alert">
            {{ error }}
        </p>
    </div>
</template>

<script>
import { pickLeadVariantRow, rowToLdVariant } from "./gp2BrowserLdServer.js";
import {
    canvasXToGenomicPosition,
    genomicPositionToCanvasX,
    isCanvasPointInXAxisInteractionZone,
    isVariantStarred,
    renderLivePositionGuideline,
    renderPlotMarkerLines,
    renderStarDot,
    renderXAxisBandHoverHighlight,
} from "../kpVariantSifter/variantSifterPlotMarkers.js";
import VariantSifterVariantDotMenu from "../kpVariantSifter/VariantSifterVariantDotMenu.vue";
import {
    computeViewRegion,
    computeVisibleWindowWidth,
    resolveHandPanFromDrag,
} from "../kpVariantSifter/variantSifterRegionPan.js";
import {
    VKS_PLOT_DISPLAY_HEIGHT,
    attachPlotResizeObserver,
    canvasPointerPosition,
    computeNegLog10Extents,
    getLdDotColor,
    getInternalPlotHeight,
    measureAssociationCanvasWidth,
    normalizePlotMargin,
    renderDiamond,
    renderTrackHighlightBands,
    renderPlotAxis,
    renderPlotDot,
    renderRecombinationLine,
    resolveRowLdScore,
    setupPlotCanvas,
    VKS_DEFAULT_DOT_RADIUS,
    VKS_LD_REFERENCE_COLOR,
} from "../kpVariantSifter/variantSifterPlotShared.js";
import { positionAnchoredPopupElement } from "../kpVariantSifter/variantSifterPopupPosition.js";
import {
    GP2_VIEWING_REGION_HALF_BP,
    clampViewingCenterBp,
} from "./gp2BrowserViewingRegion.js";
import {
    computeBridgeExonMarks,
    filterGenesOverlappingRegion,
    renderCompactSearchingPlotAxis,
} from "./gp2BrowserRegionPlotAxis.js";

export default {
    name: "GP2BrowserAssociationRegionPlot",
    components: {
        VariantSifterVariantDotMenu,
    },
    props: {
        plotRows: {
            type: Array,
            default: () => [],
        },
        showLegend: {
            type: Boolean,
            default: true,
        },
        displayHeight: {
            type: Number,
            default: VKS_PLOT_DISPLAY_HEIGHT,
        },
        panMode: {
            type: String,
            default: "searching",
        },
        highlightViewRegion: {
            type: Object,
            default: null,
        },
        showViewRegionHandle: {
            type: Boolean,
            default: false,
        },
        showViewRegionBridge: {
            type: Boolean,
            default: false,
        },
        bridgeGenes: {
            type: Array,
            default: () => [],
        },
        viewingCenterBp: {
            type: Number,
            default: null,
        },
        viewingRegionHalfWidthBp: {
            type: Number,
            default: null,
        },
        region: {
            type: Object,
            default: null,
        },
        searchSession: {
            type: Object,
            default: null,
        },
        plotMargin: {
            type: Object,
            default: null,
        },
        sharedCanvasWidth: {
            type: Number,
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
            loading: false,
            error: null,
            recombData: null,
            ldScoreMap: new Map(),
            refVariant: null,
            dotPositions: [],
            canvasWidth: 0,
            canvasHeight: 0,
            plotWidth: 0,
            containerClientWidth: 0,
            isPanning: false,
            panStartX: 0,
            panStartRegionShiftBp: 0,
            panStartRegionViewArea: 0,
            panStartViewingCenterBp: null,
            panDidChangeShift: false,
            panMoved: false,
            isDraggingViewHandle: false,
            isHoveringViewHandle: false,
            handleDragStartX: 0,
            handleDragStartCenterBp: null,
            handleDidMove: false,
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
        isCompactPlot() {
            return Number(this.displayHeight) > 0 && Number(this.displayHeight) <= 36;
        },
        effectiveHalfWidthBp() {
            return Number(this.viewingRegionHalfWidthBp) || GP2_VIEWING_REGION_HALF_BP;
        },
        activeRefVariant() {
            return this.plotOverlaysState?.refVariant || this.refVariant;
        },
        starredVariants() {
            return this.plotMarkers?.starredVariants || [];
        },
        positionMarkers() {
            return this.plotMarkers?.positionMarkers || [];
        },
        dotMenuVariantId() {
            return this.dotMenuRow?.["Variant ID"] || "";
        },
        dotMenuIsStarred() {
            return isVariantStarred(this.starredVariants, this.dotMenuVariantId);
        },
        margin() {
            const base = normalizePlotMargin(this.plotMargin);
            if (this.isCompactPlot) {
                return {
                    ...base,
                    top: 20,
                    bottom: 132,
                };
            }
            return base;
        },
        plotHeight() {
            return getInternalPlotHeight(this.displayHeight || VKS_PLOT_DISPLAY_HEIGHT);
        },
        yExtents() {
            return computeNegLog10Extents(this.plotRows);
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
            return Boolean(this.region && this.plotRows?.length);
        },
        viewingRegionWidthLabel() {
            const widthBp = this.effectiveHalfWidthBp * 2;
            if (!Number.isFinite(widthBp) || widthBp <= 0) {
                return "50 kb";
            }
            return `${Math.round(widthBp / 1000)} kb`;
        },
        viewRegionHandleTitle() {
            if (!this.highlightViewRegion) {
                return `Viewing region (${this.viewingRegionWidthLabel}) — drag to move`;
            }
            const { chr, start, end } = this.highlightViewRegion;
            return `Viewing region: ${chr}:${ Number(start).toLocaleString() }-${ Number(end).toLocaleString() } (${this.viewingRegionWidthLabel}) — drag to move`;
        },
        viewRegionHandleBox() {
            if (
                !this.highlightViewRegion ||
                !this.visibleRegion ||
                !this.canvasWidth ||
                !this.plotWidth
            ) {
                return null;
            }
            const xMin = Number(this.visibleRegion.start);
            const xMax = Number(this.visibleRegion.end);
            const span = xMax - xMin;
            if (!Number.isFinite(span) || span <= 0) {
                return null;
            }
            const startBp = Math.max(xMin, Number(this.highlightViewRegion.start));
            const endBp = Math.min(xMax, Number(this.highlightViewRegion.end));
            if (endBp <= startBp) {
                return null;
            }

            const margin = this.margin;
            const bump = margin.bump ?? 11;
            const xPosByPixel = this.plotWidth / span;
            const internalX1 = margin.left + (startBp - xMin) * xPosByPixel;
            const internalX2 = margin.left + (endBp - xMin) * xPosByPixel;
            const internalWidth = Math.max(12, internalX2 - internalX1);

            const leftPct = (internalX1 / this.canvasWidth) * 100;
            const widthPct = (internalWidth / this.canvasWidth) * 100;
            const topCssPx = (margin.top + this.plotHeight + bump * 4 + 10) / 2;

            return { leftPct, widthPct, topCssPx };
        },
        viewRegionHandleStyle() {
            if (!this.showViewRegionHandle || !this.viewRegionHandleBox) {
                return null;
            }
            const { leftPct, widthPct, topCssPx } = this.viewRegionHandleBox;
            return {
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                top: `${topCssPx}px`,
            };
        },
        viewRegionBridgeStyle() {
            if (
                !this.showViewRegionBridge ||
                !this.canvasWidth ||
                !this.plotWidth
            ) {
                return null;
            }
            const margin = this.margin;
            const leftPct = (margin.left / this.canvasWidth) * 100;
            const widthPct = (this.plotWidth / this.canvasWidth) * 100;
            return {
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                bottom: `0px`,
            };
        },
        viewRegionConnectorStyle() {
            if (
                !this.showViewRegionBridge ||
                !this.viewRegionHandleBox ||
                !this.canvasHeight
            ) {
                return null;
            }
            const { leftPct, widthPct, topCssPx } = this.viewRegionHandleBox;
            const handleBracketHeight = 12;
            const bridgeHeight = 11;
            const connectorTop = topCssPx + handleBracketHeight;
            const connectorBottomGap = bridgeHeight;
            if (connectorTop >= this.canvasHeight - connectorBottomGap) {
                return null;
            }
            return {
                left: `${leftPct + widthPct / 2}%`,
                top: `${connectorTop}px`,
                bottom: `${connectorBottomGap}px`,
            };
        },
        bridgeExonMarks() {
            return computeBridgeExonMarks(this.bridgeGenes, this.highlightViewRegion);
        },
        bridgeViewGenes() {
            return filterGenesOverlappingRegion(this.bridgeGenes, this.highlightViewRegion);
        },
    },
    watch: {
        plotRows: {
            handler() {
                this.refreshPlot();
            },
            deep: true,
        },
        displayHeight() {
            this.renderPlot();
        },
        highlightViewRegion: {
            handler() {
                this.renderPlot();
            },
            deep: true,
        },
        region: {
            handler() {
                this.refreshPlot();
            },
            deep: true,
        },
        searchSession: {
            handler() {
                this.refreshPlot();
            },
            deep: true,
        },
        regionZoom() {
            this.renderPlot();
        },
        regionShiftBp() {
            this.renderPlot();
        },
        regionViewArea() {
            this.renderPlot();
        },
        viewRegion: {
            handler() {
                this.renderPlot();
            },
            deep: true,
        },
        sharedCanvasWidth() {
            this.renderPlot();
        },
        recombPeakIntervals: {
            handler() {
                this.renderPlot();
            },
            deep: true,
        },
        plotOverlaysState: {
            handler() {
                this.refreshPlot();
            },
            deep: true,
        },
        plotMarkers: {
            handler() {
                this.renderPlot();
            },
            deep: true,
        },
    },
    mounted() {
        this.refreshPlot();
        window.addEventListener("resize", this.onResize);
        document.addEventListener("mousedown", this.onDocumentMouseDown);
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            if (this.plotRows?.length && !this.loading) {
                this.renderPlot();
            }
        });
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("mousedown", this.onDocumentMouseDown);
        this.endPanListeners();
        this.endViewHandleListeners();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        async refreshPlot() {
            if (!this.plotRows?.length || !this.region) {
                this.clearCanvas();
                return;
            }

            if (this.plotOverlaysState?.ready) {
                this.applySnapshotOverlays();
                return;
            }

            this.renderWithAvailableOverlays();
        },
        renderWithAvailableOverlays() {
            this.loading = false;
            this.error = this.plotOverlaysState?.error || null;
            this.recombData = this.plotOverlaysState?.recombData || null;
            this.ldScoreMap = new Map();
            const leadRow = pickLeadVariantRow(this.plotRows);
            this.refVariant =
                this.plotOverlaysState?.refVariant || rowToLdVariant(leadRow);
            this.$nextTick(() => {
                this.renderPlot();
            });
        },
        applySnapshotOverlays() {
            this.loading = false;
            this.error = this.plotOverlaysState.error || null;
            this.recombData = this.plotOverlaysState.recombData;
            this.ldScoreMap = new Map();
            const leadRow = pickLeadVariantRow(this.plotRows);
            this.refVariant =
                this.plotOverlaysState.refVariant || rowToLdVariant(leadRow);
            this.$nextTick(() => {
                this.renderPlot();
            });
        },
        onResize() {
            this.renderPlot();
        },
        clearCanvas() {
            const canvas = this.$refs.canvas;
            if (!canvas) {
                return;
            }
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.dotPositions = [];
        },
        renderPlot() {
            const canvas = this.$refs.canvas;
            const container = this.$refs.container;
            if (!canvas || !container || !this.plotRows?.length || !this.region) {
                return;
            }

            const margin = this.margin;
            const canvasWidth =
                this.sharedCanvasWidth ?? measureAssociationCanvasWidth(container);
            if (!canvasWidth) {
                return;
            }
            const plotWidth = canvasWidth - margin.left * 2;
            const plotHeight = this.plotHeight;
            const canvasHeight = plotHeight + margin.top + margin.bottom;
            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);

            const { yMin, yMax } = this.yExtents;
            const visibleRegion = this.visibleRegion || this.region;
            const xMin = visibleRegion.start;
            const xMax = visibleRegion.end;
            const xPosByPixel = plotWidth / (xMax - xMin || 1);
            const yPosByPixel = plotHeight / (yMax - yMin || 1);
            const xStart = margin.left;
            const yStart = margin.top + plotHeight;

            if (this.isCompactPlot) {
                renderCompactSearchingPlotAxis(ctx, {
                    margin,
                    plotWidth,
                    plotHeight,
                    yMin,
                    yMax,
                    xMin,
                    xMax,
                    utils: this.utils,
                });
            } else {
                renderPlotAxis(ctx, {
                    margin,
                    plotWidth,
                    plotHeight,
                    yMin,
                    yMax,
                    xMin,
                    xMax,
                    type: "asso",
                    utils: this.utils,
                    yAxisLabel: "-log10(p-value)",
                    xAxisLabel: "",
                });
            }

            renderTrackHighlightBands(ctx, {
                intervals: this.recombPeakIntervals,
                visibleRegion,
                margin,
                plotWidth,
                plotHeight,
            });

            renderRecombinationLine(
                ctx,
                margin,
                plotWidth,
                plotHeight,
                visibleRegion,
                this.recombData
            );

            const dotRadius = this.isCompactPlot ? 6 : VKS_DEFAULT_DOT_RADIUS;
            this.dotPositions = [];
            this.plotRows.forEach((row) => {
                const position = row.Position;
                const negLog10 = row["-log10(P-Value)"];
                if (
                    position == null ||
                    negLog10 == null ||
                    Number.isNaN(negLog10) ||
                    position < xMin ||
                    position > xMax
                ) {
                    return;
                }

                const xPos = xStart + (position - xMin) * xPosByPixel;
                const yPos = yStart - (negLog10 - yMin) * yPosByPixel;
                const ldScore = resolveRowLdScore(row, this.ldScoreMap);
                const dotColor = getLdDotColor(ldScore);
                const variantId = row["Variant ID"];
                const isRef = variantId === this.activeRefVariant;
                const isStarred = isVariantStarred(this.starredVariants, variantId);

                this.dotPositions.push({
                    x: xPos,
                    y: yPos,
                    row,
                    ldScore,
                });

                if (isRef) {
                    renderDiamond(ctx, xPos, yPos, VKS_LD_REFERENCE_COLOR);
                } else if (isStarred) {
                    renderStarDot(ctx, xPos, yPos, dotColor);
                } else {
                    renderPlotDot(ctx, xPos, yPos, dotColor, dotRadius);
                }
            });

            renderPlotMarkerLines(ctx, {
                starredVariants: this.starredVariants,
                positionMarkers: this.positionMarkers,
                visibleRegion,
                margin,
                plotWidth,
                plotHeight,
                canvasHeight,
            });

            if (this.xAxisBandHover && this.livePositionMarkerX != null) {
                renderXAxisBandHoverHighlight(ctx, {
                    margin,
                    plotWidth,
                    plotHeight,
                    canvasHeight,
                });
                renderLivePositionGuideline(ctx, this.livePositionMarkerX, {
                    margin,
                    plotHeight,
                });
            }

            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.plotWidth = plotWidth;
            this.containerClientWidth = container.clientWidth || 0;
        },
        onViewHandleMouseDown(event) {
            if (event.button !== 0 || !this.visibleRegion) {
                return;
            }
            this.isDraggingViewHandle = true;
            this.handleDragStartX = event.clientX;
            const currentCenter =
                this.viewingCenterBp != null
                    ? this.viewingCenterBp
                    : this.highlightViewRegion
                    ? Math.round(
                          (Number(this.highlightViewRegion.start) +
                              Number(this.highlightViewRegion.end)) /
                              2
                      )
                    : Math.round(
                          (Number(this.visibleRegion.start) +
                              Number(this.visibleRegion.end)) /
                              2
                      );
            this.handleDragStartCenterBp = currentCenter;
            this.handleDidMove = false;
            this.hideTooltip();
            this.closeDotMenu();
            document.addEventListener("mousemove", this.onViewHandleMouseMove);
            document.addEventListener("mouseup", this.onViewHandleMouseUp);
        },
        onViewHandleMouseMove(event) {
            if (!this.isDraggingViewHandle || !this.visibleRegion) {
                return;
            }
            const canvas = this.$refs.canvas;
            const rect = canvas?.getBoundingClientRect();
            if (!rect || !rect.width || !this.canvasWidth || !this.plotWidth) {
                return;
            }
            const deltaClientX = event.clientX - this.handleDragStartX;
            const cssPlotWidth = (this.plotWidth / this.canvasWidth) * rect.width;
            if (cssPlotWidth <= 0) {
                return;
            }
            const searchSpanBp =
                Number(this.visibleRegion.end) - Number(this.visibleRegion.start);
            const deltaBp = Math.round((deltaClientX / cssPlotWidth) * searchSpanBp);
            const nextCenter = clampViewingCenterBp(
                this.handleDragStartCenterBp + deltaBp,
                this.visibleRegion,
                this.effectiveHalfWidthBp
            );
            if (nextCenter != null && nextCenter !== this.viewingCenterBp) {
                this.handleDidMove = true;
                this.$emit("update:viewingCenterBp", nextCenter);
            }
        },
        onViewHandleMouseUp() {
            if (!this.isDraggingViewHandle) {
                return;
            }
            const didMove = this.handleDidMove;
            this.isDraggingViewHandle = false;
            this.handleDidMove = false;
            this.endViewHandleListeners();
            if (didMove) {
                this.$emit("commit-viewing-region");
            }
        },
        endViewHandleListeners() {
            document.removeEventListener("mousemove", this.onViewHandleMouseMove);
            document.removeEventListener("mouseup", this.onViewHandleMouseUp);
        },
        onViewHandleKeyDown(event) {
            if (!this.visibleRegion) {
                return;
            }
            let stepBp = 0;
            if (event.key === "ArrowLeft") {
                stepBp = -5000;
            } else if (event.key === "ArrowRight") {
                stepBp = 5000;
            } else {
                return;
            }
            event.preventDefault();
            const baseCenter =
                this.viewingCenterBp ??
                Math.round(
                    (Number(this.visibleRegion.start) +
                        Number(this.visibleRegion.end)) /
                        2
                );
            const nextCenter = clampViewingCenterBp(
                baseCenter + stepBp,
                this.visibleRegion,
                this.effectiveHalfWidthBp
            );
            if (nextCenter != null && nextCenter !== this.viewingCenterBp) {
                this.$emit("update:viewingCenterBp", nextCenter);
                this.$emit("commit-viewing-region");
            }
        },
        isInXAxisInteractionZone(x, y, canvasWidth, canvasHeight) {
            return isCanvasPointInXAxisInteractionZone(
                x,
                y,
                canvasWidth,
                canvasHeight,
                this.margin,
                this.plotHeight
            );
        },
        clearXAxisHover() {
            const hadHover = this.xAxisBandHover || this.livePositionMarkerX != null;
            this.xAxisBandHover = false;
            this.livePositionMarkerX = null;
            if (hadHover) {
                this.renderPlot();
            }
        },
        setDotHover(isHovering) {
            if (this.dotHover !== isHovering) {
                this.dotHover = isHovering;
            }
        },
        updateXAxisHover(x, canvasWidth) {
            const visibleRegion = this.visibleRegion || this.region;
            const position = canvasXToGenomicPosition(
                x,
                canvasWidth,
                this.margin,
                visibleRegion
            );
            if (position == null) {
                this.clearXAxisHover();
                return;
            }
            const nextX = genomicPositionToCanvasX(
                position,
                visibleRegion,
                this.margin,
                this.plotWidth || canvasWidth - this.margin.left * 2
            );
            if (this.livePositionMarkerX === nextX && this.xAxisBandHover) {
                return;
            }
            this.xAxisBandHover = true;
            this.livePositionMarkerX = nextX;
            this.renderPlot();
        },
        findDotAtCanvasPoint(x, y) {
            const hitRadius = (this.isCompactPlot ? 6 : VKS_DEFAULT_DOT_RADIUS) + 4;
            return this.dotPositions.find(
                (dot) => Math.hypot(dot.x - x, dot.y - y) <= hitRadius
            );
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
        onCanvasClick(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.region) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.findDotAtCanvasPoint(x, y);
            if (hit) {
                this.panMoved = false;
                this.openDotMenu(hit.row, event.offsetX, event.offsetY);
                return;
            }

            if (this.panMoved) {
                return;
            }

            const margin = this.margin;
            const canvasHeight = this.plotHeight + margin.top + margin.bottom;
            if (!this.isInXAxisInteractionZone(x, y, this.canvasWidth, canvasHeight)) {
                return;
            }

            const visibleRegion = this.visibleRegion || this.region;
            const position = canvasXToGenomicPosition(
                x,
                this.canvasWidth,
                margin,
                visibleRegion
            );
            if (position == null) {
                return;
            }
            this.$emit("toggle-position-marker", position);
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
        onMouseDown(event) {
            if (!this.canPan || event.button !== 0) {
                return;
            }
            const canvas = this.$refs.canvas;
            if (canvas) {
                const { x, y } = canvasPointerPosition(event, canvas);
                if (this.findDotAtCanvasPoint(x, y)) {
                    this.panMoved = false;
                    return;
                }
                const margin = this.margin;
                const canvasHeight = this.plotHeight + margin.top + margin.bottom;
                if (this.isInXAxisInteractionZone(x, y, this.canvasWidth, canvasHeight)) {
                    return;
                }
            }
            this.isPanning = true;
            this.panMoved = false;
            this.panDidChangeShift = false;
            this.panStartX = event.clientX;
            this.panStartRegionShiftBp = this.regionShiftBp;
            this.panStartRegionViewArea = this.regionViewArea;
            this.panStartViewingCenterBp =
                this.viewingCenterBp != null
                    ? this.viewingCenterBp
                    : this.visibleRegion
                    ? Math.round(
                          (Number(this.visibleRegion.start) +
                              Number(this.visibleRegion.end)) /
                              2
                      )
                    : null;
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
            if (this.panMode === "viewing" && this.region) {
                const cssPlotWidth = (this.plotWidth || 1) / 2;
                const deltaBp = -Math.round(
                    (deltaX / cssPlotWidth) * this.visibleWidthBp
                );
                const nextCenter = clampViewingCenterBp(
                    (this.panStartViewingCenterBp || 0) + deltaBp,
                    this.region,
                    this.effectiveHalfWidthBp
                );
                if (nextCenter != null && nextCenter !== this.viewingCenterBp) {
                    this.panDidChangeShift = true;
                    this.$emit("update:viewingCenterBp", nextCenter);
                }
                return;
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
                if (pan.regionViewArea !== this.regionViewArea) {
                    this.panDidChangeShift = true;
                }
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
            const didChangeShift = this.panDidChangeShift;
            this.isPanning = false;
            this.panMoved = false;
            this.panDidChangeShift = false;
            this.endPanListeners();
            if (didChangeShift) {
                if (this.panMode === "viewing") {
                    this.$emit("commit-viewing-region");
                } else {
                    this.$emit("pan-end");
                }
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
            if (event.relatedTarget && this.$refs.container?.contains(event.relatedTarget)) {
                return;
            }
            this.clearXAxisHover();
            this.setDotHover(false);
            this.hideTooltip();
        },
        onMouseMove(event) {
            if (this.isPanning || this.isDraggingViewHandle) {
                return;
            }
            const canvas = this.$refs.canvas;
            if (!canvas || !this.region) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const margin = this.margin;
            const canvasWidth =
                this.canvasWidth ||
                this.sharedCanvasWidth ||
                measureAssociationCanvasWidth(this.$refs.container);
            const canvasHeight = this.plotHeight + margin.top + margin.bottom;

            if (this.isInXAxisInteractionZone(x, y, canvasWidth, canvasHeight)) {
                this.setDotHover(false);
                this.hideTooltip();
                this.updateXAxisHover(x, canvasWidth);
                return;
            }

            this.clearXAxisHover();

            const hit = this.findDotAtCanvasPoint(x, y);
            this.setDotHover(Boolean(hit));

            const tooltip = this.$refs.tooltip;
            if (!tooltip || !this.dotPositions.length || !hit) {
                if (!hit) {
                    this.hideTooltip();
                }
                return;
            }

            const row = hit.row;
            tooltip.innerHTML = [
                `<strong>${row["Variant ID"] || ""}</strong>`,
                `P-Value: ${row["P-Value"] ?? ""}`,
                `Beta: ${row.Beta ?? ""}`,
                `Z Score: ${row["Z Score"] ?? ""}`,
                hit.ldScore != null ? `LD r²: ${hit.ldScore.toFixed(3)}` : null,
            ]
                .filter(Boolean)
                .join("<br />");
            tooltip.classList.remove("hidden");
            this.$nextTick(() => {
                positionAnchoredPopupElement(
                    tooltip,
                    event.offsetX,
                    event.offsetY,
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
.vks-association-region-plot {
    position: relative;
}

.vks-association-region-plot-canvas-wrap {
    position: relative;
}

.vks-association-region-plot-legend {
    text-align: left;
    padding: 4px 6px 14px;
    font-size: 12px;
    color: #333333;
}

.vks-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 20px;
}

.vks-legend-item:last-child {
    margin-right: 0;
}

.plot-legend-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 0;
    flex-shrink: 0;
    vertical-align: middle;
}

.plot-legend-diamond {
    display: inline-block;
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    vertical-align: middle;
    background-color: #824099;
    transform: rotate(45deg);
}

.vks-association-region-plot-canvas {
    display: block;
    width: 100%;
}

.vks-association-region-plot-canvas.is-pannable {
    cursor: grab;
    user-select: none;
}

.vks-association-region-plot-canvas.is-x-axis-hover {
    cursor: crosshair;
}

.vks-association-region-plot-canvas.is-dot-hover {
    cursor: default;
}

.vks-association-region-plot-canvas.is-pannable:active {
    cursor: grabbing;
}

.gp2-view-region-handle {
    position: absolute;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    cursor: grab;
    user-select: none;
}

.gp2-view-region-handle.is-dragging {
    cursor: grabbing;
}

.gp2-view-region-handle-bracket {
    position: relative;
    width: 100%;
    height: 12px;
    pointer-events: none;
}

.gp2-view-region-handle-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 5px;
    background: rgba(59, 115, 185, 0.5);
    transition: background-color 120ms ease;
    pointer-events: none;
}

.gp2-view-region-handle-edge {
    position: absolute;
    bottom: 0;
    width: 0.5px;
    height: 11px;
    background: rgba(59, 115, 185, 0.5);
    transition: background-color 120ms ease;
    pointer-events: none;
}

.gp2-view-region-handle-edge--left {
    left: 0;
}

.gp2-view-region-handle-edge--right {
    right: 0;
}

.gp2-view-region-handle:hover .gp2-view-region-handle-bar,
.gp2-view-region-handle:hover .gp2-view-region-handle-edge,
.gp2-view-region-handle.is-dragging .gp2-view-region-handle-bar,
.gp2-view-region-handle.is-dragging .gp2-view-region-handle-edge {
    background: #3b73b9;
}

.gp2-view-region-connector {
    position: absolute;
    z-index: 3;
    width: 0.5px;
    background: rgba(59, 115, 185, 0.5);
    transition: background-color 120ms ease;
    pointer-events: none;
    transform: translateX(-50%);
}

.gp2-view-region-connector.is-active {
    background: #3b73b9;
}

.gp2-view-region-bridge {
    position: absolute;
    z-index: 3;
    height: 11px;
    pointer-events: none;
}

.gp2-view-region-bridge-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0.5px;
    background: rgba(59, 115, 185, 0.5);
    transition: background-color 120ms ease;
}

.gp2-view-region-bridge-edge {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0.5px;
    background: rgba(59, 115, 185, 0.5);
    transition: background-color 120ms ease;
}

.gp2-view-region-bridge-edge--left {
    left: 0;
}

.gp2-view-region-bridge-edge--right {
    right: 0;
}

.gp2-view-region-bridge.is-active .gp2-view-region-bridge-top,
.gp2-view-region-bridge.is-active .gp2-view-region-bridge-edge {
    background: #3b73b9;
}

.gp2-view-region-bridge-exon {
    position: absolute;
    top: 0;
    height: 4px;
    border-radius: 1px;
    opacity: 0.85;
    pointer-events: none;
}

.gp2-view-region-bridge-genes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px 8px;
    margin: 2px 0 0;
    text-align: center;
}

.gp2-view-region-bridge-gene {
    font-size: 11px;
    font-weight: 700;
    font-style: italic;
    line-height: 1.25;
    white-space: nowrap;
}

.vks-association-region-plot-tooltip {
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

.vks-association-region-plot-tooltip.hidden {
    display: none;
}

.vks-association-region-plot-status,
.vks-association-region-plot-error {
    margin: 0;
    padding: 8px 0;
    font-size: 12px;
    text-align: center;
}

.vks-association-region-plot-error {
    color: #b42318;
}
</style>
