<template>
    <div id="correlations">
        <b-container fluid>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item">Phenotype</b-col>
                <b-col class="top-level-header-item">P-Value</b-col>
                <b-col class="top-level-header-item">Correlation</b-col>
                <b-col class="top-level-header-item">Standard error</b-col>
            </b-row>
            <template v-for="item in correlationData">
                <b-row>
                    <b-col class="top-level-value-item">
                        <a :href="`/phenotype.html?phenotype=${item['other_phenotype']}`">{{
                            getDescription(item['other_phenotype'])}}
                        </a>
                    </b-col>
                    <b-col class="top-level-value-item">{{pValueFormatter(item.pValue)}}</b-col>
                    <b-col class="top-level-value-item">{{item.rg}}</b-col>
                    <b-col class="top-level-value-item">{{item.stdErr}}</b-col>
                </b-row>
            </template>
        </b-container>
        <!--p v-else>No correlations available for this query.</p-->
    </div>
</template>
<script>
import Vue from "vue";
import { orderBy, groupBy } from "lodash";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("correlation-table", {
    props: ["correlationData", "phenotypeMap"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
        };
    },
    computed: {
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

