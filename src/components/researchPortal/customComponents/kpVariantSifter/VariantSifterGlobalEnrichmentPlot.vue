<template>
    <div ref="container" class="vks-ge-plot">
        <canvas
            ref="canvas"
            class="vks-ge-plot-canvas"
            :class="{ 'is-dot-hover': dotHover }"
            @mousemove="onMouseMove"
            @mouseout="onMouseOut"
            @click="onClick"
        ></canvas>
        <VariantSifterGeTissueDotMenu
            :open="dotMenuOpen"
            :tissue="dotMenuTissue"
            :annotation="dotMenuAnnotation"
            :is-selected="dotMenuIsSelected"
            :anchor-x="dotMenuX"
            :anchor-y="dotMenuY"
            @toggle-select="onDotMenuToggleSelect"
        />
        <div
            v-if="actionBubble"
            class="vks-ge-action-bubble"
            role="status"
            aria-live="polite"
        >
            {{ actionBubble }}
        </div>
        <div ref="tooltip" class="vks-ge-plot-tooltip hidden"></div>
    </div>
</template>

<script>
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import { buildGePlotModel, listSelectedTissueKeysByAnnotation } from "./variantSifterGlobalEnrichmentData.js";
import {
    globalEnrichmentPlotCanvasHeight,
    renderGlobalEnrichmentPlot,
} from "./variantSifterGlobalEnrichmentRender.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";
import VariantSifterGeTissueDotMenu from "./VariantSifterGeTissueDotMenu.vue";

export default {
    name: "VariantSifterGlobalEnrichmentPlot",
    components: {
        VariantSifterGeTissueDotMenu,
    },
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
        selectedTissuesByAnnotation: {
            type: Object,
            default: () => ({}),
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
            dotMenuOpen: false,
            dotMenuPoint: null,
            dotMenuX: 0,
            dotMenuY: 0,
            actionBubble: "",
            actionBubbleTimer: null,
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
        selectedTissueKeys() {
            return listSelectedTissueKeysByAnnotation(
                this.selectedTissuesByAnnotation
            );
        },
        selectedTissueKeySet() {
            return new Set(this.selectedTissueKeys);
        },
        dotMenuTissue() {
            return this.dotMenuPoint?.tissue || "";
        },
        dotMenuAnnotation() {
            return this.dotMenuPoint?.annotation || "";
        },
        dotMenuIsSelected() {
            if (!this.dotMenuPoint) {
                return false;
            }
            return this.selectedTissueKeySet.has(
                `${this.dotMenuPoint.annotation}:::${this.dotMenuPoint.tissue}`
            );
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
        selectedTissueKeys() {
            this.$nextTick(() => this.renderPlot());
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
        document.addEventListener("mousedown", this.onDocumentMouseDown);
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        document.removeEventListener("mousedown", this.onDocumentMouseDown);
        this.clearActionBubbleTimer();
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
                selectedTissueKeys: this.selectedTissueKeySet,
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
        formatPValue(value) {
            if (value == null || value === "") {
                return "—";
            }
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return String(value);
            }
            if (this.utils?.Formatters?.BYORColumnFormatter) {
                return this.utils.Formatters.BYORColumnFormatter(
                    numeric,
                    "P-Value",
                    {
                        "column formatting": {
                            "P-Value": { type: ["scientific notation"] },
                        },
                    },
                    null,
                    null,
                    {}
                );
            }
            if (numeric !== 0 && (Math.abs(numeric) < 0.001 || Math.abs(numeric) >= 1000)) {
                return numeric.toExponential(2);
            }
            return String(numeric);
        },
        formatFold(value) {
            if (value == null || value === "") {
                return "—";
            }
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return String(value);
            }
            if (Math.abs(numeric) >= 100 || Math.abs(numeric) < 0.01) {
                return numeric.toExponential(2);
            }
            return numeric.toFixed(2);
        },
        closeDotMenu() {
            this.dotMenuOpen = false;
            this.dotMenuPoint = null;
        },
        openDotMenu(point, anchorX, anchorY) {
            this.dotMenuPoint = point;
            this.dotMenuX = anchorX;
            this.dotMenuY = anchorY;
            this.dotMenuOpen = true;
        },
        onDocumentMouseDown(event) {
            if (!this.dotMenuOpen) {
                return;
            }
            const menu = this.$el?.querySelector(".vks-ge-tissue-dot-menu");
            if (menu?.contains(event.target)) {
                return;
            }
            this.closeDotMenu();
        },
        clearActionBubbleTimer() {
            if (this.actionBubbleTimer) {
                clearTimeout(this.actionBubbleTimer);
                this.actionBubbleTimer = null;
            }
        },
        showActionBubble(message) {
            this.clearActionBubbleTimer();
            this.actionBubble = message;
            this.actionBubbleTimer = setTimeout(() => {
                this.actionBubble = "";
                this.actionBubbleTimer = null;
            }, 4500);
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

            if (!hit || this.dotMenuOpen) {
                this.hideTooltip();
                return;
            }

            const point = hit.point;
            const rawPValue =
                point.rawPValue != null
                    ? point.rawPValue
                    : point.pValue != null
                      ? Math.pow(10, -Number(point.pValue))
                      : null;
            tooltip.innerHTML = [
                `<strong>${point.tissue}</strong>`,
                `Annotation: ${point.annotation}`,
                `P-value: ${this.formatPValue(rawPValue)}`,
                `Fold: ${this.formatFold(point.fold)}`,
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
        onClick(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.dotPositions.length) {
                return;
            }
            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = this.findDotAtCanvasPoint(x, y);
            if (!hit?.point?.annotation || !hit?.point?.tissue) {
                this.closeDotMenu();
                return;
            }
            this.hideTooltip();
            this.openDotMenu(hit.point, event.offsetX, event.offsetY);
        },
        onDotMenuToggleSelect() {
            const point = this.dotMenuPoint;
            const selecting = !this.dotMenuIsSelected;
            this.closeDotMenu();
            if (!point?.annotation || !point?.tissue) {
                return;
            }
            this.$emit("toggle-tissue-selection", {
                annotation: point.annotation,
                tissue: point.tissue,
                selected: selecting,
            });
            if (selecting) {
                this.showActionBubble(
                    `${point.tissue} tissue is selected on ${point.annotation} annotation tracks. Biosample tracks added.`
                );
            } else {
                this.showActionBubble(
                    `${point.tissue} tissue is deselected on ${point.annotation} annotation tracks.`
                );
            }
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

.vks-ge-action-bubble {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 9;
    max-width: min(420px, calc(100% - 24px));
    transform: translateX(-50%);
    padding: 10px 14px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(20, 22, 30, 0.14);
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    line-height: 1.45;
    text-align: center;
    pointer-events: none;
}

.vks-ge-plot-tooltip {
    position: absolute;
    z-index: 4;
    max-width: 260px;
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
