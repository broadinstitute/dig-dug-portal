<template>
    <div
        v-if="open"
        class="wkb-graph-table-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-graph-table-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-graph-table-title"
            @click.stop
        >
            <button
                type="button"
                class="wkb-graph-table-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>

            <header class="wkb-graph-table-head">
                <h2 id="wkb-graph-table-title">Graph data</h2>
                <p>
                    Retrieved nodes from graph build and expansion, including options not yet on
                    the canvas.
                </p>
                <p class="wkb-graph-table-legend" aria-label="Key node rows legend">
                    <span class="wkb-graph-table-legend-item">
                        <span
                            class="wkb-graph-table-legend-swatch"
                            aria-hidden="true"
                        />
                        Key node
                    </span>
                </p>
            </header>

            <div class="wkb-graph-table-body">
                <div class="wkb-graph-table-ledger">
                    <div class="wkb-graph-table-toolbar">
                        <div
                            class="wkb-graph-table-tabs"
                            role="tablist"
                            aria-label="Graph node type"
                        >
                            <button
                                v-for="tab in visibleTabs"
                                :id="tabButtonId(tab.key)"
                                :key="tab.key"
                                type="button"
                                role="tab"
                                class="wkb-graph-table-tab"
                                :class="{ 'is-active': activeTab === tab.key }"
                                :aria-selected="activeTab === tab.key ? 'true' : 'false'"
                                :aria-controls="panelId"
                                @click="setActiveTab(tab.key)"
                            >
                                {{ tab.label }}
                            </button>
                        </div>
                        <div class="wkb-graph-table-csv-action">
                            <button
                                type="button"
                                class="wkb-graph-table-csv-btn"
                                :disabled="!activeRows.length"
                                @click="downloadCurrentTab"
                            >
                                Download CSV
                            </button>
                        </div>
                    </div>

                    <div
                        :id="panelId"
                        class="wkb-graph-table-panel"
                        role="tabpanel"
                        :aria-labelledby="tabButtonId(activeTab)"
                    >
                        <div v-if="activeRows.length" class="wkb-graph-table-wrap">
                            <table class="wkb-graph-table">
                                <thead>
                                    <tr>
                                        <th class="wkb-graph-table-col-name">Name</th>
                                        <th>Aggregate</th>
                                        <th>Max</th>
                                        <th>Mean</th>
                                        <th>Novelty</th>
                                        <th>Relevance</th>
                                        <th class="wkb-graph-table-col-description">Description</th>
                                        <th>Shown</th>
                                        <th class="wkb-graph-table-col-action">Add</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="row in pagedRows"
                                        :key="row.node_id"
                                        :class="{ 'is-key-node-row': row.is_key_node }"
                                    >
                                        <td class="wkb-graph-table-label">{{ row.label }}</td>
                                        <td>{{ formatValue(row.aggregate_score) }}</td>
                                        <td>{{ formatValue(row.raw_max_score) }}</td>
                                        <td>{{ formatValue(row.raw_mean_score) }}</td>
                                        <td>{{ row.novelty_label || "NYA" }}</td>
                                        <td>{{ row.relevance_label || "NYA" }}</td>
                                        <td class="wkb-graph-table-col-description">
                                            {{ row.rationale || "NYA" }}
                                        </td>
                                        <td>{{ row.shown }}</td>
                                        <td class="wkb-graph-table-col-action">
                                            <span
                                                v-if="row.shown === 'yes'"
                                                class="wkb-graph-table-shown-note"
                                            >
                                                Shown
                                            </span>
                                            <button
                                                v-else
                                                type="button"
                                                class="wkb-graph-table-add-btn"
                                                :disabled="graphBusy || addingNodeId === row.node_id"
                                                @click="onAddRow(row)"
                                            >
                                                {{ addingNodeId === row.node_id ? "Adding…" : "Add" }}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-else class="wkb-graph-table-empty">
                            No {{ activeTabLabel.toLowerCase() }} on the graph yet.
                        </p>

                        <WorkspaceGraphTablePagination
                            :current-page="currentPage"
                            :total-pages="totalPages"
                            @page-change="currentPage = $event"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import WorkspaceGraphTablePagination from "./WorkspaceGraphTablePagination.vue";
import {
    GRAPH_TABLE_PAGE_SIZE,
    GRAPH_TABLE_TABS,
    buildGraphTableRowsFromLedger,
    downloadGraphTableCsv,
    formatGraphTableValue,
    graphTableTabsForLedger,
} from "./revealKgGraphTableData.js";
import { effectiveRetrievalLedger } from "./revealKgRetrievalLedger.js";

let panelIdCounter = 0;

export default {
    name: "WorkspaceGraphDataTableModal",
    components: {
        WorkspaceGraphTablePagination,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
        graphEdges: {
            type: Array,
            default: () => [],
        },
        contextualEdges: {
            type: Array,
            default: () => [],
        },
        retrievalLedger: {
            type: Object,
            default: () => ({}),
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
        keyNodeIds: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        panelIdCounter += 1;
        return {
            panelId: `wkb-graph-table-panel-${panelIdCounter}`,
            activeTab: "gene",
            currentPage: 1,
            addingNodeId: null,
        };
    },
    computed: {
        resolvedLedger() {
            return effectiveRetrievalLedger({
                graphNodes: this.graphNodes,
                retrievalLedger: this.retrievalLedger,
            });
        },
        rowsByType() {
            return buildGraphTableRowsFromLedger(
                this.resolvedLedger,
                this.graphNodes,
                this.graphEdges,
                this.contextualEdges,
                this.keyNodeIds
            );
        },
        visibleTabs() {
            const present = graphTableTabsForLedger(this.resolvedLedger);
            return present.length ? present : GRAPH_TABLE_TABS;
        },
        activeRows() {
            return this.rowsByType[this.activeTab] || [];
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.activeRows.length / GRAPH_TABLE_PAGE_SIZE));
        },
        pagedRows() {
            const pageIndex = Math.min(Math.max(1, this.currentPage), this.totalPages) - 1;
            const start = pageIndex * GRAPH_TABLE_PAGE_SIZE;
            return this.activeRows.slice(start, start + GRAPH_TABLE_PAGE_SIZE);
        },
        activeTabLabel() {
            return (
                this.visibleTabs.find((tab) => tab.key === this.activeTab)?.label || "Nodes"
            );
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.syncActiveTab();
                this.currentPage = 1;
            }
        },
        graphNodes() {
            this.syncActiveTab();
        },
        retrievalLedger() {
            this.syncActiveTab();
        },
        activeTab() {
            this.currentPage = 1;
        },
        totalPages(next, prev) {
            if (this.currentPage > next && next !== prev) {
                this.currentPage = next;
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        formatValue(value) {
            return formatGraphTableValue(value, 3);
        },
        tabButtonId(tabKey) {
            return `${this.panelId}-tab-${tabKey}`;
        },
        syncActiveTab() {
            const tabs = this.visibleTabs;
            if (!tabs.length) {
                return;
            }
            if (!tabs.some((tab) => tab.key === this.activeTab)) {
                this.activeTab = tabs[0].key;
            }
        },
        setActiveTab(tabKey) {
            this.activeTab = tabKey;
        },
        onAddRow(row) {
            if (row?.shown === "yes" || this.graphBusy) {
                return;
            }
            this.$emit("add-node", row);
        },
        downloadCurrentTab() {
            const tab = this.visibleTabs.find((entry) => entry.key === this.activeTab);
            const slug = tab?.key || "nodes";
            downloadGraphTableCsv(`reveal_kg_graph_${slug}.csv`, this.activeRows);
        },
        onBackdropClick(event) {
            if (event.target === event.currentTarget) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.wkb-graph-table-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 40px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-graph-table-modal {
    position: relative;
    width: min(1120px, 100%);
    max-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.wkb-graph-table-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
}

.wkb-graph-table-head {
    padding: 18px 24px 10px;
}

.wkb-graph-table-head h2 {
    margin: 0 0 6px;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-graph-table-head p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-graph-table-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    margin-top: 8px;
}

.wkb-graph-table-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: var(--cfde-ink, #33363d);
}

.wkb-graph-table-legend-swatch {
    flex-shrink: 0;
    width: 28px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(72, 139, 247, 0.35);
    background: rgba(72, 139, 247, 0.12);
}

.wkb-graph-table-body {
    overflow: auto;
    padding: 0 24px 24px;
}

.wkb-graph-table-ledger {
    min-width: 0;
}

.wkb-graph-table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.5rem 0.75rem;
    padding: 0.4rem 0.55rem 0;
    background: #e8e3da;
    border: 1px solid #d4cdc2;
    border-bottom: none;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

.wkb-graph-table-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.15rem;
    flex: 1 1 auto;
    min-width: 0;
}

.wkb-graph-table-tab {
    flex: 0 0 auto;
    margin: 0 0 -1px;
    padding: 0.5rem 0.85rem 0.6rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    background: transparent;
    color: #5a5248;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    cursor: pointer;
    appearance: none;
}

.wkb-graph-table-tab.is-active {
    background: #fff;
    color: var(--cfde-ink, #33363d);
    font-weight: 700;
    border-color: #d4cdc2;
    border-bottom: 1px solid #fff;
    z-index: 1;
}

.wkb-graph-table-tab:not(.is-active):hover {
    background: rgba(255, 255, 255, 0.45);
}

.wkb-graph-table-tab:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}

.wkb-graph-table-csv-action {
    flex: 0 0 auto;
    padding: 0 0 0.45rem;
}

.wkb-graph-table-csv-btn {
    appearance: none;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 6px;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
}

.wkb-graph-table-csv-btn:hover:not(:disabled) {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-graph-table-csv-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-graph-table-panel {
    padding: 0.5rem 0 0;
    border: none;
    background: #fff;
}

.wkb-graph-table-wrap {
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
}

.wkb-graph-table {
    width: auto;
    max-width: 100%;
    flex-shrink: 0;
    border-collapse: collapse;
    font-size: 13px;
    background: #fff;
}

.wkb-graph-table th {
    background: var(--cfde-bg, #f6f5f2);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-graph-table th,
.wkb-graph-table td {
    padding: 0.38rem 0.55rem;
    border: 1px solid var(--cfde-border, #e6e1d6);
    text-align: left;
    vertical-align: top;
}

.wkb-graph-table-col-name,
.wkb-graph-table-label,
.wkb-graph-table-col-description {
    overflow-wrap: anywhere;
    max-width: min(320px, 42vw);
}

.wkb-graph-table-label {
    font-weight: 500;
    color: var(--cfde-ink, #33363d);
}

.wkb-graph-table-col-action {
    white-space: nowrap;
    vertical-align: top;
}

.wkb-graph-table tbody tr.is-key-node-row td {
    background: rgba(72, 139, 247, 0.12);
}

.wkb-graph-table-shown-note {
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}

.wkb-graph-table-add-btn {
    appearance: none;
    white-space: nowrap;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 6px;
    background: transparent;
    color: var(--cfde-orange, #e07b39);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.2rem 0.55rem;
    cursor: pointer;
}

.wkb-graph-table-add-btn:hover:not(:disabled) {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-graph-table-add-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.wkb-graph-table-empty {
    margin: 0.75rem 0.5rem;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
