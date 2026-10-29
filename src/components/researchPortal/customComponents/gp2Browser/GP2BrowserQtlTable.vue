<template>
    <div class="gp2-qtl-table research-data-table-wrapper">
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

            <div class="gp2-qtl-table-block">
                <div class="gp2-qtl-table-wrap">
                    <table
                        class="table table-sm research-data-table gp2-qtl-data-table"
                        cellpadding="0"
                        cellspacing="0"
                    >
                        <thead>
                            <tr>
                                <th>
                                    <b-icon
                                        :icon="showStarredOnly ? 'star-fill' : 'star'"
                                        style="color: #ffcc00; cursor: pointer"
                                        @click="toggleStarredOnly"
                                    ></b-icon>
                                </th>
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
                            <tr
                                v-for="(row, rowIndex) in pagedRows"
                                :key="rowKey(row, rowIndex)"
                            >
                                <td>
                                    <b-icon
                                        :icon="isStarred(row) ? 'star-fill' : 'star'"
                                        :style="{
                                            color: isStarred(row) ? '#ffcc00' : '#aaaaaa',
                                            cursor: 'pointer',
                                        }"
                                        @click="toggleStar(row)"
                                    ></b-icon>
                                </td>
                                <td
                                    v-for="column in visibleTableColumns"
                                    :key="`${rowKey(row, rowIndex)}-${column}`"
                                    :class="getColumnId(column)"
                                >
                                    <span
                                        v-if="isDirectionalColumn(column)"
                                        class="gp2-qtl-effect"
                                        :class="effectClass(directionValue(row))"
                                    >
                                        <span
                                            v-if="column === 'Beta' && effectMark(directionValue(row))"
                                            class="gp2-qtl-effect-mark"
                                            aria-hidden="true"
                                        >{{ effectMark(directionValue(row)) }}</span>
                                        {{ formatCell(row, column) }}
                                    </span>
                                    <template v-else>{{ formatCell(row, column) }}</template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <b-pagination
                    v-if="perPageNumber !== '0' && perPageNumber !== 0"
                    v-model="currentPage"
                    class="pagination-sm justify-content-center gp2-qtl-pagination"
                    :total-rows="displayRows.length"
                    :per-page="Number(perPageNumber)"
                ></b-pagination>
            </div>
        </template>
        <div v-else class="gp2-qtl-table-empty">
            No QTL rows match the current type, tissue, and p-value filters.
        </div>
    </div>
</template>

<script>
import VariantSifterTableSettings from "../kpVariantSifter/VariantSifterTableSettings.vue";
import {
    GP2_QTL_TABLE_COLUMNS,
    qtlVariantLabel,
} from "./gp2BrowserQtlApi.js";

const DIRECTIONAL_COLUMNS = new Set(["Beta", "Var Beta"]);

export default {
    name: "GP2BrowserQtlTable",
    components: {
        VariantSifterTableSettings,
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        starredVariantIds: {
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
            showStarredOnly: false,
        };
    },
    computed: {
        tableColumns() {
            return GP2_QTL_TABLE_COLUMNS;
        },
        visibleTableColumns() {
            return this.tableColumns.filter(
                (column) => this.visibleColumns[column] !== false
            );
        },
        starredFilteredRows() {
            if (!this.showStarredOnly) {
                return this.rows || [];
            }
            return (this.rows || []).filter((row) =>
                this.starredVariantIds.includes(qtlVariantLabel(row))
            );
        },
        sortedRows() {
            const sourceRows = this.starredFilteredRows;
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
                    return qtlVariantLabel(a).localeCompare(qtlVariantLabel(b));
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
        showStarredOnly() {
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
            return [
                row?.varId || qtlVariantLabel(row),
                row?.gene,
                row?.dataset,
                row?.ancestry,
                rowIndex,
            ].join("|");
        },
        getColumnId(label) {
            return String(label || "").replace(/\W/g, "").toLowerCase();
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
        isStarred(row) {
            return this.starredVariantIds.includes(qtlVariantLabel(row));
        },
        toggleStar(row) {
            this.$emit("toggle-star-variant", { ...row, "Variant ID": qtlVariantLabel(row) });
        },
        toggleStarredOnly() {
            this.showStarredOnly = !this.showStarredOnly;
        },
        isDirectionalColumn(column) {
            return DIRECTIONAL_COLUMNS.has(column);
        },
        directionValue(row) {
            return row?.beta;
        },
        effectClass(value) {
            const number = Number(value);
            if (!Number.isFinite(number) || number === 0) {
                return null;
            }
            return number < 0 ? "is-negative" : "is-positive";
        },
        effectMark(value) {
            const number = Number(value);
            if (!Number.isFinite(number) || number === 0) {
                return "";
            }
            return number < 0 ? "▼" : "▲";
        },
        sortValue(row, column) {
            switch (column) {
                case "Variant":
                    return qtlVariantLabel(row);
                case "P-value":
                    return this.finiteNumber(row?.pValue);
                case "Beta":
                    return this.finiteNumber(row?.beta);
                case "Var Beta":
                    return this.finiteNumber(row?.varBeta);
                case "Std ERR":
                    return this.finiteNumber(row?.stdErr);
                case "EAF":
                    return this.finiteNumber(row?.eaf);
                case "MAF":
                    return this.finiteNumber(row?.maf);
                case "Gene":
                    return row?.gene || "";
                case "Tissue":
                    return row?.region || "";
                case "Ancestry":
                    return row?.ancestry || "";
                case "Dataset":
                    return row?.dataset || "";
                default:
                    return "";
            }
        },
        finiteNumber(value) {
            const number = Number(value);
            return Number.isFinite(number) ? number : null;
        },
        formatPValue(value) {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                return "—";
            }
            if (number !== 0 && Math.abs(number) < 1e-5) {
                return number.toExponential(2);
            }
            const trimmed = (number.toFixed(7) * 1).toString();
            return trimmed;
        },
        formatNumber(value, digits = 4) {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                return "—";
            }
            if (number !== 0 && Math.abs(number) < 1e-4) {
                return number.toExponential(2);
            }
            return number.toFixed(digits);
        },
        formatCell(row, column) {
            switch (column) {
                case "Variant":
                    return qtlVariantLabel(row) || "—";
                case "P-value":
                    return this.formatPValue(row?.pValue);
                case "Beta":
                    return this.formatNumber(row?.beta);
                case "Var Beta":
                    return this.formatNumber(row?.varBeta);
                case "Std ERR":
                    return this.formatNumber(row?.stdErr);
                case "EAF":
                    return this.formatNumber(row?.eaf);
                case "MAF":
                    return this.formatNumber(row?.maf);
                case "Gene":
                    return row?.gene || "—";
                case "Tissue":
                    return row?.region || "—";
                case "Ancestry":
                    return row?.ancestry || "—";
                case "Dataset":
                    return row?.dataset || "—";
                default:
                    return "—";
            }
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "gp2_qtl_associations");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "gp2_qtl_associations");
        },
    },
};
</script>

<style scoped>
.gp2-qtl-table {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
}

.gp2-qtl-table >>> .vks-table-settings {
    margin-bottom: 4px;
}

.vks-data-table-view-total {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.gp2-qtl-table-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 100%;
    min-height: 0;
}

.gp2-qtl-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
}

.gp2-qtl-table-empty {
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-qtl-pagination {
    flex: 0 0 auto;
    margin: 8px 0 0;
    width: auto;
}

.gp2-qtl-effect {
    white-space: nowrap;
}

.gp2-qtl-effect-mark {
    margin-right: 3px;
}

.gp2-qtl-effect.is-positive {
    color: #048845;
}

.gp2-qtl-effect.is-negative {
    color: #ee3124;
}
</style>
