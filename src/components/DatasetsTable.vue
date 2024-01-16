<template>
    <div>
        <div v-if="tableData.length > 0">
            <div class="text-right mb-2">
                <data-download
                    :data="tableData"
                    filename="datasets_associations"
                ></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template center v-slot:cell(image)="r">
                    <span :class="'community-icon ' + r.item.community"></span>
                </template>
                <template v-slot:cell(link)="r">
                    <a
                        :href="`/dinspector.html?dataset=${r.item.name}&phenotype=${phenotype.name}`"
                        >{{ r.item.description }}</a
                    >
                </template>
            </b-table>
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload";

export default Vue.component("datasets-table", {
    components: { DataDownload },
    props: ["datasets", "phenotype", "filter"],
    data() {
        return {
            fields: [
                {
                    key: "link",
                    label: "Name",
                },
                {
                    key: "tech",
                    label: "Technology",
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter,
                },

                {
                    key: "subjects",
                    label: "Subjects",
                    formatter: Formatters.intFormatter,
                },
                {
                    key: "image",
                    label: "Community",
                },
            ],
            perPage: 5,
            currentPage: 1,
            sortName: "subjects",
            sortOrder: "desc",
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        sortedDatasets() {
            let rawDatasets = this.datasets;

            // filter by phenotype if set
            if (this.phenotype) {
                rawDatasets = rawDatasets.filter((d) =>
                    d.phenotypes.includes(this.phenotype.name)
                );
            }

            // sort datasets by subjects
            return rawDatasets.sort((a, b) => b.subjects - a.subjects);
        },
        tableData() {
            let dataRows = this.sortedDatasets;
            if (!!this.filter) {
                dataRows = dataRows.filter((dataset) => {
                    return this.filter(dataset);
                });
            }
            return dataRows;
        },
    },
});
</script>

<style>
@import url("/css/datasetsList.css");
</style>
