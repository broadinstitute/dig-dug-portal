<template>
    <div class="wkb-evidence-table">
        <div v-if="title || $slots.controls" class="wkb-evidence-table-head">
            <h4 v-if="title" class="wkb-evidence-table-title">{{ title }}</h4>
            <slot name="controls" />
        </div>
        <div v-if="rows.length" class="wkb-evidence-table-wrap">
            <table class="wkb-evidence-table-grid">
                <thead>
                    <tr>
                        <th v-for="column in columns" :key="column.key" scope="col">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, index) in pagedRows" :key="rowKey(row, index)">
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :class="cellClass(column)"
                        >
                            <slot
                                v-if="column.slot"
                                :name="column.slot"
                                :row="row"
                                :value="row[column.key]"
                            />
                            <template v-else>{{ formatCell(row, column) }}</template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p v-else class="wkb-evidence-table-empty">{{ emptyNote }}</p>
        <WorkspaceGraphTablePagination
            v-if="rows.length"
            :current-page="currentPage"
            :total-pages="totalPages"
            :aria-label="paginationLabel"
            @page-change="currentPage = $event"
        />
    </div>
</template>

<script>
import { formatInspectorValue } from "./revealKgInspectorUtils.js";
import WorkspaceGraphTablePagination from "./WorkspaceGraphTablePagination.vue";

export default {
    name: "WorkspaceEvidenceTable",
    components: {
        WorkspaceGraphTablePagination,
    },
    props: {
        title: {
            type: String,
            default: "",
        },
        rows: {
            type: Array,
            default: () => [],
        },
        columns: {
            type: Array,
            default: () => [],
        },
        pageSize: {
            type: Number,
            default: 10,
        },
        emptyNote: {
            type: String,
            default: "No rows to display.",
        },
        paginationLabel: {
            type: String,
            default: "Table pages",
        },
    },
    data() {
        return {
            currentPage: 1,
        };
    },
    computed: {
        totalPages() {
            return Math.max(1, Math.ceil((this.rows || []).length / this.pageSize));
        },
        pagedRows() {
            const page = Math.min(this.currentPage, this.totalPages);
            const start = (page - 1) * this.pageSize;
            return (this.rows || []).slice(start, start + this.pageSize);
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
        },
        totalPages(next) {
            if (this.currentPage > next) {
                this.currentPage = next;
            }
        },
    },
    methods: {
        rowKey(row, index) {
            return row.node_id || row.row_id || `${index}`;
        },
        formatCell(row, column) {
            const value = row[column.key];
            if (column.format) {
                return column.format(value, row);
            }
            return formatInspectorValue(value, column.digits);
        },
        cellClass(column) {
            return column.wrap ? "wkb-evidence-table-cell--wrap" : "";
        },
    },
};
</script>

<style scoped>
.wkb-evidence-table {
    margin-top: 14px;
}

.wkb-evidence-table-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 8px;
}

.wkb-evidence-table-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-evidence-table-wrap {
    overflow-x: auto;
    max-width: 100%;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
}

.wkb-evidence-table-grid {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.wkb-evidence-table-grid th,
.wkb-evidence-table-grid td {
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1px solid #efe9df;
    vertical-align: top;
}

.wkb-evidence-table-grid th {
    white-space: nowrap;
}

.wkb-evidence-table-grid td.wkb-evidence-table-cell--wrap {
    white-space: normal;
    min-width: 140px;
    max-width: 280px;
    word-break: break-word;
}

.wkb-evidence-table-grid td:not(.wkb-evidence-table-cell--wrap) {
    white-space: nowrap;
}

.wkb-evidence-table-grid th {
    background: #f6f3ee;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-evidence-table-grid tbody tr:last-child td {
    border-bottom: none;
}

.wkb-evidence-table-empty {
    margin: 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}
</style>
