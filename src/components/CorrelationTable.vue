<template>
    <div id="correlations" v-if="rows > 0">
        <div class="text-right mb-2">
            <csv-download
                :data="correlationData"
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
            <template v-slot:cell(link)="r">
                <a :href="`/phenotype.html?phenotype=${r.item['other_phenotype']}`">{{
                            getDescription(r.item['other_phenotype'])}}
                </a>
            </template>
        </b-table>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>
<script>
import Vue from "vue";
import { orderBy, groupBy } from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import { decodeNamespace } from "@/utils/filterHelpers";
export default Vue.component("correlation-table", {
    props: ["correlationData", "phenotypeMap", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "link",
                    label: "Phenotype"
                },
                {
                    key: "pValue",
                    label: "P-value",
                    formatter: Formatters.pValueFormatter
                },
                {
                    key: "rg",
                    label: "Correlation"
                },
                {
                    key: "stdErr",
                    label: "Standard error"
                }
            ]
        };
    },
    computed: {
        rows(){
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.correlationData;
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
});
</script>
<style>
@import url("/css/effectorGenes.css");
</style>

