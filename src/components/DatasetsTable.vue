<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <span class="filter-by-label">Filter table by:</span>
                <b-col>
                    <div class="label">Tech:</div>
                    <b-form-select
                        v-model="tech"
                        :options="filter_tech"
                        @change="clearFilter('ancestry')"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Ancestry</div>
                    <b-form-select
                        v-model="ancestry"
                        :options="filter_ancestry"
                        @change="clearFilter('tech')"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if=" tech != '' || ancestry != ''">
                <b-col>
                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="tech">
                        <b-badge pill variant="info" @click="clearFilter('tech')" class="btn">
                            {{tech}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="ancestry">
                        <b-badge
                            pill
                            variant="success"
                            @click="clearFilter('ancestry')"
                            class="btn"
                        >
                            {{ancestry}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                </b-col>
            </b-row>
        </b-container>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        ></b-table>
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
                    formatter: Formatters.intFormatter,
                    sortable: true
                },
                {
                    key: "controls",
                    label: "Controls",
                    formatter: Formatters.intFormatter,
                    sortable: true
                },
                {
                    key: "subjects",
                    label: "Subjects",
                    formatter: Formatters.intFormatter,
                    sortable: true
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
            return this.tableData.length;
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
        },
        tableData() {
            if (this.tech != "") {
                return Filters.filterTable(
                    this.sortedDatasets,
                    this.tech,
                    "tech"
                );
            } else if (this.ancestry != "") {
                return Filters.filterFormatted(
                    this.sortedDatasets,
                    this.ancestry,
                    "ancestry"
                );
            } else {
                return this.sortedDatasets;
            }
        }
    },
    methods: {
        clearFilter(obj) {
            this[obj] = "";
        }
    }
});
</script>
