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
            <div class="col filter-col-md">
                <div class="label">Scale</div>
                <select v-model="logScale" class="form-control">
                    <option :value="false">Linear</option>
                    <option :value="true">Logarithmic: log10(TPM+1)</option>
                </select>
            </div>
            <filter-greater-control field="meanTpm">
                <div class="label">Mean TPM (≥)</div>
            </filter-greater-control>
            <template slot="filtered" slot-scope="{ filter }">
                <div id="plot" v-if="genePlotData.length > 0" class="expression-plot-wrapper">
                    <research-expression-plot 
                        :plotData="genePlotData"
                        :highlightedDataset="datasetDetails"
                        :plotName="`gene_expression_${tissue.replaceAll(' ', '_')}`">
                    </research-expression-plot>
                </div>
                <div v-else>Loading expression plot...</div>
                <tissue-expression-table
                    :tissueData="tissueData"
                    :tissue="tissue"
                    :filter="filter"
                    @geneDataReady="data => getGeneData(data)"
                    @highlight="(details) => highlight(details)">
                </tissue-expression-table>
            </template>
        </criterion-function-group>
        
        
    </div>
</template>
<script>
import Vue from "vue";
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
            genePlotData: [],            
            datasetDetails: {},
            logScale: false
        };
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        highlight(details){
            this.datasetDetails = details;
        },
        plotScale(plotData){
            let data = structuredClone(plotData);
            data.forEach(d => d.tpmsToUse = this.logScale ? d.tpmLogs : d.tpmForAllSamples);
            return data;
        },
        getGeneData(data){
            this.genePlotData = this.plotScale(data);
        },
    },
    watch: {
        logScale(){
            this.genePlotData = this.plotScale(this.genePlotData);
        }
    }
});
</script>
<style scoped>
.b-popover {
    background-color: #fff;
}
</style>
