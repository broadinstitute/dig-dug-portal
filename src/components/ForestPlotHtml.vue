<template>
    <div class="forest-plot-html-wrapper row" v-if="!!this.plotData">
        <div class="ci-start-min">{{this.plotData.ci_start_min}}</div>
        <div class="beta-0" :style="'left:'+this.plotData.beta_0+'%;'">Beta: 0.00</div>
        <div class="ci-end-max">{{this.plotData.ci_end_max}}</div>
        <div v-for="(value,name,index) in this.plotData.data" class="forest-plot-html-row">
            <template>
                <div
                    :style="'width:'+value.width+'%; left:'+value.left+'%;'"
                    class="forest-plot-html-item"
                >
                    <span
                        class="phenotype-name"
                        :class="value.left > value.right? 'left':'right'"
                    >{{value.phenotype}}{{value.beta}}</span>
                </div>
                <div
                    class="beta-box"
                    :class="value.log_pvalue < 1 ? 'p-significant': 'p-insignificant'"
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
    props: ["forestPlotData"],
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
                    "log_pvalue",
                    true,
                    false
                );

                let tempCiStartArr = [];

                content["data"].map((d) => tempCiStartArr.push(d.ci_start));
                tempCiStartArr.sort((a, b) => a - b);

                content["ci_start_min"] = tempCiStartArr[0];

                let tempCiEndArr = [];

                content["data"].map((d) => tempCiEndArr.push(d.ci_end));
                tempCiEndArr.sort((a, b) => b - a);

                content["ci_end_max"] = tempCiEndArr[0];
                content["ci_max_min_difference"] =
                    content["ci_end_max"] - content["ci_start_min"];

                content["beta_0"] =
                    ((content["ci_max_min_difference"] -
                        content["ci_end_max"]) /
                        content["ci_max_min_difference"]) *
                    100;

                content["data"].map((item) => {
                    let updated = item;
                    let itemWidth =
                        ((item.ci_end - item.ci_start) /
                            content.ci_max_min_difference) *
                        100;
                    let itemLeft =
                        ((item.ci_start - content.ci_start_min) /
                            content.ci_max_min_difference) *
                        100;
                    let itemRight =
                        ((content.ci_end_max - item.ci_end) /
                            content.ci_max_min_difference) *
                        100;

                    let itemBeta =
                        ((item.beta - content.ci_start_min) /
                            content.ci_max_min_difference) *
                        100;

                    updated["width"] = itemWidth;
                    updated["left"] = itemLeft;
                    updated["right"] = itemRight;
                    updated["beta_position"] = itemBeta;

                    return updated;
                });

                //console.log("content", content);
                console.log("-------------------------------------");
                content["data"].map((d) => {
                    console.log(d.phenotype, ": ", d.log_pvalue);
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
