<template>
    <div>
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="flatData"
                    filename="pigean_bayes"
                ></data-download>
            </div>
            <div
                v-html="'Total rows: ' + tableData.length"
                class="table-total-rows"
            ></div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :per-page="perPage"
                :current-page="currentPage"
                :sort-desc="true"
            >
                <template #cell(label)="r">
                    <span v-if="!!r.item.label">
                        {{
                            shorten(r.item.label)
                        }}    
                    </span>
                </template>
                <template #cell(gene)="r">
                    <a :href="`/pigean/gene.html?gene=${r.item.gene}`">
                        {{ r.item.gene }}
                    </a>
                </template>
                <template #cell(phenotype)="r">
                    <a
                        v-if="!!phenotypeMap[r.item.phenotype]"
                        :href="`/pigean/phenotype.html?phenotype=${r.item.phenotype}`"
                    >
                        {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                    </a>
                    <span v-else>{{ r.item.phenotype }}</span>
                </template>
                <template #cell(gene_set)="r">
                    <a
                        :href="`/pigean/geneset.html?geneset=${r.item.gene_set}`"
                    >
                        {{ shorten(r.item.gene_set) }}
                    </a>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="tableData.length"
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
import { query } from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
import keyParams from "@/utils/keyParams";
import PigeanTable from "./PigeanTable.vue";
import uiUtils from "@/utils/uiUtils";
import alertUtils from "@/utils/alertUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import dataConvert from "@/utils/dataConvert";
export default Vue.component("pigean-bayes-table", {
    components: {
        DataDownload,
    },
    props: ["pigeanData", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
        flatData(){
            let output = [];
            let factors = Object.keys(this.pigeanData);
            factors.forEach(factor => {
                //console.log(factor);
                //console.log(JSON.stringify(this.pigeanData[factor]));
                output = output.concat(this.pigeanData[factor]);
            });
            return output;
        },
        tableData() {
            let data = structuredClone(this.flatData);
            if (this.filter) {
                data = data.filter(this.filter);
            }
            return data;
        },
    },
    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        annotationFormatter: Formatters.annotationFormatter,
        tissueFormatter: Formatters.tissueFormatter,
        tpmFormatter: Formatters.tpmFormatter,
        shorten(longString){
            return longString.length > 50
                ? `${longString.slice(0, 50)}...`
                : longString
        }
    },
});
</script>
<style scoped>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
.pigean-subtable {
    font-size: smaller;
    margin-left: 15px;
    background-color: #efefef;
}
.pigean-subtable .row .col-12 {
    padding: 0 0 0 5px !important;
}
ul.top-list {
    font-size: 0.8rem;
}
</style>
