<template>
    <div class="vks-ge-table research-data-table-wrapper">
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

            <div class="vks-ge-table-block">
                <div class="vks-ge-table-wrap">
                    <table
                        class="table table-sm research-data-table vks-ge-data-table"
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
                            <tr v-for="row in pagedRows" :key="row.tissue">
                                <td
                                    v-for="column in visibleTableColumns"
                                    :key="`${row.tissue}-${column}`"
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
                    class="pagination-sm justify-content-center vks-ge-pagination"
                    :total-rows="displayRows.length"
                    :per-page="Number(perPageNumber)"
                ></b-pagination>
            </div>
        </template>
        <div v-else class="vks-ge-table-empty">
            No enrichment statistics for the current annotation and tissue filters.
        </div>
    </div>
</template>

<script>
import VariantSifterTableSettings from "./VariantSifterTableSettings.vue";

const GE_TABLE_COLUMNS = ["Tissue", "P-value", "Fold"];

export default {
    name: "VariantSifterGlobalEnrichmentTable",
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
    },
    data() {
        return {
            perPageNumber: "10",
            currentPage: 1,
            sortKey: "P-value",
            sortDirection: "asc",
            visibleColumns: {},
        };
    },
    computed: {
        tableColumns() {
            return GE_TABLE_COLUMNS;
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
                    return String(a.tissue || "").localeCompare(String(b.tissue || ""));
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
            this.sortKey = "P-value";
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
                case "P-value":
                    return row.rawPValue != null ? Number(row.rawPValue) : null;
                case "Fold":
                    return row.fold != null ? Number(row.fold) : null;
                default:
                    return row[column];
            }
        },
        formatCell(row, column) {
            switch (column) {
                case "Tissue":
                    return row.tissue || "—";
                case "P-value":
                    return row.pValueLabel || "—";
                case "Fold":
                    return row.foldLabel || "—";
                default:
                    return row[column] ?? "—";
            }
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "vks_ge_enrichment");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "vks_ge_enrichment");
        },
    },
};
</script>

<style scoped>
.vks-ge-table {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
}

.vks-ge-table >>> .vks-table-settings {
    margin-bottom: 4px;
}

.vks-data-table-view-total {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-ge-table-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 100%;
    min-height: 0;
}

.vks-ge-table-wrap {
    width: 100%;
    max-width: 100%;
}

.vks-ge-table-empty {
    font-size: 0.85rem;
    color: #666666;
}

.vks-ge-pagination {
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
}
</style>
