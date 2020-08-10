<template>
    <div class="52k">
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row class="headers">
                <b-col>{{show}}</b-col>
                <b-col>pValue</b-col>
                <b-col>Beta</b-col>
            </b-row>
            <template v-for="(row, i) in json">
                <b-row class="data" :key="row[show] + i">
                    <b-col>{{row[show]}} - {{i}}</b-col>
                    <b-col class="pValue">{{row.pValue}}</b-col>
                    <b-col class="beta">{{row.beta}}</b-col>
                    <!-- <b-row class="features" >
                    <b-col v-for="feature in row" :key="Object.keys(feature)">{{feature}}</b-col>
                    </b-row>-->
                </b-row>
                <template v-for="(key) in Object.keys(row)">
                    <template v-if="typeof row[key] === 'object'">
                        <b-row class="features-headers">
                            <b-col>Filters</b-col>
                            <b-col v-for="(fh, j) in Object.keys(row[key])">{{fh}} - {{j}}</b-col>
                        </b-row>
                        <b-row class="features" :class="`features_${j}`" :key="`features_${j}`">
                            <b-col class="key">{{key}}</b-col>
                            <b-col v-for="item in row[key]">{{item}}</b-col>
                        </b-row>
                    </template>
                </template>
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
});
</script>

<style>
</style>
