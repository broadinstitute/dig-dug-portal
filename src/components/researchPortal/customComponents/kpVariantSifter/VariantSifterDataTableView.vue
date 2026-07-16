<template>
    <div class="vks-data-table-view research-data-table-wrapper">
        <p v-if="note" class="vks-data-table-view-note">{{ note }}</p>
        <div v-if="!rows.length" class="vks-data-table-view-empty">{{ emptyMessage }}</div>
        <template v-else>
            <div class="vks-data-table-view-total">
                Total rows: {{ rows.length.toLocaleString() }}
            </div>
            <div class="vks-data-table-view-wrap">
                <table
                    class="table table-sm research-data-table"
                    cellpadding="0"
                    cellspacing="0"
                >
                    <thead>
                        <tr>
                            <th v-if="showStarColumn">
                                <b-icon
                                    :icon="showStarredOnly ? 'star-fill' : 'star'"
                                    style="color: #ffcc00; cursor: pointer"
                                    @click="showStarredOnly = !showStarredOnly"
                                ></b-icon>
                            </th>
                            <th
                                v-for="column in topRows"
                                :key="column"
                                class="byor-tooltip sortable-th"
                                @click="applySorting(column)"
                            >
                                <span>{{ column }}</span>
                                <span
                                    v-if="tableFormat['tool tips']?.[column]"
                                    class="tooltiptext"
                                >{{ tableFormat["tool tips"][column] }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(row, rowIndex) in pagedRows"
                            :key="rowKey(row, rowIndex)"
                        >
                            <td v-if="showStarColumn">
                                <b-icon
                                    :icon="isStarred(row) ? 'star-fill' : 'star'"
                                    :style="{
                                        color: isStarred(row) ? '#ffcc00' : '#aaaaaa',
                                        cursor: 'pointer',
                                    }"
                                    @click="$emit('toggle-star-variant', row)"
                                ></b-icon>
                            </td>
                            <td
                                v-for="column in topRows"
                                :key="column"
                                v-html="formatCell(row, column)"
                            ></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <b-pagination
                v-if="perPage > 0"
                v-model="currentPage"
                class="pagination-sm justify-content-center vks-data-table-pagination"
                :total-rows="displayRows.length"
                :per-page="perPage"
            ></b-pagination>
        </template>
    </div>
</template>

<script>
import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";

export default {
    name: "VariantSifterDataTableView",
    props: {
        rows: {
            type: Array,
            default: () => [],
        },
        topRows: {
            type: Array,
            default: () => [],
        },
        tableFormat: {
            type: Object,
            default: () => ASSOCIATIONS_TABLE_FORMAT,
        },
        utils: {
            type: Object,
            default: null,
        },
        starredVariantIds: {
            type: Array,
            default: () => [],
        },
        showStarColumn: {
            type: Boolean,
            default: false,
        },
        note: {
            type: String,
            default: null,
        },
        emptyMessage: {
            type: String,
            default: "No rows to display.",
        },
        defaultPerPage: {
            type: Number,
            default: 10,
        },
    },
    data() {
        return {
            currentPage: 1,
            sortKey: null,
            sortDirection: "asc",
            showStarredOnly: false,
            perPage: this.defaultPerPage,
        };
    },
    computed: {
        starColumn() {
            return this.showStarColumn ? this.tableFormat["star column"] : null;
        },
        sortedRows() {
            if (!this.sortKey) {
                return [...this.rows];
            }

            const key = this.sortKey;
            const ascending = this.sortDirection === "asc";
            const withValues = [];
            const withoutValues = [];

            this.rows.forEach((row) => {
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
            if (!this.perPage) {
                return this.displayRows;
            }
            const start = (this.currentPage - 1) * this.perPage;
            return this.displayRows.slice(start, start + this.perPage);
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
            this.sortKey = null;
            this.sortDirection = "asc";
        },
    },
    methods: {
        rowKey(row, index) {
            return `${row["Variant ID"] || row.varId || "row"}-${index}`;
        },
        isStarred(row) {
            return this.starredVariantIds.includes(row[this.starColumn]);
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
    },
};
</script>

<style scoped>
.vks-data-table-view-note {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-data-table-view-empty {
    padding: 16px 0;
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-data-table-view-total {
    float: none;
    clear: both;
    display: block;
    margin: 0 0 8px;
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.vks-data-table-view-wrap {
    clear: both;
    overflow-x: auto;
}

.vks-data-table-pagination {
    margin-top: 12px;
}
</style>
