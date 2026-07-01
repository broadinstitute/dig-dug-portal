<template>
    <div class="vks-canvas">
        <div class="vks-canvas-viewport" :style="viewportStyle">
            <VariantSifterWelcomePanel
                v-if="welcomeOpen"
                :phenotypes="phenotypes"
                :utils="utils"
                :initial-values="welcomeInitialValues"
                @start-search="$emit('start-search', $event)"
                @import-session="$emit('import-session')"
            />
            <div v-if="canvasActive" class="vks-canvas-tracks">
                <template v-for="section in canvasTrackSections">
                    <VariantSifterAssociationsPlot
                        v-if="section.id === 'associations'"
                        :key="section.id"
                        :rows="associationPlotRows"
                        :loading="associationsState.loading"
                        :ld-loading="associationsState.ldLoading"
                        :ld-error="associationsState.ldError"
                        :error="associationsState.error"
                        :search-session="searchSession"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :view-region="viewRegion"
                        :region-data-loading="regionDataLoading"
                        :genes-state="genesState"
                        :plot-overlays-state="plotOverlaysState"
                        :plot-markers="plotMarkers"
                        :credible-sets-state="credibleSetsState"
                        :credible-set-colors="credibleSetColors"
                        :credible-set-pill-colors="credibleSetPillColors"
                        :utils="utils"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                    />
                    <VariantSifterTrackStrip
                        v-else
                        :key="section.id + '-strip'"
                        :section="section"
                    />
                </template>
            </div>
            <VariantSifterDataTableModal
                :open="dataTableOpen"
                :association-rows="associationsState.rows"
                :credible-sets-state="credibleSetsState"
                :utils="utils"
                :starred-variant-ids="starredVariantIds"
                @close="$emit('close-data-table')"
                @toggle-star-variant="$emit('toggle-star-variant', $event)"
            />
        </div>
    </div>
</template>

<script>
import VariantSifterTrackStrip from "./VariantSifterTrackStrip.vue";
import VariantSifterAssociationsPlot from "./VariantSifterAssociationsPlot.vue";
import VariantSifterDataTableModal from "./VariantSifterDataTableModal.vue";
import VariantSifterWelcomePanel from "./VariantSifterWelcomePanel.vue";
import { drawerRailMinHeight, sectionHasCanvasTrack } from "./variantSifterSections.js";
import { applyAssociationsFilters } from "./variantSifterAssociationsFilters.js";

export default {
    name: "VariantSifterCanvas",
    components: {
        VariantSifterTrackStrip,
        VariantSifterAssociationsPlot,
        VariantSifterDataTableModal,
        VariantSifterWelcomePanel,
    },
    props: {
        sections: {
            type: Array,
            default: () => [],
        },
        canvasActive: {
            type: Boolean,
            default: false,
        },
        welcomeOpen: {
            type: Boolean,
            default: true,
        },
        phenotypes: {
            type: Array,
            default: () => [],
        },
        utils: {
            type: Object,
            default: null,
        },
        welcomeInitialValues: {
            type: Object,
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
        dataTableOpen: {
            type: Boolean,
            default: false,
        },
        associationsState: {
            type: Object,
            default: () => ({
                loading: false,
                ldLoading: false,
                error: null,
                ldError: null,
                rows: [],
                index: null,
                query: null,
                filtersIndex: null,
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
        credibleSetsState: {
            type: Object,
            default: () => ({
                listLoading: false,
                listError: null,
                available: [],
                selectedIds: [],
                variantsBySet: {},
                variantsLoading: false,
                variantsError: null,
            }),
        },
        credibleSetColors: {
            type: Object,
            default: () => ({}),
        },
        credibleSetPillColors: {
            type: Object,
            default: () => ({}),
        },
    },
    computed: {
        starredVariantIds() {
            return (this.plotMarkers?.starredVariants || []).map(
                (entry) => entry.variantId
            );
        },
        associationPlotRows() {
            const { rows, filtersIndex } = this.associationsState;
            if (!rows?.length) {
                return [];
            }
            return applyAssociationsFilters(rows, filtersIndex);
        },
        viewportStyle() {
            return {
                minHeight: `${drawerRailMinHeight(this.sections)}px`,
                height: "auto",
                maxHeight: "none",
            };
        },
        hasAssociationData() {
            const { rows, loading } = this.associationsState;
            return !loading && Array.isArray(rows) && rows.length > 0;
        },
        canvasTrackSections() {
            return this.sections.filter((section) =>
                sectionHasCanvasTrack(section, {
                    hasAssociationData: this.hasAssociationData,
                })
            );
        },
    },
};
</script>

<style scoped>
.vks-canvas {
    display: flex;
    flex-direction: column;
}

.vks-canvas-viewport {
    position: relative;
    background: #ffffff;
    height: auto;
    max-height: none;
}

.vks-canvas-tracks {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: min(100%, 960px);
    margin: 0 auto;
    padding: 12px 44px 24px 12px;
}
</style>
