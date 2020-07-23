<template>
    <div class="EGL-table-wrapper" :id="dataset">
        <b-container fluid v-if="!!configData && !!tableGeneData" class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col v-for="filter in configData[dataset]['filters']">
                    <div class="label">{{filter.label}}</div>
                    <template v-if="filter.type == 'search'">
                        <b-form-input type="text"></b-form-input>
                    </template>
                    <template v-else-if="filter.type == 'dropdown'">
                        <b-form-select :options="buildOptions(filter.field, tableGeneData.data)"></b-form-select>
                    </template>
                    <template v-else>Default filter</template>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid v-if="!!configData && !!tableGeneData">
            <b-row v-for="row in tableGeneData.data">
                <template v-for="(col, i) in configData[dataset]['render']">
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
import EffectorGenesFilters from "@/components/eg/EffectorGenesFilters";

Vue.use(AsyncComputed);
Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-mccarthy", {
    props: ["tableData"], //ignore for now, data comes from static file
    data() {
        return {
            staticTableData: null,
            config: null,
            dataset: "mccarthy",
        };
    },
    components: { EffectorGenesFeatures, EffectorGenesFilters },
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
        },
    },
    methods: {
        async fetchData() {
            return await fetch("/data/mccarthy_data.json").then(
                (resp) => (this.staticTableData = resp.json())
            );
        },
        async fetchConfig() {
            return await fetch("/data/mccarthy_config.json").then(
                (resp) => (this.config = resp.json())
            );
        },
        buildOptions(field, data) {
            return data
                .map((v) => v[field])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank
        },
    },
});
</script>

<style>
</style>
