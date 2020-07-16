<template>
    <div>
        <div class="EGL-table-wrapper"></div>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-richards", {
    props: ["tableData"],
    mounted: function() {},
    computed: {
        tableGeneData() {
            return this.tableData;
        }
    }
});
</script>

<style>
</style>
