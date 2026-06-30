<template>
    <div class="vks-assoc-drawer research-data-table-wrapper">
        <p v-if="metaLabel" class="vks-assoc-meta">{{ metaLabel }}</p>

        <div v-if="loading" class="vks-assoc-status">Loading associations…</div>
        <div v-else-if="error" class="vks-assoc-error" role="alert">
            {{ error }}
        </div>
        <div v-else-if="!rows.length" class="vks-assoc-status">
            No associations returned for this locus.
        </div>
        <template v-else>
            <VariantSifterAssociationsLdPlot
                :rows="filteredRows"
                :search-session="searchSession"
                :plot-overlays-state="plotOverlaysState"
                :utils="utils"
            />

            <VariantSifterAssociationsFilters
                :rows="rows"
                :filters-index="filtersIndex"
                @update:filtersIndex="$emit('update:filtersIndex', $event)"
            />

            <div class="table-total-rows">Total rows: {{ displayRows.length }}</div>

            <div class="table-ui-wrapper">
                <label>
                    Compare annotated regions:
                    <select v-model="filterTissueType" class="number-per-page">
                        <option value="or">Or</option>
                        <option value="and">And</option>
                    </select>
                </label>
                <label>
                    Rows per page:
                    <select v-model="perPageNumber" class="number-per-page">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="40">40</option>
                        <option value="100">100</option>
                        <option value="0">All</option>
                    </select>
                </label>
                <div
                    class="convert-2-csv btn-sm"
                    @click="exportCsv"
                >
                    Save as CSV
                </div>
                <div
                    class="convert-2-csv btn-sm"
                    @click="exportJson"
                >
                    Save as JSON
                </div>
                <div
                    class="convert-2-csv btn-sm"
                    @click="showHidePanel"
                >
                    show/hide columns
                </div>
                <div
                    v-if="showColumnsPanel"
                    id="vksShowHideColumnsBox"
                    class="vks-show-hide-columns-box"
                >
                    <div
                        class="show-hide-columns-box-close"
                        @click="showHidePanel"
                    >
                        <b-icon icon="x-circle-fill"></b-icon>
                    </div>
                    <h4 style="text-align: center">Show/hide columns</h4>
                    <div class="table-wrapper">
                        <table class="table table-sm">
                            <tbody>
                                <tr
                                    v-for="column in topRows"
                                    :key="column"
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            :id="getColumnId(column)"
                                            :checked="isColumnVisible(column)"
                                            @change="toggleColumn(column, $event)"
                                        />
                                        <span> {{ column }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="vks-assoc-table-wrap">
                <table
                    class="table table-sm research-data-table vks-associations-table"
                    cellpadding="0"
                    cellspacing="0"
                >
                    <thead>
                        <tr>
                            <th v-if="starColumn">
                                <b-icon
                                    :icon="showStarredOnly ? 'star-fill' : 'star'"
                                    style="color: #ffcc00; cursor: pointer"
                                    @click="toggleStarredOnly"
                                ></b-icon>
                            </th>
                            <th
                                v-for="column in visibleTopRows"
                                :key="column"
                                class="byor-tooltip sortable-th"
                                :class="getColumnId(column)"
                                @click="applySorting(column)"
                            >
                                <span>{{ column }}</span>
                                <span
                                    v-if="tableFormat['tool tips'][column]"
                                    class="tooltiptext"
                                >{{ tableFormat["tool tips"][column] }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(row, rowIndex) in pagedRows"
                            :key="row['Variant ID'] + '-' + rowIndex"
                        >
                            <td v-if="starColumn">
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
                                v-for="column in visibleTopRows"
                                :key="column"
                                :class="getColumnId(column)"
                                v-html="formatCell(row, column)"
                            ></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <b-pagination
                v-if="perPageNumber !== '0' && perPageNumber !== 0"
                v-model="currentPage"
                class="pagination-sm justify-content-center vks-assoc-pagination"
                :total-rows="displayRows.length"
                :per-page="Number(perPageNumber)"
            ></b-pagination>
        </template>
    </div>
</template>

<script>
import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";
import { applyAssociationsFilters } from "./variantSifterAssociationsFilters.js";
import VariantSifterAssociationsFilters from "./VariantSifterAssociationsFilters.vue";
import VariantSifterAssociationsLdPlot from "./VariantSifterAssociationsLdPlot.vue";

export default {
    name: "VariantSifterAssociationsDrawer",
    components: {
        VariantSifterAssociationsFilters,
        VariantSifterAssociationsLdPlot,
    },
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        filtersIndex: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: null,
        },
        ldLoading: {
            type: Boolean,
            default: false,
        },
        ldError: {
            type: String,
            default: null,
        },
        indexName: {
            type: String,
            default: null,
        },
        queryString: {
            type: String,
            default: null,
        },
        searchSession: {
            type: Object,
            default: null,
        },
        plotOverlaysState: {
            type: Object,
            default: () => ({
                ready: false,
                loading: false,
                error: null,
                recombData: null,
                refVariant: null,
            }),
        },
        utils: {
            type: Object,
            default: null,
        },
        starredVariantIds: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        const topRows = ASSOCIATIONS_TABLE_FORMAT["top rows"];
        const visibleColumns = {};
        topRows.forEach((column) => {
            visibleColumns[column] = true;
        });

        return {
            tableFormat: ASSOCIATIONS_TABLE_FORMAT,
            topRows,
            visibleColumns,
            showColumnsPanel: false,
            filterTissueType: "or",
            perPageNumber: "10",
            currentPage: 1,
            sortKey: null,
            sortDirection: "asc",
            showStarredOnly: false,
        };
    },
    computed: {
        filteredRows() {
            return applyAssociationsFilters(this.rows, this.filtersIndex);
        },
        starColumn() {
            return this.tableFormat["star column"];
        },
        visibleTopRows() {
            return this.topRows.filter((column) => this.visibleColumns[column]);
        },
        metaLabel() {
            if (!this.searchSession) {
                return "";
            }

            const parts = [this.searchSession.phenotype?.description];
            if (this.searchSession.ancestry) {
                parts.push(this.searchSession.ancestry);
            }
            if (this.searchSession.regionLabel) {
                parts.push(this.searchSession.regionLabel);
            }
            if (this.indexName) {
                parts.push(`(${this.indexName})`);
            }
            if (this.ldLoading) {
                parts.push("Loading LD scores…");
            } else if (this.ldError) {
                parts.push(this.ldError);
            }
            return parts.filter(Boolean).join(" · ");
        },
        sortedRows() {
            const sourceRows = this.filteredRows;

            if (!this.sortKey) {
                return [...sourceRows];
            }

            const key = this.sortKey;
            const ascending = this.sortDirection === "asc";
            const withValues = [];
            const withoutValues = [];

            sourceRows.forEach((row) => {
                const value = row[key];
                if (value == null || value === "") {
                    withoutValues.push(row);
                } else {
                    withValues.push(row);
                }
            });

            const isNumeric = withValues.length
                ? typeof withValues[0][key] === "number"
                : false;

            if (this.utils?.sortUtils?.sortEGLTableData) {
                return this.utils.sortUtils
                    .sortEGLTableData(withValues, key, isNumeric, ascending)
                    .concat(withoutValues);
            }

            withValues.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal === bVal) {
                    return 0;
                }
                if (aVal == null) {
                    return 1;
                }
                if (bVal == null) {
                    return -1;
                }
                const cmp = aVal > bVal ? 1 : -1;
                return ascending ? cmp : -cmp;
            });

            return withValues.concat(withoutValues);
        },
        displayRows() {
            if (!this.showStarredOnly || !this.starColumn) {
                return this.sortedRows;
            }

            return this.sortedRows.filter((row) =>
                this.starredVariantIds.includes(row[this.starColumn])
            );
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
                this.topRows.forEach((column) => {
                    out[column] = row[column];
                });
                return out;
            });
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
            this.sortKey = null;
            this.sortDirection = "asc";
        },
        queryString() {
            this.currentPage = 1;
        },
        perPageNumber() {
            this.currentPage = 1;
        },
        showStarredOnly() {
            this.currentPage = 1;
        },
    },
    methods: {
        getColumnId(label) {
            return label.replace(/\W/g, "").toLowerCase();
        },
        isColumnVisible(column) {
            return this.visibleColumns[column] !== false;
        },
        toggleColumn(column, event) {
            this.$set(this.visibleColumns, column, event.target.checked);
        },
        showHidePanel() {
            this.showColumnsPanel = !this.showColumnsPanel;
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
            return this.starredVariantIds.includes(row[this.starColumn]);
        },
        toggleStar(row) {
            this.$emit("toggle-star-variant", row);
        },
        toggleStarredOnly() {
            this.showStarredOnly = !this.showStarredOnly;
        },
        formatCell(row, column) {
            const value = row[column];
            if (value == null || value === "") {
                return "";
            }

            const columnFormatting = this.tableFormat["column formatting"]?.[column];
            if (columnFormatting?.type?.includes("link")) {
                const linkValue =
                    column === "Variant ID" && row.varId ? row.varId : value;
                const href = `${columnFormatting["link to"]}${encodeURIComponent(linkValue)}`;
                const target =
                    columnFormatting["new tab"] === "true" ? ' target="_blank"' : "";
                return `<a href="${href}"${target}>${value}</a>`;
            }

            if (columnFormatting && this.utils?.Formatters?.BYORColumnFormatter) {
                return this.utils.Formatters.BYORColumnFormatter(
                    value,
                    column,
                    this.tableFormat,
                    null,
                    null,
                    row
                );
            }

            return value;
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "vks_associations");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "vks_associations");
        },
    },
};
</script>

<style scoped>
.vks-assoc-drawer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
}

.vks-assoc-meta {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assoc-status {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-assoc-error {
    font-size: 13px;
    color: #b42318;
}

.table-total-rows {
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.table-ui-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    font-size: 12px;
    position: relative;
}

.table-ui-wrapper label {
    margin: 0;
    white-space: nowrap;
}

.number-per-page {
    margin-left: 4px;
    font-size: 12px;
}

.convert-2-csv {
    cursor: pointer;
    color: #007bff;
    white-space: nowrap;
}

.convert-2-csv:hover {
    color: #004bcf;
    text-decoration: underline;
}

.vks-show-hide-columns-box {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    min-width: 220px;
}

.show-hide-columns-box-close {
    position: absolute;
    top: 6px;
    right: 8px;
    cursor: pointer;
    color: #888;
}

.vks-assoc-table-wrap {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
}

.vks-assoc-pagination {
    flex: 0 0 auto;
    margin: 4px 0 0;
}

.research-data-table >>> thead > tr > th.sortable-th {
    color: #007bff;
    white-space: nowrap;
    font-size: 12px;
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
    font-size: 12px;
    height: 27px;
    vertical-align: middle;
}

.research-data-table >>> td a {
    color: #007bff;
}

.research-data-table >>> td a:hover {
    color: #004bcf;
}

.byor-tooltip {
    position: relative;
    overflow: visible;
}

.byor-tooltip .tooltiptext {
    visibility: hidden;
    width: 220px;
    background-color: #333;
    color: #fff;
    text-align: left;
    border-radius: 4px;
    padding: 8px 10px;
    position: absolute;
    z-index: 100;
    top: calc(100% + 4px);
    left: 0;
    bottom: auto;
    margin-left: 0;
    font-size: 11px;
    font-weight: 400;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.byor-tooltip:hover .tooltiptext {
    visibility: visible;
}
</style>
