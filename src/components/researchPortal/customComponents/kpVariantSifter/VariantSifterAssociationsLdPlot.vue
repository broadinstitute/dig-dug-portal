<template>
    <div v-if="hasSeriesData" class="vks-assoc-ld-plot" :class="{ 'is-stack': isStacked }">
        <template v-if="isStacked">
            <div
                v-for="series in plotSeries"
                :key="seriesKey(series)"
                class="vks-assoc-ld-stack-item"
            >
                <header class="vks-assoc-ld-stack-head">
                    <h4 class="vks-assoc-ld-stack-title">
                        <template v-if="multiPhenotype && series.phenotypeLabel">
                            <span class="vks-assoc-ld-stack-phenotype">
                                {{ series.phenotypeLabel }}
                            </span>
                            <span class="vks-assoc-ld-stack-sep">·</span>
                        </template>
                        {{ ancestryTitle(series) }}
                        <span class="vks-assoc-ld-stack-code">({{ series.ancestry }})</span>
                    </h4>
                    <span class="vks-assoc-ld-stack-count">
                        {{ series.rows.length.toLocaleString() }} associations
                    </span>
                </header>
                <div class="vks-assoc-ld-panel">
                    <VariantSifterLdRegionPlot
                        v-if="plotDataForSeries(series)"
                        :plot-rows="plotDataForSeries(series)"
                        :search-session="searchSession"
                        :plot-overlays-state="plotOverlaysState"
                        :plot-margin="plotMargin"
                        :plot-markers="plotMarkers"
                        :highlight-variant-id="hoveredVariantId"
                        :utils="utils"
                        @hover-variant="onHoverVariant"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                    />
                    <p v-else class="vks-assoc-ld-empty">
                        No LD points for {{ seriesDisplayLabel(series) }}.
                    </p>
                </div>
            </div>
        </template>
        <template v-else>
            <div v-if="showTabs" class="vks-assoc-ld-tab-bar">
                <div class="vks-assoc-ld-tabs" role="tablist" aria-label="Association LD plots">
                    <button
                        v-for="series in plotSeries"
                        :key="seriesKey(series)"
                        type="button"
                        class="vks-assoc-ld-tab"
                        :class="{ 'is-active': seriesKey(series) === activeSeriesKey }"
                        role="tab"
                        :aria-selected="seriesKey(series) === activeSeriesKey ? 'true' : 'false'"
                        :title="`${seriesDisplayLabel(series)} · ${series.rows.length.toLocaleString()} associations`"
                        @click="activeSeriesKey = seriesKey(series)"
                    >
                        <span
                            v-if="multiPhenotype && series.phenotypeLabel"
                            class="vks-assoc-ld-tab-phenotype"
                        >
                            {{ series.phenotypeLabel }}
                        </span>
                        <span class="vks-assoc-ld-tab-code">{{ series.ancestry }}</span>
                        <span class="vks-assoc-ld-tab-label">{{ ancestryTitle(series) }}</span>
                        <span class="vks-assoc-ld-tab-count">{{ series.rows.length.toLocaleString() }}</span>
                    </button>
                </div>
            </div>
            <p v-else-if="activeSeries" class="vks-assoc-ld-single-label">
                <template v-if="multiPhenotype && activeSeries.phenotypeLabel">
                    {{ activeSeries.phenotypeLabel }}
                    <span class="vks-assoc-ld-stack-sep">·</span>
                </template>
                {{ ancestryTitle(activeSeries) }}
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
                    :key="activeSeriesKey"
                    :plot-rows="activePlotData"
                    :search-session="searchSession"
                    :plot-overlays-state="plotOverlaysState"
                    :plot-margin="plotMargin"
                    :plot-markers="plotMarkers"
                    :highlight-variant-id="hoveredVariantId"
                    :utils="utils"
                    @hover-variant="onHoverVariant"
                    @toggle-star-variant="$emit('toggle-star-variant', $event)"
                    @set-reference-variant="$emit('set-reference-variant', $event)"
                />
                <p v-else class="vks-assoc-ld-empty">
                    No LD points for {{ seriesDisplayLabel(activeSeries) || "this series" }}.
                </p>
            </div>
        </template>
    </div>
</template>

<script>
import VariantSifterLdRegionPlot from "./VariantSifterLdRegionPlot.vue";
import {
    buildAssociationPlotSeries,
    primaryAssociationAncestry,
} from "./variantSifterAssociationsApi.js";
import { ancestryLabel } from "./variantSifterSearchUtils.js";
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
        selectedPhenotypes: {
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
        layout: {
            type: String,
            default: "tabs",
        },
        utils: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            activeSeriesKey: null,
            hoveredVariantId: null,
        };
    },
    computed: {
        isStacked() {
            return this.layout === "stack";
        },
        resolvedPrimaryAncestry() {
            return this.primaryAncestry || primaryAssociationAncestry(this.searchSession);
        },
        multiPhenotype() {
            return (this.selectedPhenotypes || []).length > 0;
        },
        plotSeries() {
            return buildAssociationPlotSeries({
                rows: this.rows,
                primaryAncestry: this.resolvedPrimaryAncestry,
                selectedAncestries: this.selectedAncestries,
                primaryPhenotype: this.searchSession?.phenotype || null,
                selectedPhenotypes: this.selectedPhenotypes,
                project: "KP",
            }).filter((series) => series.rows.length > 0);
        },
        showTabs() {
            return !this.isStacked && this.plotSeries.length > 1;
        },
        hasSeriesData() {
            return this.plotSeries.length > 0;
        },
        activeSeries() {
            return (
                this.plotSeries.find(
                    (series) => this.seriesKey(series) === this.activeSeriesKey
                ) ||
                this.plotSeries[0] ||
                null
            );
        },
        activePlotData() {
            return this.plotDataForSeries(this.activeSeries);
        },
        plotMargin() {
            return VARIANT_SIFTER_PLOT_MARGIN;
        },
    },
    watch: {
        plotSeries: {
            immediate: true,
            handler(series) {
                const keys = series.map((entry) => this.seriesKey(entry));
                if (!keys.length) {
                    this.activeSeriesKey = null;
                    return;
                }
                if (!keys.includes(this.activeSeriesKey)) {
                    this.activeSeriesKey = keys[0];
                }
            },
        },
    },
    methods: {
        seriesKey(series) {
            return `${series?.phenotype || "primary"}@@${series?.ancestry || ""}`;
        },
        ancestryTitle(series) {
            if (!series) {
                return "";
            }
            // Prefer ancestry wording even when series.label is a phenotype name.
            return ancestryLabel(series.ancestry) || series.label || series.ancestry;
        },
        seriesDisplayLabel(series) {
            if (!series) {
                return "";
            }
            const ancestry = this.ancestryTitle(series);
            if (this.multiPhenotype && series.phenotypeLabel) {
                return `${series.phenotypeLabel} · ${ancestry}`;
            }
            return ancestry;
        },
        plotDataForSeries(series) {
            if (!series?.rows?.length) {
                return null;
            }
            return associationRowsToPlotData(series.rows);
        },
        onHoverVariant(variantId) {
            this.hoveredVariantId = variantId || null;
        },
    },
};
</script>

<style scoped>
.vks-assoc-ld-plot {
    margin-bottom: 12px;
}

.vks-assoc-ld-plot.is-stack {
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.vks-assoc-ld-stack-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.vks-assoc-ld-stack-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 12px;
}

.vks-assoc-ld-stack-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-assoc-ld-stack-phenotype {
    color: var(--cfde-blue, #2c5c97);
}

.vks-assoc-ld-stack-sep {
    margin: 0 4px;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assoc-ld-stack-code {
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assoc-ld-stack-count {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    font-variant-numeric: tabular-nums;
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

.vks-assoc-ld-tab-phenotype {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
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
