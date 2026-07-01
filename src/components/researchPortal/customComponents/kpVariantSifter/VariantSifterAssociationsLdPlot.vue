<template>
    <div v-if="plotData" class="vks-assoc-ld-plot">
        <VariantSifterLdRegionPlot
            :plot-rows="plotData"
            :search-session="searchSession"
            :plot-overlays-state="plotOverlaysState"
            :plot-margin="plotMargin"
            :plot-markers="plotMarkers"
            :utils="utils"
            @toggle-star-variant="$emit('toggle-star-variant', $event)"
            @set-reference-variant="$emit('set-reference-variant', $event)"
        />
    </div>
</template>

<script>
import VariantSifterLdRegionPlot from "./VariantSifterLdRegionPlot.vue";
import { associationRowsToPlotData } from "./variantSifterAssociationsPlotData.js";
import { VARIANT_SIFTER_PLOT_MARGIN } from "./variantSifterAssociationsPlotConfig.js";

export default {
    name: "VariantSifterAssociationsLdPlot",
    components: {
        VariantSifterLdRegionPlot,
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        searchSession: {
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
    computed: {
        plotData() {
            return associationRowsToPlotData(this.rows);
        },
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
    },
};
</script>

<style scoped>
.vks-assoc-ld-plot {
    margin-bottom: 10px;
}
</style>
