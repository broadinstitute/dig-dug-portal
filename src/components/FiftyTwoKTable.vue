<template>
    <div class="52k">
        <b-container fluid class="EGLT-table">
            <b-row class="headers top-level-header">
                <b-col class="top-level-header-item">{{capitalizedFormatter(show)}}</b-col>
                <b-col class="top-level-header-item">pValue</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(row, i) in json">
                <b-row class="data top-level-value" :key="row[show] + i">
                    <b-col class="top-level-value-item">{{row[show]}}</b-col>
                    <b-col class="top-level-value-item pValue">{{row.pValue}}</b-col>
                    <b-col class="top-level-value-item beta">{{row.beta}}</b-col>
                    <b-col class="top-level-value-item">
                        <b-button @click="showFeatures(i)" class="view-features-btn">Features</b-button>
                    </b-col>
                </b-row>
                <div
                    :class="`feature-headers-${i}`"
                    class="feature-content-wrapper"
                    :key="`features_${i}`"
                >
                    <template v-for="(key, j) in Object.keys(row)">
                        <template v-if="typeof row[key] === 'object'">
                            <b-row class="feature-headers" v-if="j === 5" :key="`row_${i}_${j}`">
                                <b-col class="feature-header-item">Filters</b-col>
                                <b-col
                                    class="feature-header-item"
                                    v-for="fh in Object.keys(row[key])"
                                >{{fh}}</b-col>
                            </b-row>
                            <b-row
                                class="features"
                                :class="`features_${i}_${j}`"
                                :key="`features_${i}_${j}`"
                            >
                                <b-col class="feature-content-item key">{{key}}</b-col>
                                <b-col
                                    class="feature-content-item"
                                    v-for="item in row[key]"
                                >{{item}}</b-col>
                            </b-row>
                        </template>
                    </template>
                </div>
                <!-- <b-row
                    class="features"
                    v-if="typeof "
                    :key="row[show] + i"
                >
                    <b-col v-for="col in row" :key="col + i">{{typeof col}} - {{col}}</b-col>
                </b-row>-->
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

export default Vue.component("fiftytwok-table", {
    props: ["show"],
    data() {
        return {
            json: [
                {
                    dataset: "52k",
                    phenotype: "BMI",
                    gene: "RNF14",
                    pValue: 0.795,
                    beta: -0.0328,
                    LofTee: {
                        n: 17260,
                        pValue: 0.24698,
                        combinedAF: 0.00034762,
                        passingVariants: 5,
                        singleVariants: 4,
                        stdErr: 0.067554,
                        beta: -0.078211,
                    },
                    "5/5": {
                        n: 32927,
                        pValue: 0.8093899999999999,
                        combinedAF: 0.0010022,
                        passingVariants: 22,
                        singleVariants: 15,
                        stdErr: 0.031608,
                        beta: 0.0076242,
                    },
                    "16/16": {
                        n: 17260,
                        pValue: 0.24698,
                        combinedAF: 0.00034762,
                        passingVariants: 5,
                        singleVariants: 4,
                        stdErr: 0.067554,
                        beta: -0.078211,
                    },
                    "5/5 + LofTee LC": {
                        n: 32927,
                        pValue: 0.8093899999999999,
                        combinedAF: 0.0010022,
                        passingVariants: 22,
                        singleVariants: 15,
                        stdErr: 0.031608,
                        beta: 0.0076242,
                    },
                    "5/5 + 0/5 1%": {
                        n: 41112,
                        pValue: 0.95237,
                        combinedAF: 0.0082701,
                        passingVariants: 89,
                        singleVariants: 47,
                        stdErr: 0.023386,
                        beta: -0.0013968,
                    },
                    "5/5 + 1/5 1%": {
                        n: 41112,
                        pValue: 0.9984,
                        combinedAF: 0.006932300000000001,
                        passingVariants: 84,
                        singleVariants: 45,
                        stdErr: 0.010551000000000001,
                        beta: 2.122e-5,
                    },
                    "11/11": {
                        n: 28161,
                        pValue: 0.38822,
                        combinedAF: 0.00074571,
                        passingVariants: 13,
                        singleVariants: 8,
                        stdErr: 0.037993,
                        beta: -0.032783,
                    },
                },
                {
                    dataset: "52k",
                    phenotype: "Phenotype*",
                    gene: "Gene*",
                    pValue: 0.795,
                    beta: -0.0328,
                    LofTee: {
                        n: 17260,
                        pValue: 0.24698,
                        combinedAF: 0.00034762,
                        passingVariants: 5,
                        singleVariants: 4,
                        stdErr: 0.067554,
                        beta: -0.078211,
                    },
                    "5/5": {
                        n: 32927,
                        pValue: 0.8093899999999999,
                        combinedAF: 0.0010022,
                        passingVariants: 22,
                        singleVariants: 15,
                        stdErr: 0.031608,
                        beta: 0.0076242,
                    },
                    "16/16": {
                        n: 17260,
                        pValue: 0.24698,
                        combinedAF: 0.00034762,
                        passingVariants: 5,
                        singleVariants: 4,
                        stdErr: 0.067554,
                        beta: -0.078211,
                    },
                    "5/5 + LofTee LC": {
                        n: 32927,
                        pValue: 0.8093899999999999,
                        combinedAF: 0.0010022,
                        passingVariants: 22,
                        singleVariants: 15,
                        stdErr: 0.031608,
                        beta: 0.0076242,
                    },
                    "5/5 + 0/5 1%": {
                        n: 41112,
                        pValue: 0.95237,
                        combinedAF: 0.0082701,
                        passingVariants: 89,
                        singleVariants: 47,
                        stdErr: 0.023386,
                        beta: -0.0013968,
                    },
                    "5/5 + 1/5 1%": {
                        n: 41112,
                        pValue: 0.9984,
                        combinedAF: 0.006932300000000001,
                        passingVariants: 84,
                        singleVariants: 45,
                        stdErr: 0.010551000000000001,
                        beta: 2.122e-5,
                    },
                    "11/11": {
                        n: 28161,
                        pValue: 0.38822,
                        combinedAF: 0.00074571,
                        passingVariants: 13,
                        singleVariants: 8,
                        stdErr: 0.037993,
                        beta: -0.032783,
                    },
                },
            ],
        };
    },
    mounted() {},
    methods: {
        capitalizedFormatter: Formatters.capitalizedFormatter,
        showFeatures(index) {
            console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
