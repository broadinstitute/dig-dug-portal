<template>
    <div class="forest-plot-simple">
        {{ pvalue }} - {{ se }} - {{ dichotomous }}
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
        pvalue: {
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
});
</script>
