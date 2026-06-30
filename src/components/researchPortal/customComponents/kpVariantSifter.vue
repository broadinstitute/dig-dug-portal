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
                :region-shift-bp="regionShiftBp"
                :view-region="viewRegion"
                :region-data-loading="regionDataLoading"
                :data-table-open="dataTableOpen"
                :open-drawer-id="openDrawerId"
                :associations-state="associationsState"
                :genes-state="genesState"
                :plot-overlays-state="plotOverlaysState"
                @update:openDrawerId="openDrawerId = $event"
                @update:regionShiftBp="onRegionShiftBpUpdate"
                @pan-end="onRegionPanEnd"
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
import {
    cloneGenomicRegion,
    computeActiveRegion,
    computeFetchGaps,
    computeViewRegion,
    filterAssociationRowsInRegion,
    filterGenesInRegion,
    genomicRegionsEqual,
    mergeAssociationRowsByVariantId,
    mergeGenesByName,
    mergeRecombData,
    trimRecombData,
} from "./kpVariantSifter/variantSifterRegionPan.js";
import { fetchGenesTrackData } from "./kpVariantSifter/variantSifterGenes.js";
import { fetchRecombinationRate } from "./kpVariantSifter/variantSifterPlotShared.js";
import {
    pickLeadVariantRow,
    rowToLdVariant,
} from "./kpVariantSifter/variantSifterLdServer.js";
import { buildAssociationsRegionPlotConfig } from "./kpVariantSifter/variantSifterAssociationsPlotConfig.js";
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

function emptyGenesState() {
    return {
        ready: false,
        loading: false,
        error: null,
        data: null,
    };
}

function emptyPlotOverlaysState() {
    return {
        ready: false,
        loading: false,
        error: null,
        recombData: null,
        refVariant: null,
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
            regionShiftBp: 0,
            dataRegion: null,
            regionDataLoading: false,
            regionExtendToken: 0,
            regionPanSyncTimer: null,
            dataTableOpen: false,
            aiAssistantOpen: false,
            openDrawerId: null,
            associationsState: emptyAssociationsState(),
            genesState: emptyGenesState(),
            plotOverlaysState: emptyPlotOverlaysState(),
            associationsRequestToken: 0,
            genesRequestToken: 0,
            plotOverlaysRequestToken: 0,
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
            const geneCount = this.genesState?.data?.length || 0;
            const parts = [`${rows.toLocaleString()} association rows`];
            if (geneCount > 0) {
                parts.push(`${geneCount.toLocaleString()} genes`);
            }
            if (filterCount) {
                parts.push(
                    filterCount === 1 ? "1 active filter" : `${filterCount} active filters`
                );
            }
            return parts.join(" · ");
        },
        activeRegion() {
            if (!this.searchSession?.region) {
                return null;
            }
            return computeActiveRegion(
                this.searchSession.region,
                this.regionShiftBp
            );
        },
        viewRegion() {
            if (!this.searchSession?.region) {
                return null;
            }
            return computeViewRegion(
                this.searchSession.region,
                this.regionShiftBp,
                this.regionZoom
            );
        },
    },
    mounted() {
        this.applyUrlSearchParams();
    },
    beforeDestroy() {
        if (this.regionPanSyncTimer) {
            clearTimeout(this.regionPanSyncTimer);
            this.regionPanSyncTimer = null;
        }
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
            this.scheduleRegionDataSync();
        },
        resetRegionViewport() {
            this.regionZoom = 0;
            this.regionViewArea = 0;
            this.regionShiftBp = 0;
            if (this.searchSession?.region) {
                this.applyDataRegion(
                    computeActiveRegion(this.searchSession.region, 0)
                );
            }
        },
        onRegionShiftBpUpdate(nextShiftBp) {
            this.regionShiftBp = Number(nextShiftBp) || 0;
            this.scheduleRegionDataSync();
        },
        onRegionPanEnd() {
            this.scheduleRegionDataSync(0);
        },
        scheduleRegionDataSync(delayMs = 300) {
            if (this.regionPanSyncTimer) {
                clearTimeout(this.regionPanSyncTimer);
                this.regionPanSyncTimer = null;
            }
            if (delayMs <= 0) {
                this.$nextTick(() => {
                    this.syncRegionDataToView();
                });
                return;
            }
            this.regionPanSyncTimer = setTimeout(() => {
                this.regionPanSyncTimer = null;
                this.syncRegionDataToView();
            }, delayMs);
        },
        applyDataRegion(targetDataRegion) {
            if (!targetDataRegion) {
                return;
            }

            const nextDataRegion = cloneGenomicRegion(targetDataRegion);
            if (genomicRegionsEqual(this.dataRegion, nextDataRegion)) {
                return;
            }

            this.dataRegion = nextDataRegion;
            const rows = filterAssociationRowsInRegion(
                this.associationsState.rows,
                nextDataRegion
            );
            const genes = filterGenesInRegion(this.genesState.data, nextDataRegion);
            const recombData = trimRecombData(
                this.plotOverlaysState.recombData,
                nextDataRegion
            );

            this.associationsState = {
                ...this.associationsState,
                rows,
            };
            this.genesState = {
                ...this.genesState,
                data: genes.length ? genes : null,
            };
            this.plotOverlaysState = {
                ...this.plotOverlaysState,
                recombData,
            };
        },
        async syncRegionDataToView() {
            if (!this.searchSession?.region || !this.dataRegion) {
                return;
            }

            const activeRegion = computeActiveRegion(
                this.searchSession.region,
                this.regionShiftBp
            );
            if (!activeRegion) {
                return;
            }

            const gaps = computeFetchGaps(this.dataRegion, activeRegion);

            if (!gaps.length) {
                this.applyDataRegion(activeRegion);
                return;
            }

            const token = ++this.regionExtendToken;
            this.regionDataLoading = true;
            const host = this.utilsBox?.uiUtils?.biDomain?.();
            if (!host) {
                this.regionDataLoading = false;
                return;
            }

            try {
                let mergedRows = this.associationsState.rows;
                let mergedGenes = this.genesState.data || [];
                let mergedRecomb = this.plotOverlaysState.recombData;
                const plotConfig = buildAssociationsRegionPlotConfig(this.searchSession);

                for (const gap of gaps) {
                    if (token !== this.regionExtendToken) {
                        return;
                    }

                    const gapRegion = {
                        chr: activeRegion.chr,
                        start: gap.start,
                        end: gap.end,
                    };
                    const gapSession = {
                        ...this.searchSession,
                        region: gapRegion,
                    };

                    const result = await fetchAssociations(gapSession, host);
                    const formattedRows = formatAssociationRows(result.rows, gapSession);
                    mergedRows = mergeAssociationRowsByVariantId(mergedRows, formattedRows);

                    const newGenes = await fetchGenesTrackData(
                        gapRegion,
                        plotConfig["genome reference"]
                    );
                    mergedGenes = mergeGenesByName(mergedGenes, newGenes);

                    const newRecomb = await fetchRecombinationRate(gapRegion);
                    mergedRecomb = mergeRecombData(mergedRecomb, newRecomb);
                }

                if (token !== this.regionExtendToken) {
                    return;
                }

                mergedRows = filterAssociationRowsInRegion(mergedRows, activeRegion);
                mergedGenes = filterGenesInRegion(mergedGenes, activeRegion);
                mergedRecomb = trimRecombData(mergedRecomb, activeRegion);

                const rowsMissingLd = mergedRows.some(
                    (row) => row.LDS == null || Number.isNaN(row.LDS)
                );

                this.dataRegion = cloneGenomicRegion(activeRegion);
                this.associationsState = {
                    ...this.associationsState,
                    rows: mergedRows,
                    ldLoading: rowsMissingLd,
                };
                this.genesState = {
                    ...this.genesState,
                    ready: true,
                    loading: false,
                    data: mergedGenes.length ? mergedGenes : null,
                    error: mergedGenes.length
                        ? null
                        : this.genesState.error,
                };
                this.plotOverlaysState = {
                    ...this.plotOverlaysState,
                    recombData: mergedRecomb,
                };

                if (rowsMissingLd) {
                    try {
                        const rowsWithLd = await enrichAssociationRowsWithLdScores(
                            mergedRows,
                            {
                                ...this.searchSession,
                                region: activeRegion,
                            }
                        );
                        if (token !== this.regionExtendToken) {
                            return;
                        }
                        this.associationsState = {
                            ...this.associationsState,
                            ldLoading: false,
                            rows: filterAssociationRowsInRegion(rowsWithLd, activeRegion),
                        };
                    } catch (ldError) {
                        if (token !== this.regionExtendToken) {
                            return;
                        }
                        console.warn("Variant Sifter LD score fetch failed", ldError);
                        this.associationsState = {
                            ...this.associationsState,
                            ldLoading: false,
                            ldError: "LD scores could not be loaded for the extended region.",
                        };
                    }
                }
            } catch (error) {
                if (token !== this.regionExtendToken) {
                    return;
                }
                console.warn("Variant Sifter region extension failed", error);
            } finally {
                if (token === this.regionExtendToken) {
                    this.regionDataLoading = false;
                }
            }
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
            if (payload.action === "resetSearch") {
                this.resetSearch();
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
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    regionZoom: this.regionZoom,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
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
                    genesState: this.genesState,
                    plotOverlaysState: this.plotOverlaysState,
                    regionZoom: this.regionZoom,
                    regionViewArea: this.regionViewArea,
                    regionShiftBp: this.regionShiftBp,
                    dataRegion: this.dataRegion,
                    openDrawerId: this.openDrawerId,
                    dataTableOpen: this.dataTableOpen,
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
            this.genesRequestToken += 1;
            this.plotOverlaysRequestToken += 1;
            this.searchSession = restored.searchSession;
            this.associationsState = restored.associationsState;
            this.genesState = restored.genesState || emptyGenesState();
            this.plotOverlaysState =
                restored.plotOverlaysState || emptyPlotOverlaysState();
            this.regionZoom = restored.regionZoom ?? 0;
            this.regionViewArea = restored.regionViewArea ?? 0;
            this.regionShiftBp = restored.regionShiftBp ?? restored.viewOffsetBp ?? 0;
            this.dataRegion = restored.dataRegion
                ? cloneGenomicRegion(restored.dataRegion)
                : cloneGenomicRegion(restored.searchSession.region);
            this.openDrawerId = restored.openDrawerId;
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.welcomeInitialValues = null;
            this.dataTableOpen = restored.dataTableOpen ?? false;
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
        resetSearch() {
            this.associationsRequestToken += 1;
            this.genesRequestToken += 1;
            this.plotOverlaysRequestToken += 1;
            this.searchSession = null;
            this.associationsState = emptyAssociationsState();
            this.genesState = emptyGenesState();
            this.plotOverlaysState = emptyPlotOverlaysState();
            this.dataRegion = null;
            this.regionShiftBp = 0;
            this.regionDataLoading = false;
            this.resetRegionViewport();
            this.openDrawerId = null;
            this.dataTableOpen = false;
            this.welcomeInitialValues = null;
            this.welcomeOpen = true;
            this.canvasActive = false;
            this.clearUrlSearchParams();
        },
        clearUrlSearchParams() {
            if (!this.utilsBox?.keyParams) {
                return;
            }
            this.utilsBox.keyParams.set({
                phenotype: undefined,
                region: undefined,
                ancestry: undefined,
            });
        },
        onStartSearch(session) {
            this.searchSession = session;
            this.regionZoom = 0;
            this.regionViewArea = 0;
            this.regionShiftBp = 0;
            this.dataRegion = cloneGenomicRegion(session.region);
            this.genesState = emptyGenesState();
            this.plotOverlaysState = emptyPlotOverlaysState();
            this.canvasActive = true;
            this.welcomeOpen = false;
            this.syncUrlSearchParams(session);
            this.loadAssociations(session);
            this.loadGenesTrack(session);
        },
        async loadGenesTrack(session) {
            const token = ++this.genesRequestToken;
            this.genesState = {
                ...emptyGenesState(),
                loading: true,
            };

            try {
                const plotConfig = buildAssociationsRegionPlotConfig(session);
                const data = await fetchGenesTrackData(
                    session.region,
                    plotConfig["genome reference"]
                );
                if (token !== this.genesRequestToken) {
                    return;
                }
                this.genesState = {
                    ready: true,
                    loading: false,
                    error: data.length ? null : "No genes found for this locus.",
                    data: data.length ? data : null,
                };
            } catch (error) {
                if (token !== this.genesRequestToken) {
                    return;
                }
                console.warn("Variant Sifter genes track load failed", error);
                this.genesState = {
                    ...emptyGenesState(),
                    error: "Failed to load genes track for this locus.",
                };
            }
        },
        async loadPlotOverlays(session, rows) {
            const token = ++this.plotOverlaysRequestToken;
            this.plotOverlaysState = {
                ...emptyPlotOverlaysState(),
                loading: true,
            };

            try {
                const recombData = await fetchRecombinationRate(session.region);
                if (token !== this.plotOverlaysRequestToken) {
                    return;
                }
                const leadRow = pickLeadVariantRow(rows);
                this.plotOverlaysState = {
                    ready: true,
                    loading: false,
                    error: null,
                    recombData,
                    refVariant: rowToLdVariant(leadRow),
                };
            } catch (error) {
                if (token !== this.plotOverlaysRequestToken) {
                    return;
                }
                console.warn("Variant Sifter plot overlays load failed", error);
                const leadRow = pickLeadVariantRow(rows);
                this.plotOverlaysState = {
                    ready: true,
                    loading: false,
                    error: "Recombination overlay could not be loaded for this locus.",
                    recombData: null,
                    refVariant: rowToLdVariant(leadRow),
                };
            }
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
                if (!this.dataRegion) {
                    this.dataRegion = cloneGenomicRegion(session.region);
                }
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
                    this.loadPlotOverlays(session, rowsWithLd);
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
                    this.loadPlotOverlays(session, formattedRows);
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
    background: var(--cfde-header-bg, #f6f5f2);
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
    background: #ffffff;
}

.vks-session-import-input {
    display: none;
}
</style>
