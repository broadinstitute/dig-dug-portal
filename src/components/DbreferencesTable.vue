<template>
    <div>
        <!-- <b-row>
            <b-col sm="3" offset-sm="6">
                <b-form-select v-model="source" :options="filter_source"></b-form-select>
            </b-col>
            <b-col sm="3">
                <b-form-select v-model="moleculeType" :options="filter_moleculeType"></b-form-select>
            </b-col>
        </b-row>-->
        <b-table
            hover
            small
            responsive="sm"
            :items="filtered"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:cell(gene)="v">
                <a :href="'/gene.html?gene=' + v.item.gene_id">{{v.item.gene_id}}</a>
            </template>
            <template slot="top-row" slot-scope="{ fields }">
                <td></td>
                <td>
                    <b-form-select v-model="filters['source']" :options="filter_source">
                        <b-form-select-option value>Select a filter</b-form-select-option>
                    </b-form-select>
                </td>
                <td>
                    <b-form-select v-model="filters['moleculeType']" :options="filter_moleculeType">
                        <b-form-select-option value>Select a filter</b-form-select-option>
                    </b-form-select>
                </td>
                <td></td>
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

export default Vue.component("dbreferences-table", {
    props: ["dbreferences"],
    data() {
        return {
            fields: [
                {
                    key: "id",
                    label: "ID"
                },
                {
                    key: "source",
                    label: "Source"
                },
                {
                    key: "moleculeType",
                    label: "Molecule Type"
                },
                {
                    key: "proteinSeqID",
                    label: "Protein Sequence ID"
                }
            ],
            perPage: 5,
            currentPage: 1,
            filters: {
                source: "",
                moleculeType: ""
            }
        };
    },

    computed: {
        rows() {
            return this.filtered.length;
        },
        filter_source() {
            return this.filtered
                .map(v => v.source)
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },

        filter_moleculeType() {
            return this.filtered
                .map(v => v.moleculeType)
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        filtered() {
            const filtered = this.dbreferences.filter(item => {
                return Object.keys(this.filters).every(key => {
                    if (this.filters[key] != "")
                        return String(item[key]) == this.filters[key];
                    else return true;
                });
            });
            return filtered.length > 0
                ? filtered
                : [
                      {
                          source: "",
                          moleculeType: ""
                      }
                  ];
        }
    },
    methods: {
        // consequenceFormatter: Formatters.consequenceFormatter
        filter(data, search) {
            console.log("data", data);
            console.log("search", search);
        }
    }
});
</script>
