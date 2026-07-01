<template>
    <div class="vks-associations-plot">
        <div v-if="loading && !plotData" class="vks-associations-plot-status">
            Loading associations…
        </div>
        <div
            v-else-if="error && !plotData"
            class="vks-associations-plot-error"
            role="alert"
        >
            {{ error }}
        </div>
        <div v-else-if="!plotData" class="vks-associations-plot-status">
            No association data to plot for this locus.
        </div>
        <template v-else>
            <div ref="plotStack" class="vks-associations-plot-stack">
                <VariantSifterAssociationRegionPlot
                    :plot-rows="plotData"
                    :region="searchSession?.region"
                    :search-session="searchSession"
                    :region-zoom="regionZoom"
                    :region-shift-bp="regionShiftBp"
                    :region-view-area="regionViewArea"
                    :view-region="viewRegion"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-margin="plotMargin"
                    :shared-canvas-width="stackCanvasWidth"
                    :plot-markers="plotMarkers"
                    :utils="utils"
                    @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                    @update:regionViewArea="$emit('update:regionViewArea', $event)"
                    @pan-end="$emit('pan-end')"
                    @toggle-position-marker="$emit('toggle-position-marker', $event)"
                    @toggle-star-variant="$emit('toggle-star-variant', $event)"
                    @set-reference-variant="$emit('set-reference-variant', $event)"
                />
                <VariantSifterCredibleSetsTrack
                    v-if="hasSelectedCredibleSets"
                    :selected-sets="credibleSetsTrackData"
                    :color-by-set-id="credibleSetColors"
                    :region="searchSession?.region"
                    :view-region="viewRegion"
                    :region-zoom="regionZoom"
                    :region-shift-bp="regionShiftBp"
                    :region-view-area="regionViewArea"
                    :search-session="searchSession"
                    :shared-canvas-width="stackCanvasWidth"
                    :plot-markers="plotMarkers"
                    :utils="utils"
                    @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                    @pan-end="$emit('pan-end')"
                    @toggle-position-marker="$emit('toggle-position-marker', $event)"
                    @toggle-star-variant="$emit('toggle-star-variant', $event)"
                    @set-reference-variant="$emit('set-reference-variant', $event)"
                />
                <VariantSifterGenesTrack
                    :key="genesTrackKey"
                    :genes="genesTrackData"
                    :region="searchSession?.region"
                    :view-region="viewRegion"
                    :plot-margin="plotMargin"
                    :region-zoom="regionZoom"
                    :shared-canvas-width="stackCanvasWidth"
                    :plot-markers="plotMarkers"
                />
            </div>
            <p v-if="regionDataLoading" class="vks-associations-plot-note">
                Loading extended region…
            </p>
            <p v-else-if="ldLoading" class="vks-associations-plot-note">
                Loading LD scores for table…
            </p>
            <p v-else-if="ldError" class="vks-associations-plot-note">
                {{ ldError }}
            </p>
        </template>
    </div>
</template>

<script>
import VariantSifterGenesTrack from "./VariantSifterGenesTrack.vue";
import VariantSifterCredibleSetsTrack from "./VariantSifterCredibleSetsTrack.vue";
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
        VariantSifterCredibleSetsTrack,
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
        ldError: {
            type: String,
            default: null,
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
        regionViewArea: {
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
        plotMarkers: {
            type: Object,
            default: () => ({
                starredVariants: [],
                positionMarkers: [],
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
        credibleSetsState: {
            type: Object,
            default: () => ({
                selectedIds: [],
                variantsBySet: {},
            }),
        },
        credibleSetColors: {
            type: Object,
            default: () => ({}),
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
        hasSelectedCredibleSets() {
            return (this.credibleSetsState?.selectedIds || []).length > 0;
        },
        credibleSetsTrackData() {
            return (this.credibleSetsState?.selectedIds || []).map((credibleSetId) => {
                const setState = this.credibleSetsState?.variantsBySet?.[credibleSetId];
                return {
                    credibleSetId,
                    variants: setState?.rawVariants || [],
                    formattedVariants: setState?.formattedVariants || [],
                };
            });
        },
    },
    watch: {
        plotData(hasData) {
            if (hasData?.length) {
                this.$nextTick(() => this.updateStackCanvasWidth());
            }
        },
        selectedSets: {
            handler() {
                this.$nextTick(() => this.updateStackCanvasWidth());
            },
            deep: true,
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

.vks-associations-plot-stack {
    min-height: 280px;
    padding: 0 8px;
    position: relative;
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
