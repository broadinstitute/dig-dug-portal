<template>
    <div ref="container" class="vks-ge-plot">
        <canvas ref="canvas" class="vks-ge-plot-canvas"></canvas>
    </div>
</template>

<script>
import {
    attachPlotResizeObserver,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import { buildGePlotModel } from "./variantSifterGlobalEnrichmentData.js";
import {
    globalEnrichmentPlotCanvasHeight,
    renderGlobalEnrichmentPlot,
} from "./variantSifterGlobalEnrichmentRender.js";

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
        annotationOnFocus: {
            type: String,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
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
        plotTitle() {
            const phenotype = this.searchSession?.phenotype?.name;
            const ancestry = this.searchSession?.ancestry || "Mixed";
            if (!phenotype) {
                return "";
            }
            return `${phenotype}(${ancestry})`;
        },
    },
    watch: {
        plotModel: {
            handler() {
                this.$nextTick(() => this.renderPlot());
            },
            deep: true,
        },
        annotationOnFocus() {
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
            const canvasHeight = globalEnrichmentPlotCanvasHeight();
            if (!canvas || !canvasWidth || !this.plotModel) {
                return;
            }

            const ctx = setupPlotCanvas(canvas, canvasWidth, canvasHeight);
            renderGlobalEnrichmentPlot(ctx, {
                plotModel: this.plotModel,
                canvasWidth,
                canvasHeight,
                title: this.plotTitle,
                annotationOnFocus: this.annotationOnFocus,
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
.vks-ge-plot {
    width: 100%;
}

.vks-ge-plot-canvas {
    display: block;
    width: 100%;
}
</style>
