<template>
    <div class="forest-plot-simple forest-plot-html-row">
        {{ pvalue }} - {{ se }} - {{ dichotomous }} <br />
        {{ start }} - {{ end }}
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
    },
});
</script>
<style>
@import url("/css/forestPlotHtml.css");
</style>
