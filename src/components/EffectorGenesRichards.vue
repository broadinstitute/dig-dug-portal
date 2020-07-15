<template>
    <div>
        <div>
            <effector-genes-graphs :graphData="graphData" graphType="line"></effector-genes-graphs>
        </div>
        <div class="EGL-table-wrapper">{{tableGeneData}}</div>
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
    mounted() {},
    computed: {
        tableGeneData() {
            return this.tableData;
        },
        graphData() {
            return this.tableData;
        }
    }
});
</script>

<style>
</style>
