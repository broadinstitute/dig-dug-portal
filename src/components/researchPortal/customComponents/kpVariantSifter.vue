<template>
    <div class="kp-variant-sifter-workspace">
        <header class="vks-header">
            <div class="vks-brand">
                <span class="vks-mark">KP</span>
                <span class="vks-title">Variant Sifter</span>
            </div>
            <VariantSifterMenuBar @action="onMenuAction" />
            <VariantSifterViewportControls
                :zoom-level="zoomLevel"
                :data-table-open="dataTableOpen"
                :ai-assistant-open="aiAssistantOpen"
                @update:zoomLevel="zoomLevel = $event"
                @update:dataTableOpen="dataTableOpen = $event"
                @toggle-assistant="aiAssistantOpen = !aiAssistantOpen"
            />
        </header>

        <div class="vks-stage">
            <VariantSifterCanvas
                :sections="sections"
                :canvas-active="canvasActive"
                :welcome-open="welcomeOpen"
                :phenotypes="phenotypes"
                :ancestries="ancestryOptions"
                :utils="utilsBox"
                :welcome-initial-values="welcomeInitialValues"
                :search-session="searchSession"
                :zoom-level="zoomLevel"
                :data-table-open="dataTableOpen"
                :open-drawer-id="openDrawerId"
                @update:openDrawerId="openDrawerId = $event"
                @close-data-table="dataTableOpen = false"
                @start-search="onStartSearch"
            />
            <VariantSifterAiAssistantPanel
                :open="aiAssistantOpen"
                @close="aiAssistantOpen = false"
            />
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

import VariantSifterMenuBar from "./kpVariantSifter/VariantSifterMenuBar.vue";
import VariantSifterViewportControls from "./kpVariantSifter/VariantSifterViewportControls.vue";
import VariantSifterCanvas from "./kpVariantSifter/VariantSifterCanvas.vue";
import VariantSifterAiAssistantPanel from "./kpVariantSifter/VariantSifterAiAssistantPanel.vue";
import { VARIANT_SIFTER_SECTIONS } from "./kpVariantSifter/variantSifterSections.js";
import { parseRegionParam, formatRegion } from "./kpVariantSifter/variantSifterSearchUtils.js";
import "./kpVariantSifter/vksSharedStyles.css";

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default Vue.component("kp-variant-sifter", {
    props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
    components: {
        VariantSifterMenuBar,
        VariantSifterViewportControls,
        VariantSifterCanvas,
        VariantSifterAiAssistantPanel,
    },
    data() {
        return {
            sections: VARIANT_SIFTER_SECTIONS,
            canvasActive: false,
            welcomeOpen: true,
            searchSession: null,
            welcomeInitialValues: null,
            zoomLevel: 1,
            dataTableOpen: false,
            aiAssistantOpen: false,
            openDrawerId: null,
        };
    },
    computed: {
        phenotypes() {
            return this.phenotypesInUse || [];
        },
        ancestryOptions() {
            const datasets = this.$store?.state?.bioPortal?.datasets || [];
            return datasets
                .map((dataset) => dataset.ancestry)
                .filter((ancestry) => ancestry && ancestry !== "Mixed");
        },
    },
    mounted() {
        this.applyUrlSearchParams();
    },
    watch: {
        phenotypes() {
            this.applyUrlSearchParams();
        },
    },
    methods: {
        onMenuAction(payload) {
            if (payload.action === "downloadTable") {
                this.dataTableOpen = true;
                return;
            }
            if (payload.action === "newSearch") {
                this.openWelcomePanel();
            }
        },
        openWelcomePanel() {
            if (this.searchSession) {
                this.welcomeInitialValues = {
                    phenotype: this.searchSession.phenotype.name,
                    ancestry: this.searchSession.ancestry || "",
                    geneOrVariantQuery: this.searchSession.geneOrVariantQuery,
                    regionExpandBp: this.searchSession.regionExpandBp,
                };
            }
            this.welcomeOpen = true;
            this.canvasActive = false;
            this.openDrawerId = null;
        },
        onStartSearch(session) {
            this.searchSession = session;
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.syncUrlSearchParams(session);
        },
        applyUrlSearchParams() {
            if (this.canvasActive || this.searchSession) {
                return;
            }

            const params = this.utilsBox?.keyParams;
            if (!params?.phenotype || !params?.region) {
                return;
            }

            const region = parseRegionParam(params.region);
            if (!region) {
                return;
            }

            const phenotype = (this.phenotypes || []).find(
                (entry) => entry.name === params.phenotype
            );
            if (!phenotype) {
                this.welcomeInitialValues = {
                    phenotype: params.phenotype,
                    ancestry: params.ancestry || "",
                    geneOrVariantQuery: params.region,
                };
                return;
            }

            this.onStartSearch({
                phenotype,
                ancestry: params.ancestry || null,
                region,
                regionLabel: formatRegion(region),
                geneOrVariantQuery: params.region,
                regionExpandBp: null,
            });
        },
        syncUrlSearchParams(session) {
            if (!this.utilsBox?.keyParams || !session?.phenotype || !session?.regionLabel) {
                return;
            }

            const nextParams = {
                phenotype: session.phenotype.name,
                region: session.regionLabel,
            };
            if (session.ancestry) {
                nextParams.ancestry = session.ancestry;
            } else {
                nextParams.ancestry = undefined;
            }

            this.utilsBox.keyParams.set(nextParams);
        },
    },
});
</script>

<style scoped>
.kp-variant-sifter-workspace {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    position: relative;
}

.vks-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
    background: #ffffff;
    z-index: 7;
    border-radius: 11px 11px 0 0;
}

.vks-brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 0;
}

.vks-mark {
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cfde-orange, #e07b39);
    font-size: 1.05rem;
}

.vks-title {
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    font-size: 1.05rem;
}

.vks-stage {
    position: relative;
    border-radius: 0 0 11px 11px;
    overflow: hidden;
}
</style>
