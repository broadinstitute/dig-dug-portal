<template>
    <div class="vks-assoc-drawer research-data-table-wrapper">
        <p v-if="drawerStatusLabel" class="vks-assoc-meta">{{ drawerStatusLabel }}</p>

        <VariantSifterAncestryBubbles
            :bubbles="ancestryBubbles"
            :primary-ancestry="primaryAncestry"
            :selected-ancestries="selectedAncestries"
            :series-loading="ancestrySeriesLoading"
            :loading="ancestryAvailabilityLoading"
            :error="ancestryAvailabilityError"
            @toggle-ancestry="$emit('toggle-ancestry', $event)"
        />

        <div v-if="loading && !hideLoadingStatus" class="vks-assoc-status">Loading associations…</div>
        <div v-else-if="error" class="vks-assoc-error" role="alert">
            {{ error }}
        </div>
        <div v-else-if="!rows.length" class="vks-assoc-status">
            No associations returned for this locus.
        </div>
        <template v-else>
            <VariantSifterAssociationsLdPlot
                :rows="filteredRows"
                :primary-ancestry="primaryAncestry"
                :selected-ancestries="selectedAncestries"
                :search-session="searchSession"
                :plot-overlays-state="plotOverlaysState"
                :plot-markers="plotMarkers"
                :utils="utils"
                @toggle-star-variant="$emit('toggle-star-variant', $event)"
                @set-reference-variant="$emit('set-reference-variant', $event)"
            />

            <VariantSifterAssociationsFilters
                :rows="rows"
                :filters-index="filtersIndex"
                @update:filtersIndex="$emit('update:filtersIndex', $event)"
            />

            <VariantSifterMappingBar
                :categories="mappingCategories"
                :selected-category-ids="selectedCategoryIds"
                :mapping-mode="mappingMode"
                :workspace-filter-active="Boolean(workspaceMappingFilter?.active)"
                :workspace-filter-row-count="workspaceMappingFilter?.rowCount || 0"
                @update:selectedCategoryIds="onSelectedCategoryIdsUpdate"
                @update:mappingMode="onMappingModeUpdate"
                @update:workspaceFilterActive="$emit('update:workspaceFilterActive', $event)"
                @remove-category="$emit('remove-mapping-category', $event)"
            />

            <VariantSifterTableSettings
                :per-page="Number(perPageNumber)"
                :columns="mappedTopRows"
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
                                    v-if="activeTableFormat['tool tips']?.[column]"
                                    class="tooltiptext"
                                >{{ activeTableFormat["tool tips"][column] }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(row, rowIndex) in pagedRows">
                            <tr :key="row['Variant ID'] + '-' + rowIndex">
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
                                    :key="`${row['Variant ID']}-${rowIndex}-${column}`"
                                    :class="getColumnId(column)"
                                >
                                    <button
                                        v-if="
                                            isExpandableMappingColumn(column) &&
                                                hasMappingGroup(row, column)
                                        "
                                        type="button"
                                        class="vks-mapping-ppa-button"
                                        :class="{
                                            'is-open': isMappingExpanded(row, column),
                                        }"
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
                                :key="`${row['Variant ID']}-${rowIndex}-details`"
                                class="vks-mapping-details-row"
                            >
                                <td :colspan="mappingDetailColspan">
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
import { sortAssociationRowsByPValueAndVariantId } from "./variantSifterAssociationsTable.js";
import { applyAssociationsFilters } from "./variantSifterAssociationsFilters.js";
import {
    applyWorkspaceMappingToAssociationRows,
    buildMappedVariantDataTableView,
    collectMappingCategories,
    getMappingDetailsForGroup,
    mappingDetailGroupIdsForColumn,
    mappingGroupColor,
    mappingGroupIdForColumn,
    mappingGroupLabel,
    normalizeMappingMode,
    normalizeMappingState,
    VKS_ANNOTATION_OVERLAP_COLUMN,
    VKS_BIOSAMPLE_OVERLAP_COLUMN,
    VKS_CRED_SETS_COLUMN,
    VKS_V2G_COLUMN,
    VKS_S2G_COLUMN,
    hasMultipleCredSets,
} from "./variantSifterMappingData.js";
import VariantSifterAssociationsFilters from "./VariantSifterAssociationsFilters.vue";
import VariantSifterAssociationsLdPlot from "./VariantSifterAssociationsLdPlot.vue";
import VariantSifterAncestryBubbles from "./VariantSifterAncestryBubbles.vue";
import VariantSifterMappingBar from "./VariantSifterMappingBar.vue";
import VariantSifterMappingRowDetails from "./VariantSifterMappingRowDetails.vue";
import VariantSifterTableSettings from "./VariantSifterTableSettings.vue";

export default {
    name: "VariantSifterAssociationsDrawer",
    components: {
        VariantSifterAssociationsFilters,
        VariantSifterAssociationsLdPlot,
        VariantSifterAncestryBubbles,
        VariantSifterMappingBar,
        VariantSifterMappingRowDetails,
        VariantSifterTableSettings,
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
        hideLoadingStatus: {
            type: Boolean,
            default: false,
        },
        error: {
            type: String,
            default: null,
        },
        ancestryBubbles: {
            type: Array,
            default: () => [],
        },
        primaryAncestry: {
            type: String,
            default: "Mixed",
        },
        selectedAncestries: {
            type: Array,
            default: () => [],
        },
        ancestrySeriesLoading: {
            type: Object,
            default: () => ({}),
        },
        ancestryAvailabilityLoading: {
            type: Boolean,
            default: false,
        },
        ancestryAvailabilityError: {
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
        plotMarkers: {
            type: Object,
            default: () => ({
                starredVariants: [],
                positionMarkers: [],
            }),
        },
        starredVariantIds: {
            type: Array,
            default: () => [],
        },
        credibleSetsState: {
            type: Object,
            default: null,
        },
        globalEnrichmentState: {
            type: Object,
            default: null,
        },
        v2gState: {
            type: Object,
            default: null,
        },
        s2gState: {
            type: Object,
            default: null,
        },
        mappingState: {
            type: Object,
            default: () => ({
                selectedCategoryIds: [],
                mappingMode: "or",
            }),
        },
        workspaceMappingFilter: {
            type: Object,
            default: null,
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
            perPageNumber: "10",
            currentPage: 1,
            sortKey: "P-Value",
            sortDirection: "asc",
            showStarredOnly: false,
            expandedMappingKeys: {},
        };
    },
    computed: {
        selectedCategoryIds() {
            return normalizeMappingState(this.mappingState).selectedCategoryIds;
        },
        mappingMode() {
            return normalizeMappingState(this.mappingState).mappingMode;
        },
        mappingCategories() {
            return collectMappingCategories({
                credibleSetsState: this.credibleSetsState,
                globalEnrichmentState: this.globalEnrichmentState,
                v2gState: this.v2gState,
                s2gState: this.s2gState,
            });
        },
        columnFilteredRows() {
            return applyAssociationsFilters(this.rows, this.filtersIndex);
        },
        filteredRows() {
            // LD plot follows workspace mapping filter when applied.
            return applyWorkspaceMappingToAssociationRows(
                this.columnFilteredRows,
                this.workspaceMappingFilter
            );
        },
        tableRows() {
            return this.mappedTableView.rows;
        },
        mappedTableView() {
            return buildMappedVariantDataTableView(this.columnFilteredRows, {
                mappingCategories: this.mappingCategories,
                selectedCategoryIds: this.selectedCategoryIds,
                mappingMode: this.mappingMode,
            });
        },
        mappedTopRows() {
            return this.mappedTableView.topRows || this.topRows;
        },
        activeTableFormat() {
            return this.mappedTableView.tableFormat || this.tableFormat;
        },
        starColumn() {
            return this.activeTableFormat["star column"];
        },
        visibleTopRows() {
            return this.mappedTopRows.filter(
                (column) => this.visibleColumns[column] !== false
            );
        },
        mappingDetailColspan() {
            return this.visibleTopRows.length + (this.starColumn ? 1 : 0);
        },
        mappingCategoryKey() {
            return this.mappingCategories.map((category) => category.id).join("|");
        },
        drawerStatusLabel() {
            const parts = [];
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
            const sourceRows = this.tableRows;

            if (!this.sortKey || this.sortKey === "P-Value") {
                return sortAssociationRowsByPValueAndVariantId(sourceRows, {
                    ascending: this.sortKey
                        ? this.sortDirection === "asc"
                        : true,
                });
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
                    const byVariant = String(
                        a["Variant ID"] || a.varId || ""
                    ).localeCompare(String(b["Variant ID"] || b.varId || ""));
                    if (byVariant !== 0) {
                        return byVariant;
                    }
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
                this.mappedTopRows.forEach((column) => {
                    out[column] = row[column];
                });
                return out;
            });
        },
    },
    watch: {
        rows() {
            this.currentPage = 1;
            this.sortKey = "P-Value";
            this.sortDirection = "asc";
            this.expandedMappingKeys = {};
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
        selectedCategoryIds() {
            this.currentPage = 1;
        },
        mappingMode() {
            this.currentPage = 1;
        },
        mappingCategoryKey() {
            this.pruneSelectedCategories();
            this.ensureMappedColumnsVisible();
        },
        mappedTopRows: {
            immediate: true,
            handler() {
                this.ensureMappedColumnsVisible();
            },
        },
    },
    methods: {
        getColumnId(label) {
            return label.replace(/\W/g, "").toLowerCase();
        },
        isColumnVisible(column) {
            return this.visibleColumns[column] !== false;
        },
        onColumnVisibleUpdate({ column, visible }) {
            this.$set(this.visibleColumns, column, Boolean(visible));
        },
        onPerPageUpdate(perPage) {
            this.perPageNumber = String(perPage);
        },
        emitMappingState(patch = {}) {
            this.$emit(
                "update:mappingState",
                normalizeMappingState({
                    selectedCategoryIds: this.selectedCategoryIds,
                    mappingMode: this.mappingMode,
                    ...patch,
                })
            );
        },
        onSelectedCategoryIdsUpdate(selectedCategoryIds) {
            this.emitMappingState({ selectedCategoryIds });
        },
        onMappingModeUpdate(mappingMode) {
            this.emitMappingState({
                mappingMode: normalizeMappingMode(mappingMode),
            });
        },
        pruneSelectedCategories() {
            const availableIds = new Set(
                this.mappingCategories.map((category) => category.id)
            );
            const next = (this.selectedCategoryIds || []).filter((id) =>
                availableIds.has(id)
            );
            if (
                next.length === this.selectedCategoryIds.length &&
                next.every((id, index) => id === this.selectedCategoryIds[index])
            ) {
                return;
            }
            this.emitMappingState({ selectedCategoryIds: next });
        },
        ensureMappedColumnsVisible() {
            (this.mappedTopRows || []).forEach((column) => {
                if (this.visibleColumns[column] === undefined) {
                    this.$set(this.visibleColumns, column, true);
                }
            });
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

            const format = this.activeTableFormat;
            const columnFormatting = format["column formatting"]?.[column];
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
                    format,
                    null,
                    null,
                    row
                );
            }

            return value;
        },
        variantKey(row) {
            return String(row?.["Variant ID"] || row?.varId || "");
        },
        mappingGroupIdForColumn(column) {
            return mappingGroupIdForColumn(column, this.activeTableFormat);
        },
        isExpandableMappingColumn(column) {
            const formatting =
                this.activeTableFormat?.["column formatting"]?.[column];
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
                ? mappingDetailGroupIdsForColumn(column, this.activeTableFormat)
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
            const format = this.activeTableFormat;
            const columnFormatting = format["column formatting"]?.[column];
            let display = "";
            if (
                columnFormatting?.type?.includes("scientific notation") &&
                this.utils?.Formatters?.BYORColumnFormatter
            ) {
                display = this.utils.Formatters.BYORColumnFormatter(
                    value,
                    column,
                    format,
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
    font-size: 13px;
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

.vks-data-table-view-total {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
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
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.byor-tooltip:hover .tooltiptext {
    visibility: visible;
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
