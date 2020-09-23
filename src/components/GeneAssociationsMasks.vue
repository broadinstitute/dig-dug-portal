<template>
    <div class="EGLT-table fiftytwo">
        <!-- <forest-plot :data="test" :dichotomous="true"></forest-plot> -->
        <b-container fluid>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item">Phenotype</b-col>
                <b-col class="top-level-header-item">pValue</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">Odds Ratio</b-col>
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(row, i) in associations">
                <b-row
                    v-if="phenotypeMap[row.phenotype]"
                    class="data top-level-value"
                    :key="row.phenotype + i"
                >
                    <b-col class="top-level-value-item">
                        <a
                            :href="`/phenotype.html?phenotype=${row.phenotype}`"
                            >{{ phenotypeMap[row.phenotype].description }}</a
                        >
                    </b-col>
                    <b-col class="top-level-value-item pValue">{{
                        pValueFormatter(row.pValue)
                    }}</b-col>
                    <b-col class="top-level-value-item beta">
                        <template
                            v-if="!phenotypeMap[row.phenotype].dichotomous"
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
                    <b-col class="top-level-value-item beta">
                        <template
                            v-if="!!phenotypeMap[row.phenotype].dichotomous"
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
                    <b-col class="top-level-value-item">
                        <b-button
                            @click="showFeatures(i)"
                            class="view-features-btn"
                            >Masks + Plot</b-button
                        >
                    </b-col>
                </b-row>
                <div
                    v-if="phenotypeMap[row.phenotype]"
                    :class="`feature-headers-${i}`"
                    class="feature-content-wrapper hidden"
                    :key="`features_${i}`"
                >
                    <b-row class="feature-header">
                        <b-col
                            class="feature-header-item"
                            v-for="col in colNames"
                            :key="col"
                            >{{ col }}</b-col
                        >
                        <b-col
                            class="feature-header-item"
                            v-if="!phenotypeMap[row.phenotype].dichotomous"
                            >Beta</b-col
                        >
                        <b-col
                            class="feature-header-item"
                            v-if="!!phenotypeMap[row.phenotype].dichotomous"
                            >Odds Ratio</b-col
                        >
                    </b-row>
                    <template v-for="(mask, j) in row.masks">
                        <b-row
                            class="features"
                            :class="`features_${i}_${j}`"
                            :key="`features_${i}_${j}`"
                        >
                            <b-col class="feature-content-item">{{
                                mask.mask
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                pValueFormatter(mask.pValue)
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                Number.parseFloat(mask.combinedAF).toFixed(7)
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                mask.passingVariants
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                mask.singleVariants
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                Number.parseFloat(mask.stdErr).toFixed(5)
                            }}</b-col>
                            <b-col class="feature-content-item">{{
                                intFormatter(mask.n)
                            }}</b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!phenotypeMap[row.phenotype].dichotomous"
                            >
                                <span
                                    :class="
                                        mask.beta < 0
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        mask.beta < 0 ? "&#9660;" : "&#9650;"
                                    }}</span
                                >
                                {{ effectFormatter(mask.beta) }}
                            </b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!!phenotypeMap[row.phenotype].dichotomous"
                            >
                                <span
                                    :class="
                                        Math.exp(mask.beta) < 1
                                            ? 'effect negative'
                                            : 'effect positive'
                                    "
                                    >{{
                                        Math.exp(mask.beta) < 1
                                            ? "&#9660;"
                                            : "&#9650;"
                                    }}</span
                                >
                                {{ effectFormatter(Math.exp(mask.beta)) }}
                            </b-col>
                        </b-row>
                    </template>
                </div>
                <div
                    v-if="phenotypeMap[row.phenotype]"
                    class="feature-plot-wrapper hidden"
                    :class="`feature-plot-${i}`"
                    :key="`plot_${i}`"
                >
                    <b-col>Forest Plot</b-col>
                    <!-- <div :id="`plot_${i}`" class="plots"></div> -->
                    <forest-plot
                        :data="row.masks"
                        :id="`fplot_${i}`"
                        :element="`fplot_${i}`"
                        :dichotomous="!!phenotypeMap[row.phenotype].dichotomous"
                        :ref="`fplot_${i}`"
                    ></forest-plot>
                </div>
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
import ForestPlot from "@/components/ForestPlot";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export default Vue.component("gene-associations-masks", {
    props: ["associations", "phenotypeMap"],
    component: ForestPlot,
    data() {
        return {
            colNames: [
                "Mask",
                "P-Value",
                "Combined AF",
                "Passing Variants",
                "Single Variants",
                "Standard Error",
                "Sample Size",
            ],
            visible: false,
        };
    },
    mounted() {},
    methods: {
        capitalizedFormatter: Formatters.capitalizedFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        showFeatures(index) {
            //console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
            uiUtils.showHideElement("feature-plot-" + index);
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
