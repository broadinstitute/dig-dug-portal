<template>
    <div class="forest-plot-html-wrapper row">
        <div class="start-min">{{this.plotData.start_min}}</div>
        <div class="beta-0" :style="'left:'+this.plotData.beta_0+'%;'">Beta: 0.00</div>
        <div class="end-max">{{this.plotData.end_max}}</div>
        <div v-for="(value,name,index) in this.plotData.data" class="forest-plot-html-row">
            <template>
                <div
                    :style="'width:'+value.width+'%; left:'+value.left+'%;'"
                    class="forest-plot-html-item"
                >
                    <span
                        class="phenotype-name"
                        :class="value.left > value.right? 'left':'right'"
                    >{{value.phenotype}}{{value[beta]}}</span>
                </div>
                <div
                    class="beta-box"
                    :class="value[pvalue] < 1 ? 'p-significant': 'p-insignificant'"
                    :style="'left:calc('+value.beta_position+'% - 9px);'"
                >&nbsp;</div>
            </template>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import sortUtils from "@/utils/sortUtils";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("forest-plot-html", {
    props: ["forestPlotData", "start", "end", "pvalue", "beta", "phenotypeid"],
    data() {
        return {};
    },
    modules: {
        uiUtils,
        sortUtils,
    },
    mounted: function () {},
    computed: {
        plotData() {
            if (!!this.forestPlotData) {
                let content = {};

                content["data"] = this.forestPlotData;

                sortUtils.sortEGLTableData(
                    content["data"],
                    this.pvalue,
                    true,
                    false
                );

                let tempCiStartArr = [];

                content["data"].map((d) => tempCiStartArr.push(d[this.start]));
                tempCiStartArr.sort((a, b) => a - b);

                content["start_min"] = tempCiStartArr[0];

                let tempCiEndArr = [];

                content["data"].map((d) => tempCiEndArr.push(d[this.end]));
                tempCiEndArr.sort((a, b) => b - a);

                content["end_max"] = tempCiEndArr[0];
                content["max_min_difference"] =
                    content["end_max"] - content["start_min"];

                content["beta_0"] =
                    ((content["max_min_difference"] - content["end_max"]) /
                        content["max_min_difference"]) *
                    100;

                content["data"].map((item) => {
                    let updated = item;
                    let itemWidth =
                        ((item.ci_end - item[this.start]) /
                            content.max_min_difference) *
                        100;
                    let itemLeft =
                        ((item[this.start] - content.start_min) /
                            content.max_min_difference) *
                        100;
                    let itemRight =
                        ((content.end_max - item[this.end]) /
                            content.max_min_difference) *
                        100;

                    let itemBeta =
                        ((item.beta - content.start_min) /
                            content.max_min_difference) *
                        100;

                    updated["width"] = itemWidth;
                    updated["left"] = itemLeft;
                    updated["right"] = itemRight;
                    updated["beta_position"] = itemBeta;

                    return updated;
                });

                /*console.log("content", content);
                console.log("-------------------------------------");
                content["data"].map((d) => {
                    console.log(d.phenotype, ": ", d[this.pvalue]);
                });*/

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
