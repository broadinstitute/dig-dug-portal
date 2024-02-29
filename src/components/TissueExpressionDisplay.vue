<template>
    <div>
        <h4>
            {{ `Gene expressions for ${tissue.toUpperCase()}` }}
        </h4>
        <div id="plot" v-if="rawData.length > 0">
            <research-expression-filter
                :rawData="rawData"
                :plotByField="'gene'"
                :skipSort="true"
                ref="plotRef"
                @dataReady="(filteredData) => getPlotData(filteredData)"
            >
            </research-expression-filter>
            <research-expression-plot :plotData="plotData">
            </research-expression-plot>
        </div>
        <div v-else>Loading expression plot...</div>
        <tissue-table
            :tissueData="tableData"
            :tissue="tissue"
            :filteredData="plotData"
        >
        </tissue-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="tissueData.length"
            :per-page="perPage"
        >
        </b-pagination>
    </div>
</template>
<script>
import Vue from "vue";
import { query } from "@/utils/bioIndexUtils";
import ResearchExpressionFilter from "@/components/researchPortal/ResearchExpressionFilter.vue";
import ResearchExpressionPlot from "@/components/researchPortal/ResearchExpressionPlot.vue";
import ResearchExpressionTable from "@/components/researchPortal/ResearchExpressionTable.vue";
import TissueTable from "./TissueTable.vue";
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
            rawData: [],
            evidence: {},
            plotData: [],
            tableData: [],
        };
    },
    mounted() {
        this.populateGeneData();
    },
    methods: {
        async showEvidence(gene) {
            if (gene) {
                //check if evidence object already has key equal gene
                if (!this.evidence[gene]) {
                    let data = await query("gene-expression", gene);
                    data = data.filter((d) => d.tissue === this.tissue);
                    Vue.set(this.evidence, gene, data);
                }
            }
        },
        async populateGeneData() {
            this.rawData = [];
            let startIndex = (this.currentPage - 1) * this.perPage;
            let endIndex = startIndex + this.perPage;
            this.tableData = this.tissueData.slice(startIndex, endIndex);
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
