<template>
    <div id="correlations">
        <b-container fluid v-if="thisIsATest">
            <b-row class="top-level header">
                <b-col class="top-level-header-item">Phenotype</b-col>
                <b-col class="top-level-header-item">P-Value</b-col>
                <b-col class="top-level-header-item">Correlation</b-col>
                <b-col class="top-level-header-item">Standard error</b-col>
            </b-row>
            <template v-for="item in correlationData">
                <b-row>
                    <b-col class="top-level-value-item">
                        <a :href="`/phenotype.html?phenotype=${item['other_phenotype']}`">{{
                            phenotypeMap[item['other_phenotype']]}}
                        </a>
                    </b-col>
                    <b-col class="top-level-value-item">P-Value</b-col>
                    <b-col class="top-level-value-item">Correlation</b-col>
                    <b-col class="top-level-value-item">Standard error</b-col>
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
        thisIsATest() {
            console.log(this.correlationData);
            console.log(this.phenotypeMap);
            console.log(this.correlationData.length);
            return true;
        }
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        getDescription(phenotypeCode){
            let description = this.phenotypeMap[phenotypeCode]['description'];
            if (!description){
                return phenotypeCode;
            }
            return description;
        }
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");
</style>

