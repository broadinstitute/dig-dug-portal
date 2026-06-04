<template>
    <section class="wkb-factor-loadings">
        <h4 class="wkb-inspector-section-heading">Factor loadings</h4>
        <div class="wkb-factor-loadings-toolbar">
            <div
                class="wkb-factor-loadings-tabs"
                role="tablist"
                aria-label="Factor loading tables"
            >
                <button
                    :id="tabId('genes')"
                    type="button"
                    role="tab"
                    class="wkb-factor-loadings-tab"
                    :class="{ 'is-active': activeTab === 'genes' }"
                    :aria-selected="activeTab === 'genes' ? 'true' : 'false'"
                    :aria-controls="panelId"
                    @click="activeTab = 'genes'"
                >
                    Genes
                </button>
                <button
                    :id="tabId('gene_sets')"
                    type="button"
                    role="tab"
                    class="wkb-factor-loadings-tab"
                    :class="{ 'is-active': activeTab === 'gene_sets' }"
                    :aria-selected="activeTab === 'gene_sets' ? 'true' : 'false'"
                    :aria-controls="panelId"
                    @click="activeTab = 'gene_sets'"
                >
                    Gene sets
                </button>
            </div>
        </div>
        <div
            :id="panelId"
            class="wkb-factor-loadings-panel"
            role="tabpanel"
            :aria-labelledby="tabId(activeTab)"
        >
            <p v-if="loading" class="wkb-inspector-note">
                <span class="wkb-inspector-spinner" aria-hidden="true" />
                Loading factor genes and gene sets…
            </p>
            <p v-else-if="error" class="wkb-inspector-note wkb-inspector-note--warn">
                {{ error }}
            </p>
            <template v-else-if="payload">
                <WorkspaceEvidenceTable
                    v-if="activeTab === 'genes'"
                    :key="`${safeNodeKey}-genes`"
                    title="Factor genes"
                    :rows="payload.top_genes || []"
                    :columns="geneColumns"
                    :page-size="10"
                    pagination-label="Factor gene pages"
                    empty-note="No factor gene loadings were returned."
                />
                <WorkspaceEvidenceTable
                    v-else
                    :key="`${safeNodeKey}-gene-sets`"
                    title="Factor gene sets"
                    :rows="payload.top_gene_sets || []"
                    :columns="geneSetColumns"
                    :page-size="10"
                    pagination-label="Factor gene set pages"
                    empty-note="No factor gene set loadings were returned."
                />
            </template>
        </div>
    </section>
</template>

<script>
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";

const FACTOR_LOADINGS_PAGE_SIZE = 10;

export default {
    name: "WorkspaceFactorLoadingsPanel",
    components: {
        WorkspaceEvidenceTable,
    },
    props: {
        node: {
            type: Object,
            required: true,
        },
        loadingsCache: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            activeTab: "genes",
            pageSize: FACTOR_LOADINGS_PAGE_SIZE,
            geneColumns: [
                { key: "gene", label: "Gene", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "relative_loading", label: "Rel. loading", digits: 3 },
                { key: "combined_loading", label: "Combined", digits: 3 },
                { key: "combined_score", label: "Score", digits: 3 },
            ],
            geneSetColumns: [
                { key: "gene_set", label: "Gene set", wrap: true },
                { key: "loading", label: "Loading", digits: 3 },
                { key: "relative_loading", label: "Rel. loading", digits: 3 },
                { key: "combined_loading", label: "Combined", digits: 3 },
                { key: "beta", label: "Beta", digits: 3 },
                { key: "beta_uncorrected", label: "Beta uncorr.", digits: 3 },
            ],
        };
    },
    computed: {
        payload() {
            return this.loadingsCache?.payload || null;
        },
        safeNodeKey() {
            return String(this.node?.id || "factor").replace(/[^a-zA-Z0-9_-]+/g, "-");
        },
        panelId() {
            return `wkb-factor-loadings-panel-${this.safeNodeKey}`;
        },
    },
    watch: {
        node: {
            immediate: true,
            handler() {
                this.activeTab = "genes";
                this.ensureLoadings();
            },
        },
        loadingsCache: {
            deep: true,
            handler() {
                this.ensureLoadings();
            },
        },
    },
    methods: {
        tabId(tab) {
            return `wkb-factor-loadings-tab-${this.safeNodeKey}-${tab}`;
        },
        ensureLoadings() {
            if (!this.node?.id || this.loadingsCache?.payload || this.loadingsCache?.error) {
                return;
            }
            if (!this.apiClient?.getInteractiveFactorLoadings) {
                this.$emit("cache-factor-loadings", {
                    nodeId: this.node.id,
                    error: "Factor loadings API is not configured.",
                });
                return;
            }
            this.$emit("load-factor-loadings", { nodeId: this.node.id });
        },
    },
};
</script>

<style scoped>
.wkb-factor-loadings {
    margin-top: 16px;
}

.wkb-inspector-section-heading {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-factor-loadings-toolbar {
    margin-bottom: 0;
}

.wkb-factor-loadings-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.wkb-factor-loadings-tab {
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

.wkb-factor-loadings-tab.is-active {
    background: #fffef9;
    border-bottom-color: #fffef9;
    color: var(--cfde-orange, #e07b39);
}

.wkb-factor-loadings-panel {
    padding-top: 4px;
}

.wkb-inspector-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 6px;
    border: 2px solid #e6e1d6;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    vertical-align: -2px;
    animation: wkb-inspector-spin 0.7s linear infinite;
}

@keyframes wkb-inspector-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-inspector-note {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-note--warn {
    color: #9a3412;
}
</style>
