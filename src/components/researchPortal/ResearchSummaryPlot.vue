<template>
Hello world
<p>Phenotype:</p>
<input v-model="phenotype"/>
<p>Gene or region:</p>
<input v-model="region"/>
<button>Get associations</button>
</template>
<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("research-summary-plot", {
    props: [],
    data(){
        return {
            phenotype: "Enter a phenotype",
            region: "Enter a gene or region",
        };
    },
    mounted: function () {},
	computed: {},
	watch: {},
    methods: {
        ...uiUtils,
        async getAssociations(phenotype, region){
            let assocServer = "https://bioindex.hugeamp.org/api/bio"; // will this ever change?
            let queryURL = `${assocServer}/query/associations?q=${phenotype},${region}`
            let assocJSON = await fetch(queryURL).then((response) => response.json().data);
            let betaVals = assocJSON.map(item => item.beta); // from -1 to 1
            let betaBuckets = [];
            for (let i = -1; i < 1; i += 0.02){
                bucketCount = betaVals.filter(beta => beta >= i && beta < i + 0.02).length;
                betaBuckets = betaBuckets.concat([i, bucketCount]);
            }
        },

    },
});
</script>
<style></style>