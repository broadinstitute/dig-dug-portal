<template>
    <div>
        <div class="EGL-table-wrapper">{{tableGeneData}}</div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-manning", {
    props: ["tableData"],
    components: {},
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
