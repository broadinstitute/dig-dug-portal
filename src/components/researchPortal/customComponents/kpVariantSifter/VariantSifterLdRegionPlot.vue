<template>
    <div ref="container" class="vks-ld-region-plot">
        <canvas
            ref="canvas"
            class="vks-ld-region-plot-canvas"
            :class="{ 'is-dot-hover': dotHover }"
            @mousemove="onMouseMove"
            @mouseout="onMouseOut"
            @click="onCanvasClick"
        ></canvas>
        <VariantSifterVariantDotMenu
            :open="dotMenuOpen"
            :variant-id="dotMenuVariantId"
            :is-starred="dotMenuIsStarred"
            :anchor-x="dotMenuX"
            :anchor-y="dotMenuY"
            @set-reference="onDotMenuSetReference"
            @toggle-star="onDotMenuToggleStar"
        />
        <div ref="tooltip" class="vks-ld-region-plot-tooltip hidden"></div>
        <p v-if="loading" class="vks-ld-region-plot-status">Loading LD plot…</p>
        <p v-if="error" class="vks-ld-region-plot-error" role="alert">{{ error }}</p>
    </div>
</template>

<script>
import { pickLeadVariantRow, rowToLdVariant } from "./variantSifterLdServer.js";
import { isVariantStarred, renderStarDot } from "./variantSifterPlotMarkers.js";
import VariantSifterVariantDotMenu from "./VariantSifterVariantDotMenu.vue";
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
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";

export default {
    name: "VariantSifterLdRegionPlot",
    components: {
        VariantSifterVariantDotMenu,
    },
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
    },
    data() {
        return {
            loading: false,
            error: null,
            ldScoreMap: new Map(),
            refVariant: null,
            dotPositions: [],
            renderRetryTimer: null,
            dotMenuOpen: false,
            dotMenuRow: null,
            dotMenuX: 0,
            dotMenuY: 0,
            dotHover: false,
        };
    },
    computed: {
        starredVariants() {
            return this.plotMarkers?.starredVariants || [];
        },
        dotMenuVariantId() {
            return this.dotMenuRow?.["Variant ID"] || "";
        },
        dotMenuIsStarred() {
            return isVariantStarred(this.starredVariants, this.dotMenuVariantId);
        },
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

            if (this.plotOverlaysState?.ready) {
                this.applySnapshotOverlays();
                return;
            }

            this.renderWithAvailableOverlays();
        },
        renderWithAvailableOverlays() {
            this.loading = false;
            this.error = this.plotOverlaysState?.error || null;
            this.ldScoreMap = new Map();
            const leadRow = pickLeadVariantRow(this.plotRows);
            this.refVariant =
                this.plotOverlaysState?.refVariant || rowToLdVariant(leadRow);
            this.$nextTick(() => {
                this.renderPlot();
                if (this.renderRetryTimer) {
                    clearTimeout(this.renderRetryTimer);
                }
                this.renderRetryTimer = window.setTimeout(() => {
                    this.renderPlot();
                }, 300);
            });
        },
        applySnapshotOverlays() {
            this.loading = false;
            this.error = this.plotOverlaysState.error || null;
            this.ldScoreMap = new Map();
            const leadRow = pickLeadVariantRow(this.plotRows);
            this.refVariant =
                this.plotOverlaysState.refVariant || rowToLdVariant(leadRow);
            this.$nextTick(() => {
                this.renderPlot();
                if (this.renderRetryTimer) {
                    clearTimeout(this.renderRetryTimer);
                }
                this.renderRetryTimer = window.setTimeout(() => {
                    this.renderPlot();
                }, 300);
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
                const isStarred = isVariantStarred(this.starredVariants, variantId);

                this.dotPositions.push({
                    x: xPos,
                    y: yPos,
                    row,
                    ldScore,
                });

                if (isRef) {
                    renderDiamond(ctx, xPos, yPos, dotColor);
                } else if (isStarred) {
                    renderStarDot(ctx, xPos, yPos, dotColor);
                } else {
                    renderPlotDot(ctx, xPos, yPos, dotColor);
                }
            });
        },
        findDotAtCanvasPoint(x, y) {
            return this.dotPositions.find(
                (dot) => Math.hypot(dot.x - x, dot.y - y) <= VKS_DEFAULT_DOT_RADIUS + 4
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
            if (!canvas) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.findDotAtCanvasPoint(x, y);
            if (!hit) {
                return;
            }

            this.openDotMenu(hit.row, event.offsetX, event.offsetY);
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
        onMouseMove(event) {
            const canvas = this.$refs.canvas;
            const tooltip = this.$refs.tooltip;
            if (!canvas || !tooltip || !this.dotPositions.length) {
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.findDotAtCanvasPoint(x, y);

            const isHovering = Boolean(hit);
            if (this.dotHover !== isHovering) {
                this.dotHover = isHovering;
            }

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
            this.$nextTick(() => {
                positionAnchoredPopupElement(
                    tooltip,
                    event.offsetX,
                    event.offsetY,
                    this.$refs.container
                );
            });
        },
        onMouseOut() {
            this.dotHover = false;
            this.hideTooltip();
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
    padding: 4px 0;
}

.vks-ld-region-plot-canvas {
    display: block;
    width: 100%;
}

.vks-ld-region-plot-canvas.is-dot-hover {
    cursor: pointer;
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
