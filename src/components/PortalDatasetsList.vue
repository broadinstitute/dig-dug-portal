<template>
    <div>
        <h2>
            New Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <div class="new datasets-list-table">
            <div class="each-dataset-wrapper header">
                <div class="column name" :class="diseaseGroup.name">Dataset</div>
                <div class="column access" :class="diseaseGroup.name">Access</div>
                <div class="column samples" :class="diseaseGroup.name">Samples</div>
                <div class="column ancestry" :class="diseaseGroup.name">Ancestry</div>
                <div class="column type" :class="diseaseGroup.name">Data type</div>
                <div
                    v-if="diseaseGroup.name == 'md'"
                    class="column disease-group"
                    :class="diseaseGroup.name"
                >contributing community</div>
            </div>
            <div v-for="(row, i) in datasetsListNew" class="each-dataset-wrapper">
                <div class="column name" :class="diseaseGroup.name">
                    <a href="javascrit:;">{{ row.title }}</a>
                </div>
                <div
                    class="column access"
                    :class="diseaseGroup.name+' '+row.field_access"
                >{{ row.field_access }}</div>
                <div class="column samples" :class="diseaseGroup.name">{{ row.field_samples }}</div>
                <div class="column ancestry" :class="diseaseGroup.name">{{ row.field_ancestry2 }}</div>
                <div class="column type" :class="diseaseGroup.name">{{ row.field_data_type }}</div>
                <div
                    class="column disease-group"
                    :class="diseaseGroup.name"
                >{{ row.field_contributing_community }}</div>
            </div>
        </div>
        <h2>
            Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <div class="datasets-list-table">
            <div class="each-dataset-wrapper header">
                <div class="column name" :class="diseaseGroup.name">Dataset</div>
                <div class="column access" :class="diseaseGroup.name">Access</div>
                <div class="column samples" :class="diseaseGroup.name">Samples</div>
                <div class="column ancestry" :class="diseaseGroup.name">Ancestry</div>
                <div class="column type" :class="diseaseGroup.name">Data type</div>
                <div
                    v-if="diseaseGroup.name == 'md'"
                    class="column disease-group"
                    :class="diseaseGroup.name"
                >contributing community</div>
            </div>
            <div v-for="(row, i) in datasetsListNotNew" class="each-dataset-wrapper">
                <div class="column name" :class="diseaseGroup.name">
                    <a href="javascrit:;">{{ row.title }}</a>
                </div>
                <div
                    class="column access"
                    :class="diseaseGroup.name+' '+row.field_access"
                >{{ row.field_access }}</div>
                <div class="column samples" :class="diseaseGroup.name">{{ row.field_samples }}</div>
                <div class="column ancestry" :class="diseaseGroup.name">{{ row.field_ancestry2 }}</div>
                <div class="column type" :class="diseaseGroup.name">{{ row.field_data_type }}</div>
                <div
                    class="column disease-group"
                    :class="diseaseGroup.name"
                >{{ row.field_contributing_community }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import BootstrapVue from "bootstrap-vue";
import groupBy from "lodash/groupBy";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVue);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("portal-datasets-list", {
    props: ["diseaseGroup", "datasetsList"],
    modules: {
        ...uiUtils
    },
    data() {
        return {
            isActive: false
        };
    },
    computed: {
        datasetsListNotNew: function() {
            let data = [].slice.call(this.datasetsList);
            let way = "desc";
            let key = "field_samples";
            let keyType = "number";

            return uiUtils.sortJSON(data, key, keyType, way);
        },

        datasetsListNew: function() {
            let newDatasets = [].slice
                .call(this.datasetsList)
                .filter(dataset => dataset["field_featured"] == "featured");
            let way = "desc";
            let key = "field_samples";
            let keyType = "number";

            return uiUtils.sortJSON(newDatasets, key, keyType, way);
        }
    },
    methods: {}
});
</script>

<style>
@import url("/css/datasetsList.css");
</style>
