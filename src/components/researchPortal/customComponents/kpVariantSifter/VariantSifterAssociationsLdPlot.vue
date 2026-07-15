<template>
    <div v-if="hasSeriesData" class="vks-assoc-ld-plot">
        <div v-if="showTabs" class="vks-assoc-ld-tab-bar">
            <div class="vks-assoc-ld-tabs" role="tablist" aria-label="Ancestry LD plots">
                <button
                    v-for="series in plotSeries"
                    :key="series.ancestry"
                    type="button"
                    class="vks-assoc-ld-tab"
                    :class="{ 'is-active': series.ancestry === activeAncestry }"
                    role="tab"
                    :aria-selected="series.ancestry === activeAncestry ? 'true' : 'false'"
                    :title="`${series.label} · ${series.rows.length.toLocaleString()} associations`"
                    @click="activeAncestry = series.ancestry"
                >
                    <span class="vks-assoc-ld-tab-code">{{ series.ancestry }}</span>
                    <span class="vks-assoc-ld-tab-label">{{ series.label }}</span>
                    <span class="vks-assoc-ld-tab-count">{{ series.rows.length.toLocaleString() }}</span>
                </button>
            </div>
        </div>
        <p v-else-if="activeSeries" class="vks-assoc-ld-single-label">
            {{ activeSeries.label }}
            <span class="vks-assoc-ld-single-count">
                ({{ activeSeries.rows.length.toLocaleString() }})
            </span>
        </p>
        <div
            class="vks-assoc-ld-panel"
            :class="{ 'is-tabbed': showTabs }"
            role="tabpanel"
        >
            <VariantSifterLdRegionPlot
                v-if="activePlotData"
                :key="activeAncestry"
                :plot-rows="activePlotData"
                :search-session="searchSession"
                :plot-overlays-state="plotOverlaysState"
                :plot-margin="plotMargin"
                :plot-markers="plotMarkers"
                :utils="utils"
                @toggle-star-variant="$emit('toggle-star-variant', $event)"
                @set-reference-variant="$emit('set-reference-variant', $event)"
            />
            <p v-else class="vks-assoc-ld-empty">
                No LD points for {{ activeSeries?.label || "this ancestry" }}.
            </p>
        </div>
    </div>
</template>

<script>
import VariantSifterLdRegionPlot from "./VariantSifterLdRegionPlot.vue";
import {
    buildAssociationPlotSeries,
    primaryAssociationAncestry,
} from "./variantSifterAssociationsApi.js";
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
        primaryAncestry: {
            type: String,
            default: null,
        },
        selectedAncestries: {
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
    data() {
        return {
            activeAncestry: null,
        };
    },
    computed: {
        resolvedPrimaryAncestry() {
            return this.primaryAncestry || primaryAssociationAncestry(this.searchSession);
        },
        plotSeries() {
            return buildAssociationPlotSeries({
                rows: this.rows,
                primaryAncestry: this.resolvedPrimaryAncestry,
                selectedAncestries: this.selectedAncestries,
            }).filter((series) => series.rows.length > 0);
        },
        showTabs() {
            return this.plotSeries.length > 1;
        },
        hasSeriesData() {
            return this.plotSeries.length > 0;
        },
        activeSeries() {
            return (
                this.plotSeries.find((series) => series.ancestry === this.activeAncestry) ||
                this.plotSeries[0] ||
                null
            );
        },
        activePlotData() {
            if (!this.activeSeries?.rows?.length) {
                return null;
            }
            return associationRowsToPlotData(this.activeSeries.rows);
        },
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
    },
    watch: {
        plotSeries: {
            immediate: true,
            handler(series) {
                const codes = series.map((entry) => entry.ancestry);
                if (!codes.length) {
                    this.activeAncestry = null;
                    return;
                }
                if (!codes.includes(this.activeAncestry)) {
                    this.activeAncestry = codes[0];
                }
            },
        },
    },
};
</script>

<style scoped>
.vks-assoc-ld-plot {
    margin-bottom: 12px;
}

.vks-assoc-ld-tab-bar {
    margin-bottom: 8px;
}

.vks-assoc-ld-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 3px;
    border-radius: var(--vks-radius-md, 8px);
    background: var(--cfde-header-bg, #f6f5f2);
}

.vks-assoc-ld-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: var(--vks-radius-sm, 6px);
    margin: 0;
    padding: 7px 10px;
    background: transparent;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
    white-space: nowrap;
}

.vks-assoc-ld-tab:hover {
    color: var(--cfde-ink, #33363d);
}

.vks-assoc-ld-tab.is-active {
    background: var(--cfde-bg, #ffffff);
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 1px 3px rgba(20, 22, 30, 0.08);
    z-index: 1;
}

.vks-assoc-ld-tab-code {
    font-weight: 700;
    letter-spacing: 0.02em;
}

.vks-assoc-ld-tab-label {
    font-weight: inherit;
}

.vks-assoc-ld-tab-count {
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
}

.vks-assoc-ld-tab.is-active .vks-assoc-ld-tab-count {
    opacity: 0.85;
}

.vks-assoc-ld-single-label {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.vks-assoc-ld-single-count {
    font-weight: 500;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assoc-ld-panel {
    background: #ffffff;
    padding: 0;
}

.vks-assoc-ld-panel.is-tabbed {
    border: 1px solid #dddddd;
    border-top: none;
    padding: 8px 4px 4px;
}

.vks-assoc-ld-empty {
    margin: 0;
    padding: 16px 10px;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
    text-align: center;
}
</style>
