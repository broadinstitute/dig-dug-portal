<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper filter-rows">
            <b-row class="filtering-ui-content">
                <b-col>
                    <div class="label">Annotations:</div>
                    <b-form-select
                        @input="addFilter($event, 'annotations')"
                        :options="filter_annotation"
                        id="annotations-filter"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Methods:</div>
                    <b-form-select
                        @input="addFilter($event, 'methods')"
                        :options="filter_method"
                        id="methods-filter"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <div class="label">Tissues:</div>
                    <b-form-select
                        @input="addFilter($event, 'tissues')"
                        :options="filter_tissue"
                        id="tissues-filter"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="annotations.length > 0 || methods.length > 0 || tissues.length > 0">
                <b-col>
                    <strong>Selected Filters:</strong>
                    <template v-if="annotations">
                        <b-badge
                            pill
                            variant="info"
                            v-for="(v,i) in annotations"
                            :key="v"
                            @click="removeFilter(i, 'annotations')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>

                    <template v-if="methods">
                        <b-badge
                            pill
                            variant="success"
                            v-for="(v,i) in methods"
                            :key="v"
                            @click="removeFilter(i, 'methods')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>

                    <template v-if="tissues">
                        <b-badge
                            pill
                            variant="warning"
                            v-for="(v,i) in tissues"
                            :key="v"
                            @click="removeFilter(i, 'tissues')"
                            class="btn"
                        >
                            {{v}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                </b-col>
            </b-row>
        </b-container>

        <div v-if="rows > 0">
            <b-table
                hover
                small
                bordered
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template v-slot:cell(region)="r">
                    <a
                        :href="`/region.html?chr=${r.item.chromosome}&start=${r.item.start}&end=${r.item.end}`"
                    >{{r.item.chromosome}}:{{r.item.start}}-{{r.item.end}}</a>
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
import Filters from "@/utils/filters";

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
                    label: "Region",
                },
                {
                    key: "annotation",
                    label: "Annotation",
                    formatter: Formatters.annotationFormatter,
                },
                {
                    key: "method",
                    label: "Method",
                    formatter: Formatters.capitalizedFormatter,
                },
                {
                    key: "tissue",
                    label: "Tissue",
                    formatter: Formatters.tissueFormatter,
                },
            ],

            annotations: [],
            methods: [],
            tissues: [],
        };
    },

    computed: {
        console: () => console,
        window: () => window,
        rows() {
            return this.tableData.length;
        },
        sortedRegions() {
            return this.regions
                .filter((a) => !!a.tissue)
                .sort((a, b) => a.start - b.start);
        },
        filter_annotation() {
            return this.sortedRegions
                .map((v) => Formatters.annotationFormatter(v.annotation))
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },
        filter_method() {
            return this.sortedRegions
                .map((v) => Formatters.capitalizedFormatter(v.method))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        filter_tissue() {
            return this.sortedRegions
                .map((v) => Formatters.tissueFormatter(v.tissue))
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined && v != "-");
        },
        tableData() {
            let annotationFiltered =
                this.annotations.length > 0
                    ? Filters.filterFormatted(
                          this.sortedRegions,
                          this.annotations,
                          "annotation"
                      )
                    : this.sortedRegions;

            let methodsFiltered =
                this.methods.length > 0
                    ? Filters.filterFormatted(
                          annotationFiltered,
                          this.methods,
                          "method"
                      )
                    : annotationFiltered;

            let tissuesFiltered =
                this.tissues.length > 0
                    ? Filters.filterFormatted(
                          methodsFiltered,
                          this.tissues,
                          "tissue"
                      )
                    : methodsFiltered;

            return tissuesFiltered;
        },
    },

    methods: {
        addFilter(event, obj) {
            this[obj].push(event);
        },
        removeFilter(index, obj) {
            this[obj].splice(index, 1);
        },
        resetOtherFilters(option) {
            this.annotations =
                this.annotations === this[option] ? this[option] : [];
            this.methods = this.methods === this[option] ? this[option] : [];
            this.tissues = this.tissues === this[option] ? this[option] : [];
        },
    },
});
</script>
