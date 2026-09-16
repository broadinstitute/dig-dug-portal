<template>
    <b-sidebar
        class="pigean-detail-wrapper"
        :visible="open"
        right
        backdrop
        shadow
        no-close-on-route-change
        bg-variant="white"
        width="min(760px, 94vw)"
        sidebar-class="pigean-detail-sheet"
        body-class="pigean-detail-body"
        header-class="pigean-detail-header"
        close-label="Close details"
        @change="
            (value) => {
                if (!value) $emit('close');
            }
        "
    >
        <template #title
            ><span class="pigean-detail-kind"
                >{{ kind === "gene" ? "Gene" : "Gene set" }} ·
                {{ modelLabel }} / {{ traitName(result.trait) }}</span
            ><span class="pigean-detail-title">{{ id }}</span></template
        >
        <b-tabs v-model="tab" content-class="pt-3">
            <b-tab title="This phenotype">
                <pigean-phenotype-summary
                    :trait-id="result.trait"
                    :metadata="phenotypeMetadata"
                    :loading="metadataBusy"
                    compact
                />
                <p v-if="!record">
                    This identifier is not present in the retrieved
                    {{ result.trait }} results.
                </p>
                <dl v-else class="pigean-score-list">
                    <div v-for="metric in metrics" :key="metric">
                        <dt>{{ labels[metric] }}</dt>
                        <dd>{{ format(record[metric]) }}</dd>
                    </div>
                    <div v-if="record.n !== null">
                        <dt>Annotation count / size (n)</dt>
                        <dd>{{ format(record.n) }}</dd>
                    </div>
                    <div v-if="record.library">
                        <dt>Library / source</dt>
                        <dd>{{ record.library }}</dd>
                    </div>
                    <div v-if="record.factorLabel">
                        <dt>Factor label</dt>
                        <dd>{{ record.factorLabel }}</dd>
                    </div>
                </dl>
                <p class="text-muted">
                    Scores are reported by the selected source. Missing fields
                    are unavailable, rather than zero.
                </p>
                <details v-if="record">
                    <summary>All source fields</summary>
                    <dl class="pigean-raw-fields">
                        <template v-for="(value, key) in rawFields"
                            ><dt :key="key + '-key'">{{ key }}</dt>
                            <dd :key="key + '-value'">{{ value }}</dd></template
                        >
                    </dl>
                </details>
                <section class="pigean-related-section">
                    <h3 class="h5">
                        {{ kind === "gene" ? "Gene sets" : "Genes" }} in this
                        phenotype
                    </h3>
                    <p v-if="result.snapshot">
                        Relationship browsing requires the live source.
                    </p>
                    <template v-else>
                        <p class="small text-muted">
                            {{
                                kind === "gene_set"
                                    ? "Genes returned for this gene set"
                                    : "Gene sets returned for this gene"
                            }}
                            in {{ result.trait }} by the selected model. These
                            phenotype-specific records may be a subset of full
                            membership; annotation weights are not provided.
                        </p>
                        <p v-if="contextBusy" role="status">
                            Loading
                            {{ kind === "gene" ? "gene sets" : "genes" }}…
                        </p>
                        <b-alert v-if="contextError" show variant="warning"
                            >{{ contextError }}
                            <b-button size="sm" @click="loadRelated"
                                >Retry</b-button
                            ></b-alert
                        >
                        <template v-if="contextRows !== null">
                            <label for="pigean-related-search"
                                >Find a
                                {{
                                    kind === "gene" ? "gene set" : "gene"
                                }}</label
                            >
                            <input
                                id="pigean-related-search"
                                v-model="contextSearch"
                                class="form-control mb-3"
                                placeholder="Search returned identifiers"
                            />
                            <pigean-portal-table
                                :rows="filteredContext"
                                :fields="relatedFields"
                                :sort-by="kind === 'gene' ? 'beta' : 'combined'"
                                label="Related annotations"
                                @select="related"
                            />
                            <a
                                v-if="contextSource"
                                :href="contextSource"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="pigean-context-source"
                                >View source query</a
                            >
                        </template>
                    </template>
                </section>
            </b-tab>
            <b-tab title="Across traits">
                <p v-if="result.snapshot">
                    Across-trait browsing requires the live source. This saved
                    example contains T2D only.
                </p>
                <template v-else>
                    <p class="small text-muted">
                        HPO traits are excluded from this view.
                    </p>
                    <p v-if="busy" role="status">
                        Loading this
                        {{ kind === "gene" ? "gene" : "gene set" }} across
                        traits…
                    </p>
                    <b-alert v-if="error" show variant="warning"
                        >{{ error }}
                        <b-button size="sm" @click="loadTab"
                            >Retry</b-button
                        ></b-alert
                    >
                    <template v-if="across !== null">
                        <label for="pigean-across-metric">Score</label
                        ><select
                            id="pigean-across-metric"
                            v-model="metric"
                            class="form-control pigean-detail-select"
                        >
                            <option v-for="m in metrics" :key="m" :value="m">
                                {{ labels[m] }}
                            </option>
                        </select>
                        <figure
                            v-if="traitPoints.length"
                            class="pigean-trait-plot"
                        >
                            <figcaption>
                                Top {{ traitPoints.length }} of
                                {{ across.length.toLocaleString() }} returned
                                non-HPO traits by
                                {{ labels[metric].toLowerCase() }}
                            </figcaption>
                            <svg
                                :viewBox="`0 0 820 ${
                                    traitPoints.length * 25 + 48
                                }`"
                                role="img"
                                :aria-label="`${labels[metric]} across traits; values also appear in the table below`"
                            >
                                <line
                                    :x1="traitZero"
                                    :x2="traitZero"
                                    y1="5"
                                    :y2="traitPoints.length * 25 + 10"
                                    stroke="#b5c7d2"
                                />
                                <g
                                    v-for="(point, index) in traitPoints"
                                    :key="index"
                                    :transform="`translate(0,${
                                        index * 25 + 17
                                    })`"
                                >
                                    <text
                                        x="245"
                                        y="4"
                                        text-anchor="end"
                                        font-size="11"
                                        fill="#395467"
                                    >
                                        {{ point.label }}
                                        <title>
                                            {{ point.row.displayName }} ({{
                                                point.row.phenotype
                                            }})
                                        </title>
                                    </text>
                                    <line
                                        :x1="traitZero"
                                        :x2="point.x"
                                        stroke="#bfd8e7"
                                        stroke-width="2"
                                    />
                                    <circle :cx="point.x" r="4" fill="#1474a8">
                                        <title>
                                            {{ point.row.displayName }} ({{
                                                point.row.phenotype
                                            }}):
                                            {{ format(point.row[metric]) }}
                                        </title>
                                    </circle>
                                    <text
                                        x="810"
                                        y="4"
                                        text-anchor="end"
                                        font-size="11"
                                        fill="#395467"
                                    >
                                        {{ format(point.row[metric]) }}
                                    </text>
                                </g>
                                <text
                                    x="520"
                                    :y="traitPoints.length * 25 + 40"
                                    text-anchor="middle"
                                    font-size="12"
                                    fill="#395467"
                                >
                                    {{ labels[metric] }} (source score)
                                </text>
                            </svg>
                        </figure>
                        <label for="pigean-across-search"
                            >Filter traits by name, ID, or ontology</label
                        ><input
                            id="pigean-across-search"
                            v-model="acrossSearch"
                            class="form-control mb-3"
                            placeholder="Trait name, portal ID, or ontology term"
                        />
                        <pigean-portal-table
                            :rows="acrossRows"
                            :fields="acrossFields"
                            :sort-by="metric"
                            label="Across-trait results"
                            @select="(row) => $emit('trait', row.phenotype)"
                        >
                            <template #identifier="{ row }">
                                <button
                                    class="pigean-entity-link"
                                    :title="row.phenotype"
                                    @click.stop="$emit('trait', row.phenotype)"
                                >
                                    {{ row.displayName }}
                                </button>
                                <small class="pigean-trait-identifiers"
                                    >{{ row.phenotype
                                    }}<template v-if="row.portal_id">
                                        · {{ row.portal_id }}</template
                                    ></small
                                >
                            </template>
                            <template #ontology="{ row }"
                                ><pigean-ontology-links
                                    :mappings="row.mappings"
                                /><span
                                    v-if="!row.mappings.length"
                                    class="text-muted"
                                    >—</span
                                ></template
                            >
                        </pigean-portal-table>
                    </template>
                </template>
            </b-tab>
        </b-tabs>
    </b-sidebar>
</template>
<script>
import { scaleLinear, extent } from "d3";
import PigeanPortalTable from "./PigeanPortalTable.vue";
import PigeanPhenotypeSummary from "./PigeanPhenotypeSummary.vue";
import PigeanOntologyLinks from "./PigeanOntologyLinks.vue";
import { loadAcross, loadContext } from "@/utils/pigeanPortalApi";
import {
    phenotypeFor,
    phenotypeName,
    phenotypeMappings,
    phenotypeSearchText,
    modelFor,
    GENE_METRICS,
    SET_METRICS,
    METRIC_LABELS,
    formatScore,
    finite,
} from "@/utils/pigeanPortalUtils";
export default {
    components: {
        PigeanPortalTable,
        PigeanPhenotypeSummary,
        PigeanOntologyLinks,
    },
    props: {
        id: String,
        kind: String,
        result: Object,
        open: Boolean,
        phenotypeMetadata: Object,
        metadataBusy: Boolean,
    },
    data: () => ({
        tab: 0,
        metric: "combined",
        busy: false,
        error: null,
        across: null,
        contextRows: null,
        contextBusy: false,
        contextError: null,
        contextSearch: "",
        contextSource: null,
        acrossSearch: "",
        labels: METRIC_LABELS,
    }),
    computed: {
        identity() {
            return [
                this.result.model,
                this.result.trait,
                this.result.snapshot,
                this.kind,
                this.id,
            ].join("|");
        },
        modelLabel() {
            return modelFor(this.result.model).label;
        },
        metrics() {
            return this.kind === "gene" ? GENE_METRICS : SET_METRICS;
        },
        record() {
            return (
                this.kind === "gene" ? this.result.genes : this.result.geneSets
            ).find((row) => row.id === this.id);
        },
        rawFields() {
            return Object.fromEntries(
                Object.entries(this.record || {}).filter(
                    ([key, value]) =>
                        !["id", "library", "factorLabel"].includes(key) &&
                        value !== null &&
                        value !== undefined
                )
            );
        },
        annotatedAcross() {
            return (this.across || []).map((row) => {
                const phenotype = phenotypeFor(
                    this.phenotypeMetadata,
                    row.phenotype
                );
                return {
                    ...row,
                    id: row.phenotype,
                    displayName: this.traitName(
                        row.phenotype,
                        row.phenotype_name
                    ),
                    portal_id: phenotype ? phenotype.portal_id : "",
                    mappings: phenotypeMappings(
                        this.phenotypeMetadata,
                        row.phenotype
                    ),
                    searchText: phenotypeSearchText(
                        this.phenotypeMetadata,
                        row.phenotype,
                        row.phenotype_name
                    ),
                };
            });
        },
        acrossRows() {
            const q = this.acrossSearch.trim().toLowerCase();
            return this.annotatedAcross.filter(
                (row) => !q || row.searchText.includes(q)
            );
        },
        acrossFields() {
            return [
                {
                    key: "id",
                    label: "Phenotype",
                    sortable: true,
                    formatter: (value, key, row) => row.displayName,
                    sortByFormatted: true,
                    thStyle: { minWidth: "240px" },
                },
                ...this.metrics.map((key) => ({
                    key,
                    label: METRIC_LABELS[key],
                    sortable: true,
                    formatter: formatScore,
                })),
                { key: "trait_group", label: "Source group", sortable: true },
                { key: "ontology", label: "Ontology links" },
            ];
        },
        filteredContext() {
            const query = this.contextSearch.trim().toLowerCase();
            return (this.contextRows || []).filter((row) =>
                row.id.toLowerCase().includes(query)
            );
        },
        relatedFields() {
            return [
                {
                    key: "id",
                    label: this.kind === "gene" ? "Gene set" : "Gene",
                    sortable: true,
                },
                ...(this.kind === "gene" ? SET_METRICS : GENE_METRICS).map(
                    (key) => ({
                        key,
                        label: METRIC_LABELS[key],
                        formatter: formatScore,
                        sortable: true,
                    })
                ),
                { key: "library", label: "Library / source" },
            ];
        },
        traitScale() {
            const values = (this.across || [])
                .map((row) => finite(row[this.metric]))
                .filter((value) => value !== null);
            const range = extent(values);
            return scaleLinear()
                .domain([
                    Math.min(0, range[0] || 0),
                    Math.max(1, range[1] || 0),
                ])
                .range([265, 750]);
        },
        traitZero() {
            return this.traitScale(0);
        },
        traitPoints() {
            return this.annotatedAcross
                .filter((row) => finite(row[this.metric]) !== null)
                .slice()
                .sort((a, b) => b[this.metric] - a[this.metric])
                .slice(0, 40)
                .map((row) => ({
                    row,
                    x: this.traitScale(row[this.metric]),
                    label:
                        String(row.displayName).length > 34
                            ? String(row.displayName).slice(0, 31) + "…"
                            : row.displayName,
                }));
        },
    },
    watch: {
        identity: {
            immediate: true,
            handler() {
                if (this.controller) this.controller.abort();
                if (this.contextController) this.contextController.abort();
                this.controller = null;
                this.tab = 0;
                this.busy = false;
                this.error = null;
                this.across = null;
                this.contextRows = null;
                this.contextError = null;
                this.contextSearch = "";
                this.contextSource = null;
                this.acrossSearch = "";
                this.metric = this.kind === "gene" ? "combined" : "beta";
                this.loadRelated();
            },
        },
        tab() {
            this.loadTab();
        },
    },
    beforeDestroy() {
        if (this.contextController) this.contextController.abort();
        this.contextController = null;
        if (this.controller) this.controller.abort();
        this.controller = null;
    },
    methods: {
        format: formatScore,
        traitName(id, fallback) {
            return phenotypeName(this.phenotypeMetadata, id, fallback);
        },
        related(row) {
            this.$emit("select", {
                id: row.id,
                kind: this.kind === "gene" ? "gene_set" : "gene",
            });
        },
        async loadRelated() {
            if (this.contextController) this.contextController.abort();
            this.contextController = null;
            this.contextBusy = false;
            this.contextError = null;
            if (this.result.snapshot) return;
            const controller = new AbortController();
            this.contextController = controller;
            const timer = setTimeout(() => controller.abort(), 60000);
            this.contextBusy = true;
            try {
                const context = await loadContext(
                    this.result.model,
                    this.result.trait,
                    this.kind,
                    this.id,
                    controller.signal
                );
                if (this.contextController !== controller) return;
                if (controller.signal.aborted)
                    throw new DOMException("Request timed out", "AbortError");
                this.contextRows = Object.freeze(context.rows);
                this.contextSource = context.source;
            } catch (error) {
                if (this.contextController === controller)
                    this.contextError =
                        error.name === "AbortError"
                            ? "The source request timed out. Try again."
                            : error.message;
            } finally {
                clearTimeout(timer);
                if (this.contextController === controller)
                    this.contextBusy = false;
            }
        },
        async loadTab() {
            if (this.controller) this.controller.abort();
            this.controller = null;
            this.busy = false;
            this.error = null;
            if (!this.tab || this.result.snapshot || this.across !== null)
                return;
            const controller = new AbortController();
            this.controller = controller;
            const timer = setTimeout(() => controller.abort(), 60000);
            this.busy = true;
            try {
                const rows = await loadAcross(
                    this.result.model,
                    this.kind,
                    this.id,
                    controller.signal
                );
                if (this.controller !== controller) return;
                if (controller.signal.aborted)
                    throw new DOMException("Request timed out", "AbortError");
                this.across = Object.freeze(rows);
            } catch (error) {
                if (this.controller === controller)
                    this.error =
                        error.name === "AbortError"
                            ? "The source request timed out. Try again."
                            : error.message;
            } finally {
                clearTimeout(timer);
                if (this.controller === controller) this.busy = false;
            }
        },
    },
};
</script>
<style>
.pigean-trait-identifiers {
    display: block;
    color: #647987;
    font-size: 10px;
    overflow-wrap: anywhere;
}
.pigean-detail-wrapper .b-sidebar-backdrop {
    opacity: 0.18;
}
.pigean-detail-sheet {
    border-left: 1px solid #d2dfe7;
}
.pigean-detail-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e0e8ee;
    align-items: flex-start !important;
}
.pigean-detail-header > strong {
    min-width: 0;
    flex: 1;
}
.pigean-detail-header .close {
    order: 2;
    flex-shrink: 0;
    margin-left: 16px;
}
.pigean-detail-body {
    padding: 20px 24px 36px;
}
.pigean-detail-body > .tabs {
    min-width: 0;
}
.pigean-related-section {
    border-top: 1px solid #e0e8ee;
    padding-top: 24px;
    margin-top: 24px;
}
.pigean-context-source {
    display: inline-block;
    margin-top: 14px;
    font-size: 12px;
}

.pigean-detail-kind {
    display: block;
    font-size: 12px;
    color: #627988;
    font-weight: 400;
    margin-bottom: 8px;
}
.pigean-detail-title {
    display: block;
    font-size: 20px;
    overflow-wrap: anywhere;
    line-height: 1.4;
}
.pigean-score-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    padding: 10px 0;
}
.pigean-score-list dt {
    font-size: 12px;
    color: #536d7e;
    font-weight: 400;
}
.pigean-score-list dd {
    font-size: 20px;
    color: #284b63;
    margin: 4px 0;
    overflow-wrap: anywhere;
}
.pigean-raw-fields {
    display: grid;
    grid-template-columns: minmax(100px, 1fr) 3fr;
    gap: 8px 16px;
    padding: 16px 0;
    font-size: 13px;
}
.pigean-raw-fields dd {
    overflow-wrap: anywhere;
}
.pigean-detail-select {
    max-width: 260px;
    margin-bottom: 20px;
}
.pigean-trait-plot {
    margin-bottom: 22px;
}
.pigean-trait-plot figcaption {
    color: #546e7e;
    font-size: 13px;
    margin: 12px 0;
}
.pigean-trait-plot svg {
    width: 100%;
    max-height: 1050px;
}
@media (max-width: 600px) {
    .pigean-score-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
