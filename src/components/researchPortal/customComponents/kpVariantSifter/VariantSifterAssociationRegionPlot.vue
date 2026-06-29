<template>
    <div ref="container" class="vks-association-region-plot">
        <div class="vks-association-region-plot-legend">
            <span class="plot-legend-dot" style="background-color: #824099cc"></span>
            <span>Reference variant</span>
            <span class="plot-legend-dot" style="background-color: #d0363360"></span>
            <span>1 &gt; r2 &gt;= 0.8</span>
            <span class="plot-legend-dot" style="background-color: #ee982d50"></span>
            <span>0.8 &gt; r2 &gt;= 0.6</span>
            <span class="plot-legend-dot" style="background-color: #4db05240"></span>
            <span>0.6 &gt; r2 &gt;= 0.4</span>
            <span class="plot-legend-dot" style="background-color: #32afd530"></span>
            <span>0.4 &gt; r2 &gt;= 0.2</span>
            <span class="plot-legend-dot" style="background-color: #2074b620"></span>
            <span>0.2 &gt; r2 &gt; 0</span>
            <span class="plot-legend-dot" style="background-color: #33333320"></span>
            <span>No data</span>
        </div>
        <canvas
            ref="canvas"
            class="vks-association-region-plot-canvas"
            :class="{ 'is-pannable': canPan }"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseout="onMouseOut"
            @mouseup="onMouseUp"
        ></canvas>
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
import { fetchLdScoreMap, pickLeadVariantRow, rowToLdVariant } from "./variantSifterLdServer.js";
import {
    computeVisibleRegion,
    panRegionViewAreaFromDrag,
} from "./variantSifterRegionZoom.js";
import {
    VKS_PLOT_DISPLAY_HEIGHT,
    attachPlotResizeObserver,
    canvasPointerPosition,
    computeNegLog10Extents,
    fetchRecombinationRate,
    getLdDotColor,
    getInternalPlotHeight,
    measureAssociationCanvasWidth,
    normalizePlotMargin,
    renderDiamond,
    renderPlotAxis,
    renderPlotDot,
    renderRecombinationLine,
    resolveRowLdScore,
    setupPlotCanvas,
    VKS_DEFAULT_DOT_RADIUS,
} from "./variantSifterPlotShared.js";

export default {
    name: "VariantSifterAssociationRegionPlot",
    props: {
        plotRows: {
            type: Array,
            default: () => [],
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
        regionZoom: {
            type: Number,
            default: 0,
        },
        regionViewArea: {
            type: Number,
            default: 0,
        },
        utils: {
            type: Object,
            default: null,
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
            plotWidth: 0,
            isPanning: false,
            panStartX: 0,
            panStartViewArea: 0,
        };
    },
    computed: {
        margin() {
            return normalizePlotMargin(this.plotMargin);
        },
        plotHeight() {
            return getInternalPlotHeight(VKS_PLOT_DISPLAY_HEIGHT);
        },
        yExtents() {
            return computeNegLog10Extents(this.plotRows);
        },
        visibleRegion() {
            return computeVisibleRegion(
                this.region,
                this.regionZoom,
                this.regionViewArea
            );
        },
        canPan() {
            return this.regionZoom > 0;
        },
    },
    watch: {
        plotRows: {
            handler() {
                this.refreshPlot();
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
        regionViewArea() {
            this.renderPlot();
        },
    },
    mounted() {
        this.refreshPlot();
        window.addEventListener("resize", this.onResize);
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            if (this.plotRows?.length && !this.loading) {
                this.renderPlot();
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
        async refreshPlot() {
            if (!this.plotRows?.length || !this.region) {
                this.clearCanvas();
                return;
            }

            this.loading = true;
            this.error = null;

            try {
                const recombData = await fetchRecombinationRate(this.region);
                this.recombData = recombData;

                const rowsMissingLd = this.plotRows.some(
                    (row) => row.LDS == null || Number.isNaN(row.LDS)
                );
                if (rowsMissingLd) {
                    const ldResult = await fetchLdScoreMap(
                        this.plotRows,
                        this.searchSession
                    );
                    this.ldScoreMap = ldResult.scoreMap;
                    this.refVariant = ldResult.refVariant;
                } else {
                    this.ldScoreMap = new Map();
                    const leadRow = pickLeadVariantRow(this.plotRows);
                    this.refVariant = rowToLdVariant(leadRow);
                }
            } catch (error) {
                this.error = error?.message || "Failed to load plot overlays.";
                this.recombData = null;
                this.ldScoreMap = new Map();
                this.refVariant = null;
            } finally {
                this.loading = false;
                this.$nextTick(() => {
                    this.renderPlot();
                });
            }
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
            const canvasWidth = measureAssociationCanvasWidth(container);
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
                xAxisLabel: "Chromosome",
            });

            renderRecombinationLine(
                ctx,
                margin,
                plotWidth,
                plotHeight,
                visibleRegion,
                this.recombData
            );

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
                const isRef = variantId === this.refVariant;

                this.dotPositions.push({
                    x: xPos,
                    y: yPos,
                    row,
                    ldScore,
                });

                if (isRef) {
                    renderDiamond(ctx, xPos, yPos, dotColor);
                } else {
                    renderPlotDot(ctx, xPos, yPos, dotColor);
                }
            });

            this.canvasWidth = canvasWidth;
            this.plotWidth = plotWidth;
        },
        onMouseDown(event) {
            if (!this.canPan || event.button !== 0) {
                return;
            }
            this.isPanning = true;
            this.panStartX = event.clientX;
            this.panStartViewArea = this.regionViewArea;
            this.hideTooltip();
            document.addEventListener("mousemove", this.onDocumentMouseMove);
            document.addEventListener("mouseup", this.onDocumentMouseUp);
        },
        onDocumentMouseMove(event) {
            if (!this.isPanning) {
                return;
            }
            const deltaX = event.clientX - this.panStartX;
            const nextViewArea = panRegionViewAreaFromDrag(
                this.panStartViewArea,
                deltaX,
                this.plotWidth
            );
            this.$emit("update:regionViewArea", nextViewArea);
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
            this.isPanning = false;
            this.endPanListeners();
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
            this.hideTooltip();
        },
        onMouseMove(event) {
            if (this.isPanning) {
                return;
            }
            const canvas = this.$refs.canvas;
            const tooltip = this.$refs.tooltip;
            if (!canvas || !tooltip || !this.dotPositions.length) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.dotPositions.find(
                (dot) => Math.hypot(dot.x - x, dot.y - y) <= VKS_DEFAULT_DOT_RADIUS + 4
            );

            if (!hit) {
                this.hideTooltip();
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
            tooltip.style.left = `${event.offsetX + 12}px`;
            tooltip.style.top = `${event.offsetY + 12}px`;
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
    padding: 0 8px;
}

.vks-association-region-plot-legend {
    text-align: center;
    padding: 4px 0 8px;
    font-size: 12px;
    color: #333333;
}

.vks-association-region-plot-legend span {
    display: inline-block;
    margin-right: 5px;
}

.plot-legend-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 0;
    margin-right: 4px;
    vertical-align: middle;
}

.vks-association-region-plot-canvas {
    display: block;
    width: 100%;
}

.vks-association-region-plot-canvas.is-pannable {
    cursor: grab;
    user-select: none;
}

.vks-association-region-plot-canvas.is-pannable:active {
    cursor: grabbing;
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
