<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="liger-page">
                <div class="liger-controls">
                    <div class="liger-mode-group">
                        <button
                            class="liger-mode-button"
                            :class="{ 'is-active': $parent.searchType === 'trait' }"
                            type="button"
                            @click="$parent.setSearchType('trait')"
                        >
                            Trait
                        </button>
                        <button
                            class="liger-mode-button"
                            :class="{ 'is-active': $parent.searchType === 'gene' }"
                            type="button"
                            @click="$parent.setSearchType('gene')"
                        >
                            Gene
                        </button>
                    </div>

                    <div class="liger-search-group">
                        <input
                            v-model.trim="$parent.searchTerm"
                            class="liger-input"
                            :placeholder="$parent.searchType === 'trait' ? 'Search for a trait' : 'Search for a gene'"
                            type="text"
                        />

                        <div
                            v-if="$parent.searchMatches && Array.isArray($parent.searchMatches.data) && $parent.searchMatches.data.length"
                            class="liger-suggestion-list"
                        >
                            <button
                                v-for="match in $parent.searchMatches.data"
                                :key="match"
                                class="liger-suggestion-button"
                                type="button"
                                @click="$parent.selectSearchMatch(match)"
                            >
                                {{ match }}
                            </button>
                        </div>
                    </div>

                    <div v-if="$parent.isLoading" class="liger-status">
                        Loading...
                    </div>

                    <div v-if="$parent.errorMessage" class="liger-status">
                        {{ $parent.errorMessage }}
                    </div>

                    <div
                        v-if="$parent.searchHierarchy && $parent.searchHierarchy.length"
                        class="liger-results-tree"
                    >
                        <div class="liger-results-legend">
                            <div class="liger-results-legend-title">Legend</div>
                            <div class="liger-results-legend-items">
                                <div class="liger-entity-badge is-search">
                                    {{ $parent.searchType === "gene" ? "Gene" : "Trait" }}
                                </div>
                                <div class="liger-entity-badge is-dataset">Tissue</div>
                                <div class="liger-entity-badge is-cell-type">Cell Type</div>
                                <div class="liger-entity-badge is-model">Model</div>
                                <div class="liger-entity-badge is-factor">Gene Program</div>
                            </div>
                        </div>

                        <div
                            class="liger-browser-viewport"
                            :class="{
                                'is-dragging': $parent.browserCanvas.isDragging,
                                'is-animating': $parent.browserCanvas.isAnimating
                            }"
                            @pointerdown="$parent.startBrowserCanvasPan($event)"
                            @wheel="$parent.handleBrowserCanvasWheel($event)"
                        >
                            <button
                                class="liger-browser-fit-button"
                                type="button"
                                aria-label="Fit and center view"
                                title="Fit and center view"
                                @pointerdown.stop
                                @click.stop="$parent.fitAndCenterBrowserCanvas()"
                            >
                                ⌖
                            </button>

                            <div
                                class="liger-browser-columns"
                                :style="{
                                    transform: `translate(${$parent.browserCanvas.x}px, ${$parent.browserCanvas.y}px)`
                                }"
                            >
                                <div
                                    class="liger-browser-content"
                                    :style="{
                                        transform: `scale(${$parent.browserCanvas.scale})`
                                    }"
                                >
                                    <div class="liger-browser-column is-search">
                                        <div class="liger-browser-column-header">
                                            <span class="liger-entity-badge is-search">
                                                {{ $parent.searchType === "gene" ? "Gene" : "Trait" }}
                                            </span>
                                        </div>
                                        <div class="liger-browser-list">
                                            <button
                                                class="liger-browser-item"
                                                :class="{ 'is-active': $parent.isHierarchyItemActive('searchRoot') }"
                                                type="button"
                                                @click="$parent.selectHierarchyItem('searchRoot')"
                                            >
                                                <span class="liger-browser-item-label">{{ $parent.getSearchRootDisplayValue() }}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="liger-browser-column is-dataset">
                                        <div class="liger-browser-column-header">
                                            <span class="liger-entity-badge is-dataset">Tissue</span>
                                        </div>
                                        <div class="liger-browser-list">
                                            <button
                                                v-for="datasetGroup in $parent.searchHierarchy"
                                                :key="datasetGroup.dataset"
                                                class="liger-browser-item"
                                                :class="{ 'is-active': $parent.isHierarchyItemActive('dataset', datasetGroup.dataset) }"
                                                type="button"
                                                @click="$parent.selectHierarchyItem('dataset', { dataset: datasetGroup.dataset })"
                                            >
                                                <span class="liger-browser-item-copy">
                                                    <span class="liger-browser-item-label">{{ $parent.getDatasetDisplayLabel(datasetGroup.dataset) }}</span>
                                                    <span class="liger-browser-item-sublabel">{{ $parent.getDatasetDisplaySubLabel(datasetGroup.dataset) }}</span>
                                                </span>
                                                <span class="liger-browser-item-meta">{{ datasetGroup.cellTypes.length }}</span>
                                                <span class="liger-browser-item-chevron">›</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        v-if="$parent.getActiveDatasetGroup()"
                                        class="liger-browser-column is-cell-type"
                                    >
                                        <div class="liger-browser-column-header">
                                            <span class="liger-entity-badge is-cell-type">Cell Type</span>
                                        </div>
                                        <div class="liger-browser-list">
                                            <button
                                                v-for="cellTypeGroup in $parent.getActiveDatasetGroup().cellTypes"
                                                :key="`${$parent.getActiveDatasetGroup().dataset}-${cellTypeGroup.cellType}`"
                                                class="liger-browser-item"
                                                :class="{ 'is-active': $parent.isHierarchyItemActive('cellType', cellTypeGroup.cellType, { dataset: $parent.getActiveDatasetGroup().dataset }) }"
                                                type="button"
                                                @click="$parent.selectHierarchyItem('cellType', {
                                                    dataset: $parent.getActiveDatasetGroup().dataset,
                                                    cellType: cellTypeGroup.cellType
                                                })"
                                            >
                                                <span class="liger-browser-item-label">{{ cellTypeGroup.cellType }}</span>
                                                <span class="liger-browser-item-meta">{{ cellTypeGroup.models.length }}</span>
                                                <span class="liger-browser-item-chevron">›</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        v-if="$parent.getActiveCellTypeGroup()"
                                        class="liger-browser-column is-model"
                                    >
                                        <div class="liger-browser-column-header">
                                            <span class="liger-entity-badge is-model">Model</span>
                                        </div>
                                        <div class="liger-browser-list">
                                            <button
                                                v-for="modelGroup in $parent.getActiveCellTypeGroup().models"
                                                :key="`${$parent.activeHierarchyPath.dataset}-${$parent.getActiveCellTypeGroup().cellType}-${modelGroup.model}`"
                                                class="liger-browser-item"
                                                :class="{ 'is-active': $parent.isHierarchyItemActive('model', modelGroup.model, {
                                                    dataset: $parent.activeHierarchyPath.dataset,
                                                    cellType: $parent.getActiveCellTypeGroup().cellType
                                                }) }"
                                                type="button"
                                                @click="$parent.selectHierarchyItem('model', {
                                                    dataset: $parent.activeHierarchyPath.dataset,
                                                    cellType: $parent.getActiveCellTypeGroup().cellType,
                                                    model: modelGroup.model
                                                })"
                                            >
                                                <span class="liger-browser-item-label">{{ modelGroup.model }}</span>
                                                <span class="liger-browser-item-meta">{{ modelGroup.factors.length }}</span>
                                                <span class="liger-browser-item-chevron">›</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        v-if="$parent.getActiveModelGroup()"
                                        class="liger-browser-column is-factor"
                                    >
                                        <div class="liger-browser-column-header">
                                            <span class="liger-entity-badge is-factor">Gene Program</span>
                                        </div>

                                        <div
                                            v-if="$parent.isModelFactorLoading(
                                                $parent.activeHierarchyPath.dataset,
                                                $parent.activeHierarchyPath.cellType,
                                                $parent.activeHierarchyPath.model
                                            )"
                                            class="liger-browser-status"
                                        >
                                            Loading gene programs...
                                        </div>

                                        <div
                                            v-else
                                            class="liger-browser-list"
                                        >
                                            <button
                                                v-for="factorGroup in $parent.getActiveModelGroup().factors"
                                                :key="`${$parent.activeHierarchyPath.dataset}-${$parent.activeHierarchyPath.cellType}-${$parent.activeHierarchyPath.model}-${factorGroup.factor}`"
                                                class="liger-browser-item is-leaf"
                                                :class="{
                                                    'is-active': $parent.factorModalData
                                                        && $parent.factorModalData.dataset === $parent.activeHierarchyPath.dataset
                                                        && $parent.factorModalData.cellType === $parent.activeHierarchyPath.cellType
                                                        && $parent.factorModalData.model === $parent.activeHierarchyPath.model
                                                        && $parent.factorModalData.factor === factorGroup.factor
                                                }"
                                                type="button"
                                                @click="$parent.openFactorModal({
                                                    dataset: $parent.activeHierarchyPath.dataset,
                                                    cellType: $parent.activeHierarchyPath.cellType,
                                                    model: $parent.activeHierarchyPath.model,
                                                    factor: factorGroup.factor,
                                                    score: factorGroup.score,
                                                    scoreField: factorGroup.scoreField
                                                })"
                                            >
                                                <span class="liger-browser-item-copy">
                                                    <span
                                                        class="liger-browser-item-label"
                                                        :title="$parent.getFactorSummary(
                                                            $parent.activeHierarchyPath.dataset,
                                                            $parent.activeHierarchyPath.cellType,
                                                            $parent.activeHierarchyPath.model,
                                                            factorGroup.factor
                                                        )?.label || factorGroup.factor"
                                                    >
                                                        {{ $parent.getFactorSummary(
                                                            $parent.activeHierarchyPath.dataset,
                                                            $parent.activeHierarchyPath.cellType,
                                                            $parent.activeHierarchyPath.model,
                                                            factorGroup.factor
                                                        )?.label || factorGroup.factor }}
                                                    </span>
                                                </span>
                                                <span class="liger-browser-item-chevron">↗</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="$parent.getVisibleDetailPanels().length"
                            class="liger-detail-accordion"
                        >
                            <div
                                v-for="panel in $parent.getVisibleDetailPanels()"
                                :key="panel.key"
                                class="liger-detail-accordion-item"
                                :class="[
                                    panel.badgeClass,
                                    { 'is-active': $parent.isDetailPanelActive(panel) }
                                ]"
                            >
                                <button
                                    class="liger-detail-accordion-toggle"
                                    type="button"
                                    @click="$parent.setActiveDetailPanel(panel.type, panel.key)"
                                >
                                    <span class="liger-detail-accordion-title">
                                        <span class="liger-entity-badge" :class="panel.badgeClass">{{ panel.badgeLabel }}</span>
                                        <span class="liger-detail-accordion-value">{{ panel.value }}</span>
                                    </span>
                                    <span class="liger-detail-accordion-indicator">
                                        {{ $parent.isDetailPanelActive(panel) ? "−" : "+" }}
                                    </span>
                                </button>

                                <div
                                    v-if="$parent.isDetailPanelActive(panel)"
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
                                                    {{ $parent.factorModalData.summary?.label || $parent.factorModalData.factor }}
                                                </div>
                                            </div>
                                            <button
                                                class="liger-detail-panel-close"
                                                type="button"
                                                @click="$parent.closeFactorModal()"
                                            >
                                                Close
                                            </button>
                                        </div>

                                        <div class="liger-detail-panel-meta">
                                            <div><span class="liger-detail-meta-label">Factor ID</span>{{ $parent.factorModalData.factor }}</div>
                                            <div><span class="liger-detail-meta-label">Dataset</span>{{ $parent.factorModalData.dataset }}</div>
                                            <div><span class="liger-detail-meta-label">Cell Type</span>{{ $parent.factorModalData.cellType }}</div>
                                            <div><span class="liger-detail-meta-label">Model</span>{{ $parent.factorModalData.model }}</div>
                                            <div><span class="liger-detail-meta-label">{{ $parent.factorModalData.scoreField }}</span>{{ $parent.factorModalData.score }}</div>
                                        </div>

                                        <div class="liger-detail-panel-columns">
                                            <div
                                                v-if="$parent.factorModalData.summary?.top_genes_list?.length"
                                                class="liger-detail-panel-section"
                                            >
                                                <div class="liger-detail-panel-section-title">
                                                    Top Genes
                                                    <span class="liger-detail-panel-section-count">
                                                        {{ $parent.factorModalData.summary.top_genes_list.length }}
                                                    </span>
                                                </div>
                                                <div class="liger-detail-list">
                                                    <div class="liger-detail-list-header">
                                                        <span>Gene</span>
                                                        <span>Value</span>
                                                    </div>
                                                    <div
                                                        v-for="gene in $parent.factorModalData.detailScores.topGenes"
                                                        :key="`${$parent.factorModalData.factor}-gene-${gene.label}`"
                                                        class="liger-detail-list-item"
                                                    >
                                                        <span class="liger-detail-list-item-label" :title="gene.label">{{ gene.label }}</span>
                                                        <span class="liger-detail-list-item-value">{{ gene.value ?? "—" }}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                v-if="$parent.factorModalData.summary?.top_gene_sets_list?.length"
                                                class="liger-detail-panel-section"
                                            >
                                                <div class="liger-detail-panel-section-title">
                                                    Top Gene Sets
                                                    <span class="liger-detail-panel-section-count">
                                                        {{ $parent.factorModalData.summary.top_gene_sets_list.length }}
                                                    </span>
                                                </div>
                                                <div class="liger-detail-list">
                                                    <div class="liger-detail-list-header">
                                                        <span>Gene Set</span>
                                                        <span>Beta</span>
                                                    </div>
                                                    <div
                                                        v-for="geneSet in $parent.factorModalData.detailScores.topGeneSets"
                                                        :key="`${$parent.factorModalData.factor}-gene-set-${geneSet.label}`"
                                                        class="liger-detail-list-item"
                                                    >
                                                        <span class="liger-detail-list-item-label" :title="geneSet.label">{{ geneSet.label }}</span>
                                                        <span class="liger-detail-list-item-value">{{ geneSet.beta ?? "—" }}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                v-if="$parent.factorModalData.summary?.top_traits_list?.length"
                                                class="liger-detail-panel-section"
                                            >
                                                <div class="liger-detail-panel-section-title">
                                                    Top Traits
                                                    <span class="liger-detail-panel-section-count">
                                                        {{ $parent.factorModalData.summary.top_traits_list.length }}
                                                    </span>
                                                </div>
                                                <div class="liger-detail-list">
                                                    <div class="liger-detail-list-header">
                                                        <span>Trait</span>
                                                        <span>pValue</span>
                                                    </div>
                                                    <div
                                                        v-for="trait in $parent.factorModalData.detailScores.topTraits"
                                                        :key="`${$parent.factorModalData.factor}-trait-${trait.label}`"
                                                        class="liger-detail-list-item"
                                                    >
                                                        <span class="liger-detail-list-item-label" :title="trait.label">{{ trait.label }}</span>
                                                        <span class="liger-detail-list-item-value">{{ trait.pValue ?? "—" }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            v-if="$parent.factorModalData.detailLoading"
                                            class="liger-detail-panel-loading"
                                        >
                                            Loading detailed scores...
                                        </div>
                                    </template>
                                </div>
                            </div>
	                        </div>
	                </div>
	            </div>
	        </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style scoped>
.liger-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
}

.liger-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.liger-mode-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger-search-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger-suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border: 1px solid #d9d9d9;
    background: #d9d9d9;
}

.liger-mode-button,
.liger-suggestion-button,
.liger-input {
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    background: #ffffff;
    color: #111111;
    font: inherit;
}

.liger-mode-button,
.liger-suggestion-button {
    cursor: pointer;
}

.liger-mode-button.is-active {
    border-color: #111111;
}

.liger-suggestion-button {
    border: 0;
    text-align: left;
}

.liger-status {
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
}

.liger-results-tree {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid #d9d9d9;
    background: #fcfcfc;
}

.liger-results-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 0 10px 0;
    border-bottom: 1px solid #e6e6e6;
}

.liger-results-legend-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-results-legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger-browser-columns {
    position: absolute;
    top: 0;
    left: 0;
    width: max-content;
    will-change: transform;
}

.liger-browser-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: max-content;
    transform-origin: top left;
    will-change: transform;
}

.liger-browser-viewport.is-animating .liger-browser-columns,
.liger-browser-viewport.is-animating .liger-browser-content {
    transition: transform 180ms ease;
}

.liger-browser-viewport {
    position: relative;
    overflow: hidden;
    min-height: 452px;
    border-radius: 18px;
    cursor: grab;
    touch-action: none;
    user-select: none;
}

.liger-browser-fit-button {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 34px;
    height: 34px;
    padding: 0 0 3px 0;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    color: #333333;
    font: inherit;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(17, 17, 17, 0.08);
}

.liger-browser-fit-button:hover {
    background: #ffffff;
    color: #111111;
}

.liger-browser-viewport.is-dragging {
    cursor: grabbing;
}

.liger-browser-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(240px, 100%);
    min-width: 200px;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(17, 17, 17, 0.06);
}

.liger-browser-column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 26px;
}

.liger-browser-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 420px;
    overflow: auto;
    user-select: none;
}

.liger-browser-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #111111;
    font: inherit;
    cursor: pointer;
    text-align: left;
}

.liger-browser-item-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
    gap: 1px;
}

.liger-browser-item:hover {
    background: #f4f6f8;
}

.liger-browser-item.is-active {
    background: #eaf2ff;
    color: #144aa0;
}

.liger-browser-item.is-leaf:hover {
    background: #f7f3ff;
    color: #5e2fa0;
}

.liger-browser-column.is-dataset .liger-browser-item.is-active {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-browser-column.is-search .liger-browser-item.is-active {
    background: #eef0f3;
    color: #4b5563;
}

.liger-browser-column.is-cell-type .liger-browser-item.is-active {
    background: #e8f7ef;
    color: #22784e;
}

.liger-browser-column.is-model .liger-browser-item.is-active {
    background: #fff3df;
    color: #9a5a00;
}

.liger-browser-column.is-factor .liger-browser-item.is-active,
.liger-browser-item.is-leaf.is-active {
    background: #f1e8ff;
    color: #5e2fa0;
}

.liger-browser-column.is-factor .liger-browser-item-label {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.2;
}

.liger-browser-item-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
}

.liger-browser-item-sublabel {
    min-width: 0;
    color: #777777;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-browser-item-meta {
    color: #666666;
    font-size: 12px;
    white-space: nowrap;
}

.liger-browser-item-chevron {
    color: #888888;
    font-size: 16px;
    line-height: 1;
}

.liger-browser-status {
    padding: 8px 10px;
    color: #666666;
    font-size: 13px;
}

.liger-detail-accordion {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.liger-detail-accordion-item {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #d9d9d9;
    border-radius: 14px;
    background: #ffffff;
    overflow: hidden;
}

.liger-detail-accordion-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 4px 6px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #111111;
    font: inherit;
    cursor: pointer;
    text-align: left;
}

.liger-detail-accordion-item.is-active .liger-detail-accordion-toggle {
    border-bottom: 1px solid #ececec;
}

.liger-detail-accordion-item.is-search.is-active .liger-detail-accordion-toggle {
    background: #eef0f3;
    color: #4b5563;
}

.liger-detail-accordion-item.is-dataset.is-active .liger-detail-accordion-toggle {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-detail-accordion-item.is-cell-type.is-active .liger-detail-accordion-toggle {
    background: #e8f7ef;
    color: #22784e;
}

.liger-detail-accordion-item.is-model.is-active .liger-detail-accordion-toggle {
    background: #fff3df;
    color: #9a5a00;
}

.liger-detail-accordion-item.is-factor.is-active .liger-detail-accordion-toggle {
    background: #f4ebff;
    color: #6f35b2;
}

.liger-detail-accordion-item.is-active .liger-detail-accordion-value {
    color: #111111;
}

.liger-detail-accordion-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.liger-detail-accordion-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
}

.liger-detail-accordion-indicator {
    color: #666666;
    font-weight: 600;
}

.liger-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px 20px;
    border: 0;
    border-radius: 0;
    background: transparent;
}

.liger-detail-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.liger-detail-panel-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.liger-detail-panel-kicker {
    color: #666666;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.liger-detail-panel-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.25;
}

.liger-detail-panel-close {
    padding: 4px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    background: #ffffff;
    color: #111111;
    font: inherit;
    cursor: pointer;
}

.liger-detail-panel-meta {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
}

.liger-detail-panel-meta > div {
    display: flex;
    flex-direction: column;
    padding: 6px 8px;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    background: #fafafa;
    min-width: 0;
}

.liger-detail-meta-label {
    color: #666666;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-detail-panel-section {
    display: flex;
    flex-direction: column;
    gap: 0px;
    min-width: 0;
}

.liger-detail-panel-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.liger-detail-panel-section-title {
    font-weight: 600;
    font-size: 13px;
}

.liger-detail-panel-section-count {
    color: #666666;
    font-weight: 500;
}

.liger-detail-panel-loading {
    color: #666666;
    font-size: 13px;
}

.liger-detail-placeholder {
    color: #666666;
    font-size: 13px;
}

.liger-detail-panel-dataset {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.liger-detail-panel-split {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.liger-detail-panel-main,
.liger-detail-panel-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger-detail-panel-meta-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
}

.liger-detail-panel-meta-pair {
    grid-template-columns: 1fr;
}

.liger-detail-rich-text {
    color: #333333;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-word;
    overflow: hidden;
}

.liger-detail-meta-value,
.liger-detail-meta-link {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-detail-meta-link {
    color: #2158b6;
    text-decoration: none;
}

.liger-detail-meta-link:hover {
    text-decoration: underline;
}

.liger-detail-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-height: 180px;
    overflow: auto;
}

.liger-detail-list-header,
.liger-detail-list-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 5px 8px;
}

.liger-detail-list-header {
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 1px solid #ececec;
    background: #ffffff;
    color: #666666;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-detail-list-item {
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fafafa;
    font-size: 13px;
    line-height: 1.2;
}

.liger-detail-list-item-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-detail-list-item-value {
    color: #666666;
    font-size: 12px;
    white-space: nowrap;
}

.liger-entity-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
}

.liger-entity-badge.is-dataset {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-entity-badge.is-search {
    background: #eef0f3;
    color: #4b5563;
}

.liger-entity-badge.is-cell-type {
    background: #e8f7ef;
    color: #22784e;
}

.liger-entity-badge.is-model {
    background: #fff3df;
    color: #9a5a00;
}

.liger-entity-badge.is-factor {
    background: #f4ebff;
    color: #6f35b2;
}

.liger-pill-list {
    display: flex;
    gap: 8px;
}

.liger-pill-list {
    flex-direction: row;
    flex-wrap: wrap;
}

.liger-pill {
    padding: 6px 8px;
    border: 1px solid #d9d9d9;
}
</style>
