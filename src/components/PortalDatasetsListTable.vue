<template>
    <div>
        <h2>
            New Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <b-table
            hover
            small
            responsive="sm"
            class="new datasets-list-table"
            :class="diseaseGroup.name"
            :items="datasetsListNew"
            :fields="fields"
            :sort-compare-options="{ numeric: true }"
        >
            <template v-slot:cell(title)="data">
                <a href="javascript:;">{{ data.item.title }}</a>
            </template>
            <template v-slot:cell(field_access)="data">
                <span :class="data.item.field_access">{{ data.item.field_access }}</span>
            </template>
            <template
                v-slot:cell(field_contributing_community)="data"
                v-if="diseaseGroup.name == 'md'"
            >
                <span class="community-icon" :class="data.item.field_contributing_community">&nbsp;</span>
            </template>
        </b-table>
        <h2>
            Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <b-table
            hover
            small
            responsive="sm"
            class="datasets-list-table"
            :class="diseaseGroup.name"
            :items="datasetsListNotNew"
            :fields="fields"
            :sort-compare-options="{ numeric: true }"
        >
            <template v-slot:cell(title)="data">
                <a href="javascript:;">{{ data.item.title }}</a>
            </template>
            <template v-slot:cell(field_access)="data">
                <span :class="data.item.field_access">{{ data.item.field_access }}</span>
            </template>
            <template
                v-slot:cell(field_contributing_community)="data"
                v-if="diseaseGroup.name == 'md'"
            >
                <span class="community-icon" :class="data.item.field_contributing_community">&nbsp;</span>
            </template>
        </b-table>
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

export default Vue.component("portal-datasets-list-table", {
    props: ["diseaseGroup", "datasetsList"],
    modules: {
        ...uiUtils
    },
    data() {
        return {
            fields: [
                {
                    key: "title",
                    label: "Dataset",
                    class: "column name",
                    sortable: true
                },
                {
                    key: "field_access",
                    label: "Access",
                    class: "column access",
                    sortable: true
                },
                {
                    key: "field_samples",
                    label: "Samples",
                    class: "column samples",
                    sortable: true
                },
                {
                    key: "field_ancestry2",
                    label: "Ancestry",
                    class: "column ancestry",
                    sortable: true
                },
                {
                    key: "field_data_type",
                    label: "Data type",
                    class: "column type",
                    sortable: true
                },
                {
                    key: "field_contributing_community",
                    label: "Contributing community",
                    class: "column disease-group"
                }
            ],
            isAtive: false
        };
    },
    computed: {
        rawDatasets: function() {
            var filteredDatasets = [].slice
                .call(this.datasetsList)
                .filter(dataset => {
                    let test =
                        this.diseaseGroup.name == "md"
                            ? dataset["field_portals"].includes("t2d") ||
                              dataset["field_portals"].includes("sleep") ||
                              dataset["field_portals"].includes("cvd") ||
                              dataset["field_portals"].includes("cd")
                            : this.datasetsList;

                    return test;
                });

            return filteredDatasets;
        },
        datasetsListNotNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
                .filter(dataset => dataset["field_featured"] != "featured");
            let way = "desc";
            let key = "field_samples";
            let keyType = "number";

            return uiUtils.sortJSON(newDatasets, key, keyType, way);
        },

        datasetsListNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
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
