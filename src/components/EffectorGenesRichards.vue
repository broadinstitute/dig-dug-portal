<template>
    <div>
        <div>
            <effector-genes-graph-richards :graphData="graphData" graphType="line"></effector-genes-graph-richards>
        </div>
        <div class="EGL-table-wrapper">{{tableGeneData}}</div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesGraphRichards from "@/components/EffectorGenesGraphRichards.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-richards", {
    props: ["tableData"],
    components: {
        EffectorGenesGraphRichards
    },
    mounted: function() {},
    computed: {
        tableGeneData() {
            return this.tableData;
        },
        graphData: function() {
            return this.tableData;
        }
    }
});
</script>

<style>
</style>
