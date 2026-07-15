<template>
    <div ref="container" class="vks-ge-plot">
        <canvas
            ref="canvas"
            class="vks-ge-plot-canvas"
            :class="{ 'is-dot-hover': dotHover }"
            @mousemove="onMouseMove"
            @mouseout="onMouseOut"
        ></canvas>
        <div ref="tooltip" class="vks-ge-plot-tooltip hidden"></div>
    </div>
</template>

<script>
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import { buildGePlotModel } from "./variantSifterGlobalEnrichmentData.js";
import {
    globalEnrichmentPlotCanvasHeight,
    renderGlobalEnrichmentPlot,
} from "./variantSifterGlobalEnrichmentRender.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";

export default {
    name: "VariantSifterGlobalEnrichmentPlot",
    props: {
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                geRows: [],
                annoData: {},
            }),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        selectedAnnotations: {
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
            dotPositions: [],
            dotHover: false,
        };
    },
    computed: {
        plotModel() {
            if (!this.searchSession?.phenotype?.name) {
                return null;
            }
            return buildGePlotModel({
                geRows: this.globalEnrichmentState?.geRows || [],
                annoData: this.globalEnrichmentState?.annoData || {},
                phenotype: this.searchSession.phenotype.name,
                ancestry: this.searchSession.ancestry || "Mixed",
            });
        },
    },
    watch: {
        plotModel: {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        selectedAnnotations: {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        "globalEnrichmentState.llmRelevance": {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        "globalEnrichmentState.enabledMutedAnnotations": {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        "globalEnrichmentState.enabledMutedAnnotationTissues": {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        "globalEnrichmentState.disabledAnnotationTissues": {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
    },
    mounted() {
        this.renderPlot();
        this.resizeObserver = attachPlotResizeObserver(this, "container", () => {
            this.renderPlot();
        });
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        measureCanvasWidth() {
            const displayWidth = this.$refs.container?.clientWidth || 0;
            if (displayWidth < 100) {
                return null;
            }
            return displayWidth * 2;
        },
        renderPlot() {
            const canvas = this.$refs.canvas;
            const canvasWidth = this.measureCanvasWidth();
            const canvasHeight = globalEnrichmentPlotCanvasHeight();
            if (!canvas || !canvasWidth || !this.plotModel) {
                this.dotPositions = [];
                return;
            }

            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
            this.dotPositions = renderGlobalEnrichmentPlot(ctx, {
                plotModel: this.plotModel,
                canvasWidth,
                canvasHeight,
                selectedAnnotations: this.selectedAnnotations,
                utils: this.utils,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotations:
                    this.globalEnrichmentState?.enabledMutedAnnotations || [],
                enabledMutedAnnotationTissues:
                    this.globalEnrichmentState?.enabledMutedAnnotationTissues || {},
                disabledAnnotationTissues:
                    this.globalEnrichmentState?.disabledAnnotationTissues || {},
            });
        },
        findDotAtCanvasPoint(x, y) {
            return this.dotPositions.find((dot) => {
                const hitRadius = dot.radius + 6;
                return Math.hypot(dot.x - x, dot.y - y) <= hitRadius;
            });
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

            const point = hit.point;
            tooltip.innerHTML = [
                `<strong>${point.tissue}</strong>`,
                `Annotation: ${point.annotation}`,
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
.vks-ge-plot {
    position: relative;
    width: 100%;
}

.vks-ge-plot-canvas {
    display: block;
    width: 100%;
}

.vks-ge-plot-canvas.is-dot-hover {
    cursor: pointer;
}

.vks-ge-plot-tooltip {
    position: absolute;
    z-index: 4;
    max-width: 240px;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(20, 22, 30, 0.12);
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
    pointer-events: none;
}

.vks-ge-plot-tooltip.hidden {
    display: none;
}
</style>
