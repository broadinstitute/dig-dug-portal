<template>
    <div class="vks-canvas">
        <div class="vks-canvas-viewport" :style="viewportStyle">
            <VariantSifterWelcomePanel
                v-if="welcomeOpen"
                :phenotypes="phenotypes"
                :ancestries="ancestries"
                :utils="utils"
                :initial-values="welcomeInitialValues"
                @start-search="$emit('start-search', $event)"
            />
            <div
                v-if="canvasActive"
                class="vks-canvas-tracks"
                :style="tracksStyle"
            >
                <VariantSifterTrackStrip
                    v-for="section in sections"
                    :key="section.id"
                    :section="section"
                    :zoom-level="zoomLevel"
                    :search-session="searchSession"
                />
            </div>
            <VariantSifterSectionDrawers
                :sections="sections"
                :open-drawer-id="openDrawerId"
                @toggle-drawer="onToggleDrawer"
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
import VariantSifterSectionDrawers from "./VariantSifterSectionDrawers.vue";
import VariantSifterDataTableModal from "./VariantSifterDataTableModal.vue";
import VariantSifterWelcomePanel from "./VariantSifterWelcomePanel.vue";
import { drawerRailMinHeight } from "./variantSifterSections.js";

export default {
    name: "VariantSifterCanvas",
    components: {
        VariantSifterTrackStrip,
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
        ancestries: {
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
        zoomLevel: {
            type: Number,
            default: 1,
        },
        dataTableOpen: {
            type: Boolean,
            default: false,
        },
        openDrawerId: {
            type: String,
            default: null,
        },
    },
    computed: {
        viewportStyle() {
            return {
                minHeight: `${drawerRailMinHeight(this.sections)}px`,
                height: "auto",
                maxHeight: "none",
            };
        },
        tracksStyle() {
            return {
                transform: `scale(${this.zoomLevel})`,
                transformOrigin: "top center",
            };
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
    background: var(--cfde-bg, #f6f5f2);
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
