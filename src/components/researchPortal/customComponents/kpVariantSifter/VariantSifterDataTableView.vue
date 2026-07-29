<template>
    <div class="vks-data-table-view research-data-table-wrapper">
        <p v-if="note" class="vks-data-table-view-note">{{ note }}</p>
        <div v-if="!rows.length" class="vks-data-table-view-empty">{{ emptyMessage }}</div>
        <template v-else>
            <VariantSifterTableSettings
                :per-page="perPage"
                :columns="topRows"
                :visible-columns="visibleColumns"
                @update:perPage="onPerPageUpdate"
                @export-csv="exportCsv"
                @export-json="exportJson"
                @update:columnVisible="onColumnVisibleUpdate"
            >
                <template #before>
                    <div class="vks-data-table-view-total">
                        Total rows: {{ rows.length.toLocaleString() }}
                    </div>
                </template>
            </VariantSifterTableSettings>
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
                                v-for="column in visibleTopRows"
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
                        <template
                            v-for="(row, rowIndex) in pagedRows"
                        >
                            <tr :key="rowKey(row, rowIndex)">
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
                                    v-for="column in visibleTopRows"
                                    :key="`${rowKey(row, rowIndex)}-${column}`"
                                >
                                    <button
                                        v-if="isExpandableMappingColumn(column) && hasMappingGroup(row, column)"
                                        type="button"
                                        class="vks-mapping-ppa-button"
                                        :class="{ 'is-open': isMappingExpanded(row, column) }"
                                        :style="{ color: mappingColumnColor(column) }"
                                        @click.stop="toggleMappingExpand(row, column)"
                                    >
                                        {{ formatExpandableValue(row, column) }}
                                    </button>
                                    <span
                                        v-else
                                        v-html="formatCell(row, column)"
                                    ></span>
                                </td>
                            </tr>
                            <tr
                                v-if="expandedPanelsForRow(row).length"
                                :key="`${rowKey(row, rowIndex)}-details`"
                                class="vks-mapping-details-row"
                            >
                                <td :colspan="detailColspan">
                                    <div class="vks-mapping-details-stack">
                                        <VariantSifterMappingRowDetails
                                            v-for="panel in expandedPanelsForRow(row)"
                                            :key="panel.groupId"
                                            :details="panel.details"
                                            :group-id="panel.groupId"
                                            :title="panel.title"
                                            :utils="utils"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </template>
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
import { sortAssociationRowsByPValueAndVariantId } from "./variantSifterAssociationsTable.js";
import VariantSifterMappingRowDetails from "./VariantSifterMappingRowDetails.vue";
import VariantSifterTableSettings from "./VariantSifterTableSettings.vue";
import {
    getMappingDetailsForGroup,
    mappingDetailGroupIdsForColumn,
    mappingGroupColor,
    mappingGroupIdForColumn,
    mappingGroupLabel,
    VKS_ANNOTATION_OVERLAP_COLUMN,
    VKS_BIOSAMPLE_OVERLAP_COLUMN,
    VKS_CRED_SETS_COLUMN,
    VKS_V2G_COLUMN,
    VKS_S2G_COLUMN,
    hasMultipleCredSets,
} from "./variantSifterMappingData.js";

export default {
    name: "VariantSifterDataTableView",
    components: {
        VariantSifterMappingRowDetails,
        VariantSifterTableSettings,
    },
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
            sortKey: "P-Value",
            sortDirection: "asc",
            showStarredOnly: false,
            perPage: this.defaultPerPage,
            visibleColumns: {},
            /** `${variantKey}:::${groupId}` → true */
            expandedMappingKeys: {},
        };
    },
    computed: {
        starColumn() {
            return this.showStarColumn ? this.tableFormat["star column"] : null;
        },
        visibleTopRows() {
            return (this.topRows || []).filter(
                (column) => this.visibleColumns[column] !== false
            );
        },
        detailColspan() {
            return this.visibleTopRows.length + (this.showStarColumn ? 1 : 0);
        },
        exportRows() {
            return this.displayRows.map((row) => {
                const out = {};
                this.visibleTopRows.forEach((column) => {
                    out[column] = row[column];
                });
                return out;
            });
        },
        sortedRows() {
            if (!this.sortKey || this.sortKey === "P-Value") {
                return sortAssociationRowsByPValueAndVariantId(this.rows, {
                    ascending: this.sortKey
                        ? this.sortDirection === "asc"
                        : true,
                });
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
                    return String(a["Variant ID"] || a.varId || "").localeCompare(
                        String(b["Variant ID"] || b.varId || "")
                    );
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
            this.sortKey = "P-Value";
            this.sortDirection = "asc";
            this.expandedMappingKeys = {};
        },
        topRows: {
            immediate: true,
            handler(columns) {
                (columns || []).forEach((column) => {
                    if (this.visibleColumns[column] === undefined) {
                        this.$set(this.visibleColumns, column, true);
                    }
                });
            },
        },
        perPage() {
            this.currentPage = 1;
        },
    },
    methods: {
        onPerPageUpdate(perPage) {
            this.perPage = Number(perPage) || 0;
        },
        onColumnVisibleUpdate({ column, visible }) {
            this.$set(this.visibleColumns, column, Boolean(visible));
        },
        exportCsv() {
            if (!this.utils?.uiUtils?.saveByorCsv) {
                return;
            }
            this.utils.uiUtils.saveByorCsv(this.exportRows, "vks_variant_table");
        },
        exportJson() {
            if (!this.utils?.uiUtils?.saveJson) {
                return;
            }
            this.utils.uiUtils.saveJson(this.exportRows, "vks_variant_table");
        },
        rowKey(row, index) {
            return `${row["Variant ID"] || row.varId || "row"}-${index}`;
        },
        variantKey(row) {
            return String(row?.["Variant ID"] || row?.varId || "");
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
        mappingGroupIdForColumn(column) {
            return mappingGroupIdForColumn(column, this.tableFormat);
        },
        isExpandableMappingColumn(column) {
            const formatting = this.tableFormat?.["column formatting"]?.[column];
            return Boolean(
                formatting?.type?.includes("expandable mapping") ||
                    column === VKS_CRED_SETS_COLUMN ||
                    column === VKS_ANNOTATION_OVERLAP_COLUMN ||
                    column === VKS_BIOSAMPLE_OVERLAP_COLUMN ||
                    column === VKS_V2G_COLUMN ||
                    column === VKS_S2G_COLUMN
            );
        },
        hasMappingGroup(row, column) {
            const groupId = this.mappingGroupIdForColumn(column);
            return Boolean(
                groupId && getMappingDetailsForGroup(row, groupId).length
            );
        },
        mappingExpandKey(row, column) {
            const groupId = this.mappingGroupIdForColumn(column);
            return `${this.variantKey(row)}:::${groupId || column}`;
        },
        isMappingExpanded(row, column) {
            return Boolean(this.expandedMappingKeys[this.mappingExpandKey(row, column)]);
        },
        toggleMappingExpand(row, column) {
            const key = this.mappingExpandKey(row, column);
            this.$set(
                this.expandedMappingKeys,
                key,
                !this.expandedMappingKeys[key]
            );
        },
        expandedGroupIdsForRow(row) {
            const variantKey = this.variantKey(row);
            const prefix = `${variantKey}:::`;
            return Object.keys(this.expandedMappingKeys)
                .filter(
                    (key) =>
                        key.startsWith(prefix) && this.expandedMappingKeys[key]
                )
                .map((key) => key.slice(prefix.length))
                .filter(Boolean);
        },
        mappingTitleForGroup(groupId) {
            if (groupId === "credible-sets") {
                return "Mapped credible sets";
            }
            if (groupId === "global-enrichment") {
                return "Mapped tissue overlaps";
            }
            if (groupId === "biosamples") {
                return "Mapped biosample overlaps";
            }
            if (groupId === "variant-to-gene-links") {
                return "Mapped variant-to-gene links";
            }
            if (groupId === "snp2gene-links") {
                return "Mapped SNP-to-gene links";
            }
            return `Mapped ${mappingGroupLabel(groupId)} features`;
        },
        detailsForGroup(row, groupId) {
            const column =
                groupId === "credible-sets"
                    ? VKS_CRED_SETS_COLUMN
                    : groupId === "global-enrichment"
                      ? VKS_ANNOTATION_OVERLAP_COLUMN
                      : groupId === "biosamples"
                        ? VKS_BIOSAMPLE_OVERLAP_COLUMN
                        : groupId === "variant-to-gene-links"
                          ? VKS_V2G_COLUMN
                          : groupId === "snp2gene-links"
                            ? VKS_S2G_COLUMN
                            : null;
            const detailGroupIds = column
                ? mappingDetailGroupIdsForColumn(column, this.tableFormat)
                : [groupId];
            return getMappingDetailsForGroup(
                row,
                detailGroupIds.length ? detailGroupIds : groupId
            );
        },
        expandedPanelsForRow(row) {
            return this.expandedGroupIdsForRow(row).map((groupId) => ({
                groupId,
                title: this.mappingTitleForGroup(groupId),
                details: this.detailsForGroup(row, groupId),
            }));
        },
        mappingColumnColor(column) {
            return mappingGroupColor(this.mappingGroupIdForColumn(column));
        },
        formatExpandableValue(row, column) {
            const value = row[column];
            if (value == null || value === "") {
                return "";
            }
            const columnFormatting = this.tableFormat["column formatting"]?.[column];
            let display = "";
            if (
                columnFormatting?.type?.includes("scientific notation") &&
                this.utils?.Formatters?.BYORColumnFormatter
            ) {
                display = this.utils.Formatters.BYORColumnFormatter(
                    value,
                    column,
                    this.tableFormat,
                    null,
                    null,
                    row
                );
            } else if (typeof value === "number") {
                display = value.toExponential(2);
            } else {
                display = String(value);
            }
            if (
                column === VKS_CRED_SETS_COLUMN &&
                hasMultipleCredSets(row) &&
                display
            ) {
                return `${display}+`;
            }
            return display;
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
    margin: 0;
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

.vks-mapping-ppa-button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    margin: 0;
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
}

.vks-mapping-ppa-button.is-open {
    text-decoration: none;
}

.vks-mapping-details-row > td {
    padding: 0 !important;
    height: auto !important;
    background: transparent !important;
    border-top: 0 !important;
}

.vks-mapping-details-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
</style>
