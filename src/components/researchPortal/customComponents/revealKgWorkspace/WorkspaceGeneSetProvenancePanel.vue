<template>
    <section class="wkb-gene-set-provenance">
        <h4 class="wkb-inspector-section-heading">Gene set provenance</h4>

        <p v-if="!geneSetId" class="wkb-gene-set-provenance-note">
            Provenance detail is available when this gene set has a catalog id (demo gene sets
            added via <code>demo:</code> search).
        </p>

        <template v-else>
            <p v-if="loading" class="wkb-gene-set-provenance-note" role="status">
                Loading provenance…
            </p>
            <p v-else-if="error" class="wkb-gene-set-provenance-error" role="alert">
                {{ error }}
            </p>

            <template v-else-if="parsed">
                <div class="wkb-gene-set-provenance-toolbar">
                    <div
                        class="wkb-gene-set-provenance-tabs"
                        role="tablist"
                        aria-label="Gene set provenance views"
                    >
                        <button
                            v-for="tab in tabs"
                            :id="tabButtonId(tab.id)"
                            :key="tab.id"
                            type="button"
                            role="tab"
                            class="wkb-gene-set-provenance-tab"
                            :class="{ 'is-active': activeTab === tab.id }"
                            :aria-selected="activeTab === tab.id ? 'true' : 'false'"
                            :aria-controls="tabPanelId(tab.id)"
                            @click="activeTab = tab.id"
                        >
                            {{ tab.label }}
                        </button>
                    </div>
                </div>

                <div
                    v-if="activeTab === 'gene_set'"
                    :id="tabPanelId('gene_set')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('gene_set')"
                >
                    <WorkspaceGeneSetProvenanceViz
                        :network="parsed.geneSetNetwork"
                        aria-label="Gene set extraction path"
                    />
                </div>

                <div
                    v-if="activeTab === 'summary'"
                    :id="tabPanelId('summary')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('summary')"
                >
                    <WorkspaceGeneSetProvenanceViz
                        :network="parsed.summaryNetwork"
                        aria-label="Gene set summary preparation path"
                    />
                </div>

                <div
                    v-show="activeTab === 'graph_table'"
                    :id="tabPanelId('graph_table')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('graph_table')"
                >
                    <WorkspaceEvidenceTable
                        :rows="parsed.graphTableRows"
                        :columns="graphTableColumns"
                        :page-size="10"
                        :bordered="false"
                        empty-note="No provenance edges found."
                        pagination-label="Provenance graph pages"
                    >
                        <template #download="{ row }">
                            <a
                                v-if="row.download_url"
                                :href="row.download_url"
                                class="wkb-gene-set-provenance-download"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                            <button
                                v-else
                                type="button"
                                class="wkb-gene-set-provenance-download wkb-gene-set-provenance-download--placeholder"
                                disabled
                                title="Download link not available"
                            >
                                Download
                            </button>
                        </template>
                    </WorkspaceEvidenceTable>
                </div>

                <div
                    v-show="activeTab === 'genes'"
                    :id="tabPanelId('genes')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('genes')"
                >
                    <WorkspaceEvidenceTable
                        :rows="parsed.geneRows"
                        :columns="geneTableColumns"
                        :page-size="10"
                        :bordered="false"
                        empty-note="No genes listed for this gene set."
                        pagination-label="Gene list pages"
                    />
                </div>

                <div
                    v-show="activeTab === 'biology'"
                    :id="tabPanelId('biology')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('biology')"
                >
                    <WorkspaceEvidenceTable
                        v-if="biologyTableRows.length"
                        :rows="biologyTableRows"
                        :columns="biologyTableColumns"
                        :page-size="20"
                        :bordered="false"
                        empty-note="No biology context metadata is available for this gene set."
                        pagination-label="Biology context pages"
                    />
                    <p v-else class="wkb-gene-set-provenance-note">
                        No biology context metadata is available for this gene set.
                    </p>
                </div>
            </template>
        </template>
    </section>
</template>

<script>
import {
    fetchGeneSetProvenanceDetail,
    parseGeneSetProvenancePayload,
} from "./revealKgGeneSetProvenance.js";
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";
import WorkspaceGeneSetProvenanceViz from "./WorkspaceGeneSetProvenanceViz.vue";

let panelIdCounter = 0;

export default {
    name: "WorkspaceGeneSetProvenancePanel",
    components: {
        WorkspaceEvidenceTable,
        WorkspaceGeneSetProvenanceViz,
    },
    props: {
        geneSetId: {
            type: Number,
            default: null,
        },
    },
    data() {
        panelIdCounter += 1;
        return {
            panelId: `wkb-gene-set-prov-${panelIdCounter}`,
            activeTab: "gene_set",
            loading: false,
            error: "",
            parsed: null,
            requestId: 0,
        };
    },
    computed: {
        tabs() {
            return [
                { id: "gene_set", label: "Gene set" },
                { id: "summary", label: "Summary" },
                { id: "graph_table", label: "Graph table" },
                { id: "genes", label: "Genes" },
                { id: "biology", label: "Biology context" },
            ];
        },
        graphTableColumns() {
            return [
                { key: "source", label: "Source", wrap: true },
                { key: "source_type", label: "Source type" },
                { key: "target", label: "Target", wrap: true },
                { key: "edge_name", label: "Edge name" },
                { key: "download", label: "Download", slot: "download" },
            ];
        },
        geneTableColumns() {
            return [
                { key: "gene", label: "Gene" },
                { key: "score_1", label: "Score 1" },
                { key: "score_2", label: "Score 2" },
                { key: "score_3", label: "Score 3" },
            ];
        },
        biologyTableColumns() {
            return [
                { key: "field", label: "Field" },
                { key: "value", label: "Value", wrap: true },
            ];
        },
        biologyTableRows() {
            const rows = this.parsed?.biologyContext || [];
            return rows.map((row) => ({
                row_id: row.id,
                field: row.label,
                value: row.value,
            }));
        },
    },
    watch: {
        geneSetId: {
            immediate: true,
            handler() {
                this.loadProvenance();
            },
        },
    },
    methods: {
        tabButtonId(name) {
            return `${this.panelId}-tab-${name}`;
        },
        tabPanelId(name) {
            return `${this.panelId}-panel-${name}`;
        },
        async loadProvenance() {
            const geneSetId = Number(this.geneSetId);
            if (!Number.isFinite(geneSetId)) {
                this.loading = false;
                this.error = "";
                this.parsed = null;
                return;
            }
            const requestId = ++this.requestId;
            this.loading = true;
            this.error = "";
            this.parsed = null;
            this.activeTab = "gene_set";
            try {
                const payload = await fetchGeneSetProvenanceDetail(geneSetId);
                if (requestId !== this.requestId) {
                    return;
                }
                this.parsed = parseGeneSetProvenancePayload(payload);
            } catch (loadError) {
                if (requestId !== this.requestId) {
                    return;
                }
                this.error = String(loadError?.message || loadError);
            } finally {
                if (requestId === this.requestId) {
                    this.loading = false;
                }
            }
        },
    },
};
</script>

<style scoped>
.wkb-gene-set-provenance {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-inspector-section-heading {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-gene-set-provenance-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-provenance-note code {
    font-size: 11px;
}

.wkb-gene-set-provenance-error {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: #9a3412;
}

.wkb-gene-set-provenance-toolbar {
    margin: 8px 0 0;
}

.wkb-gene-set-provenance-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.wkb-gene-set-provenance-tab {
    margin: 0;
    border: 1px solid #d4cdc2;
    border-radius: 6px 6px 0 0;
    background: #f0ebe3;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: var(--cfde-ink, #33363d);
}

.wkb-gene-set-provenance-tab.is-active {
    background: #fffef9;
    border-bottom-color: #fffef9;
    color: var(--cfde-orange, #e07b39);
}

.wkb-gene-set-provenance-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
}

.wkb-gene-set-provenance-download {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
}

.wkb-gene-set-provenance-download:hover:not(:disabled) {
    background: #eef4fb;
}

.wkb-gene-set-provenance-download--placeholder {
    opacity: 0.45;
    cursor: not-allowed;
}
</style>
