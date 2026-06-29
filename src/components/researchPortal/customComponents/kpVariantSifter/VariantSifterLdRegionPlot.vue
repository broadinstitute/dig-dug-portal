<template>
    <div ref="container" class="vks-ld-region-plot">
        <canvas
            ref="canvas"
            class="vks-ld-region-plot-canvas"
            @mousemove="onMouseMove"
            @mouseout="hideTooltip"
        ></canvas>
        <div ref="tooltip" class="vks-ld-region-plot-tooltip hidden"></div>
        <p v-if="loading" class="vks-ld-region-plot-status">Loading LD plot…</p>
        <p v-if="error" class="vks-ld-region-plot-error" role="alert">{{ error }}</p>
    </div>
</template>

<script>
import { fetchLdScoreMap, pickLeadVariantRow, rowToLdVariant } from "./variantSifterLdServer.js";
import {
    VKS_PLOT_DISPLAY_HEIGHT,
    attachPlotResizeObserver,
    canvasPointerPosition,
    computeNegLog10Extents,
    getLdDotColor,
    getInternalPlotHeight,
    measureLdCanvasWidth,
    normalizePlotMargin,
    renderDiamond,
    renderPlotAxis,
    renderPlotDot,
    resolveRowLdScore,
    setupPlotCanvas,
    VKS_DEFAULT_DOT_RADIUS,
} from "./variantSifterPlotShared.js";

export default {
    name: "VariantSifterLdRegionPlot",
    props: {
        plotRows: {
            type: Array,
            default: () => [],
        },
        searchSession: {
            type: Object,
            default: null,
        },
        plotMargin: {
            type: Object,
            default: null,
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
            ldScoreMap: new Map(),
            refVariant: null,
            dotPositions: [],
            renderRetryTimer: null,
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
    },
    watch: {
        plotRows: {
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
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.renderRetryTimer) {
            clearTimeout(this.renderRetryTimer);
        }
    },
    methods: {
        async refreshPlot() {
            if (!this.plotRows?.length || !this.searchSession?.region) {
                this.clearCanvas();
                return;
            }

            this.loading = true;
            this.error = null;

            try {
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
                this.error = error?.message || "Failed to load LD plot.";
                this.ldScoreMap = new Map();
                this.refVariant = null;
            } finally {
                this.loading = false;
                this.$nextTick(() => {
                    this.renderPlot();
                    if (this.renderRetryTimer) {
                        clearTimeout(this.renderRetryTimer);
                    }
                    this.renderRetryTimer = window.setTimeout(() => {
                        this.renderPlot();
                    }, 300);
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
            if (!canvas || !container || !this.plotRows?.length) {
                return;
            }

            const margin = this.margin;
            const canvasWidth = measureLdCanvasWidth(container);
            if (!canvasWidth) {
                return;
            }
            const plotWidth = canvasWidth - margin.left - margin.right;
            const plotHeight = this.plotHeight;
            const canvasHeight = plotHeight + margin.top + margin.bottom;
            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);

            const { yMin, yMax } = this.yExtents;
            const xMin = 0;
            const xMax = 1;
            const xPosByPixel = plotWidth / (xMax - xMin);
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
                type: "ld",
                utils: this.utils,
                yAxisLabel: "-log10(p-value)",
                xAxisLabel: "LD(r2)",
                ldBackground: true,
            });

            this.dotPositions = [];
            this.plotRows.forEach((row) => {
                const negLog10 = row["-log10(P-Value)"];
                if (negLog10 == null || Number.isNaN(negLog10)) {
                    return;
                }

                const ldScore = resolveRowLdScore(row, this.ldScoreMap);
                if (ldScore == null || Number.isNaN(ldScore)) {
                    return;
                }

                const xPos = xStart + ldScore * xPosByPixel;
                const yPos = yStart - (negLog10 - yMin) * yPosByPixel;
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
        },
        onMouseMove(event) {
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
                `LD r²: ${hit.ldScore.toFixed(3)}`,
                `-log10(P): ${row["-log10(P-Value)"] ?? ""}`,
            ].join("<br />");
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
.vks-ld-region-plot {
    position: relative;
    padding: 4px;
}

.vks-ld-region-plot-canvas {
    display: block;
    width: 100%;
}

.vks-ld-region-plot-tooltip {
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

.vks-ld-region-plot-tooltip.hidden {
    display: none;
}

.vks-ld-region-plot-status,
.vks-ld-region-plot-error {
    margin: 0;
    padding: 8px 0;
    font-size: 12px;
    text-align: center;
}

.vks-ld-region-plot-error {
    color: #b42318;
}
</style>
