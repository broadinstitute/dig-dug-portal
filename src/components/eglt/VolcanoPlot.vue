<template>
    <div class="volcano-plot-content">
        <canvas
            id="volcanoPlot"
            width="600"
            height="300"
            style="border: 1px solid #000000"
        >
        </canvas>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("volcano-plot", {
    props: ["plotData"],
    data() {
        return {};
    },
    mounted: function () {
        this.renderPlot();
    },
    computed: {},
    watch: {
        plotData() {
            //console.log("call");
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,
        renderPlot() {
            var c = document.getElementById("myCanvas");
            var ctx = c.getContext("2d");
            ctx.beginPath();
            ctx.arc(100, 50, 20, 0, 2 * Math.PI);
            ctx.fill();
        },
    },
});

$(function () {});
</script>

