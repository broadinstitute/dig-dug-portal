<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>
        <div class="pkb-body">
            <div class="donors-page">
                <div v-html="$parent.info"></div>
                <div class="dataset-panel">
                    <div v-if="$parent.isDatasetLoading" class="dataset-status">
                        Loading donor dataset...
                    </div>
                    <div v-else-if="$parent.datasetError" class="dataset-status dataset-status-error">
                        {{ $parent.datasetError }}
                    </div>
                    <div v-else-if="hasRows" class="dataset-layout">
                        <aside class="filters-panel">
                            <div class="filters-panel-header-row">
                                <div class="filters-panel-header">Filters</div>
                                <button
                                    v-if="activeFilterPills.length"
                                    class="filters-clear-button"
                                    type="button"
                                    @click="clearAllFilters"
                                >
                                    Clear filters
                                </button>
                            </div>

                            <div v-if="hasAvailableFilters" class="filters-panel-controls">
                                <input
                                    v-model.trim="filterSearch"
                                    class="filters-search-input"
                                    type="search"
                                    placeholder="Search filters"
                                >
                                <select v-model="filterType" class="filters-type-select">
                                    <option value="all">All filters</option>
                                    <option value="numeric">Numerical filters</option>
                                    <option value="categorical">Categorical filters</option>
                                </select>
                            </div>

                            <div v-if="activeFilterPills.length" class="active-filter-pills active-filter-pills-sidebar">
                                <button
                                    v-for="pill in activeFilterPills"
                                    :key="pill.key"
                                    class="active-filter-pill"
                                    type="button"
                                    @click="scrollToFilter(pill)"
                                >
                                    <span class="active-filter-pill-label">{{ pill.label }}</span>
                                    <span
                                        class="active-filter-pill-close"
                                        @click.stop="removeFilter(pill)"
                                    >
                                        x
                                    </span>
                                </button>
                            </div>

                            <div v-if="hasVisibleFilters" class="filters-panel-body">
                                <numeric-range-filter
                                    v-for="column in visibleNumericFilterColumns"
                                    :key="`numeric-${column.name}`"
                                    :ref="getNumericFilterRef(column.name)"
                                    v-model="numericFilters[column.name]"
                                    :column-name="column.name"
                                    :display-label="getColumnLabel(column.name)"
                                    :values="numericFilterData[column.name] ? numericFilterData[column.name].values : []"
                                    :total-row-count="totalRows"
                                ></numeric-range-filter>
                                <categorical-filter
                                    v-for="column in visibleCategoricalFilterColumns"
                                    :key="`categorical-${column.name}`"
                                    :ref="getCategoricalFilterRef(column.name)"
                                    v-model="categoricalFilters[column.name]"
                                    :column-name="column.name"
                                    :display-label="getColumnLabel(column.name)"
                                    :options="categoricalFilterData[column.name] ? categoricalFilterData[column.name].options : []"
                                    :total-row-count="totalRows"
                                ></categorical-filter>
                            </div>
                            <div v-else-if="hasAvailableFilters" class="dataset-status">
                                No matching filters.
                            </div>
                            <div v-else class="dataset-status">
                                No filters available.
                            </div>
                        </aside>

                        <div class="dataset-table-wrap">
                            <div class="dataset-content-tabs">
                                <div
                                    ref="contentTabList"
                                    class="dataset-content-tab-list"
                                    role="tablist"
                                    aria-label="Donor content tabs"
                                >
                                    <button
                                        v-if="donorAvailabilityPlotData.length"
                                        class="dataset-content-tab"
                                        :class="{ 'is-active': activeContentTab === 'plot' }"
                                        type="button"
                                        role="tab"
                                        :aria-selected="activeContentTab === 'plot' ? 'true' : 'false'"
                                        @click="activeContentTab = 'plot'"
                                    >
                                        Plot
                                    </button>
                                    <button
                                        class="dataset-content-tab"
                                        :class="{ 'is-active': activeContentTab === 'table' }"
                                        type="button"
                                        role="tab"
                                        :aria-selected="activeContentTab === 'table' ? 'true' : 'false'"
                                        @click="activeContentTab = 'table'"
                                    >
                                        Table
                                    </button>
                                    <button
                                        v-for="tab in openTableTabs"
                                        :key="tab.key"
                                        class="dataset-content-tab"
                                        :class="{ 'is-active': activeContentTab === tab.key }"
                                        type="button"
                                        role="tab"
                                        :aria-selected="activeContentTab === tab.key ? 'true' : 'false'"
                                        @click="activeContentTab = tab.key"
                                    >
                                        <span class="dynamic-table-tab-title">{{ tab.title }}</span>
                                        <span
                                            class="dynamic-table-tab-close"
                                            role="button"
                                            tabindex="0"
                                            @click.stop="closeDataTypeTableTab(tab.key)"
                                            @keydown.enter.stop.prevent="closeDataTypeTableTab(tab.key)"
                                            @keydown.space.stop.prevent="closeDataTypeTableTab(tab.key)"
                                        >
                                            x
                                        </span>
                                    </button>
                                </div>

                                <div v-if="donorAvailabilityPlotData.length && activeContentTab === 'plot'" class="dataset-content-panel" role="tabpanel">
                                    <div class="availability-plot-card">
                                        <div class="availability-plot-header">
                                            <div>
                                                <div class="availability-plot-title">Donors By Data Type</div>
                                            </div>
                                            <div class="availability-plot-controls">
                                                <label class="availability-plot-label" for="availability-plot-group">
                                                    Segment by
                                                </label>
                                                <select
                                                    id="availability-plot-group"
                                                    v-model="plotCategoryField"
                                                    class="availability-plot-select"
                                                >
                                                    <option value="">None</option>
                                                    <option
                                                        v-for="option in plotGroupingOptions"
                                                        :key="option.value"
                                                        :value="option.value"
                                                    >
                                                        {{ option.text }}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        <div v-if="donorAvailabilityLegend.length" class="availability-plot-legend">
                                            <div
                                                v-for="item in donorAvailabilityLegend"
                                                :key="item.label"
                                                class="availability-plot-legend-item"
                                                :class="{ 'is-dimmed': hoveredPlotLegendValue && hoveredPlotLegendValue !== item.label }"
                                                @mouseenter="hoveredPlotLegendValue = item.label"
                                                @mouseleave="hoveredPlotLegendValue = ''"
                                            >
                                                <span
                                                    class="availability-plot-legend-swatch"
                                                    :style="{ backgroundColor: item.color }"
                                                ></span>
                                                <span>{{ item.label }}</span>
                                                <span class="availability-plot-legend-count">{{ item.count.toLocaleString() }}</span>
                                            </div>
                                        </div>

                                        <bar-plot-d3
                                            :data="donorAvailabilityPlotData"
                                            category-key="dataType"
                                            value-key="donorCount"
                                            :series-key="plotCategoryField ? 'groupValue' : ''"
                                            :stacked="!!plotCategoryField"
                                            :height="320"
                                            :fit-width="true"
                                            :fit-height="false"
                                            :margin="{ top: 16, right: 24, bottom: 84, left: 56 }"
                                            x-axis-label="Donors"
                                            y-axis-label="Data Type"
                                            :show-x-axis="true"
                                            :show-y-axis="true"
                                            :show-x-axis-label="true"
                                            :show-y-axis-label="true"
                                            :show-x-axis-ticks="true"
                                            :show-y-axis-ticks="true"
                                            :bar-padding="0.16"
                                            :colors="availabilityPlotColors"
                                            :show-bar-value-labels="true"
                                            :highlighted-series-key="hoveredPlotLegendValue"
                                            orientation="horizontal"
                                        ></bar-plot-d3>

                                        <div v-if="availabilityDataTypeCards.length" class="availability-data-type-section">
                                            <div class="availability-data-type-grid">
                                                <article
                                                    v-for="item in availabilityDataTypeCards"
                                                    :key="item.dataType"
                                                    class="availability-data-type-card"
                                                >
                                                    <div class="availability-data-type-heading">
                                                        <div class="availability-data-type-name" :title="item.label">{{ item.label }}</div>
                                                        <span
                                                            class="availability-data-type-help"
                                                            :aria-label="`${item.label} description: ${item.description}`"
                                                            tabindex="0"
                                                        >
                                                            (?)
                                                            <span class="availability-data-type-tooltip">{{ item.description }}</span>
                                                        </span>
                                                    </div>
                                                    <div class="availability-data-type-metric">
                                                        <span class="availability-data-type-metric-label">Total donors available</span>
                                                        <span class="availability-data-type-metric-value">{{ item.donorCount.toLocaleString() }}</span>
                                                    </div>
                                                    <div class="availability-data-type-links">
                                                        <a class="availability-data-type-link" :href="item.href" target="_blank">
                                                            View data
                                                        </a>
                                                        <button
                                                            class="availability-data-type-button"
                                                            type="button"
                                                            @click="showDataTypeInTable(item.dataType, '', $event)"
                                                        >
                                                            View donors
                                                        </button>
                                                    </div>
                                                    <div
                                                        v-if="item.segments && item.segments.length"
                                                        class="availability-data-type-segments"
                                                    >
                                                        <div class="availability-data-type-segments-title">
                                                            {{ getColumnLabel(plotCategoryField) }}
                                                        </div>
                                                        <div
                                                            v-for="segment in item.segments"
                                                            :key="`${item.dataType}-${segment.groupValue}`"
                                                            class="availability-data-type-segment"
                                                        >
                                                            <div class="availability-data-type-segment-meta">
                                                                <span
                                                                    class="availability-data-type-segment-swatch"
                                                                    :style="{ backgroundColor: segment.color }"
                                                                ></span>
                                                                <span class="availability-data-type-segment-label">{{ segment.groupValue }}</span>
                                                                <span class="availability-data-type-segment-count">{{ segment.donorCount.toLocaleString() }}</span>
                                                            </div>
                                                            <button
                                                                class="availability-data-type-segment-button"
                                                                type="button"
                                                                @click="showDataTypeInTable(item.dataType, segment.groupValue, $event)"
                                                            >
                                                                Donors
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="activeContentTab === 'table'" class="dataset-content-panel" role="tabpanel">
                                    <div class="dataset-toolbar">
                                        <div class="dataset-summary">
                                            {{ filteredRows.length }} rows
                                            <span class="dataset-summary-separator">|</span>
                                            {{ selectedColumns.length }} of {{ availableColumns.length }} columns shown
                                        </div>
                                        <div class="dataset-toolbar-actions">
                                            <b-button size="sm" variant="outline-secondary" @click="showColumnsModal">
                                                Columns
                                            </b-button>
                                            <table-config-button
                                                v-if="showConfigureControls"
                                                :columns="availableColumns"
                                                :config="donorTableConfig"
                                                @save="handleConfigSave"
                                            ></table-config-button>
                                        </div>
                                    </div>

                                    <div v-if="selectedColumns.length">
                                        <b-table
                                            small
                                            striped
                                            hover
                                            class="donors-data-table"
                                            responsive
                                            :items="buildTableRows(filteredRows)"
                                            :fields="tableFields"
                                            :per-page="perPage"
                                            :current-page="currentPage"
                                        >
                                            <template #cell()="cell">
                                                <a
                                                    v-if="isDonorLinkField(cell.field.key) && cell.value"
                                                    class="table-cell-text donor-link"
                                                    :href="getDonorUrl(cell.value)"
                                                    :title="formatCellTitle(cell.value)"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {{ formatCellValue(cell.value) }}
                                                </a>
                                                <span
                                                    v-else
                                                    class="table-cell-text"
                                                    :title="formatCellTitle(cell.value)"
                                                >
                                                    {{ formatCellValue(cell.value) }}
                                                </span>
                                            </template>
                                        </b-table>

                                        <b-pagination
                                            v-model="currentPage"
                                            class="pagination-sm justify-content-center"
                                            :per-page="perPage"
                                            :total-rows="filteredRows.length"
                                        ></b-pagination>
                                    </div>
                                    <div v-else class="dataset-status">
                                        No columns selected.
                                    </div>
                                </div>

                                <div
                                    v-for="tab in openTableTabs"
                                    v-if="activeContentTab === tab.key"
                                    :key="tab.key"
                                    class="dataset-content-panel"
                                    role="tabpanel"
                                >
                                    <div class="scoped-table-header">
                                        <div class="scoped-table-title">{{ tab.title }}</div>
                                        <div class="scoped-table-subtitle">
                                            {{ getScopedTableFilterSummary(tab) }}
                                        </div>
                                    </div>

                                    <div class="dataset-toolbar">
                                        <div class="dataset-summary">
                                            {{ getRowsForTableScope(tab).length }} rows
                                            <span class="dataset-summary-separator">|</span>
                                            {{ selectedColumns.length }} of {{ availableColumns.length }} columns shown
                                        </div>
                                        <div class="dataset-toolbar-actions">
                                            <b-button size="sm" variant="outline-secondary" @click="showColumnsModal">
                                                Columns
                                            </b-button>
                                            <table-config-button
                                                v-if="showConfigureControls"
                                                :columns="availableColumns"
                                                :config="donorTableConfig"
                                                @save="handleConfigSave"
                                            ></table-config-button>
                                        </div>
                                    </div>

                                    <div v-if="selectedColumns.length">
                                        <b-table
                                            small
                                            striped
                                            hover
                                            class="donors-data-table"
                                            responsive
                                            :items="buildTableRows(getRowsForTableScope(tab))"
                                            :fields="tableFields"
                                            :per-page="perPage"
                                            :current-page="getDataTypeTablePage(tab.key)"
                                        >
                                            <template #cell()="cell">
                                                <a
                                                    v-if="isDonorLinkField(cell.field.key) && cell.value"
                                                    class="table-cell-text donor-link"
                                                    :href="getDonorUrl(cell.value)"
                                                    :title="formatCellTitle(cell.value)"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {{ formatCellValue(cell.value) }}
                                                </a>
                                                <span
                                                    v-else
                                                    class="table-cell-text"
                                                    :title="formatCellTitle(cell.value)"
                                                >
                                                    {{ formatCellValue(cell.value) }}
                                                </span>
                                            </template>
                                        </b-table>

                                        <b-pagination
                                            :value="getDataTypeTablePage(tab.key)"
                                            class="pagination-sm justify-content-center"
                                            :per-page="perPage"
                                            :total-rows="getRowsForTableScope(tab).length"
                                            @input="setDataTypeTablePage(tab.key, $event)"
                                        ></b-pagination>
                                    </div>
                                    <div v-else class="dataset-status">
                                        No columns selected.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="dataset-status">
                        No dataset rows were returned.
                    </div>
                </div>
            </div>
        </div>
        <pkb-footer></pkb-footer>

        <b-modal
            id="donor-columns-modal"
            title="Choose columns"
            centered
            hide-footer
            size="lg"
        >
            <div class="columns-actions">
                <b-button size="sm" variant="outline-secondary" @click="selectAllColumns">
                    Select all
                </b-button>
                <b-button size="sm" variant="outline-secondary" @click="clearAllColumns">
                    Clear all
                </b-button>
            </div>

            <div class="columns-grid">
                <label
                    v-for="column in availableColumns"
                    :key="column"
                    class="column-option"
                >
                    <input
                        v-model="selectedColumns"
                        type="checkbox"
                        :value="column"
                    >
                    <span>{{ column }}</span>
                </label>
            </div>
        </b-modal>
    </div>
</template>

<script>
import BarPlotD3 from "./BarPlotD3.vue";
import CategoricalFilter from "./CategoricalFilter.vue";
import TableConfigButton from "./TableConfigButton.vue";
import NumericRangeFilter from "./NumericRangeFilter.vue";
import { parseNumericValue } from "./datasetUtils";

const AVAILABILITY_PLOT_COLORS = [
    "#2f5d62",
    "#5e8b7e",
    "#a7c4bc",
    "#dfd8ca",
    "#d97d54",
    "#b85c38",
    "#6b4226",
];

const DATA_TYPE_DETAILS = {
    dynamic_perifusion: {
        description: "measurement of pancreatic islet function",
        href: "/functional.html",
    },
    bulk_RNA_seq: {
        description: "bulk measurement of gene transcript abundance, either from tissue or sorted cells",
        href: "/diff-exp.html",
    },
    "bulk_RNA-seq": {
        description: "bulk measurement of gene transcript abundance, either from tissue or sorted cells",
        href: "/diff-exp.html",
    },
    "single_cell_RNA-seq": {
        description: "single cell measurement of gene transcript abundance",
        href: "/single-cell.html",
    },
    "single_nuclear_ATAC-seq": {
        description: "single cell measurement of accessible/open chromatin",
        href: "/atacseq.html",
    },
};

export default {
    components: {
        BarPlotD3,
        CategoricalFilter,
        NumericRangeFilter,
        TableConfigButton,
    },
    data() {
        return {
            debugLoggedState: {
                filtersInitialized: false,
                tableRowsLogged: false,
                numericColumnsLogged: false,
            },
            categoricalFilterData: {},
            categoricalFilters: {},
            currentPage: 1,
            filterSearch: "",
            filterType: "all",
            hoveredPlotLegendValue: "",
            numericFilterData: {},
            openTableTabs: [],
            plotCategoryField: "",
            perPage: 15,
            scopedTablePages: {},
            numericFilters: {},
            selectedColumns: [],
            activeContentTab: "plot",
        };
    },
    computed: {
        preparedDataset() {
            return this.$parent.preparedDataset;
        },
        donorTableConfig() {
            return this.$parent.donorTableConfig;
        },
        showConfigureControls() {
            return this.$parent.showConfigureControls;
        },
        availableColumns() {
            if (!this.preparedDataset || !this.preparedDataset.columns) {
                return [];
            }

            return this.preparedDataset.columns.map((column) => column.name);
        },
        columnConfigMap() {
            if (!this.donorTableConfig || !Array.isArray(this.donorTableConfig.columns)) {
                return {};
            }

            return this.donorTableConfig.columns.reduce((columnMap, column) => {
                if (column && column.name) {
                    columnMap[column.name] = column;
                }
                return columnMap;
            }, {});
        },
        initialVisibleColumns() {
            if (!this.availableColumns.length) {
                return [];
            }

            if (!this.donorTableConfig || !Array.isArray(this.donorTableConfig.columns)) {
                return this.availableColumns.slice();
            }

            return this.availableColumns.filter((columnName) => {
                const configuredColumn = this.columnConfigMap[columnName];
                return !configuredColumn || configuredColumn.showOnLoad !== false;
            });
        },
        totalRows() {
            return this.preparedDataset && this.preparedDataset.rows
                ? this.preparedDataset.rows.length
                : 0;
        },
        hasRows() {
            return this.totalRows > 0;
        },
        hasAvailableFilters() {
            return this.numericFilterColumns.length || this.categoricalFilterColumns.length;
        },
        numericFilterColumns() {
            if (!this.preparedDataset || !this.preparedDataset.columns) {
                return [];
            }

            return this.preparedDataset.columns.filter((column) => {
                if (!this.selectedColumns.includes(column.name)) {
                    return false;
                }

                return column.inferredType === "continuous" || (column.tags || []).includes("numeric");
            });
        },
        categoricalFilterColumns() {
            if (!this.preparedDataset || !this.preparedDataset.columns) {
                return [];
            }

            return this.preparedDataset.columns.filter((column) => {
                if (!this.selectedColumns.includes(column.name)) {
                    return false;
                }

                return column.inferredType === "categorical" || column.inferredType === "boolean";
            });
        },
        normalizedFilterSearch() {
            return this.filterSearch.trim().toLowerCase();
        },
        visibleNumericFilterColumns() {
            if (this.filterType === "categorical") {
                return [];
            }

            return this.numericFilterColumns.filter((column) => this.matchesFilterSearch(column));
        },
        visibleCategoricalFilterColumns() {
            if (this.filterType === "numeric") {
                return [];
            }

            return this.categoricalFilterColumns.filter((column) => this.matchesFilterSearch(column));
        },
        hasVisibleFilters() {
            return this.visibleNumericFilterColumns.length || this.visibleCategoricalFilterColumns.length;
        },
        activeNumericFilters() {
            return this.numericFilterColumns
                .map((column) => {
                    const filter = this.numericFilters[column.name];
                    const summary = this.numericFilterData[column.name];

                    if (!filter || !summary || summary.min === null || summary.max === null) {
                        return null;
                    }

                    const isActive = filter.min > summary.min || filter.max < summary.max;
                    if (!isActive) {
                        return null;
                    }

                    return {
                        name: column.name,
                        min: filter.min,
                        max: filter.max,
                    };
                })
                .filter(Boolean);
        },
        activeCategoricalFilters() {
            return this.categoricalFilterColumns
                .map((column) => {
                    const summary = this.categoricalFilterData[column.name];
                    if (!summary || !summary.options.length) {
                        return null;
                    }

                    const allValues = summary.options.map((option) => option.value);
                    const selectedValues = Array.isArray(this.categoricalFilters[column.name])
                        ? this.categoricalFilters[column.name]
                        : allValues;

                    if (selectedValues.length === allValues.length) {
                        return null;
                    }

                    return {
                        name: column.name,
                        values: new Set(selectedValues),
                    };
                })
                .filter(Boolean);
        },
        activeFilterPills() {
            const numericPills = this.activeNumericFilters.map((filter) => ({
                key: `numeric-${filter.name}`,
                type: "numeric",
                name: filter.name,
                label: `${this.getColumnLabel(filter.name)}: ${this.formatFilterNumber(filter.min)} to ${this.formatFilterNumber(filter.max)}`,
            }));
            const categoricalPills = this.activeCategoricalFilters.map((filter) => ({
                key: `categorical-${filter.name}`,
                type: "categorical",
                name: filter.name,
                label: `${this.getColumnLabel(filter.name)}: ${filter.values.size} selected`,
            }));

            return numericPills.concat(categoricalPills);
        },
        plotGroupingOptions() {
            return this.categoricalFilterColumns
                .filter((column) => column.name !== "Data_available_Pankbase")
                .map((column) => ({
                    value: column.name,
                    text: this.getColumnLabel(column.name),
                }));
        },
        donorAvailabilityPlotData() {
            const availabilityKey = "Data_available_Pankbase";
            if (!this.filteredRows.length) {
                return [];
            }

            const donorMap = {};

            this.filteredRows.forEach((row) => {
                const donorId = row.Accession || row.accession || row.donor_id || null;
                if (!donorId) {
                    return;
                }

                const uniqueDataTypes = this.parseAvailabilityValues(row[availabilityKey]);
                const rawGroupValue = this.plotCategoryField ? row[this.plotCategoryField] : null;

                if (!donorMap[donorId]) {
                    donorMap[donorId] = {
                        donorId,
                        dataTypes: new Set(),
                        groupValue: null,
                    };
                }

                uniqueDataTypes.forEach((dataType) => {
                    donorMap[donorId].dataTypes.add(dataType);
                });

                if (
                    this.plotCategoryField &&
                    donorMap[donorId].groupValue === null &&
                    !this.isMissingCategoricalValue(rawGroupValue)
                ) {
                    donorMap[donorId].groupValue = this.normalizeCategoricalValue(rawGroupValue);
                }
            });

            const counts = {};
            const groupedCounts = {};

            Object.values(donorMap).forEach((donor) => {
                const dataTypes = [...donor.dataTypes];
                if (!dataTypes.length) {
                    return;
                }

                const groupValue = donor.groupValue;
                const includeGroupValue = !this.plotCategoryField || groupValue !== null;

                dataTypes.forEach((dataType) => {
                    counts[dataType] = (counts[dataType] || 0) + 1;

                    if (includeGroupValue && groupValue !== null) {
                        const groupKey = `${dataType}|||${groupValue}`;
                        groupedCounts[groupKey] = (groupedCounts[groupKey] || 0) + 1;
                    }
                });
            });

            if (!this.plotCategoryField) {
                return Object.keys(counts)
                    .map((dataType) => ({
                        dataType,
                        donorCount: counts[dataType],
                    }))
                    .sort((left, right) => right.donorCount - left.donorCount || left.dataType.localeCompare(right.dataType));
            }

            const orderedDataTypes = Object.keys(counts)
                .sort((left, right) => counts[right] - counts[left] || left.localeCompare(right));
            const orderMap = orderedDataTypes.reduce((map, dataType, index) => {
                map[dataType] = index;
                return map;
            }, {});

            return Object.keys(groupedCounts)
                .map((groupKey) => {
                    const [dataType, groupValue] = groupKey.split("|||");
                    return {
                        dataType,
                        groupValue,
                        donorCount: groupedCounts[groupKey],
                    };
                })
                .sort((left, right) => {
                    if (left.dataType !== right.dataType) {
                        return orderMap[left.dataType] - orderMap[right.dataType];
                    }

                    return left.groupValue.localeCompare(right.groupValue);
                });
        },
        donorAvailabilityLegend() {
            if (!this.plotCategoryField) {
                return [];
            }

            const values = [...new Set(this.donorAvailabilityPlotData.map((entry) => entry.groupValue))];
            const colors = this.buildCategoricalPalette(values.length);
            const donorCounts = this.donorAvailabilityPlotData.reduce((counts, entry) => {
                counts[entry.groupValue] = (counts[entry.groupValue] || 0) + entry.donorCount;
                return counts;
            }, {});

            return values.map((value, index) => ({
                label: value,
                color: colors[index],
                count: donorCounts[value] || 0,
            }));
        },
        availabilityPlotColors() {
            const seriesCount = this.plotCategoryField
                ? [...new Set(this.donorAvailabilityPlotData.map((entry) => entry.groupValue))].length
                : 0;

            return this.buildCategoricalPalette(seriesCount);
        },
        availabilityDataTypeCards() {
            const donorCounts = this.donorAvailabilityPlotData.reduce((counts, entry) => {
                counts[entry.dataType] = (counts[entry.dataType] || 0) + entry.donorCount;
                return counts;
            }, {});
            const legendColorMap = this.donorAvailabilityLegend.reduce((map, item) => {
                map[item.label] = item.color;
                return map;
            }, {});
            const segmentCountsByDataType = this.donorAvailabilityPlotData.reduce((segments, entry) => {
                if (!entry.groupValue) {
                    return segments;
                }

                if (!segments[entry.dataType]) {
                    segments[entry.dataType] = [];
                }

                segments[entry.dataType].push({
                    groupValue: entry.groupValue,
                    donorCount: entry.donorCount,
                    color: legendColorMap[entry.groupValue] || "#d8d3ca",
                });
                return segments;
            }, {});

            return Object.keys(donorCounts)
                .map((dataType) => {
                    const details = this.getDataTypeDetails(dataType);
                    return {
                        dataType,
                        label: this.getDataTypeLabel(dataType),
                        description: details.description,
                        href: details.href,
                        donorCount: donorCounts[dataType],
                        segments: (segmentCountsByDataType[dataType] || [])
                            .slice()
                            .sort((left, right) => right.donorCount - left.donorCount || left.groupValue.localeCompare(right.groupValue)),
                    };
                })
                .sort((left, right) => right.donorCount - left.donorCount || left.label.localeCompare(right.label));
        },
        filteredRows() {
            if (!this.preparedDataset || !this.preparedDataset.rows) {
                return [];
            }

            if (!this.activeNumericFilters.length && !this.activeCategoricalFilters.length) {
                return this.preparedDataset.rows;
            }

            return this.preparedDataset.rows.filter((row, rowIndex) => {
                const matchesNumeric = this.activeNumericFilters.every((filter) => {
                    const rowValues = this.numericFilterData.__rowValues || [];
                    const numericValue = rowValues[rowIndex] ? rowValues[rowIndex][filter.name] : parseNumericValue(row[filter.name]);
                    if (numericValue === null) {
                        return true;
                    }

                    return numericValue >= filter.min && numericValue <= filter.max;
                });

                if (!matchesNumeric) {
                    return false;
                }

                return this.activeCategoricalFilters.every((filter) => {
                    const rowValues = this.categoricalFilterData.__rowValues || [];
                    const categoricalValue = rowValues[rowIndex]
                        ? rowValues[rowIndex][filter.name]
                        : this.normalizeCategoricalValue(row[filter.name]);

                    return filter.values.has(categoricalValue);
                });
            });
        },
        tableFields() {
            return this.selectedColumns.map((column) => ({
                key: column,
                label: this.getColumnLabel(column),
                sortable: true,
            }));
        },
    },
    watch: {
        availableColumns: {
            immediate: true,
            handler(newColumns) {
                if (!newColumns.length) {
                    this.selectedColumns = [];
                    return;
                }

                this.selectedColumns = this.initialVisibleColumns.slice();
            },
        },
        donorTableConfig: {
            deep: true,
            handler() {
                this.selectedColumns = this.initialVisibleColumns.slice();
            },
        },
        numericFilterColumns: {
            immediate: true,
            handler() {
                if (!this.debugLoggedState.numericColumnsLogged) {
                    console.log("[Donors] template:numeric-filter-columns", this.numericFilterColumns.map((column) => ({
                        name: column.name,
                        inferredType: column.inferredType,
                        tags: column.tags,
                    })));
                    this.debugLoggedState.numericColumnsLogged = true;
                }
                this.initializeNumericFilterData();
                this.initializeNumericFilters();
            },
        },
        categoricalFilterColumns: {
            immediate: true,
            handler() {
                this.initializeCategoricalFilterData();
                this.initializeCategoricalFilters();
            },
        },
        selectedColumns() {
            console.log("[Donors] template:selected-columns", this.selectedColumns.length);
            this.currentPage = 1;
        },
        filteredRows() {
            if (!this.debugLoggedState.tableRowsLogged) {
                console.log("[Donors] template:filtered-rows:first-pass", this.filteredRows.length);
                this.debugLoggedState.tableRowsLogged = true;
            }
            this.currentPage = 1;
        },
        availabilityDataTypeCards(cards) {
            if (!this.openTableTabs.length) {
                return;
            }

            const validScopes = new Set();
            cards.forEach((card) => {
                validScopes.add(`${card.dataType}|||`);
                (card.segments || []).forEach((segment) => {
                    validScopes.add(`${card.dataType}|||${segment.groupValue}`);
                });
            });
            const removedTabs = this.openTableTabs.filter((tab) => !validScopes.has(`${tab.dataType}|||${tab.groupValue || ""}`));
            const remainingTabs = this.openTableTabs.filter((tab) => validScopes.has(`${tab.dataType}|||${tab.groupValue || ""}`));

            if (remainingTabs.length !== this.openTableTabs.length) {
                removedTabs.forEach((tab) => {
                    this.$delete(this.scopedTablePages, tab.key);
                });
                this.openTableTabs = remainingTabs;
                if (this.activeContentTab !== "plot" && this.activeContentTab !== "table" && !remainingTabs.some((tab) => tab.key === this.activeContentTab)) {
                    this.activeContentTab = "table";
                }
            }
        },
        plotCategoryField() {
            this.hoveredPlotLegendValue = "";
        },
        donorAvailabilityPlotData(plotData) {
            if (!plotData.length && this.activeContentTab === "plot") {
                this.activeContentTab = "table";
            }
        },
    },
    mounted() {
        console.log("[Donors] template:mounted");
    },
    methods: {
        showColumnsModal() {
            this.$bvModal.show("donor-columns-modal");
        },
        selectAllColumns() {
            this.selectedColumns = this.availableColumns.slice();
        },
        clearAllColumns() {
            this.selectedColumns = [];
        },
        clearAllFilters() {
            this.initializeNumericFilters(true);
            this.initializeCategoricalFilters(true);
            this.hoveredPlotLegendValue = "";
        },
        showDataTypeInTable(dataType, groupValue = "", event = null) {
            const trigger = event && event.currentTarget ? event.currentTarget : null;
            if (trigger && typeof trigger.blur === "function") {
                trigger.blur();
            }

            const existingIndex = this.openTableTabs.findIndex((tab) => {
                return tab.dataType === dataType && (tab.groupValue || "") === groupValue;
            });
            if (existingIndex >= 0) {
                this.activeContentTab = this.openTableTabs[existingIndex].key;
                this.scrollContentTabsIntoView();
                return;
            }

            const nextTab = {
                key: `data-type-${dataType}-${groupValue || "all"}`,
                dataType,
                groupValue,
                title: groupValue
                    ? `${this.getDataTypeLabel(dataType)}: ${groupValue}`
                    : `${this.getDataTypeLabel(dataType)} Donors`,
            };

            this.openTableTabs = this.openTableTabs.concat(nextTab);
            this.$set(this.scopedTablePages, nextTab.key, 1);
            this.activeContentTab = nextTab.key;
            this.scrollContentTabsIntoView();
        },
        closeDataTypeTableTab(tabKey) {
            this.openTableTabs = this.openTableTabs.filter((tab) => tab.key !== tabKey);
            this.$delete(this.scopedTablePages, tabKey);
            if (this.activeContentTab === tabKey) {
                this.activeContentTab = "table";
            }
        },
        handleConfigSave(configPayload) {
            this.$parent.donorTableConfig = configPayload;
        },
        initializeNumericFilterData() {
            if (!this.preparedDataset || !this.preparedDataset.rows) {
                this.numericFilterData = {};
                return;
            }

            const nextFilterData = {};
            const rowValues = this.preparedDataset.rows.map(() => ({}));

            this.numericFilterColumns.forEach((column) => {
                const values = [];

                this.preparedDataset.rows.forEach((row, rowIndex) => {
                    const numericValue = parseNumericValue(row[column.name]);
                    rowValues[rowIndex][column.name] = numericValue;

                    if (numericValue !== null) {
                        values.push(numericValue);
                    }
                });

                values.sort((left, right) => left - right);

                nextFilterData[column.name] = {
                    values,
                    min: values.length ? values[0] : null,
                    max: values.length ? values[values.length - 1] : null,
                };
            });

            nextFilterData.__rowValues = rowValues;
            this.numericFilterData = nextFilterData;
        },
        initializeCategoricalFilterData() {
            if (!this.preparedDataset || !this.preparedDataset.rows) {
                this.categoricalFilterData = {};
                return;
            }

            const nextFilterData = {};
            const rowValues = this.preparedDataset.rows.map(() => ({}));

            this.categoricalFilterColumns.forEach((column) => {
                const counts = {};

                this.preparedDataset.rows.forEach((row, rowIndex) => {
                    const value = this.normalizeCategoricalValue(row[column.name]);
                    rowValues[rowIndex][column.name] = value;
                    counts[value] = (counts[value] || 0) + 1;
                });

                nextFilterData[column.name] = {
                    options: Object.keys(counts)
                        .map((value) => ({
                            value,
                            label: value,
                            count: counts[value],
                        }))
                        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
                };
            });

            nextFilterData.__rowValues = rowValues;
            this.categoricalFilterData = nextFilterData;
        },
        initializeNumericFilters(forceReset = false) {
            const nextFilters = {};

            this.numericFilterColumns.forEach((column) => {
                const summary = this.numericFilterData[column.name];
                if (!summary || !summary.values.length) {
                    return;
                }

                const existing = this.numericFilters[column.name];
                nextFilters[column.name] = {
                    min: !forceReset && existing && typeof existing.min === "number" ? existing.min : summary.min,
                    max: !forceReset && existing && typeof existing.max === "number" ? existing.max : summary.max,
                };
            });

            this.numericFilters = nextFilters;

            if (!this.debugLoggedState.filtersInitialized) {
                console.log("[Donors] template:numeric-filters-initialized", Object.keys(nextFilters).length);
                this.debugLoggedState.filtersInitialized = true;
            }
        },
        initializeCategoricalFilters(forceReset = false) {
            const nextFilters = {};

            this.categoricalFilterColumns.forEach((column) => {
                const summary = this.categoricalFilterData[column.name];
                if (!summary || !summary.options.length) {
                    return;
                }

                const existing = this.categoricalFilters[column.name];
                nextFilters[column.name] = !forceReset && Array.isArray(existing)
                    ? existing.slice()
                    : summary.options.map((option) => option.value);
            });

            this.categoricalFilters = nextFilters;
        },
        resetNumericFilter(columnName) {
            const summary = this.numericFilterData[columnName];
            if (!summary) {
                return;
            }

            this.$set(this.numericFilters, columnName, {
                min: summary.min,
                max: summary.max,
            });
        },
        resetCategoricalFilter(columnName) {
            const summary = this.categoricalFilterData[columnName];
            if (!summary) {
                return;
            }

            this.$set(this.categoricalFilters, columnName, summary.options.map((option) => option.value));
        },
        removeFilter(pill) {
            if (pill.type === "numeric") {
                this.resetNumericFilter(pill.name);
                return;
            }

            if (pill.type === "categorical") {
                this.resetCategoricalFilter(pill.name);
            }
        },
        getNumericFilterRef(columnName) {
            return `numeric-filter-${columnName}`;
        },
        getCategoricalFilterRef(columnName) {
            return `categorical-filter-${columnName}`;
        },
        scrollToFilter(pill) {
            const refName = pill.type === "numeric"
                ? this.getNumericFilterRef(pill.name)
                : this.getCategoricalFilterRef(pill.name);
            const target = this.$refs[refName];
            const element = Array.isArray(target) ? target[0] : target;

            if (element && element.$el && typeof element.$el.scrollIntoView === "function") {
                element.$el.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        },
        formatFilterNumber(value) {
            if (!Number.isFinite(value)) {
                return "";
            }

            if (Math.abs(value) >= 100 || Number.isInteger(value)) {
                return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
            }

            return value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        },
        getRowDonorId(row) {
            return row.Accession || row.accession || row.donor_id || null;
        },
        getDataTypeDetails(dataType) {
            return DATA_TYPE_DETAILS[dataType] || {
                description: "Data available for this donor cohort in PanKbase.",
                href: "#",
            };
        },
        getDataTypeLabel(dataType) {
            const details = this.getDataTypeDetails(dataType);
            return details.label || dataType;
        },
        getRowsForDataType(dataType) {
            return this.filteredRows.filter((row) => {
                const dataTypes = this.parseAvailabilityValues(row.Data_available_Pankbase);
                return dataTypes.includes(dataType);
            });
        },
        getRowsForTableScope(tab) {
            const dataTypeRows = this.getRowsForDataType(tab.dataType);
            if (!tab.groupValue) {
                return dataTypeRows;
            }

            return dataTypeRows.filter((row) => {
                if (!this.plotCategoryField) {
                    return false;
                }

                if (this.isMissingCategoricalValue(row[this.plotCategoryField])) {
                    return false;
                }

                return this.normalizeCategoricalValue(row[this.plotCategoryField]) === tab.groupValue;
            });
        },
        buildTableRows(rows) {
            if (!rows.length) {
                return [];
            }

            if (!this.selectedColumns.length) {
                return rows.map(() => ({}));
            }

            return rows.map((row) => this.selectedColumns.reduce((filteredRow, column) => {
                filteredRow[column] = row[column];
                return filteredRow;
            }, {}));
        },
        getDataTypeTablePage(tabKey) {
            return this.scopedTablePages[tabKey] || 1;
        },
        setDataTypeTablePage(tabKey, page) {
            this.$set(this.scopedTablePages, tabKey, page);
        },
        scrollContentTabsIntoView() {
            this.$nextTick(() => {
                const element = this.$refs.contentTabList;
                if (element && typeof element.scrollIntoView === "function") {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            });
        },
        getScopedTableFilterSummary(tab) {
            const filterLabels = this.activeFilterPills.map((pill) => pill.label);
            const scopedLabels = [`Data Type: ${this.getDataTypeLabel(tab.dataType)}`];
            if (tab.groupValue && this.plotCategoryField) {
                scopedLabels.push(`${this.getColumnLabel(this.plotCategoryField)}: ${tab.groupValue}`);
            }
            return scopedLabels.concat(filterLabels).join(" | ");
        },
        isDonorLinkField(fieldKey) {
            return /accession/i.test(String(fieldKey || ""));
        },
        getDonorUrl(accession) {
            return `https://data.pankbase.org/human-donors/${encodeURIComponent(accession)}`;
        },
        matchesFilterSearch(column) {
            if (!this.normalizedFilterSearch) {
                return true;
            }

            const columnName = String(column.name || "").toLowerCase();
            const displayLabel = this.getColumnLabel(column.name).toLowerCase();
            return columnName.includes(this.normalizedFilterSearch) || displayLabel.includes(this.normalizedFilterSearch);
        },
        buildCategoricalPalette(count) {
            const baseColors = AVAILABILITY_PLOT_COLORS.slice();
            if (!count) {
                return baseColors;
            }

            if (count <= baseColors.length) {
                return baseColors.slice(0, count);
            }

            const extendedColors = baseColors.slice();
            for (let index = baseColors.length; index < count; index += 1) {
                const generatedIndex = index - baseColors.length;
                const hue = (generatedIndex * 137.508) % 360;
                const saturation = 54 + ((generatedIndex % 3) * 8);
                const lightness = 38 + ((generatedIndex % 4) * 8);
                extendedColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            }

            return extendedColors;
        },
        normalizeCategoricalValue(value) {
            if (value === null || value === undefined || value === "") {
                return "(missing)";
            }

            return String(value);
        },
        isMissingCategoricalValue(value) {
            if (value === null || value === undefined) {
                return true;
            }

            const normalized = String(value).trim().toLowerCase();
            return !normalized || ["-", "na", "n/a", "null", "none", "missing", "(missing)"].includes(normalized);
        },
        parseAvailabilityValues(value) {
            if (value === null || value === undefined) {
                return [];
            }

            return [...new Set(
                String(value)
                    .split(";")
                    .map((entry) => entry.trim())
                    .filter((entry) => {
                        if (!entry) {
                            return false;
                        }

                        const normalized = entry.toLowerCase();
                        return !["-", "na", "n/a", "null", "none", "missing"].includes(normalized);
                    })
            )];
        },
        getColumnLabel(columnName) {
            const configuredColumn = this.columnConfigMap[columnName];
            return configuredColumn && configuredColumn.label
                ? configuredColumn.label
                : columnName;
        },
        formatCellValue(value) {
            if (value === null || value === undefined) {
                return "";
            }

            if (typeof value === "object") {
                return JSON.stringify(value);
            }

            return String(value);
        },
        formatCellTitle(value) {
            return this.formatCellValue(value);
        },
    },
};
</script>

<style scoped>
.donors-page {
    width: 100%;
}

.dataset-panel {
    margin-top: 24px;
    padding: 16px;
}

.dataset-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
    min-height: 0;
}

.filters-panel {
    position: sticky;
    top: 16px;
    display: flex;
    flex-direction: column;
    align-self: start;
    height: fit-content;
    max-height: calc(100vh - 32px);
    padding: 10px;
    border-right: 1px solid #ccc;
    overflow: hidden;
    background: #eee;
}

.filters-panel-header {
    color: #22343f;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.filters-panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.filters-clear-button {
    border: 0;
    background: transparent;
    color: #6b7f89;
    font-size: 12px;
    font-weight: 600;
    text-transform: none;
}

.filters-panel-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    padding-right: 10px;
}

.filters-search-input,
.filters-type-select {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #d7d0c5;
    border-radius: 8px;
    background: #fffdfa;
    color: #4f6571;
    font-size: 12px;
}

.filters-panel-body {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-right: 10px;
}

.dataset-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.active-filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.active-filter-pills-sidebar {
    max-height: 132px;
    overflow-y: auto;
    padding-right: 10px;
}

.active-filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: 1px solid #d7d0c5;
    border-radius: 999px;
    background: #fffdfa;
    color: #4f6571;
    font-size: 12px;
    font-weight: 600;
}

.active-filter-pill-label {
    min-width: 0;
}

.active-filter-pill-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #e6ece8;
    color: #445b66;
    font-size: 11px;
    line-height: 1;
}

.dataset-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dataset-summary {
    color: #3f3a34;
    font-size: 14px;
}

.dataset-summary-separator {
    margin: 0 8px;
    color: #9b9386;
}

.dataset-status {
    color: #3f3a34;
    font-size: 14px;
}

.dataset-status-error {
    color: #9f2f1f;
}

.dataset-table-wrap {
    width: 100%;
    min-width: 0;
}

.dataset-content-tab-list {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    margin-bottom: 12px;
    border-bottom: 1px solid #d8d3ca;
}

.dataset-content-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid transparent;
    border-bottom: 0;
    background: #eee;
    color: #5f7480;
    font-size: 13px;
    font-weight: 600;
}

.dataset-content-tab.is-active {
    border-color: #d8d3ca;
    background: #fff;
    color: #22343f;
    margin-bottom: -1px;
    cursor:default;
}

.dataset-content-tab:not(.is-active):hover{
    background: #ddd;
}

.dynamic-table-tab-title {
    margin-right: 6px;
}

.dynamic-table-tab-close {
    color: #7d7469;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
}

.dataset-content-panel {
    min-width: 0;
}

.scoped-table-header {
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid #d8d3ca;
    border-radius: 10px;
    background: #fffdfa;
}

.scoped-table-title {
    color: #22343f;
    font-size: 18px;
    font-weight: 700;
}

.scoped-table-subtitle {
    margin-top: 4px;
    color: #5f7480;
    font-size: 12px;
    line-height: 1.5;
}

.availability-plot-card {
    padding: 5px;
}

.availability-data-type-section {
    margin-top: 20px;
}

.availability-data-type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 5px;
}

.availability-data-type-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: #f6f4f4;
}

.availability-data-type-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.availability-data-type-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #22343f;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.25;
}

.availability-data-type-help {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #eef5f7;
    color: #2f5d62;
    font-size: 11px;
    font-weight: 700;
    cursor: help;
    flex: 0 0 auto;
}

.availability-data-type-tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    z-index: 10;
    width: 240px;
    padding: 8px 10px;
    border: 1px solid rgba(31, 29, 26, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 24px rgba(31, 29, 26, 0.14);
    color: #3f3a34;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    text-align: left;
    white-space: normal;
    pointer-events: none;
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
    transition: opacity 120ms ease, transform 120ms ease;
}

.availability-data-type-help:hover .availability-data-type-tooltip,
.availability-data-type-help:focus .availability-data-type-tooltip,
.availability-data-type-help:focus-within .availability-data-type-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.availability-data-type-metric {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.availability-data-type-metric-label {
    color: #7d7469;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.availability-data-type-metric-value {
    color: #22343f;
    font-size: 22px;
    font-weight: 700;
}

.availability-data-type-links{
    display:flex;
    justify-content: space-between;
    align-items: center;
}

.availability-data-type-link {
    color: #1d5fbf;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
}

.availability-data-type-button {
    padding: 8px 10px;
    border: 1px solid #c7d6de;
    border-radius: 8px;
    background: #eef5f7;
    color: #2f5d62;
    font-size: 12px;
    font-weight: 700;
    text-align: left;
}

.availability-data-type-segments {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid #ece7de;
}

.availability-data-type-segments-title {
    color: #7d7469;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.availability-data-type-segment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.availability-data-type-segment-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: #4f6571;
    font-size: 12px;
}

.availability-data-type-segment-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex: 0 0 auto;
}

.availability-data-type-segment-label {
    min-width: 0;
}

.availability-data-type-segment-count {
    color: #7d7469;
    font-weight: 700;
}

.availability-data-type-segment-button {
    flex: 0 0 auto;
    padding: 6px 8px;
    border: 1px solid #d7d0c5;
    border-radius: 8px;
    background: #fffdfa;
    color: #4f6571;
    font-size: 11px;
    font-weight: 700;
}

.availability-plot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
}

.availability-plot-title {
    color: #22343f;
    font-size: 16px;
    font-weight: 700;
}

.availability-plot-subtitle {
    margin-top: 2px;
    color: #687b87;
    font-size: 12px;
}

.availability-plot-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.availability-plot-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-bottom: 10px;
}

.availability-plot-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4f6571;
    font-size: 12px;
    cursor: pointer;
    transition: opacity 120ms ease;
}

.availability-plot-legend-item.is-dimmed {
    opacity: 0.38;
}

.availability-plot-legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
}

.availability-plot-legend-count {
    color: #7d7469;
    font-weight: 600;
}

.availability-plot-label {
    margin: 0;
    color: #4f6571;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.availability-plot-select {
    min-width: 180px;
    padding: 6px 8px;
    border: 1px solid #d7d0c5;
    border-radius: 8px;
    background: #fffdfa;
    color: #4f6571;
    font-size: 12px;
}

.dataset-table-wrap ::v-deep .donors-data-table th {
    white-space: nowrap;
}

.dataset-table-wrap ::v-deep .donors-data-table td {
    max-width: 240px;
}

.table-cell-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.donor-link {
    color: #1d5fbf;
    text-decoration: none;
}

@media (max-width: 1080px) {
    .dataset-layout {
        grid-template-columns: 1fr;
    }

    .filters-panel {
        position: relative;
        top: 0;
        height: auto;
        max-height: none;
    }

    .filters-panel-body {
        flex: 0 0 auto;
        min-height: auto;
    }

    .filters-panel-controls,
    .active-filter-pills-sidebar {
        padding-right: 0;
    }
}

.columns-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px 16px;
    max-height: 60vh;
    overflow-y: auto;
}

.column-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: #f7f7f5;
    border: 1px solid #d8d3ca;
    border-radius: 6px;
    color: #1f1d1a;
    font-size: 14px;
}

.column-option input {
    margin: 0;
}
</style>
