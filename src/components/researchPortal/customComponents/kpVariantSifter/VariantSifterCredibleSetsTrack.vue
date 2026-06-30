<template>
    <div ref="container" class="vks-cs-track">
        <canvas ref="canvas" class="vks-cs-track-canvas"></canvas>
    </div>
</template>

<script>
import { VARIANT_SIFTER_PLOT_MARGIN } from "./variantSifterAssociationsPlotConfig.js";
import {
    attachPlotResizeObserver,
    measureVksPlotStackCanvasWidth,
    normalizePlotMargin,
} from "./variantSifterPlotShared.js";
import {
    computeCredibleSetsTrackCanvasHeight,
    renderCredibleSetsTrack,
    setupCredibleSetsCanvas,
} from "./variantSifterCredibleSetsRender.js";

export default {
    name: "VariantSifterCredibleSetsTrack",
    props: {
        selectedSets: {
            type: Array,
            default: () => [],
        },
        colorBySetId: {
            type: Object,
            default: () => ({}),
        },
        viewRegion: {
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
            return normalizePlotMargin(this.plotMargin || VARIANT_SIFTER_PLOT_MARGIN);
        },
        phenotypeLabel() {
            return this.searchSession?.phenotype?.description || null;
        },
        hasSelectedSets() {
            return Array.isArray(this.selectedSets) && this.selectedSets.length > 0;
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
            if (!canvas || !this.hasSelectedSets || !this.viewRegion) {
                if (canvas) {
                    canvas.height = 0;
                    canvas.style.height = "0";
                }
                return;
            }

            const canvasWidth = this.resolveCanvasWidth();
            if (!canvasWidth) {
                return;
            }

            const canvasHeight = computeCredibleSetsTrackCanvasHeight(
                this.margin,
                this.hasSelectedSets
            );
            const ctx = setupCredibleSetsCanvas(canvas, canvasWidth, canvasHeight);
            renderCredibleSetsTrack(ctx, {
                canvasWidth,
                margin: this.margin,
                viewRegion: this.viewRegion,
                selectedSets: this.selectedSets,
                colorBySetId: this.colorBySetId,
                plotMarkers: this.plotMarkers,
                phenotypeLabel: this.phenotypeLabel,
            });
        },
    },
};
</script>

<style scoped>
.vks-cs-track {
    width: 100%;
}

.vks-cs-track-canvas {
    display: block;
    width: 100%;
}
</style>
