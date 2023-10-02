<template>
    <div id="pathways">
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="pathwayData"
                    filename="top_pathways"
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
export default Vue.component("PathwayTable", {
    components: {
        DataDownload,
    },
    props: ["pathwayData", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
                {
                    key: "pathwayName",
                    label: "Pathway",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    formatter: Formatters.pValueFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    },
                },
                {
                    key: "beta",
                    label: "Beta",
                    formatter: Formatters.effectFormatter,
                },
                {
                    key: "stdErr",
                    label: "Standard error",
                    formatter: Formatters.effectFormatter,
                },
            ],
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.pathwayData;
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
        getDescription(phenotypeCode) {
            let phenotypeEntry = this.phenotypeMap[phenotypeCode];
            if (!phenotypeEntry || !phenotypeEntry.description) {
                return phenotypeCode;
            }
            return phenotypeEntry.description;
        },
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
</style>
