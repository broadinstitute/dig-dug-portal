<template>
    <div>
        <div
            :key="`features_${index}`"
            :class="[`feature-headers-${index}`, isHidden ? 'hidden' : '']"
            class="feature-content-wrapper"
        >
            <b-row class="feature-header">
                <b-col
                    v-for="col in colNames"
                    :key="col"
                    class="feature-header-item"
                    >{{ col }}</b-col
                >
                <b-col v-if="!dichotomous" class="feature-header-item"
                    >Beta</b-col
                >
                <b-col v-else class="feature-header-item">Odds Ratio</b-col>
            </b-row>
            <template v-for="(mask, j) in formattedMasks">
                <b-row
                    :key="`features_${index}_${j}`"
                    class="features"
                    :class="`features_${index}_${j}`"
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
                    <b-col v-if="!dichotomous" class="feature-content-item">
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
                    <b-col v-else class="feature-content-item">
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
            :key="`plot_${index}`"
            class="feature-plot-wrapper"
            :class="[`feature-plot-${index}`, isHidden ? 'hidden' : '']"
        >
            <b-col>Forest Plot</b-col>
            <forest-plot
                :id="`fplot_${index}`"
                :ref="`fplot_${index}`"
                :data="formattedMasks"
                :element="`fplot_${index}`"
                :dichotomous="dichotomous"
            ></forest-plot>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import ForestPlot from "@/components/ForestPlot";

export default Vue.component("MaskTable", {
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
        };
    },
    computed: {
        formattedMasks() {
            let sorted = this.maskData.slice().sort((a, b) => {
                return (
                    this.maskFormatter(a.mask).sort -
                    this.maskFormatter(b.mask).sort
                );
            });
            return sorted.map((m) => ({
                ...m,
                mask: this.maskFormatter(m.mask).description,
            }));
        },
    },
    created() {},

    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        maskFormatter: Formatters.maskFormatter,
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");
</style>
