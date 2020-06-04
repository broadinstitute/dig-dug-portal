<template>
    <div>
        <h2>
            Filter Datasets
            <small class="datasets-list-header-small">(Click one to start)</small>
        </h2>
        <div v-if="diseaseGroup.name == 'md'" class="datasets-filter-wrapper">
            <h4>Disease group</h4>
            <div
                v-for="(row, i) in diseaseGroupsFiltered"
                v-on:click="setSeletedDiseaseGroup(row.name)"
                class="btn btn-sm btn-disease-group"
                :class="row.name == selectedDiseaseGroup || (row.name == 'md' && selectedDiseaseGroup == null)? 'selected':''"
            >{{row.description}}</div>
        </div>
        <div class="datasets-filter-wrapper">
            <h4>Data type</h4>
            <div
                v-for="(row, i) in dataTypesList"
                v-on:click="setSeletedDatatype(row)"
                class="btn btn-sm btn-datatype"
                :class="row == selectedDatatype || (row == 'Show all' && selectedDatatype == null)? 'selected':''"
            >{{row}}</div>
        </div>
        <div class="datasets-filter-wrapper">
            <h4>Phenotype</h4>
            <div
                v-for="(row, i) in phenotypeGroups"
                v-on:click="setSeletedPhenotypeGroup(row)"
                class="btn btn-sm btn-phenotype"
                :class="row == selectedPhenotypeGroup || (row == 'Show all' && selectedPhenotypeGroup == null)? 'selected':''"
            >{{row}}</div>
        </div>
        <div class="datasets-filter-wrapper phenotype">
            <div
                v-for="(row, i) in phenotypes"
                v-on:click="setSeletedPhenotype(row.description)"
                v-if="row.group == selectedPhenotypeGroup"
                class="btn btn-sm btn-phenotype"
                :class="row.description == selectedPhenotype? 'selected':''"
            >{{row.description}}</div>
        </div>

        <h2 style="margin-top: 30px;">
            New Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <div class="new datasets-list-table">
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th class="column name" v-on:click="setSortKey('title')">Dataset</th>
                        <th class="column access" v-on:click="setSortKey('field_access')">Access</th>
                        <th class="column samples" v-on:click="setSortKey('field_samples')">Samples</th>
                        <th class="column ancestry" v-on:click="setSortKey('field_ancestry2')">Ancestry</th>
                        <th class="column type" v-on:click="setSortKey('field_data_type')">Data type</th>
                        <th
                            class="column disease-group"
                            v-if="diseaseGroup.name == 'md'"
                        >Contributing community</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, i) in datasetsListNew"
                        v-if="(selectedDatatype == null || selectedDatatype == row.field_data_type) && (selectedPhenotype == null || row.field_phenotypes.includes(selectedPhenotype) ) && (selectedDiseaseGroup == null || row.field_portals.includes(selectedDiseaseGroup))">
                        <td class="column name">
                            <a
                                :href="'/datasetinspector.html?dataset='+row.field_dataset_id"
                            >{{ row.title }}</a>
                        </td>
                        <td class="column access">
                            <span :class="row.field_access">{{ row.field_access }}</span>
                        </td>
                        <td class="column samples">{{ row.field_samples }}</td>
                        <td class="column ancestry">{{ row.field_ancestry2 }}</td>
                        <td class="column type">{{ row.field_data_type }}</td>
                        <td class="column disease-group" v-if="diseaseGroup.name == 'md'">
                            <span
                                class="community-icon"
                                :class="row.field_contributing_community"
                            >&nbsp;</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2>
            Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h2>
        <div class="datasets-list-table">
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th class="column name" v-on:click="setSortKey('title')">Dataset</th>
                        <th class="column access" v-on:click="setSortKey('field_access')">Access</th>
                        <th class="column samples" v-on:click="setSortKey('field_samples')">Samples</th>
                        <th class="column ancestry" v-on:click="setSortKey('field_ancestry2')">Ancestry</th>
                        <th class="column type" v-on:click="setSortKey('field_data_type')">Data type</th>
                        <th
                            class="column disease-group"
                            v-if="diseaseGroup.name == 'md'"
                        >Contributing community</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, i) in datasetsListNotNew"
                        v-if="(selectedDatatype == null || selectedDatatype == row.field_data_type) && (selectedPhenotype == null || row.field_phenotypes.includes(selectedPhenotype) ) && (selectedDiseaseGroup == null || row.field_portals.includes(selectedDiseaseGroup))">
                        <td class="column name">
                            <a
                                :href="'/datasetinspector.html?dataset='+row.field_dataset_id"
                            >{{ row.title }}</a>
                        </td>
                        <td class="column access">
                            <span :class="row.field_access">{{ row.field_access }}</span>
                        </td>
                        <td class="column samples">{{ row.field_samples }}</td>
                        <td class="column ancestry">{{ row.field_ancestry2 }}</td>
                        <td class="column type">{{ row.field_data_type }}</td>
                        <td class="column disease-group" v-if="diseaseGroup.name == 'md'">
                            <span
                                class="community-icon"
                                :class="row.field_contributing_community"
                            >&nbsp;</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import uiUtils from "@/utils/uiUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("portal-datasets-list-table", {
    props: [
        "diseaseGroups",
        "phenotypes",
        "diseaseGroup",
        "datasetsList",
        "datasetsIDs"
    ],
    modules: {
        ...uiUtils
    },
    data() {
        return {
            isAtive: false,
            selectedPhenotypeGroup: null,
            selectedPhenotype: null,
            selectedDatatype: null,
            selectedDiseaseGroup: null,
            sortKey: "title",
            sortDirection: "desc"
        };
    },
    computed: {
        diseaseGroupsFiltered: function() {

            let content = this.diseaseGroups;

            return content;
        },

        datasetsIDsList: function() {
            let content = this.datasetsIDs;
            return content;
        },

        rawDatasets: function() {
            var filteredDatasets = [].slice
                .call(this.datasetsList)
                .filter(dataset => {
                    let contents =
                        this.diseaseGroup.name == "md"
                            ? dataset["field_portals"].includes("t2d") ||
                              dataset["field_portals"].includes("sleep") ||
                              dataset["field_portals"].includes("cvd") ||
                              dataset["field_portals"].includes("cd")
                            : this.datasetsList;

                    return contents;
                });

            return filteredDatasets;
        },

        datasetsListNotNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
                .filter(dataset => dataset["field_featured"] != "featured");
            let way = this.sortDirection;
            let key = this.sortKey;
            let keyType = (key == "field_samples")?"number":"";

            return uiUtils.sortJSON(newDatasets, key, keyType, way);
        },

        datasetsListNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
                .filter(dataset => dataset["field_featured"] == "featured");
            let way = this.sortDirection;
            let key = this.sortKey;
            let keyType = (key == "field_samples")?"number":"";

            return uiUtils.sortJSON(newDatasets, key, keyType, way);
        },

        dataTypesList: function() {
            let content = [
                ...new Set(this.rawDatasets.map(x => x.field_data_type))
            ];
            content.push("Show all");

            return content;
        },

        phenotypeGroups: function() {
            let content = [...new Set(this.phenotypes.map(x => x.group))];
            content.push("Show all");

            return content;
        }
    },
    methods: {
        setSeletedDiseaseGroup(diseaseGroup) {
            this.selectedDiseaseGroup = (diseaseGroup == "md")? null: diseaseGroup;
        },
        setSeletedDatatype(datatype) {
            this.selectedDatatype = (datatype == "Show all")? null: datatype;
        },
        setSeletedPhenotypeGroup(phenotypeGroup) {
            this.selectedPhenotypeGroup = (phenotypeGroup == "Show all")? null: phenotypeGroup;
            if (phenotypeGroup == "Show all") this.selectedPhenotype = null;
        },
        setSeletedPhenotype(phenotype) {
            this.selectedPhenotype = phenotype;
        },
        setSortKey(key) {
            this.sortKey = key;
            this.sortDirection = this.sortDirection == "desc"? "asc":"desc";
        }
    }
});
</script>

<style>
@import url("/css/datasetsList.css");
</style>
