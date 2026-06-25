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
                    v-if="activeTab === 'provenance'"
                    :id="tabPanelId('provenance')"
                    class="wkb-gene-set-provenance-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('provenance')"
                >
                    <WorkspaceGeneSetProvenanceViz
                        :network="parsed.provenanceNetwork"
                        :height="provenanceVizHeight"
                        aria-label="Gene set provenance graph"
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
                    />
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
                    v-show="activeTab === 'download_regenerate'"
                    :id="tabPanelId('download_regenerate')"
                    class="wkb-gene-set-provenance-panel wkb-gene-set-regenerate-panel"
                    role="tabpanel"
                    :aria-labelledby="tabButtonId('download_regenerate')"
                >
                    <p class="wkb-gene-set-regenerate-copy">
                        Open the provenance explorer to download source files, rerun the pipeline
                        with the same inputs, or tweak parameters to build a custom gene set.
                    </p>

                    <button
                        type="button"
                        class="wkb-gene-set-regenerate-copy-btn"
                        :disabled="!canCopyGeneSetInformation"
                        title="Copy gene set provenance URL and assistant intention"
                        @click="onCopyGeneSetInformation"
                    >
                        Copy gene set information
                    </button>
                    <p
                        v-if="copyFeedback"
                        class="wkb-gene-set-regenerate-copy-feedback"
                        role="status"
                    >
                        {{ copyFeedback }}
                    </p>

                    <button
                        type="button"
                        class="wkb-gene-set-regenerate-open"
                        :disabled="!canOpenProvenanceExplorer"
                        :title="provenanceExplorerButtonTitle"
                        @click="onOpenProvenanceExplorer"
                    >
                        Open provenance explorer
                    </button>
                    <p v-if="!canOpenProvenanceExplorer" class="wkb-gene-set-regenerate-footnote">
                        Provenance explorer link is not configured yet.
                    </p>
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
    formatGeneSetInformationForClipboard,
    GENE_SET_PROVENANCE_EXPLORER_URL,
    parseGeneSetProvenancePayload,
    resolveAssistantIntentionForGeneSet,
} from "./revealKgGeneSetProvenance.js";
import { demoGeneSetProvenanceForNode } from "./revealKgDemoGeneSets.js";
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
        geneSetNode: {
            type: Object,
            default: null,
        },
        provenanceExplorerUrl: {
            type: String,
            default: GENE_SET_PROVENANCE_EXPLORER_URL,
        },
    },
    data() {
        panelIdCounter += 1;
        return {
            panelId: `wkb-gene-set-prov-${panelIdCounter}`,
            activeTab: "provenance",
            loading: false,
            error: "",
            parsed: null,
            requestId: 0,
            copyFeedback: "",
            copyFeedbackTimer: null,
        };
    },
    computed: {
        tabs() {
            return [
                { id: "provenance", label: "Provenance" },
                { id: "graph_table", label: "Graph table" },
                { id: "genes", label: "Genes" },
                { id: "download_regenerate", label: "Reproduce / Extend" },
                { id: "biology", label: "Biology context" },
            ];
        },
        downloadRegenerate() {
            return (
                this.parsed?.downloadRegenerate || {
                    geneSetId: null,
                    standardName: "",
                    collectionName: "",
                    sourceFiles: [],
                    workflowSteps: [],
                    converterCommand: "",
                }
            );
        },
        resolvedProvenanceExplorerUrl() {
            return String(this.provenanceExplorerUrl || "").trim();
        },
        canOpenProvenanceExplorer() {
            return Boolean(this.resolvedProvenanceExplorerUrl);
        },
        provenanceExplorerButtonTitle() {
            return this.canOpenProvenanceExplorer
                ? "Open the gene set provenance explorer"
                : "Provenance explorer URL is not configured yet";
        },
        geneSetInformationClipboardText() {
            const demoMeta = demoGeneSetProvenanceForNode(this.geneSetNode) || {};
            const context = this.downloadRegenerate;
            return formatGeneSetInformationForClipboard({
                geneSetId: this.geneSetId || context.geneSetId,
                standardName:
                    context.standardName ||
                    demoMeta.standard_name ||
                    this.geneSetNode?.label ||
                    "",
                collectionName: context.collectionName || demoMeta.collection_name || "",
                assistantIntention: resolveAssistantIntentionForGeneSet(this.geneSetNode),
            });
        },
        canCopyGeneSetInformation() {
            return Boolean(this.geneSetInformationClipboardText);
        },
        provenanceVizHeight() {
            const nodeCount = this.parsed?.provenanceNetwork?.nodes?.length || 0;
            if (nodeCount >= 14) {
                return 480;
            }
            if (nodeCount >= 8) {
                return 400;
            }
            return 340;
        },
        graphTableColumns() {
            return [
                { key: "source", label: "Source", wrap: true },
                { key: "source_type", label: "Source type" },
                { key: "target", label: "Target", wrap: true },
                { key: "edge_name", label: "Edge name" },
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
    beforeDestroy() {
        if (this.copyFeedbackTimer) {
            clearTimeout(this.copyFeedbackTimer);
        }
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
            this.activeTab = "provenance";
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
        onOpenProvenanceExplorer() {
            const url = this.resolvedProvenanceExplorerUrl;
            if (!url) {
                return;
            }
            const context = this.downloadRegenerate;
            this.$emit("open-workflow-studio", {
                geneSetId: context.geneSetId,
                standardName: context.standardName,
                collectionName: context.collectionName,
                sourceFiles: context.sourceFiles,
                workflowSteps: context.workflowSteps,
                converterCommand: context.converterCommand,
                url,
            });
            window.open(url, "_blank", "noopener,noreferrer");
        },
        async onCopyGeneSetInformation() {
            const text = this.geneSetInformationClipboardText;
            if (!text) {
                return;
            }
            try {
                if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const textarea = document.createElement("textarea");
                    textarea.value = text;
                    textarea.setAttribute("readonly", "");
                    textarea.style.position = "absolute";
                    textarea.style.left = "-9999px";
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                }
                this.setCopyFeedback("Copied to clipboard.");
            } catch (error) {
                this.setCopyFeedback("Could not copy to clipboard.");
            }
        },
        setCopyFeedback(message) {
            this.copyFeedback = message;
            if (this.copyFeedbackTimer) {
                clearTimeout(this.copyFeedbackTimer);
            }
            this.copyFeedbackTimer = setTimeout(() => {
                this.copyFeedback = "";
                this.copyFeedbackTimer = null;
            }, 2500);
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

.wkb-gene-set-regenerate-panel {
    align-items: flex-start;
    gap: 14px;
    padding: 12px 4px 8px;
    text-align: left;
}

.wkb-gene-set-regenerate-copy {
    margin: 0;
    max-width: 36em;
    font-size: 12px;
    line-height: 1.5;
    color: var(--cfde-ink, #33363d);
}

.wkb-gene-set-regenerate-copy-btn {
    border: 1px solid var(--cfde-blue, #2c5c97);
    border-radius: 6px;
    background: #fff;
    color: var(--cfde-blue, #2c5c97);
    font-size: 12px;
    font-weight: 600;
    padding: 7px 14px;
    cursor: pointer;
}

.wkb-gene-set-regenerate-copy-btn:hover:not(:disabled) {
    background: #eef4fb;
}

.wkb-gene-set-regenerate-copy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-gene-set-regenerate-copy-feedback {
    margin: -6px 0 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-regenerate-footnote {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-gene-set-regenerate-open {
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 6px;
    background: var(--cfde-orange, #e07b39);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 9px 20px;
    cursor: pointer;
}

.wkb-gene-set-regenerate-open:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.wkb-gene-set-regenerate-open:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
