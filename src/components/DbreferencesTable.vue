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
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:thead-top="data">
                <b-tr>
                    <b-th>
                        <span class="sr-only">ID</span>
                    </b-th>
                    <b-th>
                        <div>Filter by source:</div>
                        <b-form-select
                            v-model="source"
                            :options="filter_source"
                            @change="clearOther('moleculeType')"
                        ></b-form-select>
                    </b-th>
                    <b-th>
                        <div>Filter by Molecule Type:</div>
                        <b-form-select
                            v-model="moleculeType"
                            :options="filter_moleculeType"
                            @change="clearOther('source')"
                        ></b-form-select>
                    </b-th>
                    <b-th>
                        <span class="sr-only">Protein Sequence ID</span>
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
            source: "",
            moleculeType: ""
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },
        filter_source() {
            return this.dbreferences
                .map(v => v.source)
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },

        filter_moleculeType() {
            return this.dbreferences
                .map(v => v.moleculeType)
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        tableData() {
            if (this.source != "") {
                return Filters.filterTable(
                    this.dbreferences,
                    this.source,
                    "source"
                );
            } else if (this.moleculeType != "") {
                return Filters.filterTable(
                    this.dbreferences,
                    this.moleculeType,
                    "moleculeType"
                );
            } else {
                return this.dbreferences;
            }
        }
    },
    methods: {
        clearOther(obj) {
            this[obj] = "";
        }
    }
});
</script>
