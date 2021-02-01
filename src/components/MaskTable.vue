<template>
    <div>
        {{ maskData }} <br />HERE<br />
        {{ formattedMasks }}
        <!-- <div
            :class="[`feature-headers-${index}`, isHidden ? 'hidden' : '']"
            class="feature-content-wrapper"
            :key="`features_${index}`"
        >
            <b-row class="feature-header">
                <b-col
                    class="feature-header-item"
                    v-for="col in colNames"
                    :key="col"
                    >{{ col }}</b-col
                >
                <b-col class="feature-header-item" v-if="!dichotomous"
                    >Beta</b-col
                >
                <b-col class="feature-header-item" v-else>Odds Ratio</b-col>
            </b-row>
            <template v-for="(mask, j) in formattedMasks">
                <b-row
                    class="features"
                    :class="`features_${index}_${j}`"
                    :key="`features_${index}_${j}`"
                >
                    <b-col class="feature-content-item">{{ mask.mask }}</b-col>
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
                    <b-col class="feature-content-item" v-if="!dichotomous">
                        <span
                            :class="
                                mask.beta < 0
                                    ? 'effect negative'
                                    : 'effect positive'
                            "
                            >{{ mask.beta < 0 ? "&#9660;" : "&#9650;" }}</span
                        >
                        {{ effectFormatter(mask.beta) }}
                    </b-col>
                    <b-col class="feature-content-item" v-else>
                        <span
                            :class="
                                Math.exp(mask.beta) < 1
                                    ? 'effect negative'
                                    : 'effect positive'
                            "
                            >{{
                                Math.exp(mask.beta) < 1 ? "&#9660;" : "&#9650;"
                            }}</span
                        >
                        {{ effectFormatter(Math.exp(mask.beta)) }}
                    </b-col>
                </b-row>
            </template>
            {{ formattedMasks }}
        </div>
        <div
            class="feature-plot-wrapper"
            :class="[`feature-plot-${index}`, isHidden ? 'hidden' : '']"
            :key="`plot_${index}`"
        >
            <b-col>Forest Plot</b-col>

            <forest-plot
                :data="formattedMasks"
                :id="`fplot_${index}`"
                :element="`fplot_${index}`"
                :dichotomous="dichotomous"
                :ref="`fplot_${index}`"
            ></forest-plot>
            THEREEEEEE
        </div> -->
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import ForestPlot from "@/components/ForestPlot";

// import * as am4core from "@amcharts/amcharts4/core";
// import * as am4charts from "@amcharts/amcharts4/charts";
// import am4themes_animated from "@amcharts/amcharts4/themes/animated";
// am4core.useTheme(am4themes_animated);

export default Vue.component("mask-table", {
    props: {
        maskData: Array,
        index: [String, Number],
        dichotomous: Boolean,
        isHidden: { type: Boolean, default: false },
    },
    component: ForestPlot,
    data() {
        return {
            colNames: [
                "Mask",
                "P-Value",
                "Combined AF",
                "Passing Variants",
                "Singleton Variants",
                "Standard Error",
                "Sample Size",
            ],
            masks: {
                LoF_HC: { description: "LofTee", sort: 0 },
                "16of16": { description: "16/16", sort: 1 },
                "11of11": { description: "11/11 ", sort: 2 },
                "5of5": { description: "5/5", sort: 3 },
                "5of5_LoF_LC": { description: "5/5 + LofTee LC", sort: 4 },
                "1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
                "0of5_1pct": { description: "5/5 + 0/5 1% ", sort: 6 },
            },
        };
    },
    created() {},
    computed: {
        formattedMasks() {
            console.log("inside");
            let sorted = [];
            // let keys = Object.keys(this.masks);
            // keys.forEach((key, index) => {
            //     console.log("key", key);
            //     console.log("index", index);
            //     this.maskData.forEach((item, j) => {
            //         if (item.mask == key) {
            //             console.log("yes", key);
            //             this.sorted.push(this.maskData[j]);
            //         }
            //     });
            // });
            // // for (let i = 0; i < this.maskData.length; i++) {
            // //     console.log("test", this.masks[i]);
            // //     let found = this.maskData.indexOf(this.masks[i]);
            // //     if (found > -1) {
            // //         console.log("found", found);
            // //         this.sorted.push(this.maskData[found]);
            // //     }
            // // }
            // return sorted;

            // console.log("changed");
            // // let sorted = this.maskData.sort((a, b) => {
            // //     if (this.maskData[a.mask].sort < this.masks[b.mask].sort) {
            // //         console.log("less");
            // //         console.log("a", this.masks[a.mask]);
            // //         console.log("b", this.masks[b.mask]);
            // //         return -1;
            // //     } else if (this.maskData[a.mask].sort > this.masks[b.mask].sort) {
            // //         console.log("more");
            // //         console.log("a", this.masks[a.mask]);
            // //         console.log("b", this.masks[b.mask]);
            // //         return 1;
            // //     }
            // //     console.log("equal");
            // //     return 0;
            // // });
            sorted = this.maskData.slice().sort((a, b) => {
                // console.log("a", a);
                // console.log("b", b);
                // if (this.masks[a.mask].sort < this.masks[b.mask].sort) {
                //     console.log("less");
                //     return -1;
                // } else if (this.masks[a.mask].sort > this.masks[b.mask].sort) {
                //     console.log("more");

                //     return 1;
                // }
                // console.log("equal");
                // return 0;
                console.log("here");
                return this.masks[a.mask].sort - this.masks[b.mask].sort;
            });
            // return sorted.map((m) => ({
            //     ...m,
            //     mask: this.masks[m.mask].description,
            // }));
            return sorted;
        },
    },
    watch: {
        maskData(newData, oldData) {
            console.log("watch changed", newData);
        },
    },

    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");
</style>
