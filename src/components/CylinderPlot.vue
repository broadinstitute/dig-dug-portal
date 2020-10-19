<template>
    <div class="cylinder-plot-card-wrapper">
        <div class="min-value">{{ this.minValue }}</div>
        <div class="value-label">{{ plotLabel }}</div>
        <div class="max-value">{{ this.maxValue }}</div>
        <div class="cylinder-plot-card">
            <div
                v-for="(value, index) in plotData"
                class="cylinder-plot-column"
                :class="
                    index < (currentPage - 1) * perPage ||
                    index >= currentPage * perPage
                        ? 'hidden'
                        : ''
                "
            >
                <div class="cylinder" :style="getCylinderStyle(value)">
                    <span
                        v-for="(phenotype, i) in cylinderItems"
                        :key="phenotype"
                        class="cylinder-item reference"
                        :class="'color-' + (i + 1)"
                        >&nbsp;
                        <!--<span style="color: white">
                            {{ value[phenotype + ":" + renderBy] }}
                        </span>-->
                    </span>
                    <span class="gene-name">{{ value.gene }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import uiUtils from "@/utils/uiUtils";
import formatters from "@/utils/formatters";

Vue.use(BootstrapVueIcons);

export default Vue.component("cylinder-plot", {
    props: [
        "cylinderPlotData",
        "renderBy",
        "labelMap",
        "significant",
        "moderate",
        "weak",
        "per-page",
        "current-page",
        "cylinderItems",
        "plotLabel",
    ],
    data() {
        return {
            maxValue: null,
            minValue: null,
        };
    },
    modules: {
        uiUtils,
        formatters,
    },
    mounted: function () {},
    computed: {
        plotData() {
            let content = this.cylinderPlotData;
            //console.log(this.renderBy);
            //console.log(this.maxValue);
            let renderValues = [],
                tempMax = 0,
                tempMin = null;
            content.map((i) => {
                for (const [key, value] of Object.entries(i)) {
                    if (key.includes(this.renderBy)) {
                        renderValues.push(value);
                        tempMax = value > tempMax ? value : tempMax;
                        tempMin =
                            tempMin == null
                                ? value
                                : value < tempMin
                                ? value
                                : tempMin;
                    }
                }
            });

            renderValues.sort();
            this.maxValue = Math.ceil(Math.abs(Math.log10(tempMax)));
            this.minValue = Math.ceil(Math.abs(Math.log10(tempMin)));
            //console.log("max", Math.ceil(Math.abs(Math.log10(this.maxValue))));
            //console.log("min", Math.ceil(Math.abs(Math.log10(this.minValue))));
            return content;
        },
    },
    watch: {},
    methods: {
        getCylinderStyle(VALUE) {
            let topPos, cylHeight;
            topPos = 30;
            cylHeight = 30;

            for (const [key, value] of Object.entries(i)) {
                if (key.includes(this.renderBy)) {
                    renderValues.push(value);
                    tempMax = value > tempMax ? value : tempMax;
                    tempMin =
                        tempMin == null
                            ? value
                            : value < tempMin
                            ? value
                            : tempMin;
                }
            }

            return "top:" + topPos + "%;height:" + cylHeight + "%;";
        },
    },
});
</script>

