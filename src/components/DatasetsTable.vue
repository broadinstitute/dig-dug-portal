<template>
    <div>
        <b-table
            hover
            small
            responsive="sm"
            :items="sortedDatasets"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:thead-top="data">
                <b-tr>
                    <b-th></b-th>
                    <b-th>
                        <b-form-select v-model="tech" :options="filter_tech">
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-th>
                    <b-th>
                        <b-form-select v-model="ancestry" :options="filter_ancestry">
                            <b-form-select-option value>Select a filter</b-form-select-option>
                        </b-form-select>
                    </b-th>
                    <b-th></b-th>
                    <b-th></b-th>
                    <b-th></b-th>
                </b-tr>
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

export default Vue.component("datasets-table", {
    props: ["datasets"],
    data() {
        return {
            fields: [
                {
                    key: "name",
                    label: "Name"
                },
                {
                    key: "tech",
                    label: "Tech"
                },
                {
                    key: "ancestry",
                    label: "Ancestry",
                    formatter: Formatters.ancestryFormatter
                },
                {
                    key: "cases",
                    label: "Cases",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "controls",
                    label: "Controls",
                    formatter: Formatters.intFormatter
                },
                {
                    key: "subjects",
                    label: "Subjects",
                    formatter: Formatters.intFormatter
                }
            ],
            perPage: 5,
            currentPage: 1,
            sortName: "subjects",
            sortOrder: "desc",
            tech: "",
            ancestry: ""
        };
    },
    computed: {
        rows() {
            return this.datasets.length;
        },
        sortedDatasets() {
            return this.datasets.sort((a, b) => b.subjects - a.subjects);
        },
        filter_tech() {
            return this.sortedDatasets
                .map(v => v.tech)
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },
        filter_ancestry() {
            return this.sortedDatasets
                .map(v => Formatters.ancestryFormatter(v.ancestry))
                .filter((v, i, arr) => arr.indexOf(v) == i);
        }
    }
});
</script>
