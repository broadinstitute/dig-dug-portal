<template>
    <div class="vks-v2g-table research-data-table-wrapper">
        <template v-if="rows.length">
            <VariantSifterTableSettings
                :per-page="Number(perPageNumber)"
                :columns="tableColumns"
                :visible-columns="visibleColumns"
                @update:perPage="onPerPageUpdate"
                @export-csv="exportCsv"
                @export-json="exportJson"
                @update:columnVisible="onColumnVisibleUpdate"
            >
                <template #before>
                    <div class="vks-data-table-view-total">
                        Total rows: {{ displayRows.length.toLocaleString() }}
                    </div>
                </template>
            </VariantSifterTableSettings>

            <div class="vks-v2g-table-block">
                <div class="vks-v2g-table-wrap">
                    <table
                        class="table table-sm research-data-table vks-v2g-data-table"
                        cellpadding="0"
                        cellspacing="0"
                    >
                        <thead>
                            <tr>
                                <th
                                    v-for="column in visibleTableColumns"
                                    :key="column"
                                    class="byor-tooltip sortable-th"
                                    :class="getColumnId(column)"
                                    @click="applySorting(column)"
                                >
                                    <span>{{ column }}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in pagedRows" :key="row.id">
                                <td
                                    v-for="column in visibleTableColumns"
                                    :key="`${row.id}-${column}`"
                                    :class="getColumnId(column)"
                                >
                                    {{ formatCell(row, column) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <b-pagination
                    v-if="perPageNumber !== '0' && perPageNumber !== 0"
                    v-model="currentPage"
                    class="pagination-sm justify-content-center vks-v2g-pagination"
                    :total-rows="displayRows.length"
                    :per-page="Number(perPageNumber)"
                ></b-pagination>
            </div>
        </template>
        <div v-else-if="emptyMessage" class="vks-v2g-table-empty">
            {{ emptyMessage }}
        </div>
    </div>
</template>

<script>
import VariantSifterTableSettings from "./VariantSifterTableSettings.vue";

const V2G_TABLE_COLUMNS = [
    "Tissue",
    "Biosample",
    "Gene",
    "Method",
    "Regulatory element",
    "Promoter",
];

export default {
    name: "VariantSifterV2gTable",
    components: {
        VariantSifterTableSettings,
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        utils: {
            type: Object,
            default: null,
        },
        showPromoter: {
            type: Boolean,
            default: true,
        },
        showTissueBiosample: {
            type: Boolean,
            default: true,
        },
        columns: {
            type: Array,
            default: null,
        },
        emptyMessage: {
            type: String,
            default: "No variant-to-gene links for the current tissue and filter selection.",
        },
    },
    data() {
        return {
            perPageNumber: "10",
            currentPage: 1,
            sortKey: "",
            sortDirection: "asc",
            visibleColumns: {},
        };
    },
    computed: {
        tableColumns() {
            if (Array.isArray(this.columns) && this.columns.length) {
                return this.columns.slice();
            }
            return V2G_TABLE_COLUMNS.filter((column) => {
                if (!this.showTissueBiosample && (column === "Tissue" || column === "Biosample")) {
                    return false;
                }
                if (!this.showPromoter && column === "Promoter") {
                    return false;
                }
                return true;
            });
        },
        defaultSortKey() {
            return this.tableColumns[0] || "";
        },
        visibleTableColumns() {
            return this.tableColumns.filter(
                (column) => this.visibleColumns[column] !== false
            );
        },
        sortedRows() {
            const sourceRows = this.rows || [];
            const key = this.sortKey;
            const ascending = this.sortDirection === "asc";
            if (!key) {
                return sourceRows;
            }

            const withValues = [];
            const withoutValues = [];
            sourceRows.forEach((row) => {
                const value = this.sortValue(row, key);
                if (value == null || value === "") {
                    withoutValues.push(row);
                } else {
                    withValues.push(row);
                }
            });

            const isNumeric = withValues.length
                ? typeof this.sortValue(withValues[0], key) === "number"
                : false;

            withValues.sort((a, b) => {
                const aVal = this.sortValue(a, key);
                const bVal = this.sortValue(b, key);
                if (aVal === bVal) {
                    return String(a.targetGene || "").localeCompare(String(b.targetGene || ""));
                }
                if (aVal == null) {
                    return 1;
                }
                if (bVal == null) {
                    return -1;
                }
                if (isNumeric) {
                    const cmp = Number(aVal) > Number(bVal) ? 1 : -1;
                    return ascending ? cmp : -cmp;
                }
                const cmp = String(aVal).localeCompare(String(bVal));
                return ascending ? cmp : -cmp;
            });

            return withValues.concat(withoutValues);
        },
        displayRows() {
            return this.sortedRows;
        },
        pagedRows() {
            const perPage = Number(this.perPageNumber);
            if (!perPage) {
                return this.displayRows;
            }
            const start = (this.currentPage - 1) * perPage;
            return this.displayRows.slice(start, start + perPage);
        },
        exportRows() {
            return this.displayRows.map((row) => {
                const out = {};
                this.visibleTableColumns.forEach((column) => {
                    out[column] = this.formatCell(row, column);
                });
                return out;
            });
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
            this.sortKey = this.defaultSortKey;
            this.sortDirection = "asc";
        },
        perPageNumber() {
            this.currentPage = 1;
        },
        tableColumns: {
            immediate: true,
            handler(columns) {
                (columns || []).forEach((column) => {
                    if (this.visibleColumns[column] === undefined) {
                        this.$set(this.visibleColumns, column, true);
                    }
                });
                if (!this.sortKey || !(columns || []).includes(this.sortKey)) {
                    this.sortKey = this.defaultSortKey;
                    this.sortDirection = "asc";
                }
            },
        },
    },
    methods: {
        getColumnId(label) {
            return label.replace(/\W/g, "").toLowerCase();
        },
        onPerPageUpdate(perPage) {
            this.perPageNumber = String(perPage);
        },
        onColumnVisibleUpdate({ column, visible }) {
            this.$set(this.visibleColumns, column, Boolean(visible));
        },
        applySorting(key) {
            if (this.sortKey === key) {
                this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
            } else {
                this.sortKey = key;
                this.sortDirection = "asc";
            }
            this.currentPage = 1;
        },
        sortValue(row, column) {
            switch (column) {
                case "Tissue":
                    return row.tissue || "";
                case "Biosample":
                    return row.biosample || "";
                case "Gene":
                    return row.targetGene || "";
                case "Method":
                    return row.method || "";
                case "Regulatory element":
                    return Number(row.start);
                case "Promoter":
                    return Number(row.targetGeneStart);
                default:
                    return row[column];
            }
        },
        formatCoord(value) {
            if (value == null || value === "") {
                return "";
            }
            return Number(value).toLocaleString();
        },
        formatRange(start, end) {
            const left = this.formatCoord(start);
            const right = this.formatCoord(end);
            if (!left && !right) {
                return "—";
            }
            if (!left || !right) {
                return left || right;
            }
            return `${left}–${right}`;
        },
        formatCell(row, column) {
            switch (column) {
                case "Tissue":
                    return row.tissue || "—";
                case "Biosample":
                    return row.biosample || "—";
                case "Gene":
                    return row.targetGene || "—";
                case "Method":
                    return row.method || "—";
                case "Regulatory element":
                    return this.formatRange(row.start, row.end);
                case "Promoter":
                    return this.formatRange(row.targetGeneStart, row.targetGeneEnd);
                default:
                    return row[column] ?? "—";
            }
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "vks_v2g");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "vks_v2g");
        },
    },
};
</script>

<style scoped>
.vks-v2g-table {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    width: 100%;
}

.vks-data-table-view-total {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-v2g-table-empty {
    padding: 12px 4px;
    color: var(--cfde-muted, #6b6b6b);
    font-size: 13px;
}

.vks-v2g-table-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 100%;
    min-height: 0;
}

.vks-v2g-table-wrap {
    width: 100%;
    max-width: 100%;
}

.vks-v2g-data-table {
    width: 100%;
    margin: 0;
}

.vks-v2g-pagination {
    flex: 0 0 auto;
    margin: 8px 0 0;
    width: auto;
}

.research-data-table >>> thead > tr > th.sortable-th {
    color: #007bff;
    white-space: nowrap;
    font-size: 13px;
    overflow: visible;
}

.research-data-table >>> thead {
    position: relative;
    z-index: 2;
}

.research-data-table >>> thead > tr > th.sortable-th:hover {
    color: #004bcf;
    cursor: pointer;
}

.research-data-table >>> td {
    border: none !important;
    border-left: solid 1px #eee !important;
    border-bottom: solid 1px #ddd !important;
    font-size: 13px;
    height: 27px;
    vertical-align: middle;
    white-space: nowrap;
}
</style>
