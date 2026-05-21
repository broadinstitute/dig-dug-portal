<script>
import { createLigerApiCache, ligerApiConfig } from "../Liger/ligerConfig";
import {
    fetchLigerDatasetMetadata,
    fetchLigerFactorDetailScores,
    fetchLigerFactors,
    fetchLigerSearchMatches,
    fetchLigerSearchResults
} from "../Liger/ligerApi";
import {
    buildFactorContextKey,
    buildSearchHierarchy,
    getAllHierarchyModelContexts,
    getDatasetDisplayLabel
} from "../Liger/ligerHierarchy";

const SEARCH_DEBOUNCE_MS = 250;

function buildMergedApiConfig(overrides = {}) {
    return {
        ...ligerApiConfig,
        ...overrides,
        queryEndpoints: {
            ...ligerApiConfig.queryEndpoints,
            ...(overrides.queryEndpoints || {})
        },
        matchEndpoints: {
            ...ligerApiConfig.matchEndpoints,
            ...(overrides.matchEndpoints || {})
        }
    };
}

function sortFactors(factorA, factorB) {
    const importanceA = Number(factorA.importance);
    const importanceB = Number(factorB.importance);
    const normalizedImportanceA = Number.isFinite(importanceA) ? importanceA : Number.NEGATIVE_INFINITY;
    const normalizedImportanceB = Number.isFinite(importanceB) ? importanceB : Number.NEGATIVE_INFINITY;

    if (normalizedImportanceA !== normalizedImportanceB) {
        return normalizedImportanceB - normalizedImportanceA;
    }

    return factorA.label.localeCompare(factorB.label);
}

function normalizeSearchValue(value) {
    return `${value || ""}`.trim();
}

export default {
    name: "LigerProgramBrowser",

    props: {
        apiConfig: {
            type: Object,
            default: () => ({})
        }
    },

    data() {
        return {
            searchType: "trait",
            searchTerm: "",
            selectedSearchValue: "",
            resultMode: "genePrograms",
            isLoadingMatches: false,
            isLoadingResults: false,
            errorMessage: "",
            searchMatches: null,
            searchPayload: null,
            datasetGroups: [],
            activeDataset: null,
            selectedFactorKey: null,
            datasetMetadata: {},
            factorSummaries: {},
            factorDetailScores: {},
            factorDetailLoading: {},
            apiCache: createLigerApiCache(),
            searchDebounceTimer: null,
            suppressNextSearchWatch: false
        };
    },

    computed: {
        resolvedApiConfig() {
            return buildMergedApiConfig(this.apiConfig);
        },
        hasResults() {
            return this.datasetGroups.length > 0;
        },
        activeDatasetGroup() {
            return this.datasetGroups.find((group) => group.dataset === this.activeDataset) || null;
        },
        activeDatasetLabel() {
            return this.activeDatasetGroup?.displayLabel || "";
        },
        resultCountLabel() {
            const count = this.searchPayload?.data?.length || 0;
            return count === 1 ? "1 result context" : `${count} result contexts`;
        },
        selectedFactor() {
            if (!this.activeDatasetGroup || !this.selectedFactorKey) {
                return null;
            }

            for (const cellTypeGroup of this.activeDatasetGroup.cellTypes) {
                const factor = cellTypeGroup.factors.find((item) => item.key === this.selectedFactorKey);

                if (factor) {
                    return factor;
                }
            }

            return null;
        },
        selectedFactorContextKey() {
            return this.selectedFactor?.key || null;
        },
        selectedFactorDetailScores() {
            if (!this.selectedFactorContextKey) {
                return null;
            }

            return this.factorDetailScores[this.selectedFactorContextKey] || null;
        },
        selectedFactorDetailLoading() {
            if (!this.selectedFactorContextKey) {
                return false;
            }

            return Boolean(this.factorDetailLoading[this.selectedFactorContextKey]);
        }
    },

    watch: {
        searchTerm() {
            if (this.suppressNextSearchWatch) {
                this.suppressNextSearchWatch = false;
                return;
            }

            this.scheduleMatchLookup();
        },
        selectedFactorContextKey: {
            immediate: true,
            handler(nextKey) {
                if (!nextKey || !this.selectedFactor) {
                    return;
                }

                this.ensureSelectedFactorDetailScores(this.selectedFactor);
            }
        }
    },

    async created() {
        await this.ensureDatasetMetadataLoaded();
    },

    beforeDestroy() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
        }
    },

    methods: {
        setSearchType(nextType) {
            if (this.searchType === nextType) {
                return;
            }

            this.searchType = nextType;
            this.resetSearchUi();
        },
        resetSearchUi() {
            this.errorMessage = "";
            this.searchMatches = null;
            this.searchPayload = null;
            this.datasetGroups = [];
            this.activeDataset = null;
            this.selectedFactorKey = null;
            this.selectedSearchValue = "";
            this.resultMode = "genePrograms";
            this.factorDetailScores = {};
            this.factorDetailLoading = {};

            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = null;
            }
        },
        async ensureDatasetMetadataLoaded() {
            if (Object.keys(this.datasetMetadata).length) {
                return this.datasetMetadata;
            }

            try {
                this.datasetMetadata = await fetchLigerDatasetMetadata({
                    apiConfig: this.resolvedApiConfig,
                    apiCache: this.apiCache
                });
            } catch (error) {
                console.error("Unable to load Liger dataset metadata:", error);
                this.datasetMetadata = {};
            }

            return this.datasetMetadata;
        },
        scheduleMatchLookup() {
            const normalizedValue = normalizeSearchValue(this.searchTerm);
            this.selectedSearchValue = "";
            this.errorMessage = "";

            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = null;
            }

            if (!normalizedValue) {
                this.searchMatches = null;
                return;
            }

            this.searchDebounceTimer = setTimeout(() => {
                this.loadSearchMatches(normalizedValue);
            }, SEARCH_DEBOUNCE_MS);
        },
        async loadSearchMatches(searchTerm) {
            const activeSearchType = this.searchType;
            this.isLoadingMatches = true;

            try {
                const matchPayload = await fetchLigerSearchMatches({
                    apiConfig: this.resolvedApiConfig,
                    apiCache: this.apiCache,
                    searchType: activeSearchType,
                    searchTerm
                });

                if (
                    activeSearchType === this.searchType
                    && searchTerm === normalizeSearchValue(this.searchTerm)
                ) {
                    this.searchMatches = matchPayload;
                }
            } catch (error) {
                this.errorMessage = error.message || "Unable to load suggestions.";
            } finally {
                this.isLoadingMatches = false;
            }
        },
        async submitSearch() {
            const searchTerm = normalizeSearchValue(this.searchTerm);

            if (!searchTerm) {
                this.errorMessage = `Enter a ${this.searchType === "gene" ? "gene" : "trait"} first.`;
                return;
            }

            this.selectedSearchValue = searchTerm;
            this.searchMatches = null;
            this.errorMessage = "";
            this.isLoadingResults = true;

            try {
                const searchPayload = await fetchLigerSearchResults({
                    apiConfig: this.resolvedApiConfig,
                    apiCache: this.apiCache,
                    searchType: this.searchType,
                    searchTerm
                });
                const searchHierarchy = buildSearchHierarchy(searchPayload);
                const datasetGroups = await this.buildDatasetGroups(searchHierarchy);

                this.searchPayload = searchPayload;
                this.datasetGroups = datasetGroups;
                this.activeDataset = datasetGroups[0]?.dataset || null;
                this.selectedFactorKey = datasetGroups[0]?.cellTypes?.[0]?.factors?.[0]?.key || null;

                if (!datasetGroups.length) {
                    this.errorMessage = `No gene programs found for this ${this.searchType}.`;
                }
            } catch (error) {
                this.searchPayload = null;
                this.datasetGroups = [];
                this.activeDataset = null;
                this.selectedFactorKey = null;
                this.errorMessage = error.message || "Unable to load gene programs.";
            } finally {
                this.isLoadingResults = false;
            }
        },
        async selectSearchMatch(matchValue) {
            this.suppressNextSearchWatch = true;
            this.searchTerm = matchValue;
            this.searchMatches = null;
            await this.submitSearch();
        },
        async buildDatasetGroups(searchHierarchy) {
            await this.ensureDatasetMetadataLoaded();

            const modelContexts = getAllHierarchyModelContexts(searchHierarchy);

            await Promise.all(modelContexts.map(async (context) => {
                const factorContextKey = buildFactorContextKey(context);

                if (this.factorSummaries[factorContextKey]) {
                    return;
                }

                const factorPayload = await fetchLigerFactors({
                    apiConfig: this.resolvedApiConfig,
                    apiCache: this.apiCache,
                    dataset: context.dataset,
                    cellType: context.cellType,
                    model: context.model
                });
                const factorMap = (factorPayload.data || []).reduce((lookup, factorRow) => {
                    lookup[factorRow.factor] = factorRow;
                    return lookup;
                }, {});

                this.$set(this.factorSummaries, factorContextKey, factorMap);
            }));

            return searchHierarchy.map((datasetGroup) => {
                const displayLabel = getDatasetDisplayLabel(this.datasetMetadata, datasetGroup.dataset);

                return {
                    dataset: datasetGroup.dataset,
                    displayLabel,
                    rawLabel: datasetGroup.dataset,
                    cellTypes: (datasetGroup.cellTypes || []).map((cellTypeGroup) => {
                        const usesMultipleModels = (cellTypeGroup.models || []).length > 1;
                        const factors = (cellTypeGroup.models || [])
                            .flatMap((modelGroup) => {
                                const factorContextKey = buildFactorContextKey({
                                    dataset: datasetGroup.dataset,
                                    cellType: cellTypeGroup.cellType,
                                    model: modelGroup.model
                                });
                                const summaryLookup = this.factorSummaries[factorContextKey] || {};

                                return Object.values(summaryLookup).map((summary) => ({
                                    key: [
                                        datasetGroup.dataset,
                                        cellTypeGroup.cellType,
                                        modelGroup.model,
                                        summary.factor
                                    ].join("::"),
                                    dataset: datasetGroup.dataset,
                                    cellType: cellTypeGroup.cellType,
                                    model: modelGroup.model,
                                    factor: summary.factor,
                                    label: summary.label || summary.factor,
                                    importance: summary.importance ?? null,
                                    score: summary.score ?? summary.pValue ?? summary.p_value ?? null,
                                    topGenes: summary.top_genes_list || [],
                                    topTraits: summary.top_traits_list || [],
                                    topGeneSets: summary.top_gene_sets_list || [],
                                    topCells: summary.top_cells_list || [],
                                    usesMultipleModels
                                }));
                            })
                            .sort(sortFactors);

                        return {
                            cellType: cellTypeGroup.cellType,
                            factorCount: factors.length,
                            usesMultipleModels,
                            factors
                        };
                    })
                };
            });
        },
        selectDataset(dataset) {
            const nextGroup = this.datasetGroups.find((group) => group.dataset === dataset) || null;
            this.activeDataset = dataset;
            this.selectedFactorKey = nextGroup?.cellTypes?.[0]?.factors?.[0]?.key || null;
        },
        selectFactor(factorKey) {
            this.selectedFactorKey = factorKey;
        },
        formatScore(score) {
            const numericScore = Number(score);

            if (!Number.isFinite(numericScore)) {
                return "n/a";
            }

            if (Math.abs(numericScore) >= 100 || Math.abs(numericScore) < 0.01) {
                return numericScore.toExponential(2);
            }

            return numericScore.toFixed(3);
        },
        setResultMode(nextMode) {
            if (nextMode !== "genePrograms") {
                return;
            }

            this.resultMode = nextMode;
        },
        async ensureSelectedFactorDetailScores(factor) {
            if (!factor?.key) {
                return null;
            }

            if (this.factorDetailScores[factor.key]) {
                return this.factorDetailScores[factor.key];
            }

            if (this.factorDetailLoading[factor.key]) {
                return null;
            }

            this.$set(this.factorDetailLoading, factor.key, true);

            try {
                const detailScores = await fetchLigerFactorDetailScores({
                    apiConfig: this.resolvedApiConfig,
                    apiCache: this.apiCache,
                    dataset: factor.dataset,
                    cellType: factor.cellType,
                    model: factor.model,
                    factor: factor.factor,
                    summary: {
                        top_genes_list: factor.topGenes,
                        top_traits_list: factor.topTraits,
                        top_gene_sets_list: factor.topGeneSets
                    }
                });

                this.$set(this.factorDetailScores, factor.key, detailScores);
                return detailScores;
            } catch (error) {
                console.error("Unable to load factor detail scores:", error);
                this.$set(this.factorDetailScores, factor.key, {
                    topGenes: [],
                    topTraits: [],
                    topGeneSets: []
                });
                return this.factorDetailScores[factor.key];
            } finally {
                this.$set(this.factorDetailLoading, factor.key, false);
            }
        }
    }
};
</script>

<template>
    <section class="liger2-page">
        <div class="liger2-hero">
            <div class="liger2-hero-copy">
                <div class="liger2-kicker">Liger Browser</div>
                <h1 class="liger2-title">Gene programs across tissues and cell types</h1>
                <p class="liger2-copy">
                    Search by gene or trait, then explore all gene programs grouped by tissue and cell type.
                </p>
            </div>
        </div>

        <div class="liger2-controls">
            <div class="liger2-type-toggle">
                <button
                    class="liger2-toggle-button"
                    :class="{ 'is-active': searchType === 'trait' }"
                    type="button"
                    @click="setSearchType('trait')"
                >
                    Trait
                </button>
                <button
                    class="liger2-toggle-button"
                    :class="{ 'is-active': searchType === 'gene' }"
                    type="button"
                    @click="setSearchType('gene')"
                >
                    Gene
                </button>
            </div>

            <div class="liger2-search-bar">
                <input
                    v-model="searchTerm"
                    class="liger2-search-input"
                    :placeholder="searchType === 'gene' ? 'Search for a gene' : 'Search for a trait'"
                    type="text"
                    @keyup.enter="submitSearch"
                />
                <button
                    class="liger2-search-button"
                    type="button"
                    :disabled="isLoadingResults"
                    @click="submitSearch"
                >
                    {{ isLoadingResults ? "Loading..." : "Search" }}
                </button>
            </div>

            <div
                v-if="searchMatches && Array.isArray(searchMatches.data) && searchMatches.data.length"
                class="liger2-suggestions"
            >
                <button
                    v-for="match in searchMatches.data"
                    :key="match"
                    class="liger2-suggestion"
                    type="button"
                    @click="selectSearchMatch(match)"
                >
                    {{ match }}
                </button>
            </div>

            <div v-if="isLoadingMatches && !isLoadingResults" class="liger2-status">
                Looking up suggestions...
            </div>

            <div v-if="errorMessage" class="liger2-status is-error">
                {{ errorMessage }}
            </div>
        </div>

        <div v-if="hasResults" class="liger2-results">
            <div class="liger2-results-header">
                <div class="liger2-results-copy-block">
                    <div class="liger2-results-label">
                        {{ searchType === "gene" ? "Gene" : "Trait" }}
                    </div>
                    <h2 class="liger2-results-title">{{ selectedSearchValue }}</h2>
                    <p class="liger2-results-copy">
                        {{ resultCountLabel }} across {{ datasetGroups.length }} tissue{{ datasetGroups.length === 1 ? "" : "s" }}.
                    </p>
                </div>
            </div>

            <div v-if="activeDatasetGroup" class="liger2-dataset-panel">
                <div class="liger2-dataset-meta">
                    <div class="liger2-results-label">Tissue</div>
                    <div class="liger2-dataset-picker">
                        <button
                            v-for="group in datasetGroups"
                            :key="group.dataset"
                            class="liger2-dataset-button"
                            :class="{ 'is-active': activeDataset === group.dataset }"
                            type="button"
                            @click="selectDataset(group.dataset)"
                        >
                            <span>{{ group.displayLabel }}</span>
                            <small>{{ group.rawLabel }}</small>
                        </button>
                    </div>
                </div>

                <div class="liger2-grid-controls">
                    <div class="liger2-results-label">Cell Types</div>
                    <div class="liger2-view-toggle">
                        <button
                            class="liger2-toggle-button"
                            :class="{ 'is-active': resultMode === 'genePrograms' }"
                            type="button"
                            @click="setResultMode('genePrograms')"
                        >
                            Gene Programs
                        </button>
                        <button
                            class="liger2-toggle-button"
                            :class="{ 'is-active': resultMode === 'cellStates' }"
                            type="button"
                            disabled
                        >
                            Cell States
                        </button>
                    </div>
                </div>

                <div class="liger2-grid-shell">
                    <div class="liger2-grid">
                        <article
                            v-for="cellTypeGroup in activeDatasetGroup.cellTypes"
                            :key="cellTypeGroup.cellType"
                            class="liger2-cell-column"
                        >
                            <header class="liger2-cell-header">
                                <h4>{{ cellTypeGroup.cellType }}</h4>
                                <p>
                                    {{ cellTypeGroup.factorCount }} gene program{{ cellTypeGroup.factorCount === 1 ? "" : "s" }}
                                </p>
                            </header>

                            <div class="liger2-factor-list">
                                <button
                                    v-for="factor in cellTypeGroup.factors"
                                    :key="factor.key"
                                    class="liger2-factor-card"
                                    :class="{ 'is-active': selectedFactorKey === factor.key }"
                                    type="button"
                                    @click="selectFactor(factor.key)"
                                >
                                    <div class="liger2-factor-card-top">
                                        <span class="liger2-factor-name">{{ factor.label }}</span>
                                        <span v-if="factor.usesMultipleModels" class="liger2-model-chip">{{ factor.model }}</span>
                                    </div>
                                    <div class="liger2-factor-meta">
                                        <span v-if="Number.isFinite(Number(factor.importance))">Importance: {{ formatScore(factor.importance) }}</span>
                                        <span v-else>Importance unavailable</span>
                                    </div>
                                    <div class="liger2-factor-meta">
                                        <span v-if="factor.topGenes.length">Top genes: {{ factor.topGenes.slice(0, 3).join(", ") }}</span>
                                        <span v-else-if="factor.topTraits.length">Top traits: {{ factor.topTraits.slice(0, 2).join(", ") }}</span>
                                        <span v-else>Program summary unavailable</span>
                                    </div>
                                </button>
                            </div>
                        </article>
                    </div>
                </div>
            </div>

            <div v-if="selectedFactor" class="liger2-detail-panel">
                <div class="liger2-detail-header">
                    <div class="liger2-detail-copy-block">
                        <div class="liger2-results-label">Selected Gene Program</div>
                        <h3 class="liger2-detail-title">{{ selectedFactor.label }}</h3>
                        <p class="liger2-detail-subtitle">
                            {{ selectedFactor.cellType }} in {{ activeDatasetLabel }}
                            <span v-if="selectedFactor.usesMultipleModels"> • {{ selectedFactor.model }}</span>
                        </p>
                    </div>
                    <div v-if="Number.isFinite(Number(selectedFactor.importance))" class="liger2-detail-score">
                        Importance: {{ formatScore(selectedFactor.importance) }}
                    </div>
                </div>

                <div class="liger2-detail-grid">
                    <div class="liger2-detail-card">
                        <h4>Top genes</h4>
                        <div v-if="selectedFactorDetailScores && selectedFactorDetailScores.topGenes.length" class="liger2-detail-list">
                            <div class="liger2-detail-list-header">
                                <span>Gene</span>
                                <span>Value</span>
                            </div>
                            <div
                                v-for="gene in selectedFactorDetailScores.topGenes"
                                :key="`${selectedFactor.key}-gene-${gene.label}`"
                                class="liger2-detail-list-row"
                            >
                                <span class="liger2-detail-list-label">{{ gene.label }}</span>
                                <span class="liger2-detail-list-value">{{ gene.value ?? "—" }}</span>
                            </div>
                        </div>
                        <p v-else-if="selectedFactorDetailLoading">Loading values...</p>
                        <p v-else>No genes available.</p>
                    </div>
                    <div class="liger2-detail-card">
                        <h4>Top traits</h4>
                        <div v-if="selectedFactorDetailScores && selectedFactorDetailScores.topTraits.length" class="liger2-detail-list">
                            <div class="liger2-detail-list-header">
                                <span>Trait</span>
                                <span>pValue</span>
                            </div>
                            <div
                                v-for="trait in selectedFactorDetailScores.topTraits"
                                :key="`${selectedFactor.key}-trait-${trait.label}`"
                                class="liger2-detail-list-row"
                            >
                                <span class="liger2-detail-list-label">{{ trait.label }}</span>
                                <span class="liger2-detail-list-value">{{ trait.pValue ?? "—" }}</span>
                            </div>
                        </div>
                        <p v-else-if="selectedFactorDetailLoading">Loading values...</p>
                        <p v-else>No traits available.</p>
                    </div>
                    <div class="liger2-detail-card">
                        <h4>Gene sets</h4>
                        <div v-if="selectedFactorDetailScores && selectedFactorDetailScores.topGeneSets.length" class="liger2-detail-list">
                            <div class="liger2-detail-list-header">
                                <span>Gene Set</span>
                                <span>Beta</span>
                            </div>
                            <div
                                v-for="geneSet in selectedFactorDetailScores.topGeneSets"
                                :key="`${selectedFactor.key}-gene-set-${geneSet.label}`"
                                class="liger2-detail-list-row"
                            >
                                <span class="liger2-detail-list-label">{{ geneSet.label }}</span>
                                <span class="liger2-detail-list-value">{{ geneSet.beta ?? "—" }}</span>
                            </div>
                        </div>
                        <p v-else-if="selectedFactorDetailLoading">Loading values...</p>
                        <p v-else>No gene sets available.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.liger2-page {
    --liger2-color-bg: #ffffff;
    --liger2-color-panel: #fafafa;
    --liger2-color-panel-alt: #f2f7f3;
    --liger2-color-accent: var(--pkb-primary-green);
    --liger2-color-accent-soft: var(--pkb-secondary-green);
    --liger2-color-border: #dddddd;
    --liger2-color-text: var(--pkb-black);
    --liger2-color-muted: #5d6668;
    --liger2-color-error-bg: #f4eeee;
    --liger2-color-error-text: #7b3d3d;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0 24px;
    color: var(--liger2-color-text);
}

.liger2-page h1,
.liger2-page h2,
.liger2-page h3,
.liger2-page h4,
.liger2-page p {
    margin: 0;
}

.liger2-hero,
.liger2-controls,
.liger2-results,
.liger2-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-bg);
}

.liger2-hero-copy,
.liger2-results-copy-block,
.liger2-dataset-meta,
.liger2-detail-copy-block,
.liger2-cell-header,
.liger2-detail-card,
.liger2-factor-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger2-kicker,
.liger2-results-label {
    color: var(--liger2-color-accent);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.liger2-title,
.liger2-results-title,
.liger2-dataset-title,
.liger2-detail-title {
    color: var(--liger2-color-text);
    line-height: 1.1;
}

.liger2-title {
    font-size: 34px;
}

.liger2-copy,
.liger2-results-copy,
.liger2-dataset-subtitle,
.liger2-detail-subtitle,
.liger2-cell-header p,
.liger2-detail-card p {
    color: var(--liger2-color-muted);
}

.liger2-controls {
    gap: 12px;
}

.liger2-type-toggle {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger2-grid-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger2-view-toggle {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger2-toggle-button,
.liger2-search-button,
.liger2-suggestion,
.liger2-dataset-button,
.liger2-factor-card {
    font: inherit;
}

.liger2-toggle-button,
.liger2-dataset-button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 12px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-bg);
    color: var(--liger2-color-text);
    cursor: pointer;
    transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.liger2-toggle-button.is-active,
.liger2-dataset-button.is-active {
    border-color: var(--liger2-color-accent);
    background: var(--liger2-color-accent);
    color: var(--liger2-color-bg);
}

.liger2-dataset-button.is-active span {
    font-weight: 700;
}

.liger2-search-bar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
}

.liger2-search-input {
    width: 100%;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-bg);
    color: var(--liger2-color-text);
    font: inherit;
}

.liger2-search-button {
    padding: 10px 14px;
    border: 1px solid var(--liger2-color-accent);
    background: var(--liger2-color-accent);
    color: var(--liger2-color-bg);
    cursor: pointer;
}

.liger2-search-button:disabled {
    opacity: 0.7;
    cursor: wait;
}

.liger2-toggle-button:disabled {
    opacity: 0.6;
    cursor: default;
}

.liger2-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger2-suggestion {
    padding: 6px 10px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-panel);
    color: var(--liger2-color-text);
    cursor: pointer;
}

.liger2-status {
    padding: 10px 12px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-panel);
    color: var(--liger2-color-muted);
}

.liger2-status.is-error {
    background: var(--liger2-color-error-bg);
    color: var(--liger2-color-error-text);
}

.liger2-results {
    gap: 16px;
}

.liger2-results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.liger2-dataset-picker {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
}

.liger2-dataset-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.liger2-grid-shell {
    overflow-x: auto;
    padding: 0 0 4px;
}

.liger2-grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(240px, 280px);
    gap: 10px;
    align-items: start;
}

.liger2-cell-column {
    display: flex;
    flex-direction: column;
    min-height: 520px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-panel);
}

.liger2-cell-header {
    padding: 12px;
    border-bottom: 1px solid var(--liger2-color-border);
}

.liger2-factor-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 440px;
    padding: 12px;
    overflow-y: auto;
}

.liger2-factor-card {
    padding: 10px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-bg);
    color: var(--liger2-color-text);
    text-align: left;
    cursor: pointer;
    transition: border-color 160ms ease, background-color 160ms ease;
}

.liger2-factor-card:hover,
.liger2-factor-card.is-active {
    border-color: var(--liger2-color-accent);
    background: var(--liger2-color-panel-alt);
}

.liger2-factor-card-top,
.liger2-factor-meta,
.liger2-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
}

.liger2-factor-name {
    font-weight: 700;
}

.liger2-factor-meta {
    color: var(--liger2-color-muted);
    font-size: 13px;
}

.liger2-model-chip,
.liger2-detail-score {
    padding: 4px 8px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-panel);
    color: var(--liger2-color-accent);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.liger2-detail-panel {
    gap: 12px;
}

.liger2-detail-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.liger2-detail-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--liger2-color-border);
    background: var(--liger2-color-bg);
}

.liger2-detail-card p {
    overflow-wrap: anywhere;
}

.liger2-detail-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 500px;
    overflow-y: auto;
}

.liger2-detail-list-header,
.liger2-detail-list-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
}

.liger2-detail-list-header {
    color: var(--liger2-color-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.liger2-detail-list-row {
    padding: 8px 0;
    border-top: 1px solid var(--liger2-color-border);
}

.liger2-detail-list-label {
    min-width: 0;
    overflow-wrap: anywhere;
}

.liger2-detail-list-value {
    color: var(--liger2-color-muted);
    text-align: right;
    white-space: nowrap;
}

@media (max-width: 960px) {
    .liger2-page {
        padding: 12px 0 20px;
    }

    .liger2-title {
        font-size: 30px;
    }

    .liger2-search-bar,
    .liger2-detail-grid {
        grid-template-columns: 1fr;
    }

    .liger2-results-header,
    .liger2-detail-header {
        flex-direction: column;
    }

    .liger2-dataset-picker {
        justify-content: flex-start;
    }

    .liger2-grid {
        grid-auto-columns: minmax(220px, 85vw);
    }
}
</style>
