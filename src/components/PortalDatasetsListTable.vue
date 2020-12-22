<template>
    <div class="page-info-wrapper">
        <h3>
            Filter Datasets
            <small class="datasets-list-header-small">(Click one to start)</small>
        </h3>
        <div v-if="diseaseGroup.name == 'md'" class="datasets-filter-wrapper">
            <h4>Disease group</h4>
            <div
                v-for="(row, i) in diseaseGroupsFiltered"
                v-if="row.memberCMD == true"
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
                v-for="(row, i) in rawPhenotypes"
                v-on:click="setSeletedPhenotype(row.description)"
                v-if="row.group == selectedPhenotypeGroup"
                class="btn btn-sm btn-phenotype"
                :class="row.description == selectedPhenotype? 'selected':''"
            >{{row.description}}</div>
        </div>

        <h3 style="margin-top: 30px;" v-if="datasetsListNew.length > 0">
            New Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h3>
        <div class="new datasets-list-table" v-if="datasetsListNew.length > 0">
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th class="column name" v-on:click="setSortKey('title')">Dataset</th>
                        <th class="column access" v-on:click="setSortKey('field_access')">Access</th>
                        <th class="column samples" v-on:click="setSortKey('field_samples')">Samples</th>
                        <th
                            class="column ancestry"
                            v-on:click="setSortKey('field_ancestry2')"
                        >Ancestry</th>
                        <th class="column type" v-on:click="setSortKey('field_data_type')">Data type</th>
                        <th
                            class="column disease-group"
                            v-if="diseaseGroup.name == 'md'"
                        >Contributing community</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, i) in datasetsListNew"
                        v-if="(selectedDatatype == null || selectedDatatype == row.field_data_type) &&  (selectedPhenotype == null || row.field_phenotypes.includes(selectedPhenotype) ) && (selectedPhenotypeGroup == null || row.phenotype_group.includes(selectedPhenotypeGroup)) &&(selectedDiseaseGroup == null || row.field_portals.includes(selectedDiseaseGroup))"
                    >
                        <td class="column name">
                            <a
                                :href="'/dinspector.html?dataset='+row.field_dataset_id"
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

        <h3 v-if="datasetsListNotNew.length > 0">
            Datasets
            <small class="datasets-list-header-small">(Click datasets for description)</small>
        </h3>
        <div class="datasets-list-table" v-if="datasetsListNotNew.length > 0">
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th class="column name" v-on:click="setSortKey('title')">Dataset</th>
                        <th class="column access" v-on:click="setSortKey('field_access')">Access</th>
                        <th class="column samples" v-on:click="setSortKey('field_samples')">Samples</th>
                        <th
                            class="column ancestry"
                            v-on:click="setSortKey('field_ancestry2')"
                        >Ancestry</th>
                        <th class="column type" v-on:click="setSortKey('field_data_type')">Data type</th>
                        <th
                            class="column disease-group"
                            v-if="diseaseGroup.name == 'md'"
                        >Contributing community</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, i) in datasetsListNotNew"
                        v-if="(selectedDatatype == null || selectedDatatype == row.field_data_type) && (selectedPhenotype == null || row.field_phenotypes.includes(selectedPhenotype) ) && (selectedPhenotypeGroup == null || row.phenotype_group.includes(selectedPhenotypeGroup)) &&(selectedDiseaseGroup == null || row.field_portals.includes(selectedDiseaseGroup))"
                    >
                        <td class="column name">
                            <a
                                :href="'/dinspector.html?dataset='+row.field_dataset_id"
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
import sortUtils from "@/utils/sortUtils";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("portal-datasets-list-table", {
    props: ["diseaseGroups", "phenotypes", "diseaseGroup", "datasetsList", "filter"],
    modules: {
        ...sortUtils
    },
    data() {
        return {
            isAtive: false,
            selectedPhenotypeGroup: null,
            selectedPhenotype: null,
            selectedDatatype: null,
            selectedDiseaseGroup: null,
            sortKey: "field_samples",
            ascending: false
        };
    },
    computed: {
        rawPhenotypes: function() {
            let allPhenotypesKpn = [];

            this.rawDatasets.map(x => {
                let datasetPhenotypes = x.field_phenotypes
                    .split("\r\n")
                    .map(p => allPhenotypesKpn.push(p));
            });

            let uniquePhenotypesKpn = [...new Set(allPhenotypesKpn)];

            let content = [];

            this.phenotypes.map(x => {
                let phenotype = x.description;
                if (uniquePhenotypesKpn.includes(phenotype)) content.push(x);
            });

            return content;
        },

        phenotypeGroups: function() {
            let content = [...new Set(this.rawPhenotypes.map(x => x.group))];
            content.push("Show all");

            return content;
        },

        phenotypesByGroups: function() {
            let content = {};

            this.phenotypeGroups.map(x => {
                let tempArray = [];

                this.phenotypes.map(p => {
                    if (p.group == x) {
                        tempArray.push(p.description.toLowerCase().trim());
                    }
                });

                content[x] = tempArray;
            });

            return content;
        },

        phenotypesInSelectedGroups: function() {
            let content = [];

            this.rawPhenotypes.map(x => {
                if (x.group == selectedPhenotypeGroup)
                    content.push(x.decription);
            });

            return content;
        },

        diseaseGroupsFiltered: function() {
            let content = this.diseaseGroups;

            return content;
        },

        datasetsIDsList: function() {
            let content = this.datasetsIDs;
            return content;
        },

        rawDatasets: function() {
            let filteredDatasets = [].slice
                .call(this.datasetsList)
                .filter(dataset => {
                    let contents = dataset["field_portals"].includes(
                        this.diseaseGroup.name
                    );

                    return contents;
                });

            return filteredDatasets;
        },

        datasetsListNotNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
                .filter(dataset => dataset["field_featured"] != "featured");

            let phenotypesByGroups = this.phenotypesByGroups;

            newDatasets.map(x => {
                let datasetPhenotypes = x.field_phenotypes.split("\r\n");

                let groupKeys = Object.keys(phenotypesByGroups);
                let datasetPGroup = [];

                for (let group of groupKeys) {
                    let tempGroupPhenotypes = phenotypesByGroups[group];

                    let intersectings = datasetPhenotypes.filter(p =>
                        tempGroupPhenotypes.includes(p.toLowerCase().trim())
                    );

                    if (intersectings.length > 0) {
                        datasetPGroup.push(group);
                    }
                }
                x["phenotype_group"] = datasetPGroup;
            });

            let ascending = this.ascending;
            let key = this.sortKey;
            let isNumeric = key == "field_samples" ? true : false;

            return sortUtils.sort(newDatasets, key, isNumeric, ascending);
        },

        datasetsListNew: function() {
            let newDatasets = [].slice
                .call(this.rawDatasets)
                .filter(dataset => dataset["field_featured"] == "featured");

            let phenotypesByGroups = this.phenotypesByGroups;

            newDatasets.map(x => {
                let datasetPhenotypes = x.field_phenotypes.split("\r\n");

                let groupKeys = Object.keys(phenotypesByGroups);
                let datasetPGroup = [];

                for (let group of groupKeys) {
                    let tempGroupPhenotypes = phenotypesByGroups[group];

                    let intersectings = datasetPhenotypes.filter(p =>
                        tempGroupPhenotypes.includes(p.toLowerCase().trim())
                    );

                    if (intersectings.length > 0) {
                        datasetPGroup.push(group);
                    }
                }
                x["phenotype_group"] = datasetPGroup;
            });

            let ascending = this.ascending;
            let key = this.sortKey;
            let isNumeric = key == "field_samples" ? true : false;

            return sortUtils.sort(newDatasets, key, isNumeric, ascending);
        },

        dataTypesList: function() {
            let content = [
                ...new Set(this.rawDatasets.map(x => x.field_data_type))
            ];
            content.push("Show all");

            return content;
        },

        tableData() {
            let dataRows = this.groupedAnnotations;
            if (!!this.filter) {
                dataRows = dataRows.filter(annotation => {
                    const regularAnnotation = decodeNamespace(annotation, { prefix: `${annotation.phenotype}_` });
                    return this.filter(regularAnnotation);
                });
            }
            return dataRows;
        },
    },
    methods: {
        setSeletedDiseaseGroup(diseaseGroup) {
            this.selectedDiseaseGroup =
                diseaseGroup == "md" ? null : diseaseGroup;
        },
        setSeletedDatatype(datatype) {
            this.selectedDatatype = datatype == "Show all" ? null : datatype;
        },
        setSeletedPhenotypeGroup(phenotypeGroup) {
            this.selectedPhenotypeGroup =
                phenotypeGroup == "Show all" ? null : phenotypeGroup;

            this.selectedPhenotype = null;
        },
        setSeletedPhenotype(phenotype) {
            this.selectedPhenotype = phenotype;
        },
        setSortKey(key) {
            this.sortKey = key;
            this.ascending = this.ascending == true ? false : true;
        }
    }
});
</script>

<style>
@import url("/css/datasetsList.css");
</style>
