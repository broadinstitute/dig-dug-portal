<template>
    <div class="kp-variant-sifter-workspace">
        <header class="vks-header">
            <div class="vks-brand">
                <span class="vks-mark">KP</span>
                <span class="vks-title">Variant Sifter</span>
            </div>
            <VariantSifterMenuBar @action="onMenuAction" />
            <VariantSifterViewportControls
                :region-zoom="regionZoom"
                :region-view-area="regionViewArea"
                :data-table-open="dataTableOpen"
                :ai-assistant-open="aiAssistantOpen"
                @update:regionZoom="onRegionZoomUpdate"
                @update:dataTableOpen="dataTableOpen = $event"
                @toggle-assistant="aiAssistantOpen = !aiAssistantOpen"
            />
        </header>

        <input
            ref="sessionImportInput"
            type="file"
            accept=".json,application/json"
            class="vks-session-import-input"
            @change="onSessionFileSelected"
        />

        <div class="vks-stage">
            <VariantSifterCanvas
                :sections="sections"
                :canvas-active="canvasActive"
                :welcome-open="welcomeOpen"
                :phenotypes="phenotypes"
                :utils="utilsBox"
                :welcome-initial-values="welcomeInitialValues"
                :search-session="searchSession"
                :region-zoom="regionZoom"
                :region-view-area="regionViewArea"
                :data-table-open="dataTableOpen"
                :open-drawer-id="openDrawerId"
                :associations-state="associationsState"
                @update:openDrawerId="openDrawerId = $event"
                @update:regionViewArea="regionViewArea = $event"
                @update:associationsFiltersIndex="onAssociationsFiltersIndexUpdate"
                @close-data-table="dataTableOpen = false"
                @start-search="onStartSearch"
                @import-session="openSessionImport"
            />
            <VariantSifterAiAssistantPanel
                :open="aiAssistantOpen"
                @close="aiAssistantOpen = false"
            />
        </div>

        <VariantSifterExportSessionModal
            :open="exportSessionOpen"
            :default-filename="exportSessionDefaultFilename"
            :summary="exportSessionSummary"
            :exporting="exportSessionBusy"
            @close="exportSessionOpen = false"
            @export="onExportSessionConfirm"
        />
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";

import VariantSifterMenuBar from "./kpVariantSifter/VariantSifterMenuBar.vue";
import VariantSifterViewportControls from "./kpVariantSifter/VariantSifterViewportControls.vue";
import VariantSifterCanvas from "./kpVariantSifter/VariantSifterCanvas.vue";
import VariantSifterAiAssistantPanel from "./kpVariantSifter/VariantSifterAiAssistantPanel.vue";
import VariantSifterExportSessionModal from "./kpVariantSifter/VariantSifterExportSessionModal.vue";
import { VARIANT_SIFTER_SECTIONS } from "./kpVariantSifter/variantSifterSections.js";
import { parseRegionParam, formatRegion } from "./kpVariantSifter/variantSifterSearchUtils.js";
import { fetchAssociations } from "./kpVariantSifter/variantSifterAssociationsApi.js";
import { formatAssociationRows } from "./kpVariantSifter/variantSifterAssociationsTable.js";
import { createFiltersIndex } from "./kpVariantSifter/variantSifterAssociationsFilters.js";
import { enrichAssociationRowsWithLdScores } from "./kpVariantSifter/variantSifterLdServer.js";
import {
    buildSessionExportFilename,
    countActiveAssociationFilters,
    exportVariantSifterSession,
    importVariantSifterSession,
    readSessionFile,
    saveJsonBundle,
} from "./kpVariantSifter/variantSifterSession.js";
import { clampRegionZoom } from "./kpVariantSifter/variantSifterRegionZoom.js";
import "./kpVariantSifter/vksSharedStyles.css";

function emptyAssociationsState() {
    return {
        loading: false,
        ldLoading: false,
        error: null,
        ldError: null,
        rows: [],
        index: null,
        query: null,
        filtersIndex: createFiltersIndex(),
    };
}

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export default Vue.component("kp-variant-sifter", {
    props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
    components: {
        VariantSifterMenuBar,
        VariantSifterViewportControls,
        VariantSifterCanvas,
        VariantSifterAiAssistantPanel,
        VariantSifterExportSessionModal,
    },
    data() {
        return {
            sections: VARIANT_SIFTER_SECTIONS,
            canvasActive: false,
            welcomeOpen: true,
            searchSession: null,
            welcomeInitialValues: null,
            regionZoom: 0,
            regionViewArea: 0,
            dataTableOpen: false,
            aiAssistantOpen: false,
            openDrawerId: null,
            associationsState: emptyAssociationsState(),
            associationsRequestToken: 0,
            exportSessionOpen: false,
            exportSessionBusy: false,
        };
    },
    computed: {
        phenotypes() {
            return this.phenotypesInUse || [];
        },
        exportSessionDefaultFilename() {
            if (!this.searchSession) {
                return "vks-session-export.json";
            }
            return buildSessionExportFilename(this.searchSession);
        },
        exportSessionSummary() {
            const rows = this.associationsState?.rows?.length || 0;
            if (!rows) {
                return "";
            }
            const filterCount = countActiveAssociationFilters(
                this.associationsState.filtersIndex
            );
            if (!filterCount) {
                return `${rows.toLocaleString()} association rows`;
            }
            const filterLabel =
                filterCount === 1
                    ? "1 active filter"
                    : `${filterCount} active filters`;
            return `${rows.toLocaleString()} association rows · ${filterLabel}`;
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
        onRegionZoomUpdate(nextZoom) {
            const zoom = clampRegionZoom(nextZoom);
            this.regionZoom = zoom;
            if (zoom === 0) {
                this.regionViewArea = 0;
            }
        },
        resetRegionViewport() {
            this.regionZoom = 0;
            this.regionViewArea = 0;
        },
        onMenuAction(payload) {
            if (payload.action === "downloadTable") {
                this.dataTableOpen = true;
                return;
            }
            if (payload.action === "newSearch") {
                this.openWelcomePanel();
                return;
            }
            if (payload.action === "exportSession") {
                this.exportSession();
                return;
            }
            if (payload.action === "importSession") {
                this.openSessionImport();
            }
        },
        exportSession() {
            try {
                exportVariantSifterSession({
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    regionZoom: this.regionZoom,
                    regionViewArea: this.regionViewArea,
                    openDrawerId: this.openDrawerId,
                });
                this.exportSessionOpen = true;
            } catch (error) {
                window.alert(error.message || "Could not export session.");
            }
        },
        async onExportSessionConfirm({ filename }) {
            if (this.exportSessionBusy) {
                return;
            }

            try {
                const payload = exportVariantSifterSession({
                    searchSession: this.searchSession,
                    associationsState: this.associationsState,
                    regionZoom: this.regionZoom,
                    regionViewArea: this.regionViewArea,
                    openDrawerId: this.openDrawerId,
                });
                this.exportSessionBusy = true;
                const result = await saveJsonBundle(filename, payload);
                if (result.ok) {
                    this.exportSessionOpen = false;
                }
            } catch (error) {
                window.alert(error.message || "Could not export session.");
            } finally {
                this.exportSessionBusy = false;
            }
        },
        openSessionImport() {
            const input = this.$refs.sessionImportInput;
            if (input) {
                input.value = "";
                input.click();
            }
        },
        async onSessionFileSelected(event) {
            const file = event.target.files?.[0];
            if (!file) {
                return;
            }

            try {
                const payload = await readSessionFile(file);
                const restored = importVariantSifterSession(payload, this.phenotypes);
                this.applyImportedSession(restored);
            } catch (error) {
                window.alert(error.message || "Could not import session.");
            } finally {
                event.target.value = "";
            }
        },
        applyImportedSession(restored) {
            this.associationsRequestToken += 1;
            this.searchSession = restored.searchSession;
            this.associationsState = restored.associationsState;
            this.regionZoom = restored.regionZoom ?? 0;
            this.regionViewArea = restored.regionViewArea ?? 0;
            this.openDrawerId = restored.openDrawerId;
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.welcomeInitialValues = null;
            this.dataTableOpen = false;
            this.syncUrlSearchParams(restored.searchSession);
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
            this.resetRegionViewport();
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.syncUrlSearchParams(session);
            this.loadAssociations(session);
        },
        async loadAssociations(session) {
            const token = ++this.associationsRequestToken;
            this.associationsState = {
                ...emptyAssociationsState(),
                loading: true,
            };

            const host = this.utilsBox?.uiUtils?.biDomain?.();
            if (!host) {
                this.associationsState = {
                    ...emptyAssociationsState(),
                    error: "BioIndex host is not available.",
                };
                return;
            }

            try {
                const result = await fetchAssociations(session, host);
                if (token !== this.associationsRequestToken) {
                    return;
                }

                const formattedRows = formatAssociationRows(result.rows, session);
                this.associationsState = {
                    ...this.associationsState,
                    loading: false,
                    ldLoading: true,
                    error: null,
                    ldError: null,
                    rows: formattedRows,
                    index: result.index,
                    query: result.q,
                };

                try {
                    const rowsWithLd = await enrichAssociationRowsWithLdScores(
                        formattedRows,
                        session
                    );
                    if (token !== this.associationsRequestToken) {
                        return;
                    }
                    this.associationsState = {
                        ...this.associationsState,
                        ldLoading: false,
                        rows: rowsWithLd,
                    };
                } catch (ldError) {
                    if (token !== this.associationsRequestToken) {
                        return;
                    }
                    console.warn("Variant Sifter LD score fetch failed", ldError);
                    this.associationsState = {
                        ...this.associationsState,
                        ldLoading: false,
                        ldError: "LD scores could not be loaded for this locus.",
                    };
                }
            } catch (error) {
                if (token !== this.associationsRequestToken) {
                    return;
                }
                console.warn("Variant Sifter associations load failed", error);
                this.associationsState = {
                    ...emptyAssociationsState(),
                    error: "Failed to load associations. Please try again.",
                };
            }
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
        onAssociationsFiltersIndexUpdate(filtersIndex) {
            this.associationsState = {
                ...this.associationsState,
                filtersIndex,
            };
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

.vks-session-import-input {
    display: none;
}
</style>
