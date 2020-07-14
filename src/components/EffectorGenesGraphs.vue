<template>
    <div class="feature-scores-wrapper hidden">{{tableGraphData}}</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-graphs", {
    props: ["graphData", "graphType"],
    mounted: function() {},
    computed: {
        tableGraphData() {
            if (!!this.graphData) {
                let features = {};

                this.graphData.data.forEach(element => {
                    features[element.gene] = element.features;
                });

                return features;
            }
        }
    }
});
</script>

<style>
</style>
