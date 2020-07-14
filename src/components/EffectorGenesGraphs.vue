<template>
    <div>
        <h3>EGL Graph</h3>
        <div>{{tableGraphData}}</div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-graphs", {
    props: ["graphData", "graphType", "gene"],
    mounted: function() {},
    computed: {
        tableGraphData() {
            if (!!this.graphData) {
                return this.graphData.data;
            }
        }
    }
});
</script>

<style>
</style>
