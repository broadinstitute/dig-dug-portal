<template>
    <WorkspaceEvidenceTable
        :title="title"
        :rows="rows"
        :columns="columns"
        :page-size="pageSize"
        :empty-note="emptyNote"
        :bordered="bordered"
        pagination-label="CFDE gene set pages"
    >
        <template #add="{ row }">
            <button
                v-if="isOnGraph(row)"
                type="button"
                class="wkb-cfde-gene-set-btn wkb-cfde-gene-set-btn--remove"
                :disabled="graphBusy"
                @click="$emit('remove-gene-set', row)"
            >
                Remove
            </button>
            <button
                v-else
                type="button"
                class="wkb-cfde-gene-set-btn wkb-cfde-gene-set-btn--add"
                :disabled="graphBusy"
                @click="$emit('add-gene-set', row)"
            >
                Add
            </button>
        </template>
    </WorkspaceEvidenceTable>
</template>

<script>
import { cfdeDatasetRowsHaveSource } from "./revealKgCfdeDatasetUtils.js";
import { formatInspectorValue } from "./revealKgInspectorUtils.js";
import WorkspaceEvidenceTable from "./WorkspaceEvidenceTable.vue";

export default {
    name: "WorkspaceCfdeGeneSetsTable",
    components: {
        WorkspaceEvidenceTable,
    },
    props: {
        title: {
            type: String,
            default: "CFDE gene sets for selected genes",
        },
        rows: {
            type: Array,
            default: () => [],
        },
        graphNodeIds: {
            type: Array,
            default: () => [],
        },
        pageSize: {
            type: Number,
            default: 10,
        },
        emptyNote: {
            type: String,
            default: "No CFDE gene sets matched the selected genes.",
        },
        graphBusy: {
            type: Boolean,
            default: false,
        },
        bordered: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        graphNodeIdSet() {
            return new Set(this.graphNodeIds || []);
        },
        showSourceColumn() {
            return cfdeDatasetRowsHaveSource(this.rows);
        },
        columns() {
            const base = [{ key: "label", label: "Gene set", wrap: true }];
            if (this.showSourceColumn) {
                base.push({ key: "source", label: "Source", wrap: true });
            }
            return base.concat([
                {
                    key: "aggregate_score",
                    label: "Aggregate",
                    format: (value) => formatInspectorValue(value, 3),
                },
                {
                    key: "raw_max_score",
                    label: "Max",
                    format: (value) => formatInspectorValue(value, 3),
                },
                {
                    key: "raw_mean_score",
                    label: "Mean",
                    format: (value) => formatInspectorValue(value, 3),
                },
                {
                    key: "support_anchor_count",
                    label: "Anchors",
                    format: (value) => formatInspectorValue(value),
                },
                {
                    key: "support_path_count",
                    label: "Paths",
                    format: (value) => formatInspectorValue(value),
                },
                { key: "__add__", label: "", slot: "add" },
            ]);
        },
    },
    methods: {
        isOnGraph(row) {
            return this.graphNodeIdSet.has(row?.node_id);
        },
    },
};
</script>

<style scoped>
.wkb-cfde-gene-set-btn {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
}

.wkb-cfde-gene-set-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.wkb-cfde-gene-set-btn--add {
    background: var(--cfde-orange, #e07b39);
    border-color: var(--cfde-orange, #e07b39);
    color: #fff;
}

.wkb-cfde-gene-set-btn--remove {
    background: #fff;
    border-color: #94a3b8;
    color: #475569;
}
</style>
