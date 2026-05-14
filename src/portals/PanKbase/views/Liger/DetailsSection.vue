<script>
// This file keeps all detail-panel rendering together so the accordion stays
// in one place while the main page no longer has to carry the full markup.

export default {
    name: "LigerDetailsSection",

    props: {
        viewModel: {
            type: Object,
            required: true
        },
        registerDetailsApi: {
            type: Function,
            default: null
        }
    },

    mounted() {
        if (this.registerDetailsApi) {
            this.registerDetailsApi({
                openFactorModal: this.openFactorModal,
                closeFactorModal: this.closeFactorModal
            });
        }
    },

    beforeDestroy() {
        if (this.registerDetailsApi) {
            this.registerDetailsApi(null);
        }
    },

    methods: {
        setActiveDetailPanel(type, key) {
            this.viewModel.activeDetailPanel = {
                type,
                key
            };
        },
        isDetailPanelActive(panel) {
            return this.viewModel.activeDetailPanel.type === panel.type
                && this.viewModel.activeDetailPanel.key === panel.key;
        },
        async openFactorModal({ dataset, cellType, model, factor, score, scoreField }) {
            const summary = this.viewModel.getFactorSummary(dataset, cellType, model, factor);
            const factorContextKey = [dataset, cellType, model, factor].join("::");

            this.viewModel.factorModalData = {
                dataset,
                cellType,
                model,
                factor,
                score,
                scoreField,
                summary,
                factorContextKey,
                detailLoading: true,
                detailScores: {
                    topGenes: this.viewModel.buildDetailScoreItems(summary?.top_genes_list || [], []),
                    topTraits: this.viewModel.buildDetailScoreItems(summary?.top_traits_list || [], []),
                    topGeneSets: this.viewModel.buildDetailScoreItems(summary?.top_gene_sets_list || [], [])
                }
            };
            this.setActiveDetailPanel("geneProgram", factorContextKey);

            try {
                const detailScores = await this.viewModel.fetchLigerFactorDetailScores({
                    dataset,
                    cellType,
                    model,
                    factor,
                    summary
                });

                if (this.viewModel.factorModalData?.factorContextKey !== factorContextKey) {
                    return;
                }

                this.viewModel.factorModalData = {
                    ...this.viewModel.factorModalData,
                    detailLoading: false,
                    detailScores
                };
            } catch (error) {
                if (this.viewModel.factorModalData?.factorContextKey !== factorContextKey) {
                    return;
                }

                this.viewModel.factorModalData = {
                    ...this.viewModel.factorModalData,
                    detailLoading: false
                };
            }
        },
        closeFactorModal() {
            this.viewModel.factorModalData = null;

            if (this.viewModel.browserMode === "sharedPrograms") {
                this.setActiveDetailPanel("searchRoot", `${this.viewModel.searchType}::${this.viewModel.getSearchRootDisplayValue()}`);
                return;
            }

            if (this.viewModel.activeHierarchyPath.model) {
                this.setActiveDetailPanel(
                    "model",
                    [
                        this.viewModel.activeHierarchyPath.dataset,
                        this.viewModel.activeHierarchyPath.cellType,
                        this.viewModel.activeHierarchyPath.model
                    ].join("::")
                );
            }
        }
    }
};
</script>

<template>
    <div
        v-if="viewModel.getVisibleDetailPanels().length"
        class="liger-detail-accordion"
    >
        <div
            v-for="panel in viewModel.getVisibleDetailPanels()"
            :key="panel.key"
            class="liger-detail-accordion-item"
            :class="[
                panel.badgeClass,
                { 'is-active': isDetailPanelActive(panel) }
            ]"
        >
            <button
                class="liger-detail-accordion-toggle"
                type="button"
                @click="setActiveDetailPanel(panel.type, panel.key)"
            >
                <span class="liger-detail-accordion-title">
                    <span class="liger-entity-badge" :class="panel.badgeClass">{{ panel.badgeLabel }}</span>
                    <span class="liger-detail-accordion-value">{{ panel.value }}</span>
                </span>
                <span class="liger-detail-accordion-indicator">
                    {{ isDetailPanelActive(panel) ? "−" : "+" }}
                </span>
            </button>

            <div
                v-if="isDetailPanelActive(panel)"
                class="liger-detail-panel"
            >
                <div v-if="panel.type === 'dataset' && panel.metadata" class="liger-detail-panel-dataset">
                    <div class="liger-detail-panel-header">
                        <div class="liger-detail-panel-title-group">
                            <div class="liger-detail-panel-kicker">Tissue Detail</div>
                            <div class="liger-detail-panel-title">
                                {{ panel.metadata.datasetName }}
                            </div>
                        </div>
                    </div>

                    <div class="liger-detail-panel-split">
                        <div class="liger-detail-panel-main">
                            <div class="liger-detail-panel-section">
                                <div class="liger-detail-panel-section-title">Summary</div>
                                <div class="liger-detail-rich-text">{{ panel.metadata.summary }}</div>
                            </div>

                            <div class="liger-detail-panel-section">
                                <div class="liger-detail-panel-section-title">Description</div>
                                <div class="liger-detail-rich-text">
                                    {{ `${panel.metadata.species} ${panel.metadata.tissue} ${panel.metadata.method} dataset from ${panel.metadata.source} generated on ${panel.metadata.platform}.` }}
                                </div>
                            </div>
                        </div>

                        <div class="liger-detail-panel-side">
                            <div class="liger-detail-panel-meta-grid">
                                <div class="liger-detail-panel-meta liger-detail-panel-meta-pair">
                                    <div><span class="liger-detail-meta-label">Source</span><span class="liger-detail-meta-value">{{ panel.metadata.source }}</span></div>
                                    <div><span class="liger-detail-meta-label">Dataset ID</span><span class="liger-detail-meta-value">{{ panel.metadata.datasetId }}</span></div>
                                </div>

                                <div class="liger-detail-panel-meta liger-detail-panel-meta-pair">
                                    <div><span class="liger-detail-meta-label">Species</span><span class="liger-detail-meta-value">{{ panel.metadata.species }}</span></div>
                                    <div><span class="liger-detail-meta-label">Tissue</span><span class="liger-detail-meta-value">{{ panel.metadata.tissue }}</span></div>
                                </div>

                                <div class="liger-detail-panel-meta liger-detail-panel-meta-pair">
                                    <div><span class="liger-detail-meta-label">Method</span><span class="liger-detail-meta-value">{{ panel.metadata.method }}</span></div>
                                    <div><span class="liger-detail-meta-label">Platform</span><span class="liger-detail-meta-value">{{ panel.metadata.platform }}</span></div>
                                </div>

                                <div class="liger-detail-panel-meta liger-detail-panel-meta-pair">
                                    <div><span class="liger-detail-meta-label">Total Donors</span><span class="liger-detail-meta-value">{{ panel.metadata.totalDonors }}</span></div>
                                    <div><span class="liger-detail-meta-label">Total Cells</span><span class="liger-detail-meta-value">{{ panel.metadata.totalCells }}</span></div>
                                </div>

                                <div class="liger-detail-panel-meta liger-detail-panel-meta-pair">
                                    <div><span class="liger-detail-meta-label">DOI</span><span class="liger-detail-meta-link"><a class="liger-detail-meta-link" :href="panel.metadata.doi" target="_blank" rel="noopener noreferrer">{{ panel.metadata.doi }}</a></span></div>
                                    <div><span class="liger-detail-meta-label">Browser</span><span class="liger-detail-meta-link"><a class="liger-detail-meta-link" :href="`/single-cell.html?datasetId=${panel.metadata.datasetId}`" target="_blank" rel="noopener noreferrer">View in single cell browser</a></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="panel.type !== 'geneProgram'" class="liger-detail-placeholder">
                    {{ panel.placeholder }}
                </div>
                <template v-else>
                    <div class="liger-detail-panel-header">
                        <div class="liger-detail-panel-title-group">
                            <div class="liger-detail-panel-kicker">Gene Program Detail</div>
                            <div class="liger-detail-panel-title">
                                {{ viewModel.factorModalData.summary?.label || viewModel.factorModalData.factor }}
                            </div>
                        </div>
                        <button
                            class="liger-detail-panel-close"
                            type="button"
                            @click="closeFactorModal()"
                        >
                            Close
                        </button>
                    </div>

                    <div class="liger-detail-panel-meta">
                        <div><span class="liger-detail-meta-label">Factor ID</span>{{ viewModel.factorModalData.factor }}</div>
                        <div><span class="liger-detail-meta-label">Dataset</span>{{ viewModel.factorModalData.dataset }}</div>
                        <div><span class="liger-detail-meta-label">Cell Type</span>{{ viewModel.factorModalData.cellType }}</div>
                        <div><span class="liger-detail-meta-label">Model</span>{{ viewModel.factorModalData.model }}</div>
                        <div><span class="liger-detail-meta-label">{{ viewModel.factorModalData.scoreField }}</span>{{ viewModel.factorModalData.score }}</div>
                    </div>

                    <div class="liger-detail-panel-columns">
                        <div
                            v-if="viewModel.factorModalData.summary?.top_genes_list?.length"
                            class="liger-detail-panel-section"
                        >
                            <div class="liger-detail-panel-section-title">
                                Top Genes
                                <span class="liger-detail-panel-section-count">
                                    {{ viewModel.factorModalData.summary.top_genes_list.length }}
                                </span>
                            </div>
                            <div class="liger-detail-list">
                                <div class="liger-detail-list-header">
                                    <span>Gene</span>
                                    <span>Value</span>
                                </div>
                                <div
                                    v-for="gene in viewModel.factorModalData.detailScores.topGenes"
                                    :key="`${viewModel.factorModalData.factor}-gene-${gene.label}`"
                                    class="liger-detail-list-item"
                                >
                                    <span class="liger-detail-list-item-label" :title="gene.label">{{ gene.label }}</span>
                                    <span class="liger-detail-list-item-value">{{ gene.value ?? "—" }}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="viewModel.factorModalData.summary?.top_gene_sets_list?.length"
                            class="liger-detail-panel-section"
                        >
                            <div class="liger-detail-panel-section-title">
                                Top Gene Sets
                                <span class="liger-detail-panel-section-count">
                                    {{ viewModel.factorModalData.summary.top_gene_sets_list.length }}
                                </span>
                            </div>
                            <div class="liger-detail-list">
                                <div class="liger-detail-list-header">
                                    <span>Gene Set</span>
                                    <span>Beta</span>
                                </div>
                                <div
                                    v-for="geneSet in viewModel.factorModalData.detailScores.topGeneSets"
                                    :key="`${viewModel.factorModalData.factor}-gene-set-${geneSet.label}`"
                                    class="liger-detail-list-item"
                                >
                                    <span class="liger-detail-list-item-label" :title="geneSet.label">{{ geneSet.label }}</span>
                                    <span class="liger-detail-list-item-value">{{ geneSet.beta ?? "—" }}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="viewModel.factorModalData.summary?.top_traits_list?.length"
                            class="liger-detail-panel-section"
                        >
                            <div class="liger-detail-panel-section-title">
                                Top Traits
                                <span class="liger-detail-panel-section-count">
                                    {{ viewModel.factorModalData.summary.top_traits_list.length }}
                                </span>
                            </div>
                            <div class="liger-detail-list">
                                <div class="liger-detail-list-header">
                                    <span>Trait</span>
                                    <span>pValue</span>
                                </div>
                                <div
                                    v-for="trait in viewModel.factorModalData.detailScores.topTraits"
                                    :key="`${viewModel.factorModalData.factor}-trait-${trait.label}`"
                                    class="liger-detail-list-item"
                                >
                                    <span class="liger-detail-list-item-label" :title="trait.label">{{ trait.label }}</span>
                                    <span class="liger-detail-list-item-value">{{ trait.pValue ?? "—" }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="viewModel.factorModalData.detailLoading"
                        class="liger-detail-panel-loading"
                    >
                        Loading detailed scores...
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
