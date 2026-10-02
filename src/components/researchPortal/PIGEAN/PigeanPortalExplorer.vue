<template>
    <div class="pigean-app">
        <div class="pigean-app-toolbar">
            <div class="pigean-view-switch" aria-label="Result view">
                <button
                    :aria-pressed="route.view === 'explore'"
                    @click="changeView('explore')"
                >
                    Explorer</button
                ><button
                    :aria-pressed="route.view === 'compare'"
                    @click="changeView('compare')"
                >
                    Compare
                </button>
            </div>
            <button class="btn btn-sm btn-outline-secondary" @click="copyLink">
                {{ copied ? "Link copied" : "Copy link" }}
            </button>
        </div>
        <form class="pigean-selection-form" @submit.prevent="explore">
            <fieldset class="pigean-selection-row">
                <legend v-if="isCompare">Result A</legend>
                <div class="pigean-model-select">
                    <label for="pigean-model">Model</label
                    ><select
                        id="pigean-model"
                        v-model="model"
                        class="form-control"
                    >
                        <option
                            v-for="option in models"
                            :key="option.id"
                            :value="option.id"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>
                <pigean-trait-picker
                    id="pigean-trait"
                    v-model="trait"
                    :model="model"
                    :traits="traits"
                />
                <button
                    v-if="!isCompare"
                    type="submit"
                    class="btn pigean-primary"
                    :disabled="busy || !trait.trim()"
                >
                    {{ busy ? "Loading…" : "Explore" }}
                </button>
            </fieldset>
            <fieldset v-if="isCompare" class="pigean-selection-row">
                <legend>Result B</legend>
                <div class="pigean-model-select">
                    <label for="pigean-model-b">Model</label
                    ><select
                        id="pigean-model-b"
                        v-model="bModel"
                        class="form-control"
                    >
                        <option
                            v-for="option in models"
                            :key="option.id"
                            :value="option.id"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>
                <pigean-trait-picker
                    id="pigean-trait-b"
                    v-model="bTrait"
                    :model="bModel"
                    :traits="traits"
                />
                <button
                    type="submit"
                    class="btn pigean-primary"
                    :disabled="busy || !trait.trim() || !bTrait.trim()"
                >
                    {{ busy ? "Loading…" : "Compare results" }}
                </button>
            </fieldset>
        </form>
        <div class="pigean-data-options">
            <span
                v-if="
                    model !== 'cfde-inc-v2' ||
                    (isCompare && bModel !== 'cfde-inc-v2')
                "
                >Small and large use sigma 2.</span
            ><button
                v-if="!isCompare"
                class="btn btn-link btn-sm"
                @click="savedExample"
            >
                Open saved T2D example</button
            ><span v-if="registryError" role="status">{{ registryError }}</span>
        </div>
        <p v-if="busy" class="pigean-load-status" role="status">
            <b-spinner small class="mr-2" />Loading the source records and
            following continuation pages…
        </p>
        <b-alert v-if="error" show variant="warning" class="m-3"
            ><strong>Results could not be loaded.</strong> {{ error }}
            <button class="btn btn-sm btn-outline-dark ml-2" @click="load">
                Retry
            </button>
            <p class="mb-0 mt-2 small">
                Check the phenotype key and model. The saved T2D example can be
                explored when the live source is unavailable.
            </p></b-alert
        >
        <div v-if="!resultA && !busy && !error" class="pigean-get-started">
            <h3>Start with a phenotype</h3>
            <p>
                Choose a model and phenotype to see how genetic evidence and
                gene annotations support individual genes.
            </p>
            <p class="small mb-0">
                The saved T2D example contains real CFDE v2 results captured on
                September 15, 2026.
            </p>
        </div>
        <template v-if="resultA && !busy">
            <div class="pigean-result-header">
                <div>
                    <h3>{{ phenotypeName(resultA.trait) }}</h3>
                    <span
                        >{{ modelLabel(resultA.model) }} · {{ resultA.trait
                        }}<template v-if="resultB">
                            compared with {{ modelLabel(resultB.model) }} ·
                            {{ phenotypeName(resultB.trait) }} ({{
                                resultB.trait
                            }})</template
                        ></span
                    >
                </div>
                <div class="pigean-source-state">
                    <strong>{{
                        resultA.snapshot
                            ? "Saved example · " + resultA.date
                            : "Live source results"
                    }}</strong
                    ><span
                        >{{ resultA.genes.length.toLocaleString() }} genes ·
                        {{ resultA.geneSets.length.toLocaleString() }} gene sets
                        in {{ resultB ? "A" : "this result" }}</span
                    >
                </div>
            </div>
            <div
                class="pigean-result-phenotypes"
                :class="{ 'is-comparison': resultB }"
            >
                <div>
                    <p v-if="resultB" class="pigean-phenotype-result-label">
                        Result A · {{ modelLabel(resultA.model) }}
                    </p>
                    <pigean-phenotype-summary
                        :trait-id="resultA.trait"
                        :metadata="phenotypeMetadata"
                        :loading="metadataBusy"
                        :show-name="Boolean(resultB)"
                    />
                </div>
                <div v-if="resultB">
                    <p class="pigean-phenotype-result-label">
                        Result B · {{ modelLabel(resultB.model) }}
                    </p>
                    <pigean-phenotype-summary
                        :trait-id="resultB.trait"
                        :metadata="phenotypeMetadata"
                        :loading="metadataBusy"
                        show-name
                    />
                </div>
            </div>
            <p v-if="metadataError" class="pigean-metadata-error" role="status">
                {{ metadataError }}
                <button
                    class="btn btn-link btn-sm"
                    @click="loadPhenotypeMetadata"
                >
                    Retry metadata
                </button>
            </p>
            <p v-if="resultA.snapshot" class="pigean-snapshot-note">
                This is the complete captured CFDE v2 T2D response from
                {{ resultA.date }}. It is a saved snapshot; live cross-trait and
                relationship views are unavailable here.
            </p>
            <template v-if="!isCompare">
                <div class="pigean-filter-row">
                    <div>
                        <label for="pigean-gene-search">Find a gene</label
                        ><input
                            id="pigean-gene-search"
                            v-model="geneSearch"
                            class="form-control"
                            placeholder="Gene symbol, e.g. IRS2"
                        />
                    </div>
                    <div>
                        <label for="pigean-min-direct"
                            >Minimum direct support</label
                        ><input
                            id="pigean-min-direct"
                            v-model="minDirect"
                            class="form-control"
                            type="number"
                            step="any"
                            placeholder="No minimum"
                        />
                    </div>
                    <div>
                        <label for="pigean-min-combined"
                            >Minimum combined support</label
                        ><input
                            id="pigean-min-combined"
                            v-model="minCombined"
                            class="form-control"
                            type="number"
                            step="any"
                            placeholder="No minimum"
                        />
                    </div>
                    <div>
                        <label for="pigean-min-indirect"
                            >Minimum indirect support</label
                        ><input
                            id="pigean-min-indirect"
                            v-model="minIndirect"
                            class="form-control"
                            type="number"
                            step="any"
                            placeholder="No minimum"
                        />
                    </div>
                    <button class="btn btn-sm btn-link" @click="resetFilters">
                        Reset filters
                    </button>
                </div>
                <p class="pigean-filter-summary" role="status">
                    Score filters retain
                    {{ plottedGenes.length.toLocaleString() }} of
                    {{ resultA.genes.length.toLocaleString() }} returned genes.
                </p>
                <div
                    v-if="route.gene || route.gene_set"
                    class="pigean-selection-status"
                    aria-live="polite"
                >
                    <div>
                        <span
                            v-if="route.gene_set"
                            class="pigean-selection-context"
                        >
                            <span class="pigean-selection-dot set-dot"></span
                            >Gene set:
                            <button
                                class="pigean-selection-link"
                                @click="
                                    selectEntity('gene_set', route.gene_set)
                                "
                            >
                                {{ route.gene_set }}
                            </button>
                        </span>
                        <span
                            v-if="route.gene"
                            class="pigean-selection-context"
                        >
                            <span class="pigean-selection-dot gene-dot"></span
                            >Gene:
                            <button
                                class="pigean-selection-link"
                                @click="selectEntity('gene', route.gene)"
                            >
                                {{ route.gene }}
                            </button>
                        </span>
                        <p v-if="highlightBusy" role="status">
                            Loading genes for this gene set…
                        </p>
                        <p v-else-if="highlightError">
                            {{ highlightError }}
                            <button
                                v-if="!resultA.snapshot"
                                class="btn btn-link btn-sm"
                                @click="loadHighlights"
                            >
                                Retry
                            </button>
                        </p>
                        <p v-else-if="route.gene_set">
                            {{ highlighted.length.toLocaleString() }} genes
                            returned for this set in {{ resultA.trait }};
                            {{ plottedHighlightCount.toLocaleString() }} visible
                            in the plot.
                        </p>
                    </div>
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        @click="clearSelection"
                    >
                        Clear selection
                    </button>
                </div>
                <div class="pigean-explorer-grid">
                    <div class="pigean-gene-workspace">
                        <div class="pigean-scatter-panel">
                            <h4>Direct and indirect support</h4>
                            <pigean-support-plot
                                :rows="plottedGenes"
                                color-key="combined"
                                :selected="route.gene"
                                :highlighted="highlighted"
                                @select="(row) => selectEntity('gene', row.id)"
                            />
                        </div>
                        <div class="pigean-gene-panel">
                            <div class="pigean-panel-heading">
                                <h4>Genes</h4>
                                <label
                                    v-if="highlighted.length"
                                    class="pigean-highlight-filter"
                                    ><input
                                        v-model="onlyHighlighted"
                                        type="checkbox"
                                    />
                                    Only genes in selected set</label
                                >
                            </div>
                            <pigean-portal-table
                                :rows="filteredGenes"
                                :fields="geneFields"
                                sort-by="combined"
                                :selected="route.gene"
                                :highlighted="highlighted"
                                height="340px"
                                label="Genes"
                                @select="(row) => selectEntity('gene', row.id)"
                            />
                        </div>
                    </div>
                    <div class="pigean-gene-sets">
                        <div class="pigean-gene-set-heading">
                            <h4>Gene sets</h4>
                            <p>
                                Select a set to highlight its genes and inspect
                                its annotation effect.
                            </p>
                            <label for="pigean-set-search"
                                >Find a gene set or library</label
                            >
                            <input
                                id="pigean-set-search"
                                v-model="setSearch"
                                class="form-control"
                                placeholder="Search identifiers and sources"
                            />
                        </div>
                        <pigean-portal-table
                            :rows="filteredSets"
                            :fields="setFields"
                            sort-by="beta"
                            :selected="route.gene_set"
                            height="820px"
                            label="Gene sets"
                            @select="(row) => selectEntity('gene_set', row.id)"
                        />
                    </div>
                </div>
            </template>
            <template v-else-if="resultB">
                <div class="pigean-filter-row pigean-comparison-controls">
                    <div>
                        <label for="pigean-compare-kind">Compare</label
                        ><select
                            id="pigean-compare-kind"
                            v-model="compareKind"
                            class="form-control"
                            @change="
                                compareMetric =
                                    compareKind === 'gene' ? 'combined' : 'beta'
                            "
                        >
                            <option value="gene">Genes</option>
                            <option value="gene_set">Gene sets</option>
                        </select>
                    </div>
                    <div>
                        <label for="pigean-compare-metric">Score</label
                        ><select
                            id="pigean-compare-metric"
                            v-model="compareMetric"
                            class="form-control"
                        >
                            <option
                                v-for="metric in comparisonMetrics"
                                :key="metric"
                                :value="metric"
                            >
                                {{ labels[metric] }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="pigean-compare-top"
                            >Agreement population</label
                        ><select
                            id="pigean-compare-top"
                            v-model.number="topN"
                            class="form-control"
                        >
                            <option :value="100">Union of top 100</option>
                            <option :value="500">Union of top 500</option>
                            <option :value="0">All common scores</option>
                        </select>
                    </div>
                </div>
                <b-alert
                    v-if="comparisonError"
                    show
                    variant="warning"
                    class="mx-3"
                    >{{ comparisonError }}</b-alert
                >
                <template v-if="comparison">
                    <dl class="pigean-agreement">
                        <div>
                            <dt>Paired scores in summary</dt>
                            <dd>{{ comparison.summary.n.toLocaleString() }}</dd>
                        </div>
                        <div>
                            <dt>Pearson correlation</dt>
                            <dd>{{ format(comparison.summary.pearson) }}</dd>
                        </div>
                        <div>
                            <dt>Spearman correlation</dt>
                            <dd>{{ format(comparison.summary.spearman) }}</dd>
                        </div>
                        <div>
                            <dt>
                                {{
                                    topN ? "Top-set overlap" : "Scored overlap"
                                }}
                            </dt>
                            <dd>
                                {{
                                    comparison.summary.overlap.toLocaleString()
                                }}
                            </dd>
                        </div>
                        <div>
                            <dt>Jaccard overlap</dt>
                            <dd>{{ format(comparison.summary.jaccard) }}</dd>
                        </div>
                    </dl>
                    <p class="pigean-comparison-note">
                        Correlations use common identifiers with finite scores{{
                            topN
                                ? " in the union of each result’s top " + topN
                                : ""
                        }}. Ranks are computed within retrieved results. Source
                        filtering can change the comparison population. Δ is B
                        minus A.
                    </p>
                    <div class="pigean-comparison-plot">
                        <pigean-support-plot
                            :rows="comparison.selected"
                            x-key="a"
                            y-key="b"
                            :x-label="'A: ' + labels[compareMetric]"
                            :y-label="'B: ' + labels[compareMetric]"
                            title="Score agreement between two results"
                            :point-label="
                                compareKind === 'gene' ? 'genes' : 'gene sets'
                            "
                            identity
                            @select="(row) => selectEntity(compareKind, row.id)"
                        />
                    </div>
                    <div class="pigean-filter-row">
                        <div>
                            <label for="pigean-compare-search"
                                >Find an identifier</label
                            ><input
                                id="pigean-compare-search"
                                v-model="compareSearch"
                                class="form-control"
                            />
                        </div>
                        <div>
                            <label for="pigean-presence">Presence</label
                            ><select
                                id="pigean-presence"
                                v-model="presence"
                                class="form-control"
                            >
                                <option value="">All rows</option>
                                <option>Both</option>
                                <option>A only</option>
                                <option>B only</option>
                            </select>
                        </div>
                    </div>
                    <div class="pigean-comparison-table">
                        <pigean-portal-table
                            :rows="comparisonRows"
                            :fields="comparisonFields"
                            sort-by="absDelta"
                            label="Comparison"
                            @select="(row) => selectEntity(compareKind, row.id)"
                        />
                    </div>
                </template>
            </template>
            <details class="pigean-provenance">
                <summary>Data sources and coverage</summary>
                <p>
                    All continuation pages were retrieved for the exposed
                    records. This does not establish coverage of an unfiltered
                    original analysis. Run parameters, full-output ranks, and
                    unavailable score fields are not reconstructed.
                </p>
                <ul>
                    <li v-for="(url, index) in sourceUrls" :key="index">
                        <a
                            :href="url"
                            target="_blank"
                            rel="noopener noreferrer"
                            >{{ url }}</a
                        >
                    </li>
                </ul>
                <p v-if="catalogDate">
                    Trait discovery snapshot: {{ catalogDate }}. Suggestions may
                    include traits without results in the chosen model.
                </p>
            </details>
        </template>
        <pigean-portal-detail
            v-if="route.tab === 'explorer' && detailResult && selectedId"
            :key="detailResult.model + detailResult.trait"
            :id="selectedId"
            :open="route.sheet !== 'closed'"
            :kind="selectedKind"
            :result="detailResult"
            :phenotype-metadata="phenotypeMetadata"
            :metadata-busy="metadataBusy"
            @close="closeDetail"
            @select="(value) => selectEntity(value.kind, value.id)"
            @trait="visitTrait"
        />
        <b-modal v-model="showShare" title="Share this selection" hide-footer
            ><p>Copy this URL to reopen the same selection.</p>
            <input
                class="form-control"
                :value="shareUrl"
                readonly
                aria-label="Selection URL"
                @focus="$event.target.select()"
        /></b-modal>
    </div>
</template>
<script>
import PigeanTraitPicker from "./PigeanTraitPicker.vue";
import PigeanSupportPlot from "./PigeanSupportPlot.vue";
import PigeanPortalTable from "./PigeanPortalTable.vue";
import PigeanPortalDetail from "./PigeanPortalDetail.vue";
import PigeanPhenotypeSummary from "./PigeanPhenotypeSummary.vue";
import {
    loadRegistry,
    loadResult,
    loadContext,
    loadPhenotypes,
} from "@/utils/pigeanPortalApi";
import {
    phenotypeName as mappedPhenotypeName,
    DEFAULT_GENE_MINIMUMS,
    filterGenesBySupport,
    MODELS,
    modelFor,
    fuzzyScore,
    finite,
    formatScore,
    compareResults,
    GENE_METRICS,
    SET_METRICS,
    METRIC_LABELS,
} from "@/utils/pigeanPortalUtils";
const field = (key) => ({
    key,
    label: METRIC_LABELS[key],
    sortable: true,
    formatter: formatScore,
});
export default {
    components: {
        PigeanTraitPicker,
        PigeanSupportPlot,
        PigeanPortalTable,
        PigeanPortalDetail,
        PigeanPhenotypeSummary,
    },
    props: { route: { type: Object, required: true } },
    data: () => ({
        models: MODELS,
        labels: METRIC_LABELS,
        traits: [],
        catalogDate: null,
        registryError: null,
        phenotypeMetadata: null,
        metadataBusy: false,
        metadataError: null,
        model: "cfde-inc-v2",
        trait: "T2D",
        bModel: "small",
        bTrait: "T2D",
        resultA: null,
        resultB: null,
        busy: false,
        error: null,
        geneSearch: "",
        setSearch: "",
        minDirect: String(DEFAULT_GENE_MINIMUMS.log_bf),
        minCombined: String(DEFAULT_GENE_MINIMUMS.combined),
        minIndirect: "",
        highlighted: [],
        highlightBusy: false,
        highlightError: null,
        onlyHighlighted: false,
        compareKind: "gene",
        compareMetric: "combined",
        topN: 100,
        compareSearch: "",
        presence: "",
        copied: false,
        showShare: false,
        shareUrl: "",
        geneFields: [
            { key: "id", label: "Gene", sortable: true },
            ...GENE_METRICS.map(field),
        ],
        setFields: [
            {
                key: "id",
                label: "Gene set",
                sortable: true,
                thStyle: { minWidth: "220px", width: "50%" },
            },
            ...SET_METRICS.map(field),
            { key: "n", label: "Size", formatter: formatScore, sortable: true },
        ],
    }),
    computed: {
        isCompare() {
            return this.route.view === "compare";
        },
        loadKey() {
            return JSON.stringify([
                this.route.model,
                this.route.trait,
                this.route.bModel,
                this.route.bTrait,
                this.route.snapshot,
                this.route.view,
                this.route.run,
            ]);
        },
        plottedGenes() {
            if (!this.resultA) return [];
            return filterGenesBySupport(this.resultA.genes, {
                log_bf: this.minDirect,
                combined: this.minCombined,
                prior: this.minIndirect,
            });
        },
        filteredGenes() {
            const q = this.geneSearch.trim();
            const highlighted = new Set(this.highlighted);
            return this.plottedGenes.filter(
                (row) =>
                    (!q || fuzzyScore(q, row.id)) &&
                    (!this.onlyHighlighted || highlighted.has(row.id))
            );
        },
        highlightKey() {
            return JSON.stringify([
                this.resultA && this.resultA.model,
                this.resultA && this.resultA.trait,
                this.resultA && this.resultA.snapshot,
                this.route.gene_set,
                this.route.view,
            ]);
        },
        plottedHighlightCount() {
            const ids = new Set(this.highlighted);
            return this.plottedGenes.filter(
                (row) =>
                    ids.has(row.id) &&
                    finite(row.prior) !== null &&
                    finite(row.log_bf) !== null
            ).length;
        },
        filteredSets() {
            if (!this.resultA) return [];
            const q = this.setSearch.trim().toLowerCase();
            return this.resultA.geneSets.filter(
                (row) =>
                    !q ||
                    `${row.id} ${row.library} ${row.factorLabel}`
                        .toLowerCase()
                        .includes(q)
            );
        },
        comparisonMetrics() {
            return this.compareKind === "gene" ? GENE_METRICS : SET_METRICS;
        },
        comparisonState() {
            if (!this.resultA || !this.resultB) return {};
            try {
                return {
                    value: compareResults(
                        this.compareKind === "gene"
                            ? this.resultA.genes
                            : this.resultA.geneSets,
                        this.compareKind === "gene"
                            ? this.resultB.genes
                            : this.resultB.geneSets,
                        this.compareMetric,
                        this.topN
                    ),
                };
            } catch (error) {
                return { error: error.message };
            }
        },
        comparison() {
            return this.comparisonState.value;
        },
        comparisonError() {
            return this.comparisonState.error;
        },
        comparisonRows() {
            return !this.comparison
                ? []
                : this.comparison.rows
                      .filter(
                          (row) =>
                              (!this.presence ||
                                  row.status === this.presence) &&
                              fuzzyScore(this.compareSearch, row.id)
                      )
                      .map((row) => ({
                          ...row,
                          absDelta:
                              row.delta === null ? null : Math.abs(row.delta),
                      }));
        },
        comparisonFields() {
            return [
                {
                    key: "id",
                    label: this.compareKind === "gene" ? "Gene" : "Gene set",
                    sortable: true,
                },
                ...["a", "b", "delta", "aRank", "bRank", "deltaRank"].map(
                    (key, i) => ({
                        key,
                        label: [
                            "A score",
                            "B score",
                            "Δ score",
                            "A rank",
                            "B rank",
                            "Δ rank",
                        ][i],
                        formatter: formatScore,
                        sortable: true,
                    })
                ),
                {
                    key: "absDelta",
                    label: "|Δ score|",
                    formatter: formatScore,
                    sortable: true,
                },
                { key: "status", label: "Presence", sortable: true },
            ];
        },
        selectedId() {
            return this.route.gene || this.route.gene_set;
        },
        selectedKind() {
            return this.route.gene ? "gene" : "gene_set";
        },
        detailResult() {
            if (!this.resultA) return null;
            const field = this.selectedKind === "gene" ? "genes" : "geneSets";
            if (
                this.resultB &&
                !this.resultA[field].some(
                    (row) => row.id === this.selectedId
                ) &&
                this.resultB[field].some((row) => row.id === this.selectedId)
            )
                return this.resultB;
            return this.resultA;
        },
        sourceUrls() {
            return [
                ...(this.resultA ? this.resultA.sources : []),
                ...(this.resultB ? this.resultB.sources : []),
            ];
        },
    },
    watch: {
        highlightKey: {
            immediate: true,
            handler() {
                this.loadHighlights();
            },
        },
        loadKey: {
            immediate: true,
            handler() {
                this.model = this.route.model;
                this.trait = this.route.trait;
                this.bModel = this.route.bModel;
                this.bTrait = this.route.bTrait;
                this.resetFilters();
                this.load();
            },
        },
    },
    async mounted() {
        this.loadPhenotypeMetadata();
        try {
            const registry = await loadRegistry();
            this.traits = Object.freeze(registry.traits);
            this.catalogDate = registry.snapshotDate;
        } catch (error) {
            this.registryError = error.message;
        }
    },
    beforeDestroy() {
        if (this.controller) this.controller.abort();
        if (this.highlightController) this.highlightController.abort();
        clearTimeout(this.copyTimer);
    },
    methods: {
        format: formatScore,
        modelLabel: (id) => modelFor(id).label,
        phenotypeName(id) {
            const trait = this.traits.find((row) => row.id === id);
            return mappedPhenotypeName(
                this.phenotypeMetadata,
                id,
                trait && trait.name
            );
        },
        async loadPhenotypeMetadata() {
            this.metadataBusy = true;
            this.metadataError = null;
            try {
                this.phenotypeMetadata = await loadPhenotypes();
            } catch (error) {
                this.metadataError = error.message;
            } finally {
                this.metadataBusy = false;
            }
        },
        resetFilters() {
            this.geneSearch = "";
            this.setSearch = "";
            this.minDirect = String(DEFAULT_GENE_MINIMUMS.log_bf);
            this.minCombined = String(DEFAULT_GENE_MINIMUMS.combined);
            this.minIndirect = "";
            this.onlyHighlighted = false;
        },
        changeView(view) {
            this.$emit("navigate", {
                view,
                run: null,
                gene: null,
                gene_set: null,
                sheet: null,
                snapshot: null,
                section: null,
            });
        },
        explore() {
            const patch = {
                model: this.model,
                trait: this.trait.trim(),
                bModel: this.bModel,
                bTrait: this.bTrait.trim(),
                run: "1",
                snapshot: null,
                gene: null,
                gene_set: null,
                sheet: null,
                section: null,
            };
            if (
                this.route.run === "1" &&
                !this.route.snapshot &&
                this.route.model === patch.model &&
                this.route.trait === patch.trait &&
                this.route.bModel === patch.bModel &&
                this.route.bTrait === patch.bTrait
            )
                this.load();
            else this.$emit("navigate", patch);
        },
        savedExample() {
            if (this.route.snapshot === "1") this.load();
            else
                this.$emit("navigate", {
                    model: "cfde-inc-v2",
                    trait: "T2D",
                    view: "explore",
                    snapshot: "1",
                    run: "1",
                    gene: null,
                    gene_set: null,
                    sheet: null,
                    section: null,
                });
        },
        selectEntity(kind, id) {
            this.$emit("navigate", {
                gene: kind === "gene" ? id : null,
                gene_set:
                    kind === "gene_set"
                        ? id
                        : this.isCompare
                        ? null
                        : this.route.gene_set,
                sheet: null,
                section: null,
            });
        },
        closeDetail() {
            if (this.selectedId) this.$emit("navigate", { sheet: "closed" });
        },
        clearSelection() {
            this.onlyHighlighted = false;
            this.$emit("navigate", { gene: null, gene_set: null, sheet: null });
        },
        visitTrait(trait) {
            this.$emit("navigate", {
                trait,
                model: this.detailResult.model,
                view: "explore",
                run: "1",
                snapshot: null,
                sheet: null,
                section: null,
            });
        },
        async loadHighlights() {
            if (this.highlightController) this.highlightController.abort();
            this.highlightController = null;
            this.highlighted = [];
            this.highlightError = null;
            this.highlightBusy = false;
            this.onlyHighlighted = false;
            if (!this.resultA || !this.route.gene_set || this.isCompare) return;
            if (this.resultA.snapshot) {
                this.highlightError =
                    "Gene-set highlighting requires the live source; this saved example contains scores only.";
                return;
            }
            const controller = new AbortController();
            this.highlightController = controller;
            const timer = setTimeout(() => controller.abort(), 60000);
            this.highlightBusy = true;
            try {
                const context = await loadContext(
                    this.resultA.model,
                    this.resultA.trait,
                    "gene_set",
                    this.route.gene_set,
                    controller.signal
                );
                if (this.highlightController !== controller) return;
                if (controller.signal.aborted)
                    throw new DOMException("Request timed out", "AbortError");
                this.highlighted = Object.freeze([
                    ...new Set(context.rows.map((row) => row.id)),
                ]);
            } catch (error) {
                if (this.highlightController === controller)
                    this.highlightError =
                        error.name === "AbortError"
                            ? "The gene-set request timed out. Try again."
                            : error.message;
            } finally {
                clearTimeout(timer);
                if (this.highlightController === controller)
                    this.highlightBusy = false;
            }
        },
        async copyLink() {
            this.shareUrl = window.location.href;
            try {
                await navigator.clipboard.writeText(this.shareUrl);
                this.copied = true;
                clearTimeout(this.copyTimer);
                this.copyTimer = setTimeout(() => {
                    this.copied = false;
                }, 2000);
            } catch (_) {
                this.showShare = true;
            }
        },
        async load() {
            if (this.controller) this.controller.abort();
            this.controller = null;
            this.resultA = null;
            this.resultB = null;
            this.error = null;
            this.busy = false;
            if (this.route.run !== "1") return;
            const controller = new AbortController();
            this.controller = controller;
            const timer = setTimeout(() => controller.abort(), 60000);
            this.busy = true;
            try {
                const requests = [
                    loadResult(
                        this.route.model,
                        this.route.trait,
                        controller.signal,
                        this.route.snapshot === "1"
                    ),
                ];
                if (this.isCompare)
                    requests.push(
                        loadResult(
                            this.route.bModel,
                            this.route.bTrait,
                            controller.signal
                        )
                    );
                const results = await Promise.all(requests);
                if (controller.signal.aborted || this.controller !== controller)
                    return;
                this.resultA = results[0];
                this.resultB = results[1] || null;
            } catch (error) {
                if (this.controller === controller) {
                    this.error =
                        error.name === "AbortError"
                            ? "The source request timed out. Please retry."
                            : error.message;
                    controller.abort();
                }
            } finally {
                clearTimeout(timer);
                if (this.controller === controller) this.busy = false;
            }
        },
    },
};
</script>
<style>
.pigean-app {
    background: white;
}
.pigean-app-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e0e8ee;
}
.pigean-view-switch {
    display: flex;
    gap: 4px;
}
.pigean-view-switch button {
    padding: 8px 18px;
    background: transparent;
    color: #536d7e;
    border: 1px solid transparent;
    border-radius: 4px;
    font-weight: 600;
}
.pigean-view-switch button[aria-pressed="true"] {
    color: #146b96;
    background: #eaf3f8;
    border-color: #cce0eb;
}
.pigean-selection-form {
    padding: 20px 24px 0;
}
.pigean-selection-row {
    display: flex;
    gap: 18px;
    align-items: flex-end;
    margin: 0 0 32px;
    min-width: 0;
}
.pigean-selection-row legend {
    float: left;
    width: auto;
    font-size: 14px;
    padding-right: 16px;
    line-height: 38px;
    margin: 0;
}
.pigean-selection-row .pigean-typeahead {
    flex: 1;
    min-width: 100px;
}
.pigean-model-select {
    flex: 0 0 145px;
}
.pigean-app label {
    font-size: 13px;
    font-weight: 600;
    color: #3b596d;
    margin-bottom: 7px;
}
.pigean-selection-row .btn {
    min-height: 38px;
}
.pigean-data-options {
    padding: 0 24px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #617889;
    flex-wrap: wrap;
}
.pigean-data-options .btn {
    padding-left: 0;
}
.pigean-get-started {
    border-top: 1px solid #e0e8ee;
    padding: 44px 28px;
    background: #f8fbfd;
    border-radius: 0 0 8px 8px;
}
.pigean-get-started h3 {
    font-size: 23px;
    margin-bottom: 14px;
}
.pigean-get-started p {
    max-width: 650px;
    color: #536d7e;
}
.pigean-load-status {
    padding: 24px;
    margin: 0;
    color: #456980;
}
.pigean-result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    border-top: 1px solid #e0e8ee;
    background: #f8fbfd;
}
.pigean-result-header h3 {
    margin: 0 0 6px;
    font-size: 23px;
}
.pigean-result-header span {
    font-size: 13px;
    color: #587385;
}
.pigean-source-state {
    text-align: right;
    flex-shrink: 0;
}
.pigean-source-state strong,
.pigean-source-state span {
    display: block;
    font-size: 12px;
}
.pigean-source-state strong {
    color: #426c82;
    margin-bottom: 6px;
}
.pigean-result-phenotypes {
    padding: 18px 24px 22px;
    border-bottom: 1px solid #e0e8ee;
}
.pigean-result-phenotypes.is-comparison {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
}
.pigean-phenotype-result-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5a7182;
}
.pigean-metadata-error {
    padding: 10px 24px;
    font-size: 13px;
    color: #77551a;
}
@media (max-width: 800px) {
    .pigean-result-phenotypes.is-comparison {
        grid-template-columns: minmax(0, 1fr);
    }
}
.pigean-snapshot-note {
    padding: 12px 24px;
    background: #f2eef7;
    color: #65456f;
    font-size: 13px;
    margin: 0;
}
.pigean-filter-row {
    padding: 18px 24px;
    display: flex;
    gap: 18px;
    align-items: flex-end;
    flex-wrap: wrap;
}
.pigean-filter-row > div {
    flex: 1;
    min-width: 160px;
}
.pigean-filter-row .form-control {
    font-size: 14px;
}
.pigean-filter-summary {
    padding: 0 24px 10px;
    margin: 0;
    color: #5d7483;
    font-size: 12px;
}
.pigean-explorer-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 28px;
    padding: 10px 24px 28px;
}
.pigean-explorer-grid h4,
.pigean-gene-sets h4 {
    font-size: 18px;
    margin: 0 0 16px;
}
.pigean-gene-workspace,
.pigean-gene-sets {
    min-width: 0;
}
.pigean-gene-sets {
    padding-left: 24px;
    border-left: 1px solid #e0e8ee;
}
.pigean-gene-sets td:first-child {
    min-width: 220px;
}
.pigean-gene-sets .pigean-entity-link {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.pigean-gene-panel {
    margin-top: 28px;
}
.pigean-gene-set-heading {
    margin-bottom: 18px;
}
.pigean-gene-set-heading h4 {
    margin-bottom: 6px;
}
.pigean-gene-set-heading p {
    font-size: 13px;
    color: #5d7788;
}
.pigean-panel-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}
.pigean-highlight-filter {
    font-size: 12px;
    color: #75358a;
    cursor: pointer;
}
.pigean-highlight-filter input {
    margin-right: 5px;
}
.pigean-selection-status {
    margin: 0 24px 24px;
    padding: 12px 16px;
    background: #f6f3fa;
    border: 1px solid #e3d9ed;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
}
.pigean-selection-status > div {
    min-width: 0;
}
.pigean-selection-status > button {
    flex-shrink: 0;
}
.pigean-selection-status p {
    font-size: 12px;
    color: #637181;
    margin: 6px 0 0;
}
.pigean-selection-context {
    display: block;
    font-size: 13px;
    overflow-wrap: anywhere;
}
.pigean-selection-link {
    background: none;
    border: 0;
    padding: 2px;
    color: #633978;
    text-align: left;
    text-decoration: underline;
}
.pigean-selection-dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
}
.set-dot {
    background: #81388b;
}
.gene-dot {
    background: #b85c16;
}
.pigean-provenance {
    padding: 18px 24px;
    border-top: 1px solid #e0e8ee;
    color: #546f81;
    font-size: 12px;
    overflow-wrap: anywhere;
}
.pigean-provenance summary {
    cursor: pointer;
}
.pigean-provenance p:first-of-type {
    margin-top: 16px;
}
.pigean-agreement {
    margin: 0;
    padding: 10px 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 22px 36px;
}
.pigean-agreement dt {
    font-size: 12px;
    color: #5d7483;
    font-weight: 400;
}
.pigean-agreement dd {
    font-size: 23px;
    color: #235674;
    margin: 4px 0;
}
.pigean-comparison-note {
    padding: 10px 24px;
    color: #5d7483;
    font-size: 13px;
}
.pigean-comparison-plot {
    max-width: 850px;
    padding: 0 24px;
}
.pigean-comparison-table {
    padding: 6px 24px 24px;
}
@media (max-width: 1000px) {
    .pigean-explorer-grid {
        grid-template-columns: minmax(0, 1fr);
    }
    .pigean-gene-sets {
        padding: 24px 0 0;
        border-left: 0;
        border-top: 1px solid #e0e8ee;
    }
}
@media (max-width: 650px) {
    .pigean-selection-row {
        flex-wrap: wrap;
    }
    .pigean-model-select {
        flex-basis: 100%;
    }
    .pigean-selection-row .pigean-typeahead {
        flex-basis: 100%;
    }
    .pigean-result-header {
        flex-direction: column;
    }
    .pigean-source-state {
        text-align: left;
    }
    .pigean-selection-status {
        margin-left: 12px;
        margin-right: 12px;
        flex-direction: column;
    }
    .pigean-app-toolbar,
    .pigean-selection-form,
    .pigean-result-header,
    .pigean-filter-row {
        padding-left: 16px;
        padding-right: 16px;
    }
    .pigean-explorer-grid {
        padding-left: 12px;
        padding-right: 12px;
    }
}
</style>
