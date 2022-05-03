<template>
    <div class="EGLT-table fiftytwo" v-if="associations.length > 0">
        <b-container fluid>
            <div class="text-right mt-2 mb-2 border-0">
                <csv-download
                    :data="associations"
                    filename="rare_variant_gene_associations"
                ></csv-download>
            </div>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item" cols="4">Phenotype</b-col>
                <b-col class="top-level-header-item" cols="2">pValue</b-col>
                <b-col class="top-level-header-item" cols="2">Beta</b-col>
                <b-col class="top-level-header-item" cols="2">Odds Ratio</b-col>
                <b-col class="top-level-header-item" cols="2">View</b-col>
            </b-row>
            <template v-for="(row, i) in associations">
                <b-row
                    v-if="phenotypeMap[row.phenotype]"
                    class="data top-level-value"
                    :key="row.phenotype + i"
                >
                
                <!-- <b-row
                    class="data top-level-value"
                > -->
                    <b-col class="top-level-value-item" cols="4">
                        <a
                            :href="`/phenotype.html?phenotype=${row.phenotype}`"
                            >{{ phenotypeMap[row.phenotype]}}</a
                        >
                    </b-col>
                    <b-col class="top-level-value-item pValue" cols="2">{{
                        pValueFormatter(row.pValue)
                    }}</b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!!phenotypeMap[row.phenotype]"
                        >
                        
                            <span
                                :class="
                                    row.beta < 0
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    row.beta < 0 ? "&#9660;" : "&#9650;"
                                }}</span
                            >
                            <span>{{ effectFormatter(row.beta) }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!!phenotypeMap[row.phenotype]"
                        >
                            <span
                                :class="
                                    Math.exp(row.beta) < 1
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    Math.exp(row.beta) < 1
                                        ? "&#9660;"
                                        : "&#9650;"
                                }}</span
                            >
                            <span>{{
                                effectFormatter(Math.exp(row.beta))
                            }}</span>
                            
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item" cols="2">
                        <b-button
                            @click="showFeatures(i)"
                            class="view-features-btn"
                            >Masks + Plot</b-button
                        >
                        
                    </b-col>
                </b-row>
                <mask-table
                    v-if="!!phenotypeMap[row.phenotype]"
                    :maskData="row.masks"
                    :key="i"
                    :index="i"
                    :dichotomous="!!phenotypeMap[row.phenotype]"
                    :isHidden="true"
                ></mask-table>
            </template>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import MaskTable from "@/portals/Neph/components/MaskTable";
import CsvDownload from "@/components/CsvDownload";

export default Vue.component("gene-associations-masks", {
    props: ["associations", "phenotypeMap"],
    component: { MaskTable, CsvDownload },
    data() {
        return {
            visible: false
        };
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        showFeatures(index) {
            console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
            uiUtils.showHideElement("feature-plot-" + index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
