<template>
    <div class="wkb-node-connections">
        <h4 class="wkb-inspector-section-heading">
            Top connections from {{ nodeLabel }}
        </h4>
        <div class="wkb-node-connections-toolbar">
            <div class="wkb-node-connections-tabs" role="tablist" aria-label="Top connection types">
                <button
                    v-for="targetType in targetTypes"
                    :id="tabId(targetType)"
                    :key="targetType"
                    type="button"
                    role="tab"
                    class="wkb-node-connections-tab"
                    :class="{ 'is-active': selectedTab === targetType }"
                    :aria-selected="selectedTab === targetType ? 'true' : 'false'"
                    :aria-controls="panelId"
                    @click="selectedTab = targetType"
                >
                    {{ targetTypeLabel(targetType) }}
                </button>
            </div>
            <label class="wkb-node-connections-toggle">
                <input v-model="shownOnly" type="checkbox" />
                Show only on graph
            </label>
        </div>
        <div
            :id="panelId"
            class="wkb-node-connections-panel"
            role="tabpanel"
            :aria-labelledby="tabId(selectedTab)"
        >
            <p v-if="isSelectedTabLoading" class="wkb-inspector-note">
                Loading top connections…
            </p>
            <p v-else-if="selectedTabError" class="wkb-inspector-note wkb-inspector-note--warn">
                {{ selectedTabError }}
            </p>
            <WorkspaceEvidenceTable
                v-else-if="visibleRows.length"
                :rows="visibleRows"
                :columns="tableColumns"
                :page-size="10"
                :empty-note="emptyNote"
                pagination-label="Top connections pages"
            >
                <template #add="{ row }">
                    <button
                        type="button"
                        class="wkb-inspector-mini-btn"
                        :disabled="row.shown === 'yes' || graphBusy"
                        @click="onAddRow(row)"
                    >
                        {{ row.shown === "yes" ? "On graph" : "Add" }}
                    </button>
                </template>
            </WorkspaceEvidenceTable>
            <p v-else class="wkb-inspector-note">{{ emptyNote }}</p>
        </div>
    </div>
</template>

<script>
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";
import {
    connectionTargetTypesForNode,
    graphNodeToConnectionAnchor,
    INSPECTOR_TARGET_TYPE_LABELS,
    mapConnectionCandidatesToRows,
} from "./revealKgInspectorUtils.js";

export default {
    name: "WorkspaceNodeConnectionTabs",
    components: {
        WorkspaceEvidenceTable,
    },
    props: {
        node: {
            type: Object,
            required: true,
        },
        anchorItems: {
            type: Array,
            default: () => [],
        },
        sessionContext: {
            type: String,
            default: "",
        },
        graphNodes: {
            type: Array,
            default: () => [],
        },
        connectionCache: {
            type: Object,
            default: () => ({}),
        },
        apiClient: {
            type: Object,
            default: null,
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            selectedTab: "",
            shownOnly: false,
            tabCache: {},
            loadingTabs: {},
            tabErrors: {},
            preloadToken: 0,
        };
    },
    computed: {
        targetTypes() {
            return connectionTargetTypesForNode(this.node);
        },
        nodeLabel() {
            return this.node?.label || this.node?.id || "this node";
        },
        panelId() {
            return `wkb-node-conn-panel-${this.safeNodeKey}`;
        },
        safeNodeKey() {
            return String(this.node?.id || "node").replace(/[^a-zA-Z0-9_-]+/g, "-");
        },
        tableColumns() {
            return [
                { key: "label", label: "Node", wrap: true },
                { key: "subtitle", label: "Description", wrap: true },
                { key: "aggregate_score", label: "Aggregate", digits: 3 },
                { key: "raw_max_score", label: "Max", digits: 3 },
                { key: "raw_mean_score", label: "Mean", digits: 3 },
                { key: "link_score", label: "Link", digits: 3 },
                { key: "shown", label: "On graph?" },
                { key: "add", label: "", slot: "add" },
            ];
        },
        tableRows() {
            const candidates = this.tabCache[this.selectedTab] || [];
            return mapConnectionCandidatesToRows(candidates, this.graphNodes);
        },
        visibleRows() {
            if (this.shownOnly) {
                return this.tableRows.filter((row) => row.shown === "yes");
            }
            return this.tableRows;
        },
        emptyNote() {
            const tab = INSPECTOR_TARGET_TYPE_LABELS[this.selectedTab] || this.selectedTab;
            return `No ${String(tab || "connection").toLowerCase()} connections matched this view.`;
        },
        isSelectedTabLoading() {
            return (
                Boolean(this.loadingTabs[this.selectedTab]) &&
                !this.tabCache[this.selectedTab]
            );
        },
        selectedTabError() {
            return this.tabErrors[this.selectedTab] || "";
        },
    },
    watch: {
        node: {
            immediate: true,
            handler() {
                this.resetForNode();
            },
        },
        connectionCache: {
            immediate: true,
            deep: true,
            handler(cache) {
                this.tabCache = cache && typeof cache === "object" ? { ...cache } : {};
                this.preloadAllTabs(this.preloadToken);
            },
        },
        anchorItems: {
            deep: true,
            handler() {
                this.preloadAllTabs(this.preloadToken);
            },
        },
        sessionContext() {
            this.preloadAllTabs(this.preloadToken);
        },
        targetTypes: {
            immediate: true,
            handler(types) {
                if (!types.length) {
                    this.selectedTab = "";
                    return;
                }
                if (!types.includes(this.selectedTab)) {
                    this.selectedTab = types[0];
                }
                this.preloadAllTabs(this.preloadToken);
            },
        },
    },
    methods: {
        tabId(targetType) {
            return `wkb-node-conn-tab-${this.safeNodeKey}-${targetType}`;
        },
        targetTypeLabel(targetType) {
            return INSPECTOR_TARGET_TYPE_LABELS[targetType] || targetType;
        },
        resetForNode() {
            this.shownOnly = false;
            this.loadingTabs = {};
            this.tabErrors = {};
            this.preloadToken += 1;
            const types = this.targetTypes;
            this.selectedTab = types[0] || "";
            this.preloadAllTabs(this.preloadToken);
        },
        preloadAllTabs(token = this.preloadToken) {
            if (token !== this.preloadToken || !this.node?.id) {
                return;
            }
            const pending = this.targetTypes.filter(
                (targetType) => !this.tabCache[targetType] && !this.loadingTabs[targetType]
            );
            for (const targetType of pending) {
                this.loadTab(targetType, token);
            }
        },
        onAddRow(row) {
            if (!row?.node_id || row.shown === "yes") {
                return;
            }
            this.$emit("add-node", {
                node_id: row.node_id,
                label: row.label,
                subtitle: row.subtitle,
                node_type: row.node_type || row.type,
                type: row.node_type || row.type,
            });
        },
        async loadTab(targetType, token = this.preloadToken) {
            if (token !== this.preloadToken) {
                return;
            }
            if (!this.node?.id || !targetType || this.tabCache[targetType]) {
                return;
            }
            if (this.loadingTabs[targetType]) {
                return;
            }
            if (!this.apiClient?.getInteractiveConnections) {
                this.$set(
                    this.tabErrors,
                    targetType,
                    "Connections API is not configured."
                );
                return;
            }
            this.$set(this.loadingTabs, targetType, true);
            this.$set(this.tabErrors, targetType, "");
            const anchorItems = (this.anchorItems || []).length
                ? this.anchorItems
                : [graphNodeToConnectionAnchor(this.node)].filter(Boolean);
            const useAnchorRanked = anchorItems.length > 0;
            try {
                const payload = await this.apiClient.getInteractiveConnections({
                    anchor_items: anchorItems,
                    context: (this.sessionContext || "").trim(),
                    target_type: targetType,
                    reducer: "max",
                    connection_scope: "direct",
                    limit: 100,
                    exclude_node_ids: [this.node.id],
                    linked_node_id: useAnchorRanked ? this.node.id : undefined,
                });
                if (token !== this.preloadToken) {
                    return;
                }
                const candidates = payload.candidates || [];
                this.$set(this.tabCache, targetType, candidates);
                this.$emit("cache-connections", {
                    nodeId: this.node.id,
                    targetType,
                    candidates,
                });
            } catch (err) {
                if (token === this.preloadToken) {
                    this.$set(
                        this.tabErrors,
                        targetType,
                        String(err?.message || err) || "Could not load connections."
                    );
                }
            } finally {
                if (token === this.preloadToken) {
                    this.$delete(this.loadingTabs, targetType);
                }
            }
        },
    },
};
</script>

<style scoped>
.wkb-node-connections {
    margin-top: 16px;
}

.wkb-inspector-section-heading {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-node-connections-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 8px;
}

.wkb-node-connections-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.wkb-node-connections-tab {
    border: 1px solid #d4cdc2;
    border-radius: 6px 6px 0 0;
    background: #f0ebe3;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: var(--cfde-ink, #33363d);
}

.wkb-node-connections-tab.is-active {
    background: #fffef9;
    border-bottom-color: #fffef9;
    color: var(--cfde-orange, #e07b39);
}

.wkb-node-connections-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--cfde-ink, #33363d);
}

.wkb-node-connections-panel {
    padding-top: 4px;
}

.wkb-inspector-mini-btn {
    border: 1px solid #d4cdc2;
    border-radius: 5px;
    background: #fffdfa;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-inspector-mini-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.wkb-inspector-note {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-note--warn {
    color: #a34b2d;
}
</style>
