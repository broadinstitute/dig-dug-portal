<template>
    <div class="EGL-table-wrapper" id="mccarthy">
        <b-container fluid v-if="!!configData && !!tableGeneData">
            <b-row v-for="row in tableGeneData.data">
                <template v-for="(col, i) in configData['mccarthy']['render']">
                    <b-col :class="i" :key="i">{{row[i]}}</b-col>
                </template>

                <effector-genes-features :features="row.features"></effector-genes-features>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import AsyncComputed from "vue-async-computed";
import { BootstrapVueIcons } from "bootstrap-vue";
import EffectorGenesFeatures from "@/components/eg/EffectorGenesFeatures";

Vue.use(AsyncComputed);
Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-mccarthy", {
    props: ["tableData"], //ignore for now, data comes from static file
    data() {
        return {
            staticTableData: null,
            config: null
        };
    },
    components: { EffectorGenesFeatures },
    created() {
        this.fetchData();
        this.fetchConfig();
    },
    mounted() {},
    asyncComputed: {
        tableGeneData() {
            return this.staticTableData;
        },
        graphData() {
            return this.staticTableData;
        },
        configData() {
            return this.config;
        }
    },
    methods: {
        async fetchData() {
            return await fetch("/data/mccarthy_data.json").then(
                resp => (this.staticTableData = resp.json())
            );
        },
        async fetchConfig() {
            return await fetch("/data/mccarthy_config.json").then(
                resp => (this.config = resp.json())
            );
        }
    }
});
</script>

<style>
</style>
