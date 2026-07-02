<template>
    <div ref="container" class="vks-annotations-plot">
        <canvas ref="canvas" class="vks-annotations-plot-canvas"></canvas>
    </div>
</template>

<script>
import {
    attachPlotResizeObserver,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import {
    annotationsForPlot,
    computeAnnotationsPlotHeight,
    countAnnotationTissues,
} from "./variantSifterGlobalEnrichmentData.js";
import { renderAnnotationsPlot } from "./variantSifterGlobalEnrichmentRender.js";

export default {
    name: "VariantSifterAnnotationsPlot",
    props: {
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                annoData: {},
            }),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        selectedAnnotation: {
            type: String,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
    },
    computed: {
        visibleRegion() {
            return this.searchSession?.region || null;
        },
        annotations() {
            return annotationsForPlot(
                this.globalEnrichmentState?.annoData || {},
                this.selectedAnnotation
            );
        },
        canvasHeight() {
            const tissueCount = countAnnotationTissues(
                this.globalEnrichmentState?.annoData || {},
                this.annotations
            );
            return computeAnnotationsPlotHeight(this.annotations.length, tissueCount);
        },
    },
    watch: {
        annotations: {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        visibleRegion: {
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
        "globalEnrichmentState.enabledMutedTissues": {
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
            if (!canvas || !canvasWidth || !this.visibleRegion || !this.annotations.length) {
                return;
            }

            const ctx = setupPlotCanvas(canvas, canvasWidth, this.canvasHeight);
            renderAnnotationsPlot(ctx, {
                annoData: this.globalEnrichmentState?.annoData || {},
                visibleRegion: this.visibleRegion,
                canvasWidth,
                canvasHeight: this.canvasHeight,
                annotations: this.annotations,
                utils: this.utils,
                llmRelevance: this.globalEnrichmentState?.llmRelevance || null,
                enabledMutedAnnotations:
                    this.globalEnrichmentState?.enabledMutedAnnotations || [],
                enabledMutedTissues: this.globalEnrichmentState?.enabledMutedTissues || [],
            });
        },
    },
};
</script>

<style scoped>
.vks-annotations-plot {
    width: 100%;
    margin-top: 12px;
}

.vks-annotations-plot-canvas {
    display: block;
    width: 100%;
}
</style>
