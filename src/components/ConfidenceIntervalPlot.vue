<template>
    <div>
        <forest-plot :data="geneAssociations" element="plot2"></forest-plot>
    </div>
</template>


<script>
import Vue from "vue";

import ForestPlot from "@/components/ForestPlot.vue";

import Formatters from "@/utils/formatters.js";

export default Vue.component("confidence-interval-plot", {
    props: ["geneAssociations", "isDichotomous"],

    data() {
        return {};
    },
    components: {
        ForestPlot
    },

    mounted() {},
    methods: {},

    computed: {
        // getLofTeeMask() {
        //     // for (let i = 0; i < this.geneAssociations.masks.length; i++) {
        //     //     if (this.geneAssociations.masks[i].mask == "LofTee") {
        //     //         console.log(this.geneAssociations.masks[i]);
        //     //         return [this.geneAssociations.masks[i]];
        //     //     }
        //     // }
        //     return this.geneAssociations.masks;
        // }
    },

    watch: {}
});
</script>
