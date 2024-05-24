<template>
    <div>
        <h4>
            {{
                `Gene expression for ${tissueFormatter(tissue)}`
            }}
        </h4>
        <documentation
            name="tissue.gene-expression.subheader"
            :content-fill="$parent.documentationMap"
        ></documentation>
        <!-- <div id="plot" v-if="rawData.length > 0" class="expression-plot-wrapper">
            <research-expression-filter
                :rawData="rawData"
                :plotByField="'gene'"
                :skipSort="true"
                ref="plotRef"
                @dataReady="(filteredData) => getPlotData(filteredData)"
            >
            </research-expression-filter>
            <research-expression-plot 
                :plotData="plotData"
                :highlightedDataset="datasetDetails"
                :plotName="`gene_expression_${tissue.replaceAll(' ', '_')}_p${currentPage}`">
            </research-expression-plot>
        </div>
        <div v-else>Loading expression plot...</div> -->
        <b-table
            v-if="tissueData.length > 0"
            id="big-table"
            small
            responsive="sm"
            :items="tissueData"
            sort-by="meanTpm"
            :sort-desc="true"
            :fields="newTableFields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(gene)="row">
                <a :href="`/gene.html?gene=${row.item.gene}`">
                    {{ row.item.gene }}
                </a>
            </template>
            <template #cell(show_datasets)="row">
                <b-button
                    variant="outline-primary"
                    size="sm"
                    @click="row.toggleDetails"
                >
                    {{ row.detailsShowing ? "Hide" : "Show" }} Datasets
                </b-button>
            </template>
            <template #row-details="row">
                <research-dataset-subtable
                    :row="row"
                    :fields="tableConfig['Datasets']"
                    :plotByField="plotByField"
                    @highlight="(details) => highlight(details)"
                >
                </research-dataset-subtable>
            </template>
        </b-table>
        <b-pagination
            v-model="currentPage"
            class="pagination-sm justify-content-center"
            :total-rows="tissueData.length"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import ResearchExpressionFilter from "@/components/researchPortal/ResearchExpressionFilter.vue";
import ResearchExpressionPlot from "@/components/researchPortal/ResearchExpressionPlot.vue";
import ResearchExpressionTable from "./researchPortal/ResearchExpressionTable.vue";
export default Vue.component("TissueExpressionDisplay", {
    props: {
        tissueData: {
            type: Array,
            required: true,
        },
        tissue: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortedData: this.$props.tissueData,
            rawData: [],
            evidence: {},
            plotData: [],
            tableData: [],
            sortKey: "",
            datasetDetails: {},
            newTableFields: [
                { key: "gene",
                    label: "Gene",
                    sortable: true },
                { key: "nSamples",
                    label: "Samples",
                    sortable: true },
                { key: "meanTpm",
                    label: "Mean TPM",
                    sortable: true,
                    formatter: Formatters.tpmFormatter }
            ],
        };
    },
    mounted() {
        this.populateGeneData();
        console.log(this.tissueData.length);
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        async showEvidence(gene) {
            if (gene) {
                //check if evidence object already has key equal gene
                if (!this.evidence[gene]) {
                    let data = await query("gene-expression", gene);
                    data = data.filter(
                        (d) => d.tissue === this.tissue.replace(" ", "_")
                    );
                    Vue.set(this.evidence, gene, data);
                }
            }
        },
        async populateGeneData() {
            this.rawData = [];
            let startIndex = (this.currentPage - 1) * this.perPage;
            let endIndex = startIndex + this.perPage;
            this.tableData = this.sortedData.slice(startIndex, endIndex);
            let rows = this.tableData.map((d) => d.gene);
            await this.populateEvidence(rows);
            this.rawData = rows.flatMap((gene) => this.evidence[gene]);
        },
        async populateEvidence(genes) {
            await Promise.all(genes.map((gene) => this.showEvidence(gene)));
        },
        getPlotData(plotData) {
            this.plotData = plotData;
        },
        sortBy(field, ascending){
            this.sortedData.sort((a,b) => {
                let sortVal = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
                return !ascending ? -sortVal : sortVal;
            });
            this.currentPage = 1;
            this.populateGeneData();
        },
        highlight(details){
            this.datasetDetails = details;
        }
    },
    watch: {
        currentPage: function () {
            this.populateGeneData();
        },
    },
});
</script>
<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
