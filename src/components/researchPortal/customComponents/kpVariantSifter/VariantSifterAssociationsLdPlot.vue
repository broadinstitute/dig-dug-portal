<template>
    <div v-if="plotData" class="vks-assoc-ld-plot">
        <VariantSifterLdRegionPlot
            :plot-rows="plotData"
            :search-session="searchSession"
            :plot-margin="plotMargin"
            :utils="utils"
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
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
}
</style>
