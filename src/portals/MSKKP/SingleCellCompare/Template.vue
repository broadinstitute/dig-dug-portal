<template>
    <div class="mskkp-sc-compare">
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid">
            <main class="page-shell">
                <header class="page-shell-header">
                    <p class="eyebrow">MSKKP live single-cell explorer</p>
                    <h1>Dataset vs Dataset Single-Cell Comparison</h1>
                    <p class="lede">
                        Compare musculoskeletal single-cell datasets using live
                        queries against the single-cell BioIndex API - no
                        precomputed or static test data.
                    </p>
                    <div
                        v-if="$store.state.metadataError"
                        class="alert alert-warning"
                    >
                        {{ $store.state.metadataError }}
                    </div>
                    <p
                        v-else-if="
                            !$store.state.loading && $parent.datasets.length
                        "
                        class="caption dataset-count-note"
                    >
                        {{ $store.state.datasetCount }} single-cell dataset{{
                            $store.state.datasetCount === 1 ? "" : "s"
                        }}
                        available from this BioIndex host{{
                            $store.state.usingMskDatasets
                                ? ""
                                : ' (none tagged for the "msk" portal yet)'
                        }}.
                    </p>
                    <div
                        v-if="
                            !$store.state.loading &&
                            !$store.state.usingMskDatasets &&
                            $parent.datasets.length
                        "
                        class="alert alert-info"
                    >
                        No dataset on this BioIndex host is tagged for the "msk"
                        portal yet, so the pickers below default to the first
                        two datasets available. The fuller MSK set (bone, bone
                        marrow, tendon/ligament) currently lives on the dev
                        BioIndex - rebuild with <code>BIOINDEX_DEV=1</code> to
                        see it.
                    </div>
                </header>

                <section
                    class="section-block controls"
                    v-if="$parent.datasets.length"
                >
                    <label class="control">
                        <span>Left dataset</span>
                        <select class="form-control" v-model="$parent.leftId">
                            <option
                                v-for="d in $parent.datasets"
                                :key="'l-' + d.id"
                                :value="d.id"
                            >
                                {{ d.label }}
                            </option>
                        </select>
                    </label>
                    <label class="control">
                        <span>Right dataset</span>
                        <select class="form-control" v-model="$parent.rightId">
                            <option
                                v-for="d in $parent.datasets"
                                :key="'r-' + d.id"
                                :value="d.id"
                            >
                                {{ d.label }}
                            </option>
                        </select>
                    </label>
                </section>
                <section class="section-block" v-else>
                    <div class="empty-state">
                        {{
                            $store.state.loading
                                ? "Loading datasets from the single-cell BioIndex..."
                                : "No single-cell datasets are currently available."
                        }}
                    </div>
                </section>

                <template v-if="$parent.datasets.length">
                    <section
                        class="section-block"
                        aria-labelledby="sc-overview-title"
                    >
                        <div class="section-heading">
                            <h2 id="sc-overview-title">Dataset Overview</h2>
                            <p class="caption">
                                Display-sampled UMAP coordinates colored by cell
                                type, fetched live per dataset.
                            </p>
                        </div>
                        <div class="paired-panels">
                            <article class="panel">
                                <div class="panel-title">
                                    <h3>{{ $parent.leftLabel }}</h3>
                                    <span>{{ $parent.leftCountLabel }}</span>
                                </div>
                                <canvas ref="leftUmap"></canvas>
                            </article>
                            <article class="panel">
                                <div class="panel-title">
                                    <h3>{{ $parent.rightLabel }}</h3>
                                    <span>{{ $parent.rightCountLabel }}</span>
                                </div>
                                <canvas ref="rightUmap"></canvas>
                            </article>
                        </div>
                        <div class="legend-row">
                            <span
                                class="legend-item"
                                v-for="ct in $parent.cellTypes"
                                :key="ct"
                            >
                                <span
                                    class="swatch"
                                    :style="{
                                        background:
                                            $parent.cellTypeColors[ct] ||
                                            '#999',
                                    }"
                                ></span>
                                {{ $parent.formatLabel(ct) }}
                            </span>
                        </div>
                    </section>

                    <section
                        class="section-block"
                        aria-labelledby="sc-gene-title"
                    >
                        <div class="section-heading with-control">
                            <h2 id="sc-gene-title">Gene Comparison</h2>
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
                                    <option
                                        v-for="g in $parent.geneOptions"
                                        :key="g"
                                        :value="g"
                                    ></option>
                                </datalist>
                            </label>
                        </div>
                        <p class="caption panel-note gene-panel-note">
                            {{ $parent.geneOptions.length }} suggested genes
                            <template v-if="$store.state.usingLiveGenePanel"
                                >auto-loaded live from {{ $parent.leftLabel }} /
                                {{ $parent.rightLabel }}'s own marker
                                genes</template
                            >
                            <template v-else>from a fallback list</template>
                            - any gene symbol you type is queried live
                            regardless.
                        </p>
                        <div class="plot-card">
                            <div class="plot-title">
                                <h3>Expression by cell type</h3>
                                <div class="dataset-key">
                                    <span
                                        ><i class="chip left"></i
                                        >{{ $parent.leftLabel }}</span
                                    >
                                    <span
                                        ><i class="chip right"></i
                                        >{{ $parent.rightLabel }}</span
                                    >
                                </div>
                            </div>
                            <div
                                class="plot-status"
                                v-if="$parent.geneStatusDisplay"
                            >
                                {{ $parent.geneStatusDisplay }}
                            </div>
                            <canvas ref="genePlot"></canvas>
                        </div>
                        <div class="paired-tables">
                            <article class="table-card">
                                <h3>{{ $parent.leftLabel }} summaries</h3>
                                <div
                                    v-if="!$parent.leftGeneTableRows.length"
                                    class="empty-state"
                                >
                                    No rows available.
                                </div>
                                <table v-else>
                                    <thead>
                                        <tr>
                                            <th>Cell type</th>
                                            <th class="numeric">Avg</th>
                                            <th class="numeric">% expr</th>
                                            <th class="numeric">n</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in $parent.leftGeneTableRows"
                                            :key="row.label"
                                        >
                                            <td>{{ row.label }}</td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatNumber(
                                                        row.summary
                                                            .avg_expression
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatPercent(
                                                        row.summary
                                                            .pct_expressing
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatInteger(
                                                        row.summary.n
                                                    )
                                                }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </article>
                            <article class="table-card">
                                <h3>{{ $parent.rightLabel }} summaries</h3>
                                <div
                                    v-if="!$parent.rightGeneTableRows.length"
                                    class="empty-state"
                                >
                                    No rows available.
                                </div>
                                <table v-else>
                                    <thead>
                                        <tr>
                                            <th>Cell type</th>
                                            <th class="numeric">Avg</th>
                                            <th class="numeric">% expr</th>
                                            <th class="numeric">n</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in $parent.rightGeneTableRows"
                                            :key="row.label"
                                        >
                                            <td>{{ row.label }}</td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatNumber(
                                                        row.summary
                                                            .avg_expression
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatPercent(
                                                        row.summary
                                                            .pct_expressing
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatInteger(
                                                        row.summary.n
                                                    )
                                                }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </article>
                        </div>
                    </section>

                    <section
                        class="section-block"
                        aria-labelledby="sc-celltype-title"
                    >
                        <div class="section-heading with-control">
                            <h2 id="sc-celltype-title">Cell-Type Comparison</h2>
                            <label class="control compact">
                                <span>Cell type</span>
                                <select
                                    class="form-control"
                                    v-model="$parent.cellTypeModel"
                                >
                                    <option
                                        v-for="ct in $parent.cellTypes"
                                        :key="ct"
                                        :value="ct"
                                    >
                                        {{ $parent.formatLabel(ct) }}
                                    </option>
                                </select>
                            </label>
                        </div>
                        <div class="plot-card">
                            <div class="plot-title">
                                <h3>
                                    Marker-panel genes by average expression
                                </h3>
                                <div class="dataset-key">
                                    <span
                                        ><i class="chip left"></i
                                        >{{ $parent.leftLabel }}</span
                                    >
                                    <span
                                        ><i class="chip right"></i
                                        >{{ $parent.rightLabel }}</span
                                    >
                                </div>
                            </div>
                            <div
                                class="plot-status"
                                v-if="$parent.cellTypeStatusDisplay"
                            >
                                {{ $parent.cellTypeStatusDisplay }}
                            </div>
                            <canvas ref="cellTypePlot"></canvas>
                        </div>
                        <p class="caption panel-note">
                            Scoped to the top
                            {{ $parent.genePanelCount }} marker genes
                            <template v-if="$store.state.usingLiveGenePanel"
                                >auto-loaded live from each dataset's own
                                marker_genes file</template
                            >
                            <template v-else
                                >from a fallback list (neither dataset has a
                                live marker-gene file)</template
                            >
                            - not the whole genome, see the comments in
                            <code
                                >src/portals/MSKKP/SingleCellCompare/store.js</code
                            >
                            for why.
                        </p>
                        <div class="paired-tables">
                            <article class="table-card">
                                <h3>{{ $parent.leftLabel }} summaries</h3>
                                <div
                                    v-if="!$parent.leftCellTypeTableRows.length"
                                    class="empty-state"
                                >
                                    No rows available.
                                </div>
                                <table v-else>
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th class="numeric">Avg</th>
                                            <th class="numeric">% expr</th>
                                            <th class="numeric">n</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in $parent.leftCellTypeTableRows"
                                            :key="row.label"
                                        >
                                            <td>{{ row.label }}</td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatNumber(
                                                        row.summary
                                                            .avg_expression
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatPercent(
                                                        row.summary
                                                            .pct_expressing
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatInteger(
                                                        row.summary.n
                                                    )
                                                }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </article>
                            <article class="table-card">
                                <h3>{{ $parent.rightLabel }} summaries</h3>
                                <div
                                    v-if="
                                        !$parent.rightCellTypeTableRows.length
                                    "
                                    class="empty-state"
                                >
                                    No rows available.
                                </div>
                                <table v-else>
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th class="numeric">Avg</th>
                                            <th class="numeric">% expr</th>
                                            <th class="numeric">n</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in $parent.rightCellTypeTableRows"
                                            :key="row.label"
                                        >
                                            <td>{{ row.label }}</td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatNumber(
                                                        row.summary
                                                            .avg_expression
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatPercent(
                                                        row.summary
                                                            .pct_expressing
                                                    )
                                                }}
                                            </td>
                                            <td class="numeric">
                                                {{
                                                    $parent.formatInteger(
                                                        row.summary.n
                                                    )
                                                }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </article>
                        </div>
                    </section>
                </template>
            </main>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style scoped>
.mskkp-sc-compare {
    --sc-bg: #f7f8f8;
    --sc-surface: #fff;
    --sc-surface-soft: #f2f5f4;
    --sc-ink: #17201c;
    --sc-muted: #63706b;
    --sc-line: #dbe4df;
    --sc-line-strong: #c1cec8;
    --sc-left: #2f6f73;
    --sc-right: #c06938;
}

.mskkp-sc-compare .page-shell {
    width: min(1240px, calc(100% - 36px));
    margin: 0 auto;
    padding: 34px 0 56px;
}

.mskkp-sc-compare .page-shell-header {
    max-width: 780px;
    padding: 12px 0 20px;
}

.mskkp-sc-compare .eyebrow {
    margin: 0 0 8px;
    color: var(--sc-left);
    font-size: 0.78rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.mskkp-sc-compare h1 {
    margin-bottom: 10px;
    font-size: clamp(1.8rem, 3.4vw, 3rem);
    line-height: 1.08;
}
.mskkp-sc-compare h2 {
    margin-bottom: 0;
    font-size: clamp(1.3rem, 2vw, 1.8rem);
}
.mskkp-sc-compare h3 {
    margin-bottom: 0;
    font-size: 1rem;
}
.mskkp-sc-compare .lede {
    margin-bottom: 0;
    color: #43504b;
    font-size: 1.02rem;
}

.mskkp-sc-compare .section-block {
    margin-top: 20px;
    padding: 22px;
    border: 1px solid var(--sc-line);
    border-radius: 8px;
    background: var(--sc-surface);
}

.mskkp-sc-compare .controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
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
    color: var(--sc-muted);
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

.mskkp-sc-compare .control {
    display: grid;
    gap: 6px;
    color: var(--sc-muted);
    font-size: 0.82rem;
    font-weight: 700;
}
.mskkp-sc-compare .control.compact {
    min-width: min(320px, 100%);
}

.mskkp-sc-compare .paired-panels,
.mskkp-sc-compare .paired-tables {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.mskkp-sc-compare .panel,
.mskkp-sc-compare .plot-card,
.mskkp-sc-compare .table-card {
    min-width: 0;
    border: 1px solid var(--sc-line);
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
    border-bottom: 1px solid var(--sc-line);
    background: var(--sc-surface-soft);
}
.mskkp-sc-compare .panel-title span {
    color: var(--sc-muted);
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
    color: var(--sc-muted);
    font-size: 0.9rem;
    pointer-events: none;
}

.mskkp-sc-compare .dataset-key,
.mskkp-sc-compare .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    color: var(--sc-muted);
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
    border-bottom: 1px solid var(--sc-line);
    text-align: left;
    vertical-align: middle;
}
.mskkp-sc-compare th {
    color: var(--sc-muted);
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
.mskkp-sc-compare .empty-state {
    padding: 15px;
    color: var(--sc-muted);
    font-size: 0.9rem;
}

@media (max-width: 860px) {
    .mskkp-sc-compare .page-shell {
        width: min(100% - 24px, 720px);
        padding-top: 24px;
    }
    .mskkp-sc-compare .section-block {
        padding: 16px;
    }
    .mskkp-sc-compare .controls,
    .mskkp-sc-compare .paired-panels,
    .mskkp-sc-compare .paired-tables,
    .mskkp-sc-compare .section-heading,
    .mskkp-sc-compare .section-heading.with-control {
        grid-template-columns: 1fr;
        display: grid;
        align-items: start;
    }
    .mskkp-sc-compare .caption {
        text-align: left;
    }
    .mskkp-sc-compare .plot-title {
        display: grid;
        align-items: start;
    }
}
</style>
