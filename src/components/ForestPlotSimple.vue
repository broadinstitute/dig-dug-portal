<template>
    <div class="forest-plot-simple">
        <div class="forest-plot-html-row">
            <div class="start-min">-1</div>
            <div class="beta-0" style="left: 50%">
                <label>0</label>
            </div>
            <div class="end-max">1</div>
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
            return ((1 + this.start) / 2) * 100;
        },
        effectPos() {
            return ((1 + this.effect) / 2) * 100;
        },
    },
});
</script>
<style>
@import url("/css/forestPlotHtml.css");
.forest-plot-simple {
    margin: 30px auto;
    position: relative;
}
.forest-plot-html-row {
    border-top: 1px solid #dddddd;
    margin: 10px auto;
}
#gait .beta-box {
    background-color: blueviolet;
}
</style>
