<template>
    <div>
        <div class="forest-plot-html-wrapper row">
            <div class="start-min">{{this.plotData.low_min}}</div>
            <div class="beta-0" :style="'left:'+this.plotData.beta_0+'%;'">Beta: 0.00</div>
            <div class="end-max">{{this.plotData.high_max}}</div>
            <div
                v-for="(value,index) in this.plotData.data"
                class="forest-plot-html-row"
                :class="index < (currentPage-1)*perPage || index >= currentPage*perPage ? 'hidden':''"
            >
                <template>
                    <div
                        :style="'width:'+value.width+'%; left:'+value.left+'%;'"
                        class="forest-plot-html-item"
                    >
                        <span
                            v-if="!!labelByDescriptionMap"
                            :class="'phenotype-name '+(value.left > value.right? 'left':'right')"
                        >{{labelByDescriptionMap[value[labelBy]].description}}</span>
                        <span
                            v-else
                            :class="'phenotype-name '+(value.left > value.right? 'left':'right')"
                        >{{value[labelBy]}}</span>
                    </div>
                    <div
                        class="beta-box"
                        :class="value[sortBy] < significant ? 'p-significant':value[sortBy] <= moderate ? 'p-moderate':''"
                        :style="'left:calc('+value.beta_position+'% - 9px);'"
                    >&nbsp;</div>
                    <div
                        v-if="value[sortBy] < significant"
                        :class="'phenotype-group-dot '+labelByDescriptionMap[value[labelBy]].group"
                    >
                        <span
                            class="phenotype-group-name"
                        >{{labelByDescriptionMap[value[labelBy]].group}}</span>
                    </div>
                </template>
            </div>
        </div>
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
import { BootstrapVueIcons } from "bootstrap-vue";
import sortUtils from "@/utils/sortUtils";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("forest-plot-html", {
    props: [
        "forestPlotData",
        "start",
        "end",
        "sortBy",
        "bulletBy",
        "labelBy",
        "labelByDescriptionMap",
        "significant",
        "moderate",
        "stdErr",
    ],
    data() {
        return { perPage: 25, currentPage: 1 };
    },
    modules: {
        uiUtils,
        sortUtils,
    },
    mounted: function () {},
    computed: {
        rows() {
            return this.forestPlotData.length;
        },
        plotData() {
            if (!!this.forestPlotData) {
                let content = {};

                content["data"] = this.forestPlotData;

                sortUtils.sortEGLTableData(
                    content["data"],
                    this.sortBy,
                    true,
                    false
                );

                let tempCiStartArr = [],
                    tempCiEndArr = [];

                content["data"].map((d) => {
                    let dichotomous = this.labelByDescriptionMap[
                        d[this.labelBy]
                    ].dichotomous;

                    let high = d[this.bulletBy] + d[this.stdErr] * 1.96;

                    tempCiEndArr.push(high);

                    let low = d[this.bulletBy] - d[this.stdErr] * 1.96;

                    tempCiStartArr.push(low);

                    let measure = d[this.bulletBy];
                    /*
                    let high = dichotomous
                        ? Math.exp(d[this.bulletBy] + d[this.stdErr] * 1.96)
                        : d[this.bulletBy] + d[this.stdErr] * 1.96;

                    tempCiEndArr.push(high);
                    let low = dichotomous
                        ? Math.exp(d[this.bulletBy] - d[this.stdErr] * 1.96)
                        : d[this.bulletBy] - d[this.stdErr] * 1.96;

                    tempCiStartArr.push(low);

                    let measure = dichotomous
                        ? Math.exp(d[this.bulletBy])
                        : d[this.bulletBy];
                        */

                    d["high"] = high;
                    d["low"] = low;
                    d["measure"] = measure;
                });

                tempCiStartArr.sort((a, b) => a - b);

                content["low_min"] = tempCiStartArr[0];

                tempCiEndArr.sort((a, b) => b - a);

                content["high_max"] = tempCiEndArr[0];

                content["max_min_difference"] =
                    content["high_max"] - content["low_min"];

                content["beta_0"] =
                    ((content["max_min_difference"] - content["high_max"]) /
                        content["max_min_difference"]) *
                    100;

                //console.log(content);

                content["data"].map((item) => {
                    let updated = item;
                    let itemWidth =
                        ((item.high - item.low) / content.max_min_difference) *
                        100;
                    let itemLeft =
                        ((item.low - content.low_min) /
                            content.max_min_difference) *
                        100;
                    let itemRight =
                        ((content.high_max - item.high) /
                            content.max_min_difference) *
                        100;

                    let itemBeta =
                        ((item.measure - content.low_min) /
                            content.max_min_difference) *
                        100;

                    updated["width"] = itemWidth;
                    updated["left"] = itemLeft;
                    updated["right"] = itemRight;
                    updated["beta_position"] = itemBeta;

                    return updated;
                });

                return content;
            } else {
                return [];
            }
        },
    },
    watch: {},
    methods: {},
});
</script>

<style>
@import url("/css/forestPlotHtml.css");
</style>
