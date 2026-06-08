<template>
    <div class="wkb-edge-inspector-stack">
        <section class="wkb-inspector-panel-block">
            <h3 class="wkb-inspector-node-title">{{ edgeLabel }}</h3>
            <dl v-if="hasMeta" class="wkb-inspector-meta">
                <div v-if="selectedEdge.edgeType">
                    <dt>Type</dt>
                    <dd>{{ selectedEdge.edgeType }}</dd>
                </div>
                <div v-if="selectedEdge.isContextual">
                    <dt>Role</dt>
                    <dd>Contextual edge</dd>
                </div>
                <div v-if="selectedEdge.scoreLabel">
                    <dt>Score</dt>
                    <dd>{{ selectedEdge.scoreLabel }}</dd>
                </div>
            </dl>
        </section>

        <p v-if="provenanceLoading" class="wkb-inspector-note">Loading edge provenance…</p>
        <p
            v-else-if="provenanceError"
            class="wkb-inspector-note wkb-inspector-note--warn"
        >
            {{ provenanceError }}
        </p>
        <template v-else-if="payload">
            <section
                v-if="payload.relation === 'gene_trait'"
                class="wkb-inspector-panel-block"
            >
                <h4 class="wkb-inspector-section-heading">{{ payload.title }}</h4>
                <p v-if="payload.summary" class="wkb-inspector-note">{{ payload.summary }}</p>
                <p v-if="payload.provenance_note" class="wkb-inspector-note">
                    {{ payload.provenance_note }}
                </p>
                <div class="wkb-edge-provenance-grid">
                    <div>
                        <h5 class="wkb-edge-provenance-subheading">Genetic support</h5>
                        <p class="wkb-edge-provenance-line">
                            <strong>Combined probability:</strong>
                            {{ formatProbability(payload.direct_support?.combined_score) }}
                            <span class="wkb-inspector-note">
                                (logBF {{ formatValue(payload.direct_support?.combined_score, 2) }})
                            </span>
                        </p>
                        <p class="wkb-edge-provenance-line">
                            <strong>Direct probability:</strong>
                            {{ formatProbability(payload.direct_support?.direct_score) }}
                            <span class="wkb-inspector-note">
                                (logBF {{ formatValue(payload.direct_support?.direct_score, 2) }})
                            </span>
                        </p>
                        <p class="wkb-edge-provenance-line">
                            <strong>Indirect probability:</strong>
                            {{ formatProbability(payload.direct_support?.indirect_score) }}
                            <span class="wkb-inspector-note">
                                (logBF {{ formatValue(payload.direct_support?.indirect_score, 2) }})
                            </span>
                        </p>
                        <WorkspaceLeadSnpSummary :direct-support="payload.direct_support" />
                    </div>
                    <WorkspaceGeneTraitLocusZoomPane
                        :locus-zoom="locusZoomPayload"
                        :api-client="apiClient"
                    />
                </div>
                <WorkspaceEvidenceTable
                    title="Top gene sets containing the gene for this trait"
                    :rows="visibleIndirectGeneSetRows"
                    :columns="indirectGeneSetColumns"
                    :page-size="5"
                    :empty-note="indirectGeneSetEmptyNote"
                    pagination-label="Gene set pages"
                >
                    <template #controls>
                        <label class="wkb-edge-provenance-toggle">
                            <input v-model="showCfdeOnly" type="checkbox" />
                            Show CFDE only
                        </label>
                    </template>
                    <template #addGeneSet="{ row }">
                        <button
                            v-if="isGeneSetOnGraph(row)"
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--remove"
                            :disabled="graphBusy"
                            @click="onRemoveGeneSet(row)"
                        >
                            Remove
                        </button>
                        <button
                            v-else
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--add"
                            :disabled="graphBusy"
                            @click="onAddGeneSet(row)"
                        >
                            Add
                        </button>
                    </template>
                </WorkspaceEvidenceTable>
            </section>

            <section
                v-else-if="payload.relation === 'gene_factor'"
                class="wkb-inspector-panel-block"
            >
                <h4 class="wkb-inspector-section-heading">{{ payload.title }}</h4>
                <p v-if="payload.summary" class="wkb-inspector-note">{{ payload.summary }}</p>
                <p v-if="payload.provenance_note" class="wkb-inspector-note">
                    {{ payload.provenance_note }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Gene loading:</strong>
                    {{ formatValue(payload.gene_loading?.loading, 3) }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Normalized score:</strong>
                    {{ formatValue(payload.gene_loading?.normalized_score, 3) }}
                </p>
                <WorkspaceEvidenceTable
                    title="Gene sets containing the gene with highest factor loadings"
                    :rows="payload.supporting_gene_sets || []"
                    :columns="supportingGeneSetColumns"
                    :empty-note="geneFactorGeneSetEmptyNote"
                    pagination-label="Gene set pages"
                >
                    <template #addGeneSet="{ row }">
                        <button
                            v-if="isGeneSetOnGraph(row)"
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--remove"
                            :disabled="graphBusy"
                            @click="onRemoveGeneSet(row)"
                        >
                            Remove
                        </button>
                        <button
                            v-else
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--add"
                            :disabled="graphBusy"
                            @click="onAddGeneSet(row)"
                        >
                            Add
                        </button>
                    </template>
                </WorkspaceEvidenceTable>
            </section>

            <section
                v-else-if="payload.relation === 'factor_trait'"
                class="wkb-inspector-panel-block"
            >
                <h4 class="wkb-inspector-section-heading">{{ payload.title }}</h4>
                <p v-if="payload.summary" class="wkb-inspector-note">{{ payload.summary }}</p>
                <p v-if="payload.provenance_note" class="wkb-inspector-note">
                    {{ payload.provenance_note }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Family:</strong> {{ payload.factor_relevance?.family || "—" }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Raw score:</strong>
                    {{ formatValue(payload.factor_relevance?.raw_score, 3) }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Normalized score:</strong>
                    {{ formatValue(payload.factor_relevance?.normalized_score, 3) }}
                </p>
                <WorkspaceEvidenceTable
                    title="Top factor genes"
                    :rows="payload.top_factor_genes || []"
                    :columns="topFactorGeneColumns"
                    pagination-label="Factor gene pages"
                />
                <WorkspaceEvidenceTable
                    title="Top factor gene sets"
                    :rows="payload.top_factor_gene_sets || []"
                    :columns="topFactorGeneSetColumns"
                    pagination-label="Factor gene set pages"
                >
                    <template #addGeneSet="{ row }">
                        <button
                            v-if="isGeneSetOnGraph(row)"
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--remove"
                            :disabled="graphBusy"
                            @click="onRemoveGeneSet(row)"
                        >
                            Remove
                        </button>
                        <button
                            v-else
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--add"
                            :disabled="graphBusy"
                            @click="onAddGeneSet(row)"
                        >
                            Add
                        </button>
                    </template>
                </WorkspaceEvidenceTable>
                <WorkspaceEvidenceTable
                    title="Trait support for top factor genes"
                    :rows="payload.trait_gene_support || []"
                    :columns="traitGeneSupportColumns"
                    pagination-label="Trait gene support pages"
                />
                <WorkspaceEvidenceTable
                    title="Trait support for top factor gene sets"
                    :rows="payload.trait_gene_set_support || []"
                    :columns="traitGeneSetSupportColumns"
                    pagination-label="Trait gene set support pages"
                >
                    <template #addGeneSet="{ row }">
                        <button
                            v-if="isGeneSetOnGraph(row)"
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--remove"
                            :disabled="graphBusy"
                            @click="onRemoveGeneSet(row)"
                        >
                            Remove
                        </button>
                        <button
                            v-else
                            type="button"
                            class="wkb-inspector-mini-btn wkb-inspector-mini-btn--add"
                            :disabled="graphBusy"
                            @click="onAddGeneSet(row)"
                        >
                            Add
                        </button>
                    </template>
                </WorkspaceEvidenceTable>
            </section>

            <section v-else class="wkb-inspector-panel-block">
                <h4 class="wkb-inspector-section-heading">{{ payload.title || "Edge provenance" }}</h4>
                <p v-if="payload.summary" class="wkb-inspector-note">{{ payload.summary }}</p>
                <p class="wkb-edge-provenance-line">
                    <strong>Family:</strong> {{ payload.family || "—" }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Raw score:</strong> {{ formatValue(payload.raw_score, 3) }}
                </p>
                <p class="wkb-edge-provenance-line">
                    <strong>Normalized score:</strong>
                    {{ formatValue(payload.normalized_score, 3) }}
                </p>
                <p v-if="payload.path_nodes?.length" class="wkb-edge-provenance-line">
                    <strong>Path:</strong> {{ payload.path_nodes.join(" → ") }}
                </p>
                <pre v-if="payload.extra" class="wkb-edge-provenance-json">{{
                    formattedExtra
                }}</pre>
            </section>
        </template>
        <p v-else class="wkb-inspector-note">
            Edge summary only. Select a supported edge to load provenance.
        </p>
    </div>
</template>

<script>
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";
import WorkspaceGeneTraitLocusZoomPane from "./WorkspaceGeneTraitLocusZoomPane.vue";
import WorkspaceLeadSnpSummary from "./WorkspaceLeadSnpSummary.vue";
import {
    formatEdgeProvenanceValue,
    geneSetRowToAddPayload,
    inferLocusZoomPayload,
} from "./revealKgEdgeProvenanceUtils.js";
import { graphNodeIdSet } from "./revealKgInspectorUtils.js";
import {
    formatProbabilityFromLogBf,
    GENE_TRAIT_PROBABILITY_COLUMNS,
} from "./revealKgSigChainUtils.js";

export default {
    name: "WorkspaceEdgeInspectorContent",
    components: {
        WorkspaceEvidenceTable,
        WorkspaceGeneTraitLocusZoomPane,
        WorkspaceLeadSnpSummary,
    },
    props: {
        selectedEdge: {
            type: Object,
            required: true,
        },
        payload: {
            type: Object,
            default: null,
        },
        provenanceLoading: {
            type: Boolean,
            default: false,
        },
        provenanceError: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            showCfdeOnly: false,
        };
    },
    computed: {
        edgeLabel() {
            return this.selectedEdge?.label || "Selected edge";
        },
        hasMeta() {
            return Boolean(
                this.selectedEdge?.edgeType ||
                    this.selectedEdge?.isContextual ||
                    this.selectedEdge?.scoreLabel
            );
        },
        locusZoomPayload() {
            return inferLocusZoomPayload(this.payload || {});
        },
        visibleIndirectGeneSetRows() {
            const rows = this.payload?.indirect_gene_sets || [];
            if (!this.showCfdeOnly) {
                return rows;
            }
            return rows.filter((row) => !row.data_source || row.data_source === "cfde");
        },
        indirectGeneSetEmptyNote() {
            const diagnostics = this.payload?.diagnostics || {};
            return `No rows match the current filters. Gene-side GMT sets: ${diagnostics.gene_set_count_for_gene ?? 0}. Trait-side qualifying gene sets: ${diagnostics.trait_gene_set_count ?? 0}. Overlap: ${diagnostics.overlap_count ?? 0}.`;
        },
        geneFactorGeneSetEmptyNote() {
            const diagnostics = this.payload?.diagnostics || {};
            return `No qualifying factor-loaded gene sets containing this gene were available. Gene-side GMT sets: ${diagnostics.gene_set_count_for_gene ?? 0}. Factor-side loaded gene sets: ${diagnostics.factor_gene_set_count ?? 0}. Overlap: ${diagnostics.overlap_count ?? 0}.`;
        },
        formattedExtra() {
            if (!this.payload?.extra) {
                return "";
            }
            return JSON.stringify(this.payload.extra, null, 2);
        },
        geneSetAddColumn() {
            return [{ key: "__add__", label: "", slot: "addGeneSet" }];
        },
        indirectGeneSetColumns() {
            return [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "gene_count", label: "N", digits: 0 },
                { key: "data_source", label: "Source" },
                { key: "beta_uncorrected", label: "Beta uncorr.", digits: 3 },
                { key: "beta_marginal", label: "Beta marginal", digits: 3 },
                { key: "score", label: "Score", digits: 3 },
                ...this.geneSetAddColumn,
            ];
        },
        supportingGeneSetColumns() {
            return [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "beta", label: "Beta", digits: 3 },
                { key: "beta_uncorrected", label: "Beta uncorr.", digits: 3 },
                ...this.geneSetAddColumn,
            ];
        },
        topFactorGeneColumns() {
            return [
                { key: "gene", label: "Gene" },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "combined_loading", label: "Combined", digits: 3 },
            ];
        },
        topFactorGeneSetColumns() {
            return [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "beta_uncorrected", label: "Beta uncorr.", digits: 3 },
                ...this.geneSetAddColumn,
            ];
        },
        traitGeneSupportColumns() {
            return [{ key: "gene", label: "Gene" }, ...GENE_TRAIT_PROBABILITY_COLUMNS];
        },
        traitGeneSetSupportColumns() {
            return [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "beta", label: "Beta", digits: 3 },
                { key: "beta_marginal", label: "Beta marginal", digits: 3 },
                ...this.geneSetAddColumn,
            ];
        },
        graphNodeIds() {
            return graphNodeIdSet(this.graphNodes);
        },
    },
    methods: {
        formatValue: formatEdgeProvenanceValue,
        formatProbability: formatProbabilityFromLogBf,
        onAddGeneSet(row) {
            const item = geneSetRowToAddPayload(row);
            if (!item) {
                return;
            }
            this.$emit("add-node", item);
        },
        isGeneSetOnGraph(row) {
            const item = geneSetRowToAddPayload(row);
            return Boolean(item?.node_id && this.graphNodeIds.has(item.node_id));
        },
        onRemoveGeneSet(row) {
            const item = geneSetRowToAddPayload(row);
            if (!item?.node_id) {
                return;
            }
            this.$emit("remove-node", {
                nodeId: item.node_id,
                label: item.label,
            });
        },
    },
};
</script>

<style scoped>
.wkb-edge-inspector-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.wkb-inspector-panel-block {
    margin: 0;
}

.wkb-inspector-node-title,
.wkb-inspector-section-heading {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-section-heading {
    font-size: 15px;
}

.wkb-edge-provenance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-top: 10px;
}

.wkb-edge-provenance-subheading {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
}

.wkb-edge-provenance-line {
    margin: 0 0 6px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-edge-provenance-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    color: var(--cfde-ink, #33363d);
}

.wkb-edge-provenance-json {
    margin: 8px 0 0;
    padding: 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #faf8f5;
    font-size: 11px;
    line-height: 1.4;
    overflow-x: auto;
}

.wkb-inspector-mini-btn {
    padding: 4px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 999px;
    background: #fff;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-inspector-mini-btn--add {
    border-color: var(--cfde-orange, #e07b39);
    color: var(--cfde-orange, #e07b39);
}

.wkb-inspector-mini-btn--add:hover:not(:disabled) {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-inspector-mini-btn--remove {
    border-color: #8a8278;
    color: #4a4540;
    background: #f3f0eb;
}

.wkb-inspector-mini-btn--remove:hover:not(:disabled) {
    background: #e8e3da;
    border-color: #6f6860;
}

.wkb-inspector-mini-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
</style>
