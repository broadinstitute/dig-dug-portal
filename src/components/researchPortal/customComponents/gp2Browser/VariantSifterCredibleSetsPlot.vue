<template>
    <div class="vks-cs-plot">
        <p class="vks-cs-plot-intro">
            Filter associated variants by credible set membership to view fine-mapped
            variants most likely to include the causal variant for this locus.
        </p>
        <div ref="plotStack" class="vks-cs-plot-stack">
            <VariantSifterCredibleSetsTrack
                :selected-sets="selectedSets"
                :color-by-set-id="colorBySetId"
                :view-region="viewRegion"
                :search-session="searchSession"
                :plot-margin="plotMargin"
                :shared-canvas-width="sharedCanvasWidth"
                :plot-markers="plotMarkers"
            />
        </div>
    </div>
</template>

<script>
import VariantSifterCredibleSetsTrack from "./VariantSifterCredibleSetsTrack.vue";
import { VARIANT_SIFTER_PLOT_MARGIN } from "./variantSifterAssociationsPlotConfig.js";
import {
    attachPlotResizeObserver,
    measureVksPlotStackCanvasWidth,
} from "./variantSifterPlotShared.js";

export default {
    name: "VariantSifterCredibleSetsPlot",
    components: {
        VariantSifterCredibleSetsTrack,
    },
    data() {
        return {
            stackCanvasWidth: null,
        };
    },
    props: {
        selectedSets: {
            type: Array,
            default: () => [],
        },
        colorBySetId: {
            type: Object,
            default: () => ({}),
        },
        searchSession: {
            type: Object,
            default: null,
        },
        viewRegion: {
            type: Object,
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
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
    },
    watch: {
        selectedSets: {
            handler() {
                this.$nextTick(() => this.updateStackCanvasWidth());
            },
            deep: true,
        },
    },
    mounted() {
        this.updateStackCanvasWidth();
        this.stackResizeObserver = attachPlotResizeObserver(this, "plotStack", () => {
            this.updateStackCanvasWidth();
        });
    },
    beforeDestroy() {
        if (this.stackResizeObserver) {
            this.stackResizeObserver.disconnect();
        }
    },
    methods: {
        updateStackCanvasWidth() {
            this.stackCanvasWidth = measureVksPlotStackCanvasWidth(this.$refs.plotStack);
        },
    },
};
</script>

<style scoped>
.vks-cs-plot {
    background: #ffffff;
    padding: 0 0 12px;
}

.vks-cs-plot-intro {
    margin: 0;
    padding: 8px 14px 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-cs-plot-stack {
    min-height: 120px;
    padding: 0 8px;
}
</style>
