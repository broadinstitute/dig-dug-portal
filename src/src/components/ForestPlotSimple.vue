<template>
    <div class="forest-plot-simple">
        <div class="forest-plot-html-row">
            <div class="plot">
                <div
                    class="forest-plot-html-item"
                    :style="'width:' + width + '%; left:' + startPos + '%;'"
                ></div>
                <div
                    class="beta-box"
                    :style="
                        (effect > 100 ? 'display:none; ' : '') +
                        'left:calc(' +
                        effectPos +
                        '% - 6px);'
                    "
                >
                    &nbsp;
                </div>
            </div>

            <div class="beta-0" style="left: 50%">
                <label>{{ dichotomous ? "1" : "0" }}</label>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("forest-plot-simple", {
    props: {
        effect: {
            type: Number,
            required: true,
        },
        se: {
            type: Number,
            required: true,
        },
        dichotomous: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    mounted() {},
    methods: {},
    computed: {
        start() {
            return !!this.dichotomous
                ? Math.exp(this.effect - this.se * 1.96)
                : this.effect - this.se * 1.96;
        },
        end() {
            return !!this.dichotomous
                ? Math.exp(this.effect + this.se * 1.96)
                : this.effect + this.se * 1.96;
        },
        width() {
            return ((this.end - this.start) / 2) * 100;
        },
        startPos() {
            return !!this.dichotomous
                ? (this.start / 2) * 100
                : ((1 + this.start) / 2) * 100;
        },
        effectPos() {
            return !!this.dichotomous
                ? (Math.exp(this.effect) / 2) * 100
                : ((1 + this.effect) / 2) * 100;
        },
    },
});
</script>
<style>
@import url("/css/forestPlotHtml.css");
</style>
