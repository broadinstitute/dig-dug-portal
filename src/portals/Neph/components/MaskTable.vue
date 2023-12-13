<template>
    <div>
        <div
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
            <!-- <template v-for="(mask, j) in maskData"> -->
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
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import ForestPlot from "@/components/ForestPlot";

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
            //{5of5_noLoF': -1,}
            masks: {
                "LoF_HC": { description: "LofTee", sort: 0 },
                "15of15": { description: "15/15", sort: 1 },
                "11of11": { description: "11/11 ", sort: 2 },
                "5of5": { description: "5/5", sort: 3 },
                "5of5_LoF_LC_1pct": { description: "5/5 + LofTee LC 1%", sort: 4 },
                "1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
                "0of5_1pct": { description: "5/5 + 0/5 1%", sort: 6 },
				"0of5": { description: "0/5", sort: 7 },
                "1of5_noLoF": { description: "1/5 - LoFTee", sort: 8 },
                "5of5_noLoF": { description: "5/5 - LofTee", sort: 10 },
				
                //"LoF_HC": { description: "LofTee", sort: 0 },
                //"15of15": { description: "15/15", sort: 1 },
                //"11of11": { description: "11/11 ", sort: 2 },
                //"5of5": { description: "5/5", sort: 3 },
                //"5of5_LoF_LC": { description: "5/5 + LofTee LC", sort: 4 },
                //"5of5_LoF_LC_1pct": { description: "5/5 + 1/5 noLoF %1", sort: 4 },
                //"1of5_1pct": { description: "5/5 + 1/5 1%", sort: 5 },
                //"0of5_1pct": { description: "5/5 + 0/5 1% ", sort: 6 },
                //"0of5": { description: "5/5 + 0/5 ", sort: 7 },
                //"1of5_noLoF": { description: "5/5 + 1/5 noLoF", sort: 8 },
                //"5of5_noLoF": { description: "5/5 + 1/5 noLoF", sort: 10 }
            },
        };
    },
    created() {
        
    },
    computed: {
        formattedMasks() {
            //console.log(this.maskData);
            let sorted = this.maskData.slice().sort((a, b) => {
                if (this.masks[a.mask].sort < this.masks[b.mask].sort)
                    return -1;
                if (this.masks[b.mask].sort < this.masks[a.mask].sort) return 1;
                return 0;
            }); 
            sorted = sorted.filter((item) => {
                    return this.masks[item.mask].sort < 7;
                });
            let returndata = sorted.map((m) => ({
                ...m,
                mask: this.masks[m.mask].description,
            }));
            //console.log('here:'+returndata.length);
            return returndata;
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
