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
                        :search-session="searchSession"
                    />
                </template>
            </div>
            <VariantSifterSectionDrawers
                :sections="sections"
                :open-drawer-id="openDrawerId"
                :search-session="searchSession"
                :associations-state="associationsState"
                :plot-overlays-state="plotOverlaysState"
                :plot-markers="plotMarkers"
                :utils="utils"
                @toggle-drawer="onToggleDrawer"
                @update:associationsFiltersIndex="$emit('update:associationsFiltersIndex', $event)"
                @toggle-star-variant="$emit('toggle-star-variant', $event)"
            />
            <VariantSifterDataTableModal
                :open="dataTableOpen"
                @close="$emit('close-data-table')"
            />
        </div>
    </div>
</template>

<script>
import VariantSifterTrackStrip from "./VariantSifterTrackStrip.vue";
import VariantSifterAssociationsPlot from "./VariantSifterAssociationsPlot.vue";
import VariantSifterSectionDrawers from "./VariantSifterSectionDrawers.vue";
import VariantSifterDataTableModal from "./VariantSifterDataTableModal.vue";
import VariantSifterWelcomePanel from "./VariantSifterWelcomePanel.vue";
import { drawerRailMinHeight, sectionHasCanvasTrack } from "./variantSifterSections.js";
import { applyAssociationsFilters } from "./variantSifterAssociationsFilters.js";

export default {
    name: "VariantSifterCanvas",
    components: {
        VariantSifterTrackStrip,
        VariantSifterAssociationsPlot,
        VariantSifterSectionDrawers,
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
        openDrawerId: {
            type: String,
            default: null,
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
    },
    computed: {
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
    methods: {
        onToggleDrawer(sectionId) {
            const nextId = this.openDrawerId === sectionId ? null : sectionId;
            this.$emit("update:openDrawerId", nextId);
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
