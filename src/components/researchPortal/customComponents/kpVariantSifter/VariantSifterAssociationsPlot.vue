<template>
    <div class="vks-associations-plot">
        <div v-if="loading" class="vks-associations-plot-status">
            Loading associations…
        </div>
        <div v-else-if="error" class="vks-associations-plot-error" role="alert">
            {{ error }}
        </div>
        <div v-else-if="!plotData" class="vks-associations-plot-status">
            No association data to plot for this locus.
        </div>
        <template v-else>
            <p v-if="metaLabel" class="vks-associations-plot-meta">{{ metaLabel }}</p>
            <div class="vks-associations-plot-stack">
                <VariantSifterAssociationRegionPlot
                    :plot-rows="plotData"
                    :region="searchSession?.region"
                    :search-session="searchSession"
                    :region-zoom="regionZoom"
                    :region-view-area="regionViewArea"
                    :plot-margin="plotMargin"
                    :utils="utils"
                    @update:regionViewArea="$emit('update:regionViewArea', $event)"
                />
                <ResearchGenesTrack
                    :region="regionString"
                    :genes-data="null"
                    :plot-config="renderConfig"
                    plot-type="region plot"
                    :plot-margin="plotMargin"
                    :region-zoom="regionZoom"
                    :region-view-area="regionViewArea"
                    :utils="utils"
                    section-id="vks"
                />
            </div>
            <p v-if="ldLoading" class="vks-associations-plot-note">
                Loading LD scores for table…
            </p>
        </template>
    </div>
</template>

<script>
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import VariantSifterAssociationRegionPlot from "./VariantSifterAssociationRegionPlot.vue";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { associationRowsToPlotData } from "./variantSifterAssociationsPlotData.js";
import {
    buildAssociationsRegionPlotConfig,
    VARIANT_SIFTER_PLOT_MARGIN,
} from "./variantSifterAssociationsPlotConfig.js";

export default {
    name: "VariantSifterAssociationsPlot",
    components: {
        ResearchGenesTrack,
        VariantSifterAssociationRegionPlot,
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        ldLoading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: null,
        },
        searchSession: {
            type: Object,
            default: null,
        },
        regionZoom: {
            type: Number,
            default: 0,
        },
        regionViewArea: {
            type: Number,
            default: 0,
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
        renderConfig() {
            return buildAssociationsRegionPlotConfig(this.searchSession);
        },
        regionString() {
            if (!this.searchSession?.region) {
                return null;
            }
            return formatRegion(this.searchSession.region);
        },
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
        metaLabel() {
            if (!this.searchSession) {
                return "";
            }
            const parts = [this.searchSession.phenotype?.description];
            if (this.searchSession.ancestry) {
                parts.push(this.searchSession.ancestry);
            }
            if (this.searchSession.regionLabel) {
                parts.push(this.searchSession.regionLabel);
            }
            return parts.filter(Boolean).join(" · ");
        },
    },
};
</script>

<style scoped>
.vks-associations-plot {
    background: #ffffff;
    padding: 0 0 12px;
}

.vks-associations-plot-meta {
    margin: 0;
    padding: 8px 14px 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-associations-plot-stack {
    min-height: 280px;
}

.vks-associations-plot-stack >>> .genes-plot-wrapper {
    padding: 0 8px;
}

.vks-associations-plot-status,
.vks-associations-plot-note {
    margin: 0;
    padding: 24px 14px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    text-align: center;
}

.vks-associations-plot-error {
    margin: 0;
    padding: 24px 14px;
    font-size: 13px;
    color: #b42318;
    text-align: center;
}
</style>
