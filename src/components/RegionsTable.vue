<template>
    <div>
        <div v-if="rows > 0">
            <b-table
                hover
                small
                bordered
                responsive="sm"
                :items="filtered"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template v-slot:cell(region)="r">
                    <a
                        :href="`/region.html?chr=${r.item.chromosome}&start=${r.item.start}&end=${r.item.end}`"
                    >{{r.item.chromosome}}:{{r.item.start}}-{{r.item.end}}</a>
                </template>
                <template v-slot:thead-top="data">
                    <b-tr>
                        <b-th>
                            <span class="sr-only">Region</span>
                        </b-th>
                        <b-th>
                            <b-form-select
                                v-model="filters['annotation']"
                                :options="filter_annotation"
                                multiple
                            >
                                <b-form-select-option value>Select a filter</b-form-select-option>
                            </b-form-select>
                        </b-th>
                        <b-th>
                            <b-form-select
                                v-model="filters['method']"
                                :options="filter_method"
                                multiple
                            >
                                <b-form-select-option value>Select a filter</b-form-select-option>
                            </b-form-select>
                        </b-th>
                        <b-th>
                            <b-form-select
                                v-model="filters['tissue']"
                                :options="filter_tissue"
                                multiple
                            >
                                <b-form-select-option value>Select a filter</b-form-select-option>
                            </b-form-select>
                        </b-th>
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
        <div v-else>
            <h4 v-if="regions.length > 0">No annotated regions</h4>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import { filterDropdown, filterTissue } from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("regions-table", {
    props: ["regions"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "region",
                    label: "Region"
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.capitalizedFormatter
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.capitalizedFormatter
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                    filterByFormatted: true
                }
            ],
            filters: {
                annotation: [],
                method: "",
                tissue: ""
            }
        };
    },

    computed: {
        rows() {
            return this.filtered.length;
        },

        sortedRegions() {
            return this.regions.sort((a, b) => a.start - b.start);
        },
        filter_annotation() {
            return this.sortedRegions
                .map(v => v.annotation)
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },
        filter_method() {
            return this.sortedRegions
                .map(v => v.method)
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        filter_tissue() {
            return this.sortedRegions
                .map(v => Formatters.tissueFormatter(v.tissue))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        filtered() {
            // const filtered = this.sortedRegions.filter(item => {
            //     return Object.keys(this.filters).every(key => {
            //         //console.log("check", key);
            //         if (
            //             Array.isArray(this.filters[key]) &&
            //             this.filters[key].length > 0
            //         ) {
            //             // console.log("here", key);
            //             console.log("keys", Object.keys(this.filters[key]));
            //             return Object.keys(this.filters[key]).every(i => {
            //                 // console.log("index", k);
            //                 // console.log("index2", this.filters[key][k]);
            //                 return String(item[key]) == this.filters[key][i];
            //             });
            //         } else {
            //             console.log("there");
            //             if (this.filters[key] != "")
            //                 return String(item[key]) == this.filters[key];
            //             // else return true;
            //         }
            //         return true;
            //     });
            // });
            // console.log("FF ", filtered);
            // return filtered.length > 0
            //     ? filtered
            //     : [
            //           {
            //               annotation: [],
            //               method: "",
            //               tissue: ""
            //           }
            //       ];
            //
            //);
            //return this.sortedRegions;

            //works
            // return filterDropdown(
            //     this.sortedRegions,
            //     "annotation",
            //     this.filters["annotation"]
            // );
            //works on tissue
            // return filterTissue(
            //     this.sortedRegions,
            //     "tissue",
            //     this.filters["tissue"]
            // );

            return filterDropdown(this.sortedRegions, this.filters);
        },
        tabledata() {}
    },

    methods: {
        checkFilter(n, h) {}
    }
});
</script>
