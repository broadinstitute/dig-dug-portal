<template></template>

<script>
import Vue from "vue";
import ForestPlot from "@/components/ForestPlot";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export default Vue.component("gene-associations-masks", {
    props: ["masks", "dichotomous"],
    component: ForestPlot,
    data() {
        return {
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
    computed: {
        sortedMasks() {
            return this.masks.sort((a, b) => {
                if (this.masks[a.mask].sort < this.masks[b.mask].sort)
                    return -1;
                if (this.masks[b.mask].sort < this.masks[a.mask].sort) return 1;
                return 0;
            });
        },
    },
});
</script>
