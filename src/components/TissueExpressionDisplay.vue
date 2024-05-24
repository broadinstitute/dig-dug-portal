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
        <div id="plot" v-if="genePlotData.length > 0" class="expression-plot-wrapper">
            <!-- <research-expression-filter
                :rawData="rawData"
                :plotByField="'gene'"
                :skipSort="true"
                ref="plotRef"
                @dataReady="(filteredData) => getPlotData(filteredData)"
            >
            </research-expression-filter> -->
            <research-expression-plot 
                :plotData="genePlotData"
                :highlightedDataset="datasetDetails"
                :plotName="`gene_expression_${tissue.replaceAll(' ', '_')}_p${currentPage}`">
            </research-expression-plot>
        </div>
        <div v-else>Loading expression plot...</div>
        <b-table
            v-if="tissueData.length > 0"
            v-model="currentTable"
            id="big-table"
            small
            responsive="sm"
            :items="tissueData"
            sort-by="meanTpm"
            :sort-desc="true"
            :fields="newTableFields"
            :per-page="perPage"
            :current-page="currentPage"
            @sort-changed="showTableEvent($event)"
            @filtered="showTableEvent($event)"
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
                    @click="row.toggleDetails()"
                >
                    {{ row.detailsShowing ? "Hide" : "Show" }} Datasets
                </b-button>
            </template>
            <template #row-details="row">
                <!-- <research-dataset-subtable
                    :row="row"
                    :fields="tableConfig['Datasets']"
                    :plotByField="plotByField"
                    @highlight="(details) => highlight(details)"
                >
                </research-dataset-subtable> -->
                <b-table
                    :items="evidence[row.item.gene]"
                    :fields="datasetFields">
                </b-table>
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
            currentTable: [],
            genePlotData: [],
            rawData: [],
            evidence: {},
            plotData: [],
            tableData: [],
            sortKey: "",
            datasetDetails: {},
            newTableFields: [
                { key: "gene",
                    label: "Gene",
                    sortable: true,
                    tdClass: "gene-findable" },
                { key: "nSamples",
                    label: "Samples",
                    sortable: true },
                { key: "meanTpm",
                    label: "Mean TPM",
                    sortable: true,
                    formatter: Formatters.tpmFormatter },
                { key: "show_datasets"}
            ],
            datasetFields: [
                {
                    key: "biosample",
                    formatter: Formatters.tissueFormatter,
                    sortable: true,
                },
                {
                    key: "collection",
                    formatter: (value) => value.toString(", "),
                },
                { key: "dataset", sortable: true },
                {
                    key: "diseaseTermName",
                    label: "Disease",
                    sortable: true,
                    formatter: (value) =>
                        !value
                            ? "Not available"
                            : Formatters.tissueFormatter(value),
                },
                {
                    key: "Min TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Q1 TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Median TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Q3 TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                {
                    key: "Max TPM",
                    formatter: Formatters.tpmFormatter,
                    sortable: true,
                },
                { key: "nSamples", label: "Samples", sortable: true },
            ],
        };
    },
    mounted() {
        this.populateEvidence(this.currentGenes);
    },
    computed: {
        currentGenes(){
            return this.currentTable.map(d => d.gene);
        }
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
                    Vue.set(this.evidence, gene, this.parseData(data));
                }
            }
        },
        async populateEvidence(genes) {
            await Promise.all(genes.map((gene) => this.showEvidence(gene)));
            this.genePlotData = genes.flatMap(gene => this.evidence[gene]);
        },
        parseData(data){
            data.forEach((entry) => {
                if(typeof entry.tpmForAllSamples === 'string'){
                    let tpms = entry.tpmForAllSamples
                        .split(",")
                        .map((i) => !!Number.isNaN(parseFloat(i)) ? 0 : parseFloat(i));
                    entry["tpmForAllSamples"] = tpms;
                }
				entry["tissue"] = Formatters.tissueFormatter(entry["tissue"]);
				entry["Min TPM"] = parseFloat(entry.minTpm);
				entry["Q1 TPM"] = parseFloat(entry.firstQuTpm);
				entry["Median TPM"] = parseFloat(entry.medianTpm);
				entry["Q3 TPM"] = parseFloat(entry.thirdQuTpm);
				entry["Max TPM"] = parseFloat(entry.maxTpm);
				entry["nSamples"] = parseInt(entry.nSamples);
			});
            return data;
        },
        getPlotData(plotData) {
            this.plotData = plotData;
        },
        highlight(details){
            this.datasetDetails = details;
        }
    },
    watch: {
        async currentGenes(latestGenes){
            await this.populateEvidence(latestGenes);
        }
    },
});
</script>
<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
