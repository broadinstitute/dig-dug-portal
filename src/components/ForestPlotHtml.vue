<template>
    <div>
        <div class="forest-plot-html-wrapper row">
            <div class="start-min">{{this.plotData.low_min}}</div>
            <div class="beta-0" :style="'left:'+this.plotData.beta_0+'%;'">0</div>
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
                            v-if="!!labelMap"
                            :class="'phenotype-name '+(value.left > value.right? 'left':'right')"
                        >{{labelMap[value[labelBy]].description}}</span>
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
                        v-if="!!labelMap"
                        :class="'phenotype-group-dot '+labelMap[value[labelBy]].group"
                    >
                        <span class="phenotype-group-name">{{labelMap[value[labelBy]].group}}</span>
                    </div>
                </template>
            </div>
            <div class="forest-plot-html-legend-wrapper">
                <div class="forest-plot-html-legend-handler">
                    <a
                        href="javascript:;"
                        v-on:click="showLegends('forest-plot-html-legend-content')"
                    >> Show legends</a>
                </div>
                <div class="forest-plot-html-legend-content hidden">
                    <ul>
                        <li>
                            <span class="beta-box p-significant">&nbsp;</span>
                            {{sortBy}}&nbsp;&lt;&equals;&nbsp;{{significant}}
                        </li>
                        <li>
                            <span class="beta-box p-moderate">&nbsp;</span>
                            {{significant}}&nbsp;&lt;&nbsp;{{sortBy}}&nbsp;&lt;&equals;&nbsp;{{moderate}}
                        </li>
                        <li>
                            <span class="beta-box">&nbsp;</span>
                            {{sortBy}}&nbsp;&gt;{{moderate}}
                        </li>
                    </ul>
                    <ul v-if="!!labelMap">
                        <template>
                            <li v-for="group in this.plotData.label_group">
                                <span :class="'phenotype-group-dot '+group">&nbsp;</span>
                                {{group}}
                            </li>
                        </template>
                    </ul>
                </div>
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
        "labelMap",
        "significant",
        "moderate",
        "stdErr",
        "countDichotomous",
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
        legendContent() {
            if (!!this.forestPlotData) {
            }
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

                let tempCiStart = 0,
                    tempCiEnd = 0;

                let labelGroup = [];

                content["data"].map((d) => {
                    let dichotomous =
                        this.countDichotomous == 1
                            ? this.labelMap[d[this.labelBy]].dichotomous
                            : 0;

                    let high = dichotomous
                        ? Math.exp(d[this.bulletBy] + d[this.stdErr] * 1.96)
                        : d[this.bulletBy] + d[this.stdErr] * 1.96;

                    tempCiEnd = high > tempCiEnd ? high : tempCiEnd;
                    let low = dichotomous
                        ? Math.exp(d[this.bulletBy] - d[this.stdErr] * 1.96)
                        : d[this.bulletBy] - d[this.stdErr] * 1.96;

                    tempCiStart = low < tempCiStart ? low : tempCiStart;

                    let measure = dichotomous
                        ? Math.exp(d[this.bulletBy])
                        : d[this.bulletBy];

                    d["high"] = high;
                    d["low"] = low;
                    d["measure"] = measure;

                    labelGroup.push(this.labelMap[d[this.labelBy]].group);
                });

                content["low_min"] = tempCiStart.toFixed(3);
                content["high_max"] = tempCiEnd.toFixed(3);
                content["max_min_difference"] =
                    content["high_max"] - content["low_min"];
                content["label_group"] = labelGroup.filter(
                    (v, i, arr) => arr.indexOf(v) == i
                );

                content["label_group"].sort();

                content["beta_0"] =
                    ((content["max_min_difference"] - content["high_max"]) /
                        content["max_min_difference"]) *
                    100;

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
    methods: {
        showLegends(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        },
    },
});
</script>

<style>
@import url("/css/forestPlotHtml.css");
</style>
