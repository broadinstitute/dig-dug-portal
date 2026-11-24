<template>
    <div
        v-if="open"
        class="gp2-research-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="$emit('close')"
    >
        <div class="gp2-research-panel">
            <header class="gp2-research-head">
                <h2 :id="titleId">{{ title }}</h2>
                <div v-if="showLiteratureActionButtons" class="gp2-research-head-actions">
                    <button
                        v-if="showLiteratureLoadMoreButton"
                        type="button"
                        class="gp2-research-head-action"
                        :class="{ 'gp2-research-head-action-dim': literatureEvidenceState.exhausted }"
                        :disabled="
                            literatureEvidenceState.loadingMore ||
                            literatureEvidenceState.exhausted ||
                            literatureBusy
                        "
                        @click="$emit('load-more-literature-evidence')"
                    >
                        {{
                            literatureEvidenceState.loadingMore
                                ? "Loading next 15…"
                                : "Show next 15"
                        }}
                    </button>
                    <button
                        type="button"
                        class="gp2-research-head-action"
                        :disabled="literatureBusy"
                        :title="
                            enableAiSupport
                                ? 'Re-run PubMed search, evidences, and knowledge graph (skips AI summary)'
                                : 'Re-run PubMed search (Gene scores + lead variant; AI support off)'
                        "
                        @click="$emit('find-literature-evidence')"
                    >
                        {{ enableAiSupport ? "Find evidences" : "Find papers" }}
                    </button>
                    <button
                        type="button"
                        class="gp2-research-head-action"
                        :disabled="!canDownloadLiteratureEvidence || literatureBusy"
                        :title="
                            enableAiSupport
                                ? 'Download evidences, excerpts, papers, and network as HTML'
                                : 'Download paper list as HTML'
                        "
                        @click="downloadLiteratureEvidence"
                    >
                        Download
                    </button>
                </div>
                <button
                    type="button"
                    class="gp2-research-close"
                    :aria-label="`Close ${title}`"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>
            <div class="gp2-research-body">
                <template v-if="panelId === 'genePrioritization'">
                    <div v-if="genePrioritizationState.loading" class="gp2-research-status">
                        Loading gene prioritization data…
                    </div>
                    <div v-else-if="genePrioritizationState.error" class="gp2-research-status gp2-research-status-error">
                        {{ genePrioritizationState.error }}
                    </div>
                    <template v-else>
                        <GP2BrowserGenePrioritizationFilters
                            :rows="genePrioritizationState.rows"
                            :filters="genePrioritizationFilters"
                            @update:filters="onGenePrioritizationFiltersUpdate"
                        />
                        <GP2BrowserGenePrioritizationTable
                            :rows="genePrioritizationFilteredRows"
                            :utils="utilsBox"
                            @navigate-region="$emit('navigate-region', $event)"
                        />
                    </template>
                </template>
                <template v-else-if="panelId === 'literatureEvidence'">
                    <div
                        v-if="literatureEvidenceState.loading"
                        class="gp2-research-status"
                        role="status"
                        aria-live="polite"
                    >
                        {{ literatureEvidenceState.progressLabel || "Searching PubMed…" }}
                    </div>
                    <div
                        v-else-if="literatureEvidenceState.error"
                        class="gp2-research-status gp2-research-status-error"
                        role="alert"
                    >
                        {{ literatureEvidenceState.error }}
                    </div>
                    <template v-else>
                        <div
                            v-if="literatureEvidenceState.loadMoreError"
                            class="gp2-research-status gp2-research-status-error gp2-research-status-spaced"
                            role="alert"
                        >
                            {{ literatureEvidenceState.loadMoreError }}
                        </div>
                        <GP2BrowserLiteratureEvidencePanel
                            ref="literaturePanel"
                            :genes-searched="literatureEvidenceState.genesSearched"
                            :variants-searched="literatureEvidenceState.variantsSearched"
                            :highlight-terms="literatureEvidenceState.highlightTerms"
                            :ai-support="literatureEvidenceState.aiSupport"
                            :gene-reasons="literatureEvidenceState.geneReasons"
                            :digest-findings="literatureEvidenceState.digestFindings"
                            :ai-summary="aiSummaryMessage"
                            :used-locus-digest="literatureEvidenceState.usedLocusDigest"
                            :phenotype="literatureEvidenceState.phenotype"
                            :query="literatureEvidenceState.query"
                            :region-label="regionLabel"
                            :papers="literatureEvidenceState.papers"
                            :synthesizing="literatureEvidenceState.synthesizing"
                            :synthesis-error="literatureEvidenceState.synthesisError"
                            :progress-label="literatureEvidenceState.progressLabel"
                            :claims="literatureEvidenceState.claims"
                            :excerpts="literatureEvidenceState.excerpts"
                            :gaps="literatureEvidenceState.gaps"
                            :kg="literatureEvidenceState.kg"
                            :kg-loading="literatureEvidenceState.kgLoading"
                            :kg-error="literatureEvidenceState.kgError"
                        />
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import GP2BrowserGenePrioritizationFilters from "./GP2BrowserGenePrioritizationFilters.vue";
import GP2BrowserGenePrioritizationTable from "./GP2BrowserGenePrioritizationTable.vue";
import GP2BrowserLiteratureEvidencePanel from "./GP2BrowserLiteratureEvidencePanel.vue";
import {
    fetchGp2GenePrioritization,
    gp2GenePrioritizationDefaultFilters,
    gp2GenePrioritizationFilterRows,
} from "./gp2BrowserGenePrioritizationApi.js";

const RESEARCH_PANEL_TITLES = {
    genePrioritization: "Gene prioritization",
    associatedPhenotypes: "Associated phenotypes",
    literatureEvidence: "Literature evidence",
};

export default {
    name: "GP2BrowserResearchModal",
    components: {
        GP2BrowserGenePrioritizationFilters,
        GP2BrowserGenePrioritizationTable,
        GP2BrowserLiteratureEvidencePanel,
    },
    props: {
        panelId: {
            type: String,
            default: null,
        },
        utilsBox: {
            type: Object,
            default: null,
        },
        searchRegion: {
            type: Object,
            default: null,
        },
        literatureEvidenceState: {
            type: Object,
            required: true,
        },
        /** Prose from the AI summary stage that precedes LE. */
        aiSummaryMessage: {
            type: String,
            default: null,
        },
        enableAiSupport: {
            type: Boolean,
            default: false,
        },
        /** Human-readable locus label for LE download filename/header. */
        regionLabel: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            genePrioritizationState: {
                loading: false,
                loaded: false,
                error: null,
                rows: [],
            },
            genePrioritizationFilters: gp2GenePrioritizationDefaultFilters(),
        };
    },
    computed: {
        genePrioritizationFilteredRows() {
            return gp2GenePrioritizationFilterRows(
                this.genePrioritizationState.rows,
                this.genePrioritizationFilters
            );
        },
        open() {
            return Boolean(this.panelId && RESEARCH_PANEL_TITLES[this.panelId]);
        },
        title() {
            return (this.panelId && RESEARCH_PANEL_TITLES[this.panelId]) || "";
        },
        titleId() {
            return `gp2-research-title-${this.panelId || "panel"}`;
        },
        literatureBusy() {
            const state = this.literatureEvidenceState || {};
            return Boolean(
                state.loading ||
                    state.loadingMore ||
                    state.synthesizing ||
                    state.kgLoading
            );
        },
        showLiteratureActionButtons() {
            return (
                this.panelId === "literatureEvidence" &&
                (this.literatureEvidenceState.loaded ||
                    this.literatureEvidenceState.error ||
                    this.literatureBusy)
            );
        },
        showLiteratureLoadMoreButton() {
            return (
                this.literatureEvidenceState.loaded &&
                !this.literatureEvidenceState.loading &&
                !this.literatureEvidenceState.error &&
                Boolean(this.literatureEvidenceState.papers?.length)
            );
        },
        canDownloadLiteratureEvidence() {
            return (
                this.literatureEvidenceState.loaded &&
                !this.literatureEvidenceState.error &&
                Boolean(
                    this.literatureEvidenceState.papers?.length ||
                        this.literatureEvidenceState.claims?.length ||
                        this.literatureEvidenceState.excerpts?.length
                )
            );
        },
    },
    watch: {
        panelId: {
            immediate: true,
            handler(panelId) {
                if (panelId === "genePrioritization") {
                    this.loadGenePrioritization();
                }
            },
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onKeyDown(event) {
            if (!this.open) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onGenePrioritizationFiltersUpdate(filters) {
            this.genePrioritizationFilters = filters;
        },
        downloadLiteratureEvidence() {
            const panel = this.$refs.literaturePanel;
            if (panel && typeof panel.downloadHtmlReport === "function") {
                panel.downloadHtmlReport();
            }
        },
        async loadGenePrioritization() {
            if (this.genePrioritizationState.loaded || this.genePrioritizationState.loading) {
                return;
            }
            this.genePrioritizationState.loading = true;
            this.genePrioritizationState.error = null;
            try {
                const rows = await fetchGp2GenePrioritization();
                this.genePrioritizationState.rows = rows;
                this.genePrioritizationState.loaded = true;
            } catch (error) {
                this.genePrioritizationState.error =
                    error?.message || "Failed to load gene prioritization data.";
            } finally {
                this.genePrioritizationState.loading = false;
            }
        },
    },
};
</script>

<style scoped>
.gp2-research-modal {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5vh 2.5vw;
    background: rgba(20, 22, 30, 0.28);
}

.gp2-research-panel {
    width: 95%;
    height: 95%;
    max-width: none;
    max-height: none;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.22);
    overflow: hidden;
}

.gp2-research-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.gp2-research-head h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.gp2-research-head-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
}

.gp2-research-head-action {
    flex-shrink: 0;
    padding: 6px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.gp2-research-head-action:disabled {
    cursor: default;
}

.gp2-research-head-action-dim {
    opacity: 0.45;
}

.gp2-research-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.gp2-research-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 16px 18px;
}

.gp2-research-status {
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1px solid rgba(44, 92, 151, 0.28);
    border-left: 4px solid var(--cfde-blue, #2c5c97);
    border-radius: 8px;
    background: #eef4fb;
    box-shadow: 0 1px 2px rgba(51, 54, 61, 0.06);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.gp2-research-status-error {
    border-color: rgba(238, 49, 36, 0.35);
    border-left-color: #ee3124;
    background: #fdeeee;
    color: #9f1c14;
}

.gp2-research-status-spaced {
    margin-bottom: 12px;
}
</style>
