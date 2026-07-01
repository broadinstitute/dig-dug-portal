<template>
    <div
        class="vks-section-drawers"
        :class="{ 'is-rail-pinned': railPinned }"
        :style="railPinStyle"
    >
        <aside
            class="vks-section-drawer-panel"
            :class="{ 'is-open': Boolean(openSection) }"
            :aria-hidden="openSection ? 'false' : 'true'"
        >
            <template v-if="openSection">
                <header class="vks-section-drawer-head">
                    <h3 class="vks-section-drawer-title">{{ openSection.label }}</h3>
                    <button
                        type="button"
                        class="vks-section-drawer-close"
                        :aria-label="'Close ' + openSection.label"
                        @click="$emit('toggle-drawer', openDrawerId)"
                    >
                        &times;
                    </button>
                </header>
                <div class="vks-section-drawer-body">
                    <VariantSifterAssociationsDrawer
                        v-if="openSection.id === 'associations'"
                        :rows="associationsState.rows"
                        :filters-index="associationsState.filtersIndex"
                        :loading="associationsState.loading"
                        :error="associationsState.error"
                        :index-name="associationsState.index"
                        :query-string="associationsState.query"
                        :search-session="searchSession"
                        :utils="utils"
                        :ld-loading="associationsState.ldLoading"
                        :ld-error="associationsState.ldError"
                        :plot-overlays-state="plotOverlaysState"
                        :plot-markers="plotMarkers"
                        :starred-variant-ids="starredVariantIds"
                        @update:filtersIndex="$emit('update:associationsFiltersIndex', $event)"
                        @toggle-star-variant="$emit('toggle-star-variant', $event)"
                        @set-reference-variant="$emit('set-reference-variant', $event)"
                    />
                    <VariantSifterCredibleSetsDrawer
                        v-else-if="openSection.id === 'credible-sets'"
                        :credible-sets-state="credibleSetsState"
                        :color-by-set-id="credibleSetPillColors"
                        :utils="utils"
                        @add-set="$emit('add-credible-set', $event)"
                        @remove-set="$emit('remove-credible-set', $event)"
                    />
                    <template v-else>
                        <p class="vks-section-drawer-note">{{ openSection.description }}</p>
                        <p class="vks-section-drawer-note">
                            Search and filter UI for this section will appear here.
                        </p>
                    </template>
                </div>
            </template>
        </aside>
        <div class="vks-section-drawer-tabs" role="tablist" aria-label="Section controls">
            <button
                v-for="section in sections"
                :key="section.id"
                type="button"
                role="tab"
                class="vks-section-drawer-tab"
                :class="{
                    'is-active': section.id === openDrawerId,
                    'is-attached': section.id === openDrawerId && Boolean(openDrawerId),
                }"
                :style="tabStyle(section)"
                :aria-selected="section.id === openDrawerId ? 'true' : 'false'"
                :title="section.label"
                @click="$emit('toggle-drawer', section.id)"
            >
                <span class="vks-section-drawer-tab-label">{{ drawerTabLabel(section) }}</span>
            </button>
        </div>
    </div>
</template>

<script>
import { drawerTabLabel, drawerTabHeight, sectionById } from "./variantSifterSections.js";
import VariantSifterAssociationsDrawer from "./VariantSifterAssociationsDrawer.vue";

import VariantSifterCredibleSetsDrawer from "./VariantSifterCredibleSetsDrawer.vue";

export default {
    name: "VariantSifterSectionDrawers",
    components: {
        VariantSifterAssociationsDrawer,
        VariantSifterCredibleSetsDrawer,
    },
    props: {
        sections: {
            type: Array,
            default: () => [],
        },
        openDrawerId: {
            type: String,
            default: null,
        },
        searchSession: {
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
        utils: {
            type: Object,
            default: null,
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
        credibleSetPillColors: {
            type: Object,
            default: () => ({}),
        },
        railPinned: {
            type: Boolean,
            default: false,
        },
        railPinStyle: {
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
        openSection() {
            return sectionById(this.openDrawerId);
        },
    },
    methods: {
        drawerTabLabel(section) {
            return drawerTabLabel(section);
        },
        tabStyle(section) {
            return { height: `${drawerTabHeight(section)}px` };
        },
    },
};
</script>

<style scoped>
.vks-section-drawers {
    position: relative;
    flex-shrink: 0;
    width: var(--vks-drawer-tab-width, 30px);
    height: 100%;
    min-height: 240px;
    pointer-events: none;
    z-index: 6;
}

.vks-section-drawers.is-rail-pinned {
    pointer-events: none;
}

.vks-section-drawer-tabs {
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 0;
    width: var(--vks-drawer-tab-width, 30px);
}

.vks-section-drawer-tab {
    box-sizing: border-box;
    width: var(--vks-drawer-tab-width, 30px);
    min-height: 88px;
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-right: none;
    border-radius: 8px 0 0 8px;
    background: #ffffff;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    box-shadow: -3px 0 10px rgba(20, 22, 30, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease;
}

.vks-section-drawer-tab.is-attached {
    transform: translateX(
        calc(-1 * (var(--vks-drawer-open-width, 75vw) + var(--vks-drawer-tab-width, 30px)))
    );
    z-index: 2;
}

.vks-section-drawer-tab:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.vks-section-drawer-tab.is-active {
    border-color: var(--cfde-orange, #e07b39);
}

.vks-section-drawer-tab-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.2;
    max-height: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.vks-section-drawer-panel {
    position: absolute;
    top: 0;
    right: var(--vks-drawer-tab-width, 30px);
    bottom: 0;
    pointer-events: auto;
    width: 0;
    overflow: hidden;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    transition: width 0.22s ease;
    z-index: 1;
}

.vks-section-drawer-panel.is-open {
    width: var(--vks-drawer-open-width, 75vw);
    border-left: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-section-drawer-head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-section-drawer-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-section-drawer-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.vks-section-drawer-close:hover {
    color: var(--cfde-ink, #33363d);
}

.vks-section-drawer-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 14px 16px;
}

.vks-section-drawer-note {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
