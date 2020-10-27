<template>
    <div>
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
                >{{r.item.description}}</a>
            </template>
        </b-table>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
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
import Filters from "@/utils/filters";

export default Vue.component("datasets-table", {
    props: ["datasets", "phenotype", "filter"],
    data() {
        return {
            fields: [
                {
                    key: "link",
                    label: "Name"
                },
                {
                    key: "tech",
                    label: "Technology"
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter
                },

                {
                    key: "subjects",
                    label: "Subjects",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "image",
                    label: "Community"
                }
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
                rawDatasets = rawDatasets.filter(d =>
                    d.phenotypes.includes(this.phenotype.name)
                );
            }

            // sort datasets by subjects
            return rawDatasets.sort((a, b) => b.subjects - a.subjects);
        },
        tableData() {
            let dataRows = this.sortedDatasets;
            if (!!this.filter) {
                dataRows = dataRows.filter(dataset => {
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
