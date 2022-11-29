<template>
    <div id="pathways">
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <csv-download
                    :data="pathwayData"
                    filename="genetic_correlations"
                ></csv-download>
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
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>No data available for this query.</div>
    </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
export default Vue.component("pathway-table", {
    props: ["pathwayData", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
                {
                    key: "pathwayName",
                    label: "Pathway"
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    formatter: Formatters.pValueFormatter,
                    tdClass(x) {
							return !!x && x < 1e-5
								? "variant-table-cell high"
								: "";
						}
                },
                {
                    key: "beta",
                    label: "Beta",
                    formatter: Formatters.effectFormatter,
                },
                {
                    key: "stdErr",
                    label: "Standard error",
                    formatter: Formatters.effectFormatter
                }
            ]
        };
    },
    computed: {
        rows(){
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.pathwayData;
            let filter = this.filter;
            if (!!filter) {
                dataRows = dataRows.filter((row) => filter(row));
            }
            return dataRows;
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        getDescription(phenotypeCode){
            let phenotypeEntry = this.phenotypeMap[phenotypeCode];
            if (!phenotypeEntry || !phenotypeEntry.description){
                return phenotypeCode;
            }
            return phenotypeEntry.description;
        }
    },
    watch: {
    }
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
</style>

