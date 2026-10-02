<template>
    <div class="mskkp-sc-compare">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">Dataset vs Dataset Single-Cell Comparison</h1>
                    <p class="eyebrow">MSKKP live single-cell explorer</p>
                    <p class="lede">
                        Compare musculoskeletal single-cell datasets. Start by selecting the tissues for your comparison using the filters below.
                    </p>
                    <div v-if="$store.state.metadataError" class="alert alert-warning">
                        {{ $store.state.metadataError }}
                    </div>
                    <p v-else-if="!$store.state.loading && $parent.datasets.length" class="caption dataset-count-note">
                        {{ $store.state.datasetCount }} single-cell dataset{{ $store.state.datasetCount === 1 ? "" : "s" }}
                        available.
                    </p>
                    <div
                        v-if="!$store.state.loading && !$store.state.usingMskDatasets"
                        class="alert alert-info"
                    >
                        No dataset on this BioIndex host is tagged for the "msk"
                        portal, so there are no musculoskeletal single-cell datasets
                        to load. The fuller MSK set (bone, bone marrow, tendon/ligament)
                        currently lives on the dev BioIndex - rebuild with
                        <code>BIOINDEX_DEV=1</code> to see it.
                    </div>
                </div>
            </div>

            <!-- Tissue pickers -->
            <div class="card mdkp-card" v-if="$parent.tissues.length && $parent.datasets.length">
                <div class="card-body">
                    <h4 class="card-title">Select Tissue(s) to Compare</h4>
                    <div class="row controls sc-filter-wrap">
                        <label class="col-md-6 control">
                            <span>Left tissue</span>
                            <select class="form-control" v-model="$parent.leftTissue">
                                <option value="All tissues">All tissues</option>
                                <option v-for="t in $parent.tissues" :key="'lt-' + t" :value="t">
                                    {{ $parent.formatLabel(t) }}
                                </option>
                            </select>
                        </label>
                        <label class="col-md-6 control">
                            <span>Right tissue</span>
                            <select class="form-control" v-model="$parent.rightTissue">
                                <option value="All tissues">All tissues</option>
                                <option v-for="t in $parent.tissues" :key="'rt-' + t" :value="t">
                                    {{ $parent.formatLabel(t) }}
                                </option>
                            </select>
                        </label>
                    </div>
                    <div>&nbsp;</div>
                    <h4 class="card-title">Choose datasets to compare across the selected tissue(s)
                    </h4>
                    <div class="row controls sc-filter-wrap">
                        <label class="col-md-6 control">
                            <span>Left dataset</span>
                            <select class="form-control" v-model="$parent.leftId">
                                <option
                                    v-for="d in $parent.leftDatasets"
                                    :key="'l-' + d.id"
                                    :value="d.id"
                                    :title="$parent.formatDatasetOption(d)"
                                >
                                    {{ $parent.formatDatasetOption(d) }}
                                </option>
                            </select>
                        </label>
                        <label class="col-md-6 control">
                            <span>Right dataset</span>
                            <select class="form-control" v-model="$parent.rightId">
                                <option
                                    v-for="d in $parent.rightDatasets"
                                    :key="'r-' + d.id"
                                    :value="d.id"
                                    :title="$parent.formatDatasetOption(d)"
                                >
                                    {{ $parent.formatDatasetOption(d) }}
                                </option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div class="card mdkp-card" v-else>
                <div class="card-body">
                    <div class="empty-state">
                        {{ $store.state.loading ? "Loading musculoskeletal single-cell datasets from the BioIndex..." : "No musculoskeletal (\"msk\") single-cell datasets are currently available on this BioIndex host." }}
                    </div>
                </div>
            </div>

            <template v-if="$parent.datasets.length">
                <!-- Dataset overview -->
                <div class="card mdkp-card" aria-labelledby="sc-overview-title">
                    <div class="card-body">
                        <div class="section-heading">
                            <h4 id="sc-overview-title" class="card-title">Dataset Overview</h4>
                            <p class="caption">
                                Display-sampled UMAP coordinates colored by cell type,
                                fetched live per dataset.
                            </p>
                        </div>
                        <div class="row paired-panels">
                            <article class="col-md-6 panel">
                                <div class="panel-title">
                                    <h3>{{ $parent.leftLabel }}</h3>
                                    <span>{{ $parent.leftCountLabel }}</span>
                                </div>
                                <download-chart
                                    class="download"
                                    chartId="sc-left-umap-canvas"
                                    :filename="`${$parent.slug($parent.leftLabel)}_umap`"
                                ></download-chart>
                                <canvas id="sc-left-umap-canvas" ref="leftUmap"></canvas>
                            </article>
                            <article class="col-md-6 panel">
                                <div class="panel-title">
                                    <h3>{{ $parent.rightLabel }}</h3>
                                    <span>{{ $parent.rightCountLabel }}</span>
                                </div>
                                <download-chart
                                    class="download"
                                    chartId="sc-right-umap-canvas"
                                    :filename="`${$parent.slug($parent.rightLabel)}_umap`"
                                ></download-chart>
                                <canvas id="sc-right-umap-canvas" ref="rightUmap"></canvas>
                            </article>
                        </div>
                        <div class="legend-row">
                            <span class="legend-item" v-for="ct in $parent.cellTypes" :key="ct">
                                <span
                                    class="swatch"
                                    :style="{ background: $parent.cellTypeColors[ct] || '#999' }"
                                ></span>
                                {{ $parent.formatLabel(ct) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Gene comparison -->
                <div class="card mdkp-card" aria-labelledby="sc-gene-title">
                    <div class="card-body">
                        <div class="section-heading with-control">
                            <h4 id="sc-gene-title" class="card-title">Gene Comparison</h4>
                            <label class="control compact">
                                <span>Gene</span>
                                <input
                                    class="form-control"
                                    list="sc-gene-options"
                                    v-model="$parent.geneInput"
                                    @change="$parent.applyGene()"
                                    @keydown.enter="$parent.applyGene()"
                                    autocomplete="off"
                                    placeholder="Type any gene symbol..."
                                />
                                <datalist id="sc-gene-options">
                                    <option v-for="g in $parent.geneOptions" :key="g" :value="g"></option>
                                </datalist>
                            </label>
                        </div>
                        <p class="caption panel-note gene-panel-note">
                            {{ $parent.geneOptions.length }} suggested genes
                            <template v-if="$store.state.usingLiveGenePanel">auto-loaded live from {{ $parent.leftLabel }} / {{ $parent.rightLabel }}'s own marker genes</template>
                            <template v-else>from a fallback list</template>
                            - any gene symbol you type is queried live regardless.
                        </p>
                        <div class="plot-card">
                            <div class="plot-title">
                                <h3>Expression by cell type</h3>
                                <div class="dataset-key">
                                    <span><i class="chip left"></i>{{ $parent.leftLabel }}</span>
                                    <span><i class="chip right"></i>{{ $parent.rightLabel }}</span>
                                </div>
                                <download-chart
                                    class="download"
                                    chartId="sc-gene-plot-canvas"
                                    :filename="`${$parent.slug($parent.selectedGene)}_expression_by_celltype`"
                                ></download-chart>
                            </div>
                            <div class="plot-status" v-if="$parent.geneStatusDisplay">
                                {{ $parent.geneStatusDisplay }}
                            </div>
                            <canvas id="sc-gene-plot-canvas" ref="genePlot"></canvas>
                        </div>
                        <div class="row paired-tables">
                            <article class="col-md-6 table-card">
                                <h3>{{ $parent.leftLabel }} summaries</h3>
                                <div v-if="!$parent.leftGeneTableRows.length" class="empty-state">
                                    No rows available.
                                </div>
                                <template v-else>
                                    <div class="table-toolbar">
                                        <data-download
                                            :data="$parent.leftGeneTableCsvRows"
                                            :filename="`${$parent.slug($parent.leftLabel)}_gene_expression_by_celltype`"
                                        ></data-download>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Cell type</th>
                                                <th class="numeric">Adj. p-value</th>
                                                <th class="numeric">Log fold change</th>
                                                <th class="numeric">% cell expr</th>
                                                <th class="numeric">Mean expr (scaled)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in $parent.leftGeneTableRows" :key="row.label">
                                                <td>{{ row.label }}</td>
                                                <td class="numeric">{{ $parent.formatPValue(row.summary.p_value_adj) }}</td>
                                                <td class="numeric">{{ $parent.formatSigned(row.summary.log_fold_change) }}</td>
                                                <td class="numeric">{{ $parent.formatPercent(row.summary.pct_expressing) }}</td>
                                                <td class="numeric">{{ $parent.formatNumber(row.summary.mean_expression_scaled) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </template>
                            </article>
                            <article class="col-md-6 table-card">
                                <h3>{{ $parent.rightLabel }} summaries</h3>
                                <div v-if="!$parent.rightGeneTableRows.length" class="empty-state">
                                    No rows available.
                                </div>
                                <template v-else>
                                    <div class="table-toolbar">
                                        <data-download
                                            :data="$parent.rightGeneTableCsvRows"
                                            :filename="`${$parent.slug($parent.rightLabel)}_gene_expression_by_celltype`"
                                        ></data-download>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Cell type</th>
                                                <th class="numeric">Adj. p-value</th>
                                                <th class="numeric">Log fold change</th>
                                                <th class="numeric">% cell expr</th>
                                                <th class="numeric">Mean expr (scaled)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in $parent.rightGeneTableRows" :key="row.label">
                                                <td>{{ row.label }}</td>
                                                <td class="numeric">{{ $parent.formatPValue(row.summary.p_value_adj) }}</td>
                                                <td class="numeric">{{ $parent.formatSigned(row.summary.log_fold_change) }}</td>
                                                <td class="numeric">{{ $parent.formatPercent(row.summary.pct_expressing) }}</td>
                                                <td class="numeric">{{ $parent.formatNumber(row.summary.mean_expression_scaled) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </template>
                            </article>
                        </div>
                    </div>
                </div>

                <!-- Cell-type comparison -->
                <div class="card mdkp-card" aria-labelledby="sc-celltype-title">
                    <div class="card-body">
                        <div class="section-heading with-control">
                            <h4 id="sc-celltype-title" class="card-title">Cell-Type Comparison</h4>
                            <label class="control compact">
                                <span>Cell type</span>
                                <select class="form-control" v-model="$parent.cellTypeModel">
                                    <option v-for="ct in $parent.cellTypes" :key="ct" :value="ct">
                                        {{ $parent.formatLabel(ct) }}
                                    </option>
                                </select>
                            </label>
                        </div>
                        <div class="plot-card">
                            <div class="plot-title">
                                <h3>Marker-panel genes by average expression</h3>
                                <div class="dataset-key">
                                    <span><i class="chip left"></i>{{ $parent.leftLabel }}</span>
                                    <span><i class="chip right"></i>{{ $parent.rightLabel }}</span>
                                </div>
                                <download-chart
                                    class="download"
                                    chartId="sc-cell-type-plot-canvas"
                                    :filename="`${$parent.slug($parent.cellTypeModel)}_marker_genes`"
                                ></download-chart>
                            </div>
                            <div class="plot-status" v-if="$parent.cellTypeStatusDisplay">
                                {{ $parent.cellTypeStatusDisplay }}
                            </div>
                            <canvas id="sc-cell-type-plot-canvas" ref="cellTypePlot"></canvas>
                        </div>
                        <!-- <p class="caption panel-note">
                            Scoped to the top {{ $parent.genePanelCount }} marker genes
                            <template v-if="$store.state.usingLiveGenePanel">auto-loaded live from each dataset's own marker_genes file</template>
                            <template v-else>from a fallback list (neither dataset has a live marker-gene file)</template>
                            - not the whole genome, see the comments in
                            <code>src/views/SingleCellCompare/store.js</code> for why.
                        </p> -->
                        <div class="row paired-tables">
                            <article class="col-md-6 table-card">
                                <h3>{{ $parent.leftLabel }} summaries</h3>
                                <div v-if="!$parent.leftCellTypeTableRows.length" class="empty-state">
                                    No rows available.
                                </div>
                                <template v-else>
                                    <div class="table-toolbar">
                                        <data-download
                                            :data="$parent.leftCellTypeTableCsvRows"
                                            :filename="`${$parent.slug($parent.leftLabel)}_${$parent.slug($parent.cellTypeModel)}_marker_genes`"
                                        ></data-download>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Gene</th>
                                                <th class="numeric">Adj. p-value</th>
                                                <th class="numeric">Log fold change</th>
                                                <th class="numeric">% cell expr</th>
                                                <th class="numeric">Mean expr (scaled)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in $parent.leftCellTypeTableRows" :key="row.label">
                                                <td>{{ row.label }}</td>
                                                <td class="numeric">{{ $parent.formatPValue(row.summary.p_value_adj) }}</td>
                                                <td class="numeric">{{ $parent.formatSigned(row.summary.log_fold_change) }}</td>
                                                <td class="numeric">{{ $parent.formatPercent(row.summary.pct_expressing) }}</td>
                                                <td class="numeric">{{ $parent.formatNumber(row.summary.mean_expression_scaled) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </template>
                            </article>
                            <article class="col-md-6 table-card">
                                <h3>{{ $parent.rightLabel }} summaries</h3>
                                <div v-if="!$parent.rightCellTypeTableRows.length" class="empty-state">
                                    No rows available.
                                </div>
                                <template v-else>
                                    <div class="table-toolbar">
                                        <data-download
                                            :data="$parent.rightCellTypeTableCsvRows"
                                            :filename="`${$parent.slug($parent.rightLabel)}_${$parent.slug($parent.cellTypeModel)}_marker_genes`"
                                        ></data-download>
                                    </div>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Gene</th>
                                                <th class="numeric">Adj. p-value</th>
                                                <th class="numeric">Log fold change</th>
                                                <th class="numeric">% cell expr</th>
                                                <th class="numeric">Mean expr (scaled)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in $parent.rightCellTypeTableRows" :key="row.label">
                                                <td>{{ row.label }}</td>
                                                <td class="numeric">{{ $parent.formatPValue(row.summary.p_value_adj) }}</td>
                                                <td class="numeric">{{ $parent.formatSigned(row.summary.log_fold_change) }}</td>
                                                <td class="numeric">{{ $parent.formatPercent(row.summary.pct_expressing) }}</td>
                                                <td class="numeric">{{ $parent.formatNumber(row.summary.mean_expression_scaled) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </template>
                            </article>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Footer -->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style scoped>
.mskkp-sc-compare {
    --sc-left: #2f6f73;
    --sc-right: #c06938;
}

.mskkp-sc-compare .eyebrow {
    margin: 0 0 8px;
    color: var(--sc-left);
    font-size: 0.78rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.mskkp-sc-compare .lede {
    margin-bottom: 0;
    color: #43504b;
    font-size: 1.02rem;
}

.mskkp-sc-compare .card-title {
    margin-bottom: 10px;
}

.mskkp-sc-compare h1.card-title {
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    line-height: 1.1;
}

.mskkp-sc-compare .section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
}

.mskkp-sc-compare .section-heading.with-control {
    align-items: center;
}

.mskkp-sc-compare .caption {
    max-width: 420px;
    margin-bottom: 0;
    color: #63706b;
    font-size: 0.88rem;
    text-align: right;
}

.mskkp-sc-compare .panel-note {
    max-width: none;
    text-align: left;
    margin-bottom: 14px;
}

.mskkp-sc-compare .dataset-count-note {
    max-width: none;
    text-align: left;
    margin: 6px 0 0;
}

.mskkp-sc-compare .gene-panel-note {
    max-width: none;
    text-align: left;
    margin: -8px 0 14px;
}

.mskkp-sc-compare .controls {
    margin: 0 -7px;
}

.mskkp-sc-compare .sc-filter-wrap {
    background-color: #ddefff;
    border: 1px solid #bbdfff;
    border-radius: 5px;
}

.mskkp-sc-compare .controls .control {
    padding: 0 7px;
}

.mskkp-sc-compare .control {
    display: grid;
    gap: 6px;
    color: #63706b;
    font-size: 0.82rem;
    font-weight: 700;
}

.mskkp-sc-compare .control.compact {
    min-width: min(320px, 100%);
}

.mskkp-sc-compare .paired-panels,
.mskkp-sc-compare .paired-tables {
    margin: 0 -7px;
}

.mskkp-sc-compare .paired-panels > [class*="col"],
.mskkp-sc-compare .paired-tables > [class*="col"] {
    padding: 0 7px;
}

.mskkp-sc-compare .panel,
.mskkp-sc-compare .plot-card,
.mskkp-sc-compare .table-card {
    min-width: 0;
    border: 1px solid #dbe4df;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
}

.mskkp-sc-compare .panel-title,
.mskkp-sc-compare .plot-title,
.mskkp-sc-compare .table-card h3 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 46px;
    padding: 12px 14px;
    border-bottom: 1px solid #bbdfff;
    background: #ddefff;
}

.mskkp-sc-compare .panel-title span {
    color: #63706b;
    font-size: 0.82rem;
    white-space: nowrap;
}

.mskkp-sc-compare canvas {
    display: block;
    width: 100%;
    aspect-ratio: 1.5;
    background: #fbfcfc;
}

.mskkp-sc-compare .plot-card {
    position: relative;
    margin-bottom: 14px;
}

.mskkp-sc-compare .plot-card canvas {
    aspect-ratio: 3.05;
}

.mskkp-sc-compare .plot-status {
    position: absolute;
    inset: 49px 0 auto 0;
    z-index: 1;
    padding: 14px;
    color: #63706b;
    font-size: 0.9rem;
    pointer-events: none;
}

.mskkp-sc-compare .dataset-key,
.mskkp-sc-compare .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    color: #63706b;
    font-size: 0.82rem;
}

.mskkp-sc-compare .legend-row {
    margin-top: 14px;
}

.mskkp-sc-compare .dataset-key span,
.mskkp-sc-compare .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.mskkp-sc-compare .chip,
.mskkp-sc-compare .swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    border: 1px solid rgba(0, 0, 0, 0.12);
}

.mskkp-sc-compare .chip.left {
    background: var(--sc-left);
}

.mskkp-sc-compare .chip.right {
    background: var(--sc-right);
}

.mskkp-sc-compare table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.86rem;
}

.mskkp-sc-compare th,
.mskkp-sc-compare td {
    padding: 8px 11px;
    border-bottom: 1px solid #dbe4df;
    text-align: left;
    vertical-align: middle;
}

.mskkp-sc-compare th {
    color: #63706b;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.mskkp-sc-compare td.numeric,
.mskkp-sc-compare th.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.mskkp-sc-compare tr:last-child td {
    border-bottom: 0;
}

.mskkp-sc-compare .panel-title .download-chart,
.mskkp-sc-compare .plot-title .download-chart {
    margin-bottom: 0;
    float: none;
}

.mskkp-sc-compare .table-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 8px 11px 0;
}

.mskkp-sc-compare .empty-state {
    padding: 15px;
    color: #63706b;
    font-size: 0.9rem;
}

@media (max-width: 860px) {
    .mskkp-sc-compare .section-heading,
    .mskkp-sc-compare .section-heading.with-control {
        flex-direction: column;
        align-items: stretch;
    }

    .mskkp-sc-compare .caption {
        text-align: left;
    }

    .mskkp-sc-compare .plot-title {
        display: grid;
        align-items: start;
    }

    .mskkp-sc-compare .controls,
    .mskkp-sc-compare .paired-panels,
    .mskkp-sc-compare .paired-tables {
        margin: 0;
    }

    .mskkp-sc-compare .controls > [class*="col"],
    .mskkp-sc-compare .paired-panels > [class*="col"],
    .mskkp-sc-compare .paired-tables > [class*="col"] {
        padding: 0;
    }
}
</style>
