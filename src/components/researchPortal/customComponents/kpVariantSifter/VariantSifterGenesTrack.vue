<template>
    <div ref="container" class="vks-genes-track">
        <canvas ref="canvas" class="vks-genes-track-canvas"></canvas>
    </div>
</template>

<script>
import { computeVisibleRegion } from "./variantSifterRegionZoom.js";
import {
    attachPlotResizeObserver,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import {
    computeGenesTrackCanvasHeight,
    layoutGenesInLanes,
    renderGenesTrack,
} from "./variantSifterGenesTrackRender.js";
import { renderPlotMarkerLines } from "./variantSifterPlotMarkers.js";

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
        renderTrack() {
            const canvas = this.$refs.canvas;
            const container = this.$refs.container;
            if (!canvas || !container || !this.region) {
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const visibleRegion = this.visibleRegion;
            if (!visibleRegion) {
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
                return;
            }

            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
            renderGenesTrack(ctx, {
                genes: this.genes,
                visibleRegion,
                margin,
                canvasWidth,
                canvasHeight,
            });

            const plotHeight = canvasHeight - margin.top - margin.bottom;
            renderPlotMarkerLines(ctx, {
                starredVariants: this.plotMarkers?.starredVariants || [],
                positionMarkers: this.plotMarkers?.positionMarkers || [],
                visibleRegion,
                margin,
                plotWidth,
                plotHeight,
                canvasHeight,
            });
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
}
</style>
