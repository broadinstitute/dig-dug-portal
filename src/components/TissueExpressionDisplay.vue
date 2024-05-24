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
        <criterion-function-group>
            <filter-greater-control field="meanTpm">
                <div class="label">Mean TPM (≥)</div>
            </filter-greater-control>
            <template slot="filtered" slot-scope="{ filter }">
                <div id="plot" v-if="genePlotData.length > 0" class="expression-plot-wrapper">
                    <research-expression-plot 
                        :plotData="genePlotData"
                        :highlightedDataset="datasetDetails"
                        :plotName="`gene_expression_${tissue.replaceAll(' ', '_')}_p${currentPage}`">
                    </research-expression-plot>
                </div>
                <div v-else>Loading expression plot...</div>
                <tissue-expression-table
                    :tissueData="tissueData"
                    :tissue="tissue"
                    :filter="filter">

                </tissue-expression-table>
            </template>
        </criterion-function-group>
        
        
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import ResearchExpressionPlot from "@/components/researchPortal/ResearchExpressionPlot.vue";
import TissueExpressionTable from "@/components/TissueExpressionTable.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
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
                entry["keyField"] = entry.gene;
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
