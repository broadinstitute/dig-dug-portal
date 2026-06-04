<template>
    <div>
        <div v-if="loading">
            <b-spinner label="Loading..."></b-spinner>
        </div>
        <div v-else-if="error">
            <b-alert show variant="danger" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon>
                {{ error }}
            </b-alert>
        </div>
        <div v-else-if="items.length === 0">
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon>
                No data available for this query.
            </b-alert>
        </div>
        <criterion-function-group
            v-else
            :filter-list="criterionFilterList"
            @update:filter-list="onCriterionFilterListUpdate"
        >
            <filter-enumeration-control
                :field="'tissue'"
                placeholder="Select tissue ..."
                :options="tissueOptions"
                :multiple="true"
            >
                <div class="label">Tissue</div>
            </filter-enumeration-control>
            <filter-enumeration-control
                v-if="showCellTypeFilter"
                :field="'cell_type'"
                placeholder="Select cell type ..."
                :options="cellTypeOptions"
                :multiple="true"
            >
                <div class="label">Cell type</div>
            </filter-enumeration-control>
            <filter-greater-less
                :field="'log10_cpk'"
                label="Log10 CPK"
                placeholder="Set Log10 CPK ..."
            >
                <div class="label">Log10 CPK</div>
            </filter-greater-less>
            <filter-greater-less
                :field="'log2fc_weighted_vs_all_parent'"
                label="Log2 FC"
                placeholder="Set Log2 FC ..."
            >
                <div class="label">Log2 FC (weighted vs all parent)</div>
            </filter-greater-less>
            <filter-pvalue-control
                :field="'p_value'"
                placeholder="Set P-Value ..."
            >
                <div class="label">P-Value (&le;)</div>
            </filter-pvalue-control>
            <template slot="filtered">
                <template v-if="filteredItems().length > 0">
                    <div
                        v-if="plotsReady"
                        :key="plotRenderKey"
                        class="liger-plots-wrapper mb-4"
                    >
                        <research-simple-scatter-plot
                            :plots="ligerScatterPlots"
                            :plot-data="ligerPlotData"
                            :utils="utilsBox"
                            :colors="plotColors"
                            section-id="ligerCellState"
                            row-key-field="liger_row_key"
                        ></research-simple-scatter-plot>
                    </div>
                    <div class="table-total-rows">
                        Total rows: {{ filteredItems().length }}
                    </div>
                    <div class="text-right mb-2">
                        <data-download
                            :data="filteredItems()"
                            :filename="downloadFilename"
                        ></data-download>
                    </div>
                    <b-table
                        small
                        hover
                        responsive
                        :items="filteredItems()"
                        :fields="fields"
                        :per-page="perPage"
                        :current-page="currentPage"
                        sort-by="state_name"
                        show-empty
                    >
                        <template #cell(tissue)="row">
                            <a
                                :href="metadataLink(row.item, 'tissue')"
                                class="liger-metadata-link"
                            >{{ row.item.tissue }}</a>
                        </template>
                        <template #cell(cell_type)="row">
                            <a
                                :href="metadataLink(row.item, 'cell_type')"
                                class="liger-metadata-link"
                            >{{ row.item.cell_type }}</a>
                        </template>
                        <template #cell(state_name)="row">
                            <a
                                :href="metadataLink(row.item, 'cell_state')"
                                class="liger-metadata-link"
                            >{{ formatCellState(row.item) }}</a>
                        </template>
                        <template #cell(show_gene_programs)="row">
                            <b-button
                                variant="outline-primary"
                                size="sm"
                                :disabled="
                                    isGeneProgramLoading(row.item) &&
                                    !row.detailsShowing
                                "
                                @click="showGenePrograms(row)"
                            >
                                {{
                                    row.detailsShowing ? "Hide" : "View"
                                }}
                            </b-button>
                        </template>
                        <template #row-details="row">
                            <div
                                v-if="geneProgramErrorFor(row.item)"
                                class="liger-gene-program-subtable-message"
                            >
                                {{ geneProgramErrorFor(row.item) }}
                            </div>
                            <div
                                v-else-if="isGeneProgramLoading(row.item)"
                                class="liger-gene-program-subtable-message"
                            >
                                <b-spinner small></b-spinner>
                                Loading gene programs ...
                            </div>
                            <liger-gene-program-subtable
                                v-else-if="
                                    geneProgramsForRow(row.item).length > 0
                                "
                                :programs="geneProgramsForRow(row.item)"
                                :correlation-max-absolute="
                                    correlationMaxAbsoluteFor(row.item)
                                "
                            ></liger-gene-program-subtable>
                            <div
                                v-else
                                class="liger-gene-program-subtable-message"
                            >
                                No gene program relationships found for this
                                cell state.
                            </div>
                        </template>
                    </b-table>
                    <b-pagination
                        v-model="currentPage"
                        class="pagination-sm justify-content-center"
                        :total-rows="filteredItems().length"
                        :per-page="perPage"
                    ></b-pagination>
                </template>
                <b-alert v-else show variant="warning" class="text-center">
                    <b-icon icon="exclamation-triangle"></b-icon>
                    No rows match the current filters.
                </b-alert>
            </template>
        </criterion-function-group>
    </div>
</template>

<style scoped>
@import url("/css/table.css");

.liger-plots-wrapper {
    width: 100%;
    padding-top: 6px;
}

.liger-plots-wrapper ::v-deep .scatter-plot-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    padding-top: 4px;
    padding-bottom: 0;
}

.liger-plots-wrapper ::v-deep .plot-legend {
    margin-bottom: 5px;
}

.liger-plots-wrapper ::v-deep .download-images-setting {
    top: 0;
    right: 0;
}

.liger-plots-wrapper ::v-deep canvas.scatter-plot {
    display: block;
    margin-left: auto;
    margin-right: auto;
}

.liger-metadata-link {
    color: inherit;
    text-decoration: underline;
}

.liger-metadata-link:hover {
    color: var(--cfde-orange, #e07b39);
}

.liger-gene-program-subtable-message {
    font-size: 13px;
    margin-left: 15px;
    padding: 8px 12px;
    background-color: #efefef;
}

</style>

<script>
import Vue from "vue";
import { isEqual } from "lodash";
import { query } from "@/utils/bioIndexUtils";
import {
    filterFromPredicates,
    predicateFromSpec,
} from "@/utils/filterHelpers";
import DataDownload from "@/components/DataDownload.vue";
import LigerGeneProgramSubtable from "@/components/LigerGeneProgramSubtable.vue";
import ResearchSimpleScatterPlot from "@/components/researchPortal/ResearchSimpleScatterPlot.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import dataConvert from "@/utils/dataConvert";
import colors from "@/utils/colors";

export default Vue.component("LigerTable", {
    components: {
        DataDownload,
        LigerGeneProgramSubtable,
        ResearchSimpleScatterPlot,
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterGreaterLess,
        FilterPValue,
    },
    props: {
        geneName: {
            type: String,
            required: true,
        },
        filter: {
            type: Function,
            default: null,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            criterionFilterList: [],
            geneProgramHeatmapByTissueCellType: {},
            geneProgramHeatmapLoading: {},
            geneProgramHeatmapErrors: {},
            plotColors: {
                moderate: colors,
            },
            log2fcScatterPlotConfig: {
                type: "simple scatter plot",
                width: 500,
                height: 200,
                "render by": "cell_state_label",
                "x axis field": "log2fc_weighted_vs_all_parent",
                "y axis field": "neg_log10_p",
                "x axis label": "Log2 FC (weighted vs all parent)",
                "y axis label": "-Log10(p-value)",
                "color by": "tissue",
                "on hover": ["", "P-Value", "Log2 FC"],
            },
            cpkScatterPlotConfig: {
                type: "simple scatter plot",
                width: 500,
                height: 200,
                "render by": "cell_state_label",
                "x axis field": "log10_cpk",
                "y axis field": "neg_log10_p",
                "x axis label": "Log10 CPK",
                "y axis label": "-Log10(p-value)",
                "color by": "tissue",
                "on hover": ["", "P-Value", "Log2 FC"],
            },
            fields: [
                {
                    key: "tissue",
                    label: "Tissue",
                    sortable: true,
                },
                {
                    key: "cell_type",
                    label: "Cell type",
                    sortable: true,
                },
                {
                    key: "state_name",
                    label: "Cell state",
                    sortable: true,
                },
                {
                    key: "log10_cpk",
                    label: "Log10 CPK",
                    sortable: true,
                    formatter: Formatters.floatFormatter,
                },
                {
                    key: "log2fc_weighted_vs_all_parent",
                    label: "Log2 FC (weighted vs all parent)",
                    sortable: true,
                    formatter: Formatters.floatFormatter,
                },
                {
                    key: "p_value",
                    label: "P-value",
                    sortable: true,
                    formatter: Formatters.pValueFormatter,
                },
                {
                    key: "show_gene_programs",
                    label: "Gene programs",
                },
            ],
        };
    },
    computed: {
        cellStateExpression() {
            return this.$store.state.cellStateExpression;
        },
        items() {
            return (this.cellStateExpression.data || []).map((row) =>
                this.normalizeRow(row)
            );
        },
        loading() {
            const progress = this.cellStateExpression.progress;
            if (!progress) {
                return false;
            }
            return progress.bytes_read < progress.bytes_total;
        },
        error() {
            return this.cellStateExpression.error;
        },
        utilsBox() {
            return {
                uiUtils,
                Formatters,
                plotUtils,
                dataConvert,
            };
        },
        tissueOptions() {
            return [...new Set(this.items.map((row) => row.tissue))]
                .filter(Boolean)
                .sort();
        },
        selectedTissues() {
            return this.criterionFilterList
                .filter((f) => f.field === "tissue")
                .map((f) => f.threshold);
        },
        selectedCellTypes() {
            return this.criterionFilterList
                .filter((f) => f.field === "cell_type")
                .map((f) => f.threshold);
        },
        showCellTypeFilter() {
            return this.selectedTissues.length > 0;
        },
        valueCriterionFilter() {
            const specs = this.criterionFilterList.filter(
                (f) => f.field !== "tissue" && f.field !== "cell_type"
            );
            if (specs.length === 0) {
                return null;
            }
            const predicates = specs.map((spec) =>
                predicateFromSpec(spec, {
                    notStrictMatch: true,
                    strictCase: false,
                })
            );
            return filterFromPredicates(predicates, false);
        },
        cellTypeOptions() {
            let rows = this.items || [];
            if (this.selectedTissues.length > 0) {
                rows = rows.filter((row) =>
                    this.selectedTissues.includes(row.tissue)
                );
            }
            return [...new Set(rows.map((row) => row.cell_type))]
                .filter(Boolean)
                .sort();
        },
        downloadFilename() {
            return `cell_state_expression_${this.geneName || "gene"}`;
        },
        plotsReady() {
            return (
                !this.loading &&
                !this.error &&
                Array.isArray(this.items) &&
                this.items.length > 0
            );
        },
        plotRenderKey() {
            return `${this.geneName || "gene"}-${this.items.length}`;
        },
        ligerPlotData() {
            return this.buildPlotData(this.filteredItems());
        },
        ligerScatterPlots() {
            return [
                {
                    title: "Log2 FC vs -log10(p)",
                    renderConfig: this.log2fcScatterPlotConfig,
                },
                {
                    title: "Log10 CPK vs -log10(p)",
                    renderConfig: this.cpkScatterPlotConfig,
                },
            ];
        },
    },
    watch: {
        geneName() {
            this.criterionFilterList = [];
            this.currentPage = 1;
            this.geneProgramHeatmapByTissueCellType = {};
            this.geneProgramHeatmapLoading = {};
            this.geneProgramHeatmapErrors = {};
        },
        items() {
            if (!this.loading && this.items.length > 0) {
                this.refreshPlotLayout();
            }
        },
    },
    methods: {
        refreshPlotLayout() {
            this.$nextTick(() => {
                this.$nextTick(() => {
                    window.dispatchEvent(new Event("resize"));
                });
            });
        },
        onCriterionFilterListUpdate(filters) {
            const tissues = filters
                .filter((f) => f.field === "tissue")
                .map((f) => f.threshold);

            let next = filters;

            if (tissues.length === 0) {
                next = next.filter((f) => f.field !== "cell_type");
            } else {
                const rows = (this.items || []).filter((row) =>
                    tissues.includes(row.tissue)
                );
                const validCellTypes = new Set(
                    rows.map((row) => row.cell_type).filter(Boolean)
                );
                next = next.filter(
                    (f) =>
                        f.field !== "cell_type" ||
                        validCellTypes.has(f.threshold)
                );
            }

            if (!isEqual(next, this.criterionFilterList)) {
                this.criterionFilterList = next;
            }
        },
        filteredItems() {
            let data = this.items || [];
            if (this.filter) {
                data = data.filter(this.filter);
            }
            const tissues = this.selectedTissues;
            const cellTypes = this.selectedCellTypes;
            if (tissues.length > 0) {
                data = data.filter((row) => tissues.includes(row.tissue));
            }
            if (cellTypes.length > 0) {
                data = data.filter((row) =>
                    cellTypes.includes(row.cell_type)
                );
            }
            if (this.valueCriterionFilter) {
                data = data.filter(this.valueCriterionFilter);
            }
            return data;
        },
        ligerRowKey(row) {
            if (row?.node_id) {
                return String(row.node_id);
            }
            return [row.tissue, row.cell_type, row.state_name]
                .filter(Boolean)
                .join("|");
        },
        buildPlotData(rows) {
            return (rows || []).map((row) => ({
                ...row,
                liger_row_key: this.ligerRowKey(row),
                cell_state_label: this.formatCellState(row),
                neg_log10_p: this.negLog10P(row.p_value),
                "": this.hoverContext(row),
                "P-Value": Formatters.pValueFormatter(row.p_value),
                "Log2 FC": Formatters.floatFormatter(
                    row.log2fc_weighted_vs_all_parent
                ),
            }));
        },
        plotDataFor() {
            return this.buildPlotData(this.filteredItems());
        },
        negLog10P(pValue) {
            const p = Number(pValue);
            if (!p || p <= 0) {
                return 0;
            }
            return -Math.log10(p);
        },
        formatStateName(value) {
            if (!value) {
                return "";
            }
            return String(value).replace(/_/g, " ");
        },
        normalizeRow(row) {
            if (!row || typeof row !== "object") {
                return row;
            }
            return {
                ...row,
                tissue: row.tissue ?? row.Tissue,
                cell_type: row.cell_type ?? row.cellType ?? row.celltype,
            };
        },
        cellStatePrefixes(row) {
            const tissue = Formatters.toSnakeFormatter(row.tissue || "");
            const cellType = Formatters.toSnakeFormatter(row.cell_type || "");
            if (!tissue || !cellType) {
                return [];
            }
            const prefixes = new Set([
                `${tissue}_${cellType}_`,
                `${tissue}_${cellType}_cell_`,
            ]);
            if (!cellType.endsWith("_cell")) {
                prefixes.add(`${tissue}_${cellType}_cell_`);
            }
            return [...prefixes].sort((a, b) => b.length - a.length);
        },
        formatCellState(row) {
            if (!row?.state_name) {
                return "";
            }
            let stateValue = row.state_name;
            for (const prefix of this.cellStatePrefixes(row)) {
                if (stateValue.startsWith(prefix)) {
                    stateValue = stateValue.slice(prefix.length);
                    break;
                }
            }
            return this.formatStateName(stateValue);
        },
        hoverContext(row) {
            return [
                row.tissue,
                row.cell_type,
                this.formatCellState(row),
            ].join(" > ");
        },
        metadataIds(row) {
            return {
                gene: this.geneName || "",
                tissue_id: row.tissue_id ?? row.tissue ?? "",
                cell_type_id: row.cell_type_id ?? row.cell_type ?? "",
                cell_state_id:
                    row.cell_state_id ??
                    row.state_id ??
                    row.state_name ??
                    "",
            };
        },
        metadataLink(row, column) {
            const ids = this.metadataIds(row);
            const params = new URLSearchParams();
            params.set("gene", ids.gene);
            if (column === "tissue") {
                params.set("tissue", ids.tissue_id);
            } else if (column === "cell_type") {
                params.set("tissue", ids.tissue_id);
                params.set("cell_type", ids.cell_type_id);
            } else if (column === "cell_state") {
                params.set("tissue", ids.tissue_id);
                params.set("cell_type", ids.cell_type_id);
                params.set("cell_state", ids.cell_state_id);
            }
            return `/liger.html?${params.toString()}`;
        },
        tissueCellTypeCacheKey(row) {
            const tissue = this.tissueIdForQuery(row);
            const cellType = this.cellTypeIdForQuery(row);
            if (!tissue || !cellType) {
                return "";
            }
            return `${tissue}|${cellType}`;
        },
        tissueIdForQuery(row) {
            const value = row.tissue_id ?? row.tissue ?? "";
            return Formatters.toSnakeFormatter(String(value));
        },
        cellTypeIdForQuery(row) {
            const value = row.cell_type_id ?? row.cell_type ?? "";
            return Formatters.toSnakeFormatter(String(value));
        },
        stateIdForMatch(row) {
            return String(
                row.state_name ?? row.state_id ?? row.cell_state_id ?? ""
            );
        },
        isGeneProgramLoading(row) {
            const cacheKey = this.tissueCellTypeCacheKey(row);
            return !!cacheKey && !!this.geneProgramHeatmapLoading[cacheKey];
        },
        geneProgramErrorFor(row) {
            const cacheKey = this.tissueCellTypeCacheKey(row);
            return cacheKey ? this.geneProgramHeatmapErrors[cacheKey] : null;
        },
        correlationMaxAbsoluteFor(row) {
            const cacheKey = this.tissueCellTypeCacheKey(row);
            const rows = this.geneProgramHeatmapByTissueCellType[cacheKey] || [];
            const values = rows
                .map((entry) => Number(entry.correlation))
                .filter((value) => Number.isFinite(value));

            if (!values.length) {
                return 1;
            }

            return Math.max(...values.map((value) => Math.abs(value)));
        },
        geneProgramsForRow(row) {
            const cacheKey = this.tissueCellTypeCacheKey(row);
            const stateId = this.stateIdForMatch(row);
            if (!cacheKey || !stateId) {
                return [];
            }
            const rows = this.geneProgramHeatmapByTissueCellType[cacheKey] || [];
            return rows
                .filter((entry) => String(entry.state_name) === stateId)
                .slice()
                .sort((a, b) => {
                    const aVal = Number(a.correlation);
                    const bVal = Number(b.correlation);
                    const aNum = Number.isFinite(aVal) ? aVal : -Infinity;
                    const bNum = Number.isFinite(bVal) ? bVal : -Infinity;
                    return bNum - aNum;
                });
        },
        async ensureGeneProgramHeatmap(row) {
            const tissue = this.tissueIdForQuery(row);
            const cellType = this.cellTypeIdForQuery(row);
            const cacheKey = this.tissueCellTypeCacheKey(row);

            if (!tissue || !cellType || !cacheKey) {
                throw new Error(
                    "Tissue and cell type are required to load gene programs."
                );
            }

            if (this.geneProgramHeatmapByTissueCellType[cacheKey]) {
                return;
            }

            Vue.set(this.geneProgramHeatmapLoading, cacheKey, true);
            Vue.set(this.geneProgramHeatmapErrors, cacheKey, null);

            try {
                const data = await query(
                    "gene-program-heatmap",
                    `${tissue},${cellType}`,
                    {
                        onError: (json) => {
                            Vue.set(
                                this.geneProgramHeatmapErrors,
                                cacheKey,
                                json?.message ||
                                    json?.error ||
                                    "Failed to load gene program heatmap."
                            );
                        },
                    }
                );
                if (this.geneProgramHeatmapErrors[cacheKey]) {
                    return;
                }
                Vue.set(
                    this.geneProgramHeatmapByTissueCellType,
                    cacheKey,
                    data || []
                );
            } catch (err) {
                Vue.set(
                    this.geneProgramHeatmapErrors,
                    cacheKey,
                    err.message || "Failed to load gene program heatmap."
                );
            } finally {
                Vue.set(this.geneProgramHeatmapLoading, cacheKey, false);
            }
        },
        async showGenePrograms(row) {
            if (row.detailsShowing) {
                row.toggleDetails();
                return;
            }

            try {
                await this.ensureGeneProgramHeatmap(row.item);
            } catch (err) {
                const cacheKey = this.tissueCellTypeCacheKey(row.item);
                if (cacheKey) {
                    Vue.set(
                        this.geneProgramHeatmapErrors,
                        cacheKey,
                        err.message
                    );
                }
            }

            row.toggleDetails();
        },
    },
});
</script>
