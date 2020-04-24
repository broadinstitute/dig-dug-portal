<template>
    <figure>
        <img :src="src" style="height: 300px" />
        <div v-show="showTitle">{{title || "QQ"}}</div>
    </figure>
</template>

<style scoped>
figure {
    font-size: 80%;
    font-style: italic;
    padding: 8px;
}
</style>

<script>
import Vue from "vue";

export default Vue.component("qq-plot", {
    props: ["phenotype", "title", "showTitle"],

    data() {
        return {
            chart: null
        };
    },

    computed: {
        src() {
            return `https://dig-analysis-data.s3.amazonaws.com/out/metaanalysis/plots/${this.phenotype.name}/qq.png`;
        }
    }
});
</script>
