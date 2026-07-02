<template>
    <div ref="container" class="vks-genes-track">
        <canvas
            ref="canvas"
            class="vks-genes-track-canvas"
            :class="{ 'is-gene-hover': Boolean(hoveredGene) }"
            @mousemove="onMouseMove"
            @mouseout="onMouseOut"
        ></canvas>
        <div
            v-if="hoveredGene"
            ref="infoPanel"
            class="vks-genes-track-info-panel"
            role="status"
        >
            <p class="vks-genes-track-info-name">{{ hoveredGene.gene_name }}</p>
            <p class="vks-genes-track-info-row">
                <span class="vks-genes-track-info-label">Region</span>
                <span>{{ geneRegionLabel }}</span>
            </p>
            <p class="vks-genes-track-info-row">
                <span class="vks-genes-track-info-label">Type</span>
                <span class="vks-genes-track-info-type">
                    <span
                        class="vks-genes-track-info-swatch"
                        :style="{ backgroundColor: hoveredGeneColor }"
                        aria-hidden="true"
                    ></span>
                    <span>{{ geneTypeLabel }}</span>
                </span>
            </p>
        </div>
    </div>
</template>

<script>
import { computeVisibleRegion } from "./variantSifterRegionZoom.js";
import {
    attachPlotResizeObserver,
    canvasPointerPosition,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
    renderTrackHighlightBands,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import {
    computeGeneTrackHitRegions,
    computeGenesTrackCanvasHeight,
    findGeneHitAtCanvasPoint,
    layoutGenesInLanes,
    renderGenesTrack,
} from "./variantSifterGenesTrackRender.js";
import {
    formatGeneRegion,
    formatGeneTypeLabel,
    resolveGeneType,
} from "./variantSifterGenesFilter.js";
import { geneColorForGene } from "./variantSifterGenesColors.js";
import { renderPlotMarkerLines } from "./variantSifterPlotMarkers.js";
import { positionAnchoredPopupElement } from "./variantSifterPopupPosition.js";

export default {
    name: "VariantSifterGenesTrack",
    props: {
        genes: {
            type: Array,
            default: () => [],
        },
        region: {
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
        viewRegion: {
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
        recombPeakIntervals: {
            type: Array,
            default: () => [],
        },
        colorByGeneType: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            geneHitRegions: [],
            hoveredGene: null,
            hoverAnchorX: 0,
            hoverAnchorY: 0,
        };
    },
    computed: {
        margin() {
            return normalizePlotMargin(this.plotMargin);
        },
        visibleRegion() {
            if (this.viewRegion) {
                return this.viewRegion;
            }
            return computeVisibleRegion(this.region, this.regionZoom, 0);
        },
        geneRegionLabel() {
            if (!this.hoveredGene) {
                return "";
            }
            return formatGeneRegion(this.hoveredGene, this.region?.chr);
        },
        geneTypeLabel() {
            if (!this.hoveredGene) {
                return "";
            }
            return formatGeneTypeLabel(resolveGeneType(this.hoveredGene));
        },
        hoveredGeneColor() {
            if (!this.hoveredGene) {
                return "";
            }
            return geneColorForGene(this.hoveredGene, this.colorByGeneType);
        },
    },
    watch: {
        genes: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        region: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        regionZoom() {
            this.renderTrack();
        },
        viewRegion: {
            handler() {
                this.renderTrack();
            },
            deep: true,
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
        colorByGeneType: {
            handler() {
                this.renderTrack();
            },
            deep: true,
        },
        hoveredGene() {
            this.$nextTick(() => this.positionInfoPanel());
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
        clearHover() {
            this.hoveredGene = null;
        },
        positionInfoPanel() {
            const panel = this.$refs.infoPanel;
            if (!panel || !this.hoveredGene) {
                return;
            }
            positionAnchoredPopupElement(
                panel,
                this.hoverAnchorX / 2,
                this.hoverAnchorY / 2,
                this.$refs.container
            );
        },
        onMouseMove(event) {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.geneHitRegions.length) {
                this.clearHover();
                return;
            }

            const { x, y } = canvasPointerPosition(event, canvas);
            const hit = findGeneHitAtCanvasPoint(this.geneHitRegions, x, y);
            if (!hit) {
                this.clearHover();
                return;
            }

            this.hoverAnchorX = x;
            this.hoverAnchorY = y;
            this.hoveredGene = hit.gene;
        },
        onMouseOut(event) {
            if (event.relatedTarget && this.$refs.container?.contains(event.relatedTarget)) {
                return;
            }
            this.clearHover();
        },
        renderTrack() {
            const canvas = this.$refs.canvas;
            const container = this.$refs.container;
            if (!canvas || !container || !this.region) {
                this.geneHitRegions = [];
                this.clearHover();
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const visibleRegion = this.visibleRegion;
            if (!visibleRegion) {
                this.geneHitRegions = [];
                this.clearHover();
                return;
            }

            const margin = this.margin;
            const plotWidth = canvasWidth - margin.left * 2;
            const xMin = Number(visibleRegion.start);
            const xMax = Number(visibleRegion.end);
            const xStart = margin.left;
            const xPosByPixel = plotWidth / (xMax - xMin || 1);
            const { laneCount } = layoutGenesInLanes(
                this.genes,
                xMin,
                xMax,
                xStart,
                xPosByPixel
            );

            const canvasHeight = computeGenesTrackCanvasHeight(margin, laneCount);
            if (!canvasHeight) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.height = "0px";
                this.geneHitRegions = [];
                this.clearHover();
                return;
            }

            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
            const plotHeight = canvasHeight - margin.top - margin.bottom;

            renderTrackHighlightBands(ctx, {
                intervals: this.recombPeakIntervals,
                visibleRegion,
                margin,
                plotWidth,
                plotHeight,
            });

            renderGenesTrack(ctx, {
                genes: this.genes,
                visibleRegion,
                margin,
                canvasWidth,
                canvasHeight,
                colorByGeneType: this.colorByGeneType,
            });

            renderPlotMarkerLines(ctx, {
                starredVariants: this.plotMarkers?.starredVariants || [],
                positionMarkers: this.plotMarkers?.positionMarkers || [],
                visibleRegion,
                margin,
                plotWidth,
                plotHeight,
                canvasHeight,
            });

            this.geneHitRegions = computeGeneTrackHitRegions(
                this.genes,
                visibleRegion,
                margin,
                canvasWidth,
                ctx
            );
        },
    },
};
</script>

<style scoped>
.vks-genes-track {
    position: relative;
}

.vks-genes-track-canvas {
    display: block;
    width: 100%;
    cursor: default;
}

.vks-genes-track-canvas.is-gene-hover {
    cursor: pointer;
}

.vks-genes-track-info-panel {
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

.vks-genes-track-info-name {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--cfde-ink, #33363d);
}

.vks-genes-track-info-row {
    display: grid;
    grid-template-columns: 52px 1fr;
    gap: 8px;
    margin: 0 0 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cfde-ink, #33363d);
}

.vks-genes-track-info-row:last-child {
    margin-bottom: 0;
}

.vks-genes-track-info-type {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.vks-genes-track-info-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
}

.vks-genes-track-info-label {
    color: var(--cfde-muted, #6b6b6b);
    font-weight: 600;
}
</style>
