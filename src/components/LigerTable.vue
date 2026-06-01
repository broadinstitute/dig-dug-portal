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
            <template slot="filtered" slot-scope="{ filter }">
                <template v-if="filteredItems(filter).length > 0">
                    <b-tabs
                        v-model="activePlotTab"
                        class="liger-plot-tabs mb-4"
                        @input="onPlotTabChange"
                    >
                        <b-tab title="Log2 FC vs -log10(p)" lazy>
                            <div class="liger-plot-wrapper">
                                <research-section-visualizers
                                    :plot-config="volcanoPlotConfig"
                                    :plot-data="volcanoPlotDataFor(filter)"
                                    :utils="utilsBox"
                                    :plot-margin="plotMargin"
                                    :colors="plotColors"
                                    section-id="ligerVolcano"
                                ></research-section-visualizers>
                            </div>
                        </b-tab>
                        <b-tab title="Log10 CPK vs -log10(p)" lazy>
                            <div class="liger-plot-wrapper">
                                <research-section-visualizers
                                    :plot-config="scatterPlotConfig"
                                    :plot-data="scatterPlotDataFor(filter)"
                                    :utils="utilsBox"
                                    :plot-margin="plotMargin"
                                    :colors="plotColors"
                                    section-id="ligerScatter"
                                ></research-section-visualizers>
                            </div>
                        </b-tab>
                    </b-tabs>
                    <div class="table-total-rows">
                        Total rows: {{ filteredItems(filter).length }}
                    </div>
                    <div class="text-right mb-2">
                        <data-download
                            :data="filteredItems(filter)"
                            :filename="downloadFilename"
                        ></data-download>
                    </div>
                    <b-table
                        small
                        striped
                        hover
                        responsive
                        :items="filteredItems(filter)"
                        :fields="fields"
                        :per-page="perPage"
                        :current-page="currentPage"
                        sort-by="state_name"
                        show-empty
                    >
                        <template #cell(state_name)="row">
                            {{ formatCellState(row.item) }}
                        </template>
                    </b-table>
                    <b-pagination
                        v-model="currentPage"
                        class="pagination-sm justify-content-center"
                        :total-rows="filteredItems(filter).length"
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

/* Only style the visible tab pane — do not override Bootstrap's display:none on inactive panes. */
.liger-plot-tabs ::v-deep .tab-pane.active {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-top: 12px;
}

.liger-plot-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-top: 8px;
}

.liger-plot-wrapper ::v-deep .col-md-12 {
    float: none;
    flex: 0 1 auto;
    width: auto;
    max-width: 100%;
    display: flex;
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
}

.liger-plot-wrapper ::v-deep .volcano-plot-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    padding-top: 8px;
}

.liger-plot-wrapper ::v-deep .download-images-setting {
    top: 0;
    right: 0;
}

.liger-plot-wrapper ::v-deep .volcano-plot,
.liger-plot-wrapper ::v-deep canvas.scatter-plot {
    display: block;
    margin-left: auto;
    margin-right: auto;
}

.liger-plot-wrapper ::v-deep .scatter-plot-content {
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
    width: auto;
    max-width: 100%;
}
</style>

<script>
import Vue from "vue";
import { isEqual } from "lodash";
import DataDownload from "@/components/DataDownload.vue";
import ResearchSectionVisualizers from "@/components/researchPortal/ResearchSectionVisualizers.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterLess from "@/components/criterion/FilterGreaterLess.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import dataConvert from "@/utils/dataConvert";
import colors from "@/utils/colors";

// Direct fetch until cell-state-expression is available on the portal BioIndex server.
const CELL_STATE_EXPRESSION_API =
    "https://private.hugeampkpnbi.org/api/bio/query/cell-state-expression";

export default Vue.component("LigerTable", {
    components: {
        DataDownload,
        ResearchSectionVisualizers,
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
            activePlotTab: 0,
            criterionFilterList: [],
            items: [],
            loading: false,
            error: null,
            plotMargin: {
                leftMargin: 80,
                rightMargin: 20,
                topMargin: 20,
                bottomMargin: 60,
                bump: 5,
            },
            plotColors: {
                moderate: colors,
            },
            volcanoRenderConfig: {
                type: "volcano plot",
                width: 500,
                height: 200,
                "render by": "cell_state_label",
                "x axis field": "log2fc_weighted_vs_all_parent",
                "y axis field": "neg_log10_p",
                "x axis label": "Log2 FC (weighted vs all parent)",
                "y axis label": "-Log10(p-value)",
                "on hover": ["", "P-Value", "Log2 FC"],
                "dot label score": 2,
                "x condition": {
                    combination: "or",
                    "greater than": 0.5,
                    "lower than": -0.5,
                },
                "y condition": {
                    combination: "greater than",
                    "greater than": 1.301,
                },
            },
            scatterPlotConfig: {
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
            ],
        };
    },
    computed: {
        volcanoPlotConfig() {
            return this.volcanoRenderConfig;
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
    },
    watch: {
        geneName() {
            this.fetchData();
        },
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        onPlotTabChange() {
            this.$nextTick(() => {
                window.dispatchEvent(new Event("resize"));
            });
        },
        onCriterionFilterListUpdate(filters) {
            const tissues = filters
                .filter((f) => f.field === "tissue")
                .map((f) => f.threshold);
            let rows = this.items || [];
            if (tissues.length > 0) {
                rows = rows.filter((row) => tissues.includes(row.tissue));
            }
            const validCellTypes = new Set(
                rows.map((row) => row.cell_type).filter(Boolean)
            );
            const pruned = filters.filter(
                (f) =>
                    f.field !== "cell_type" ||
                    validCellTypes.has(f.threshold)
            );
            const nextFilters =
                pruned.length !== filters.length ? pruned : filters;
            if (!isEqual(nextFilters, this.criterionFilterList)) {
                this.criterionFilterList = nextFilters;
            }
        },
        filteredItems(criterionFilter) {
            let data = this.items || [];
            if (this.filter) {
                data = data.filter(this.filter);
            }
            if (criterionFilter) {
                data = data.filter(criterionFilter);
            }
            return data;
        },
        volcanoPlotDataFor(criterionFilter) {
            return this.filteredItems(criterionFilter).map((row) => ({
                ...row,
                cell_state_label: this.formatCellState(row),
                neg_log10_p: this.negLog10P(row.p_value),
                "": this.hoverContext(row),
                "P-Value": Formatters.pValueFormatter(row.p_value),
                "Log2 FC": Formatters.floatFormatter(
                    row.log2fc_weighted_vs_all_parent
                ),
            }));
        },
        scatterPlotDataFor(criterionFilter) {
            return this.filteredItems(criterionFilter).map((row) => ({
                ...row,
                cell_state_label: this.formatCellState(row),
                neg_log10_p: this.negLog10P(row.p_value),
                "": this.hoverContext(row),
                "P-Value": Formatters.pValueFormatter(row.p_value),
                "Log2 FC": Formatters.floatFormatter(
                    row.log2fc_weighted_vs_all_parent
                ),
            }));
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
        cellStatePrefix(row) {
            const tissue = Formatters.toSnakeFormatter(row.tissue || "");
            const cellType = Formatters.toSnakeFormatter(row.cell_type || "");
            if (!tissue || !cellType) {
                return "";
            }
            return `${tissue}_${cellType}_cell_`;
        },
        formatCellState(row) {
            if (!row?.state_name) {
                return "";
            }
            const prefix = this.cellStatePrefix(row);
            let stateValue = row.state_name;
            if (prefix && stateValue.startsWith(prefix)) {
                stateValue = stateValue.slice(prefix.length);
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
        async fetchData() {
            if (!this.geneName) {
                this.items = [];
                return;
            }

            this.loading = true;
            this.error = null;
            this.currentPage = 1;
            this.criterionFilterList = [];

            const url = `${CELL_STATE_EXPRESSION_API}?q=${encodeURIComponent(
                this.geneName
            )}`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                }
                const json = await response.json();
                this.items = json.data || [];
            } catch (err) {
                this.items = [];
                this.error =
                    err.message || "Failed to load cell state expression.";
            } finally {
                this.loading = false;
            }
        },
    },
});
</script>
