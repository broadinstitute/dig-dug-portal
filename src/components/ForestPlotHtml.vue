<template>
    <div class="forest-plot-html-wrapper row">{{massagedData}}</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import sortUtils from "@/utils/sortUtils";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVueIcons);

export default Vue.component("forest-plot-html", {
    props: ["forestPlotData"],
    modules: {
        uiUtils,
    },
    mounted: function () {},
    computed: {
        massagedData() {
            let rawData = this.forestPlotData;

            return rawData;
        },
    },
});
</script>

<style>
@import url("/css/forestPlotHtml.css");
</style>
