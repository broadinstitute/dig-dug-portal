<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col>
                    <div class="label">Source</div>
                    <b-form-select
                        v-model="source"
                        :options="filter_source"
                        @change="clearFilter('moleculeType')"
                    ></b-form-select>
                </b-col>
                <b-col class="divider">
                    <span class="or-text">OR</span>
                </b-col>
                <b-col>
                    <div class="label">Molecule Type</div>
                    <b-form-select
                        v-model="moleculeType"
                        :options="filter_moleculeType"
                        @change="clearFilter('source')"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="source != '' || moleculeType != ''">
                <b-col>
                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="source">
                        <b-badge pill variant="info" @click="clearFilter('source')" class="btn">
                            {{source}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="moleculeType">
                        <b-badge
                            pill
                            variant="success"
                            @click="clearFilter('moleculeType')"
                            class="btn"
                        >
                            {{moleculeType}}
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
        >
            <template v-slot:cell(gene)="v">
                <a :href="'/gene.html?gene=' + v.item.gene_id">{{v.item.gene_id}}</a>
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

import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";

export default Vue.component("uniprot-references-table", {
    props: ["references"],
    components: {
        Documentation,
        TooltipDocumentation
    },
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
            return this.references
                .map(v => v.source)
                .filter((v, i, arr) => arr.indexOf(v) == i);
        },

        filter_moleculeType() {
            return this.references
                .map(v => v.moleculeType)
                .filter((v, i, arr) => arr.indexOf(v) == i)
                .filter((v, i, arr) => v != undefined);
        },
        tableData() {
            if (this.source != "") {
                return Filters.filterTable(
                    this.references,
                    this.source,
                    "source"
                );
            } else if (this.moleculeType != "") {
                return Filters.filterExact(
                    this.references,
                    this.moleculeType,
                    "moleculeType"
                );
            } else {
                return this.references;
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
