<template>
    <div id="c2ct">
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="c2ctData"
                    filename="c2ct"
                ></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("c2ct-table", {
    components: {
        DataDownload,
    },
    props: ["c2ctData", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
                "Q",
                "Q_adj",
                "adjustedEntPP",
                "adjustedEntropy",
                "adjustedPP",
                "ancestry",
                "annot_bp",
                "annotation",
                "biosample",
                "chromosome",
                "clumpEnd",
                "clumpStart",
                "credibleSetId",
                "dataset",
                "entPP",
                "entropy",
                "entropyType",
                "leadSNP",
                "minOverlapPValue",
                "overlapLeadSNP",
                "phenotype",
                "posteriorProbability",
                "source",
                "tissue",
                "totalEntropy",
                "varOverlap",
                "varTotal"
            ]
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.c2ctData;
            let filter = this.filter;
            if (filter) {
                dataRows = dataRows.filter((row) => filter(row));
            }
            return dataRows;
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
</style>
