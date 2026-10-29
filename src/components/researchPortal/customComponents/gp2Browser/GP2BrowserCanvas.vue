<template>
    <div class="vks-canvas">
        <div class="vks-canvas-viewport" :style="viewportStyle">
            <GP2BrowserWelcomePanel
                v-if="welcomeOpen"
                :phenotypes="phenotypes"
                :utils="utils"
                :initial-values="welcomeInitialValues"
                :project-id="projectId"
                :bio-index-host="geneLookupBioIndexHost"
                :welcome-title="welcomeTitle"
                @start-search="$emit('start-search', $event)"
                @import-session="$emit('import-session')"
            />
            <div v-if="canvasActive" class="vks-canvas-tracks">
                <template v-for="section in canvasTrackSections">
                    <GP2BrowserAssociationsPlot
                        v-if="section.id === 'associations'"
                        :key="section.id"
                        :rows="associationPlotRows"
                        :selected-ancestries="associationsState.selectedAncestries || []"
                        :selected-phenotypes="associationsState.selectedPhenotypes || []"
                        :loading="associationsState.loading"
                        :hide-loading-status="regionLoadProgressActive"
                        :ld-loading="associationsState.ldLoading"
                        :ld-error="associationsState.ldError"
                        :error="associationsState.error"
                        :search-session="searchSession"
                        :region-zoom="regionZoom"
                        :region-shift-bp="regionShiftBp"
                        :region-view-area="regionViewArea"
                        :view-region="viewRegion"
                        :active-search-region="activeSearchRegion"
                        :viewing-center-bp="viewingCenterBp"
                        :viewing-region-half-width-bp="viewingRegionHalfWidthBp"
                        :genes-state="genesState"
                        :qtl-state="qtlState"
                        :plot-overlays-state="plotOverlaysState"
                        :plot-markers="plotMarkers"
                        :credible-sets-state="credibleSetsState"
                        :credible-set-colors="credibleSetColors"
                        :credible-set-pill-colors="credibleSetPillColors"
                        :global-enrichment-state="globalEnrichmentState"
                        :v2g-state="v2gState"
                        :s2g-state="s2gState"
                        :visible-section-ids="visibleSectionIds"
                        :workspace-mapping-filter="workspaceMappingFilter"
                        :utils="utils"
                        :tissue-regions-host="tissueRegionsHost"
                        :project-id="projectId"
                        @update:regionShiftBp="$emit('update:regionShiftBp', $event)"
                        @update:regionViewArea="$emit('update:regionViewArea', $event)"
                        @update:viewingCenterBp="$emit('update:viewingCenterBp', $event)"
                        @commit-viewing-region="$emit('commit-viewing-region')"
                        @pan-end="$emit('pan-end')"
                        @toggle-position-marker="$emit('toggle-position-marker', $event)"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @toggle-qtl-star-variant="$emit('toggle-qtl-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                        @update:geSelectedBiosamples="$emit('update:geSelectedBiosamples', $event)"
                        @update:geActiveAnnotation="$emit('update:geActiveAnnotation', $event)"
                        @update:geSelectedTissues="$emit('update:geSelectedTissues', $event)"
                        @update:geSelectedAnnotations="$emit('update:geSelectedAnnotations', $event)"
                        @select-ge-plot-tissue="$emit('select-ge-plot-tissue', $event)"
                        @update:geBiosampleFilterOptions="
                            $emit('update:geBiosampleFilterOptions', $event)
                        "
                        @update:geBiosampleTissueRegions="
                            $emit('update:geBiosampleTissueRegions', $event)
                        "
                        @update:geBiosampleLoading="$emit('update:geBiosampleLoading', $event)"
                        @update:v2gSelectedLinks="$emit('update:v2gSelectedLinks', $event)"
                        @update:s2gSelectedLinks="$emit('update:s2gSelectedLinks', $event)"
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
                :association-rows="associationTableRows"
                :search-session="searchSession"
                :selected-phenotypes="associationsState.selectedPhenotypes || []"
                :project-id="projectId"
                :credible-sets-state="credibleSetsState"
                :global-enrichment-state="globalEnrichmentState"
                :v2g-state="v2gState"
                :s2g-state="s2gState"
                :mapping-state="mappingState"
                :workspace-mapping-filter="workspaceMappingFilter"
                :utils="utils"
                :starred-variant-ids="starredVariantIds"
                @close="$emit('close-data-table')"
                @toggle-star-variant="$emit('toggle-star-variant', $event)"
                @update:mappingState="$emit('update:mappingState', $event)"
                @update:workspaceFilterActive="$emit('update:workspaceFilterActive', $event)"
                @remove-mapping-category="$emit('remove-mapping-category', $event)"
            />
        </div>
    </div>
</template>

<script>
import VariantSifterTrackStrip from "../kpVariantSifter/VariantSifterTrackStrip.vue";
import GP2BrowserAssociationsPlot from "./GP2BrowserAssociationsPlot.vue";
import VariantSifterDataTableModal from "../kpVariantSifter/VariantSifterDataTableModal.vue";
import GP2BrowserWelcomePanel from "./GP2BrowserWelcomePanel.vue";
import { drawerRailMinHeight, sectionHasCanvasTrack } from "./gp2BrowserSections.js";
import { applyAssociationsFilters } from "../kpVariantSifter/variantSifterAssociationsFilters.js";
import { applyWorkspaceMappingToAssociationRows } from "../kpVariantSifter/variantSifterMappingData.js";
import {
    addMissingStarredAssociationRows,
    stripZoomRefetchedRows,
} from "./gp2BrowserAssociationsDownsample.js";

export default {
    name: "GP2BrowserCanvas",
    components: {
        VariantSifterTrackStrip,
        GP2BrowserAssociationsPlot,
        VariantSifterDataTableModal,
        GP2BrowserWelcomePanel,
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
        welcomeTitle: {
            type: String,
            default: "Welcome to GP2 Browser",
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
        projectId: {
            type: String,
            default: "",
        },
        geneLookupBioIndexHost: {
            type: String,
            default: "",
        },
        tissueRegionsHost: {
            type: String,
            default: "",
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
        activeSearchRegion: {
            type: Object,
            default: null,
        },
        viewingCenterBp: {
            type: Number,
            default: null,
        },
        viewingRegionHalfWidthBp: {
            type: Number,
            default: null,
        },
        dataTableOpen: {
            type: Boolean,
            default: false,
        },
        mappingState: {
            type: Object,
            default: () => ({
                selectedCategoryIds: [],
                mappingMode: "or",
            }),
        },
        workspaceMappingFilter: {
            type: Object,
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
        qtlState: {
            type: Object,
            default: () => ({
                loading: false,
                error: null,
                rawRows: [],
                selectedTypes: [],
                selectedTissues: [],
                pValueMax: "",
                loadedRegionKey: null,
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
        globalEnrichmentState: {
            type: Object,
            default: () => ({
                annoData: {},
                geRows: [],
                catalog: { annotations: [] },
                selectedAnnotations: [],
            }),
        },
        v2gState: {
            type: Object,
            default: () => ({
                tissueData: {},
                selectedTissues: [],
                loadingTissue: null,
                error: null,
                deselectedMethods: [],
                deselectedGenes: [],
            }),
        },
        s2gState: {
            type: Object,
            default: () => ({
                tissueData: {},
                selectedTissues: [],
                loadingTissue: null,
                error: null,
                deselectedMethods: [],
                deselectedGenes: [],
            }),
        },
        visibleSectionIds: {
            type: Array,
            default: null,
        },
        regionLoadProgressActive: {
            type: Boolean,
            default: false,
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
            const filtered = applyAssociationsFilters(rows, filtersIndex);
            return applyWorkspaceMappingToAssociationRows(
                filtered,
                this.workspaceMappingFilter
            );
        },
        /**
         * Same association-filter view as the Associations drawer table
         * (before mapping chips): the stable, downsampled searching-region
         * baseline plus any starred variant that would otherwise be missing.
         */
        associationTableRows() {
            const { rows, filtersIndex } = this.associationsState;
            if (!rows?.length) {
                return [];
            }
            const baseline = addMissingStarredAssociationRows(
                stripZoomRefetchedRows(rows),
                this.plotMarkers?.starredVariants
            );
            return applyAssociationsFilters(baseline, filtersIndex);
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
