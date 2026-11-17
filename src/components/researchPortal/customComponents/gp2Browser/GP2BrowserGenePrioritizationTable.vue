<template>
    <div class="gp2-gene-prioritization-table research-data-table-wrapper">
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
                        Total genes: {{ displayRows.length.toLocaleString() }}
                    </div>
                </template>
            </VariantSifterTableSettings>

            <div class="gp2-gene-prioritization-table-block">
                <div class="gp2-gene-prioritization-table-wrap">
                    <table
                        class="table table-sm research-data-table gp2-gene-prioritization-data-table"
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
                            <tr v-for="(row, rowIndex) in pagedRows" :key="rowKey(row, rowIndex)">
                                <td
                                    v-for="column in visibleTableColumns"
                                    :key="`${rowKey(row, rowIndex)}-${column}`"
                                    :class="getColumnId(column)"
                                >
                                    <button
                                        v-if="isNavigableColumn(column) && rowHasRegion(row)"
                                        type="button"
                                        class="gp2-gene-prioritization-link"
                                        :title="`Search this region: ${formatCell(row, column)}`"
                                        @click="$emit('navigate-region', row)"
                                    >
                                        {{ formatCell(row, column) }}
                                    </button>
                                    <template v-else>{{ formatCell(row, column) }}</template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <b-pagination
                    v-if="perPageNumber !== '0' && perPageNumber !== 0"
                    v-model="currentPage"
                    class="pagination-sm justify-content-center gp2-gene-prioritization-pagination"
                    :total-rows="displayRows.length"
                    :per-page="Number(perPageNumber)"
                ></b-pagination>
            </div>
        </template>
        <div v-else class="gp2-gene-prioritization-table-empty">
            No gene prioritization rows available.
        </div>
    </div>
</template>

<script>
import VariantSifterTableSettings from "../kpVariantSifter/VariantSifterTableSettings.vue";
import {
    gp2GenePrioritizationColumnLabels,
    gp2GenePrioritizationFormatCell,
    gp2GenePrioritizationRowRegion,
    gp2GenePrioritizationSortValue,
} from "./gp2BrowserGenePrioritizationApi.js";

const NAVIGABLE_COLUMNS = new Set(["Gene", "Locus"]);

export default {
    name: "GP2BrowserGenePrioritizationTable",
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
            sortKey: "Evidence Score",
            sortDirection: "desc",
            visibleColumns: {},
        };
    },
    computed: {
        tableColumns() {
            return gp2GenePrioritizationColumnLabels();
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
                const value = gp2GenePrioritizationSortValue(row, key);
                if (value == null || value === "") {
                    withoutValues.push(row);
                } else {
                    withValues.push(row);
                }
            });

            const isNumeric = withValues.length
                ? typeof gp2GenePrioritizationSortValue(withValues[0], key) === "number"
                : false;

            withValues.sort((a, b) => {
                const aVal = gp2GenePrioritizationSortValue(a, key);
                const bVal = gp2GenePrioritizationSortValue(b, key);
                if (aVal === bVal) {
                    return 0;
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
        rowKey(row, rowIndex) {
            return [row?.Gene, row?.Locus_ID, row?.dataset, rowIndex].join("|");
        },
        getColumnId(label) {
            return String(label || "").replace(/\W/g, "").toLowerCase();
        },
        isNavigableColumn(column) {
            return NAVIGABLE_COLUMNS.has(column);
        },
        rowHasRegion(row) {
            return Boolean(gp2GenePrioritizationRowRegion(row));
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
        formatCell(row, column) {
            return gp2GenePrioritizationFormatCell(row, column);
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "gp2_gene_prioritization");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "gp2_gene_prioritization");
        },
    },
};
</script>

<style scoped>
.gp2-gene-prioritization-table {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
}

.gp2-gene-prioritization-table >>> .vks-table-settings {
    margin-bottom: 4px;
}

.vks-data-table-view-total {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.gp2-gene-prioritization-table-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 100%;
    min-height: 0;
}

.gp2-gene-prioritization-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
}

.gp2-gene-prioritization-data-table th {
    white-space: normal !important;
    word-break: break-word;
    vertical-align: bottom;
}

.gp2-gene-prioritization-link {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: var(--cfde-blue, #2c5c97);
    text-decoration: underline;
    cursor: pointer;
}

.gp2-gene-prioritization-link:hover {
    color: #1b3f6b;
}

.gp2-gene-prioritization-table-empty {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-gene-prioritization-pagination {
    flex: 0 0 auto;
    margin: 8px 0 0;
    width: auto;
}
</style>
