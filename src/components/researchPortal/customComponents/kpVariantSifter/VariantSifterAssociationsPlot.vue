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
            <div ref="plotStack" class="vks-associations-plot-stack">
                <VariantSifterAssociationRegionPlot
                    :plot-rows="plotData"
                    :region="searchSession?.region"
                    :search-session="searchSession"
                    :region-zoom="regionZoom"
                    :region-shift-bp="regionShiftBp"
                    :view-region="viewRegion"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-margin="plotMargin"
                    :shared-canvas-width="stackCanvasWidth"
                    :utils="utils"
                    @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                    @pan-end="$emit('pan-end')"
                />
                <VariantSifterGenesTrack
                    :key="genesTrackKey"
                    :genes="genesTrackData"
                    :region="searchSession?.region"
                    :view-region="viewRegion"
                    :plot-margin="plotMargin"
                    :region-zoom="regionZoom"
                    :shared-canvas-width="stackCanvasWidth"
                />
            </div>
            <p v-if="regionDataLoading" class="vks-associations-plot-note">
                Loading extended region…
            </p>
            <p v-else-if="ldLoading" class="vks-associations-plot-note">
                Loading LD scores for table…
            </p>
        </template>
    </div>
</template>

<script>
import VariantSifterGenesTrack from "./VariantSifterGenesTrack.vue";
import VariantSifterAssociationRegionPlot from "./VariantSifterAssociationRegionPlot.vue";
import { associationRowsToPlotData } from "./variantSifterAssociationsPlotData.js";
import {
    VARIANT_SIFTER_PLOT_MARGIN,
} from "./variantSifterAssociationsPlotConfig.js";
import {
    attachPlotResizeObserver,
    measureVksPlotStackCanvasWidth,
} from "./variantSifterPlotShared.js";

export default {
    name: "VariantSifterAssociationsPlot",
    components: {
        VariantSifterGenesTrack,
        VariantSifterAssociationRegionPlot,
    },
    data() {
        return {
            stackCanvasWidth: null,
        };
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
        regionShiftBp: {
            type: Number,
            default: 0,
        },
        viewRegion: {
            type: Object,
            default: null,
        },
        regionDataLoading: {
            type: Boolean,
            default: false,
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
        genesState: {
            type: Object,
            default: () => ({
                ready: false,
                loading: false,
                error: null,
                data: null,
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
        genesTrackData() {
            const { loading, ready, data } = this.genesState || {};
            if (loading || ready) {
                return Array.isArray(data) ? data : [];
            }
            return [];
        },
        genesTrackKey() {
            const region = this.searchSession?.region;
            const regionKey = region
                ? `${region.chr}:${region.start}-${region.end}`
                : "region";
            const count = this.genesState?.data?.length || 0;
            return `${regionKey}:${count}:${this.genesState?.loading ? "loading" : "ready"}`;
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
    watch: {
        plotData(hasData) {
            if (hasData?.length) {
                this.$nextTick(() => this.updateStackCanvasWidth());
            }
        },
        loading(isLoading) {
            if (!isLoading) {
                this.$nextTick(() => this.updateStackCanvasWidth());
            }
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
