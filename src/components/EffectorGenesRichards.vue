<template>
    <div>
        <div>
            <effector-genes-graphs :v-if="!!graphData" :graphData="graphData"></effector-genes-graphs>
        </div>
        <h3>Richards EGL</h3>
        <div>{{tableGeneData}}</div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesGraphs from "@/components/EffectorGenesGraphs.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-richards", {
    props: ["tableData"],
    components: {
        EffectorGenesGraphs
    },
    mounted: function() {},
    computed: {
        tableGeneData() {
            return this.tableData;
        },
        graphData() {
            let content = this.tableData;
            return content;
        }
    }
});
</script>

<style>
</style>
