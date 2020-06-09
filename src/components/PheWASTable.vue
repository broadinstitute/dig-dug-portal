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
            filter-included-fields="pValue"
        >
            <template v-slot:cell(phenotype)="r">
                <a
                    :href="`/phenotype.html?phenotype=${r.item.phenotype.name}`"
                >{{phenotypeFormatter(r.item.phenotype)}}</a>
            </template>
            <template
                v-slot:cell(continuousEffect)="r"
            >{{!!r.item.phenotype.dichotomous ? null : floatFormatter(r.item.beta)}}</template>
            <template
                v-slot:cell(dichotomousEffect)="r"
            >{{!!r.item.phenotype.dichotomous ? floatFormatter(Math.exp(r.item.beta)) : null}}</template>
            <template v-slot:thead-top="data">
                <b-tr>
                    <b-th>
                        <div v-if="selectedPhenotypes">
                            <b-badge
                                pill
                                variant="info"
                                v-for="(p,i) in selectedPhenotypes"
                                :key="p"
                                @click="removePhenotype(i)"
                                class="btn"
                            >{{p}}</b-badge>
                        </div>
                        <vue-typeahead-bootstrap
                            v-if="phenotypeMap"
                            v-model="userText"
                            ref="phenotypeSelect"
                            placeholder="Select a phenotype ..."
                            :data="Object.values(phenotypeMap)"
                            :serializer="s => s.description"
                            @hit="addPhenotype($event)"
                        ></vue-typeahead-bootstrap>
                    </b-th>
                    <b-th>
                        <b-form-input
                            id="filter-pValue"
                            type="number"
                            v-model="pValue"
                            placeholder="Filter pValue <="
                            @change="filterPValue()"
                        ></b-form-input>
                    </b-th>
                    <b-th>
                        <b-form-group>
                            <b-form-radio-group v-model="beta" @input="filterBeta()">
                                <b-form-radio name="all" value size="sm">All</b-form-radio>
                                <b-form-radio name="positive" value="p" size="sm">Positive</b-form-radio>
                                <b-form-radio name="negative" value="n" size="sm">Negative</b-form-radio>
                            </b-form-radio-group>
                        </b-form-group>
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
import $ from "jquery";

import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import { filterPhenotype, filterBeta, filterPValue } from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

export default Vue.component("phewas-table", {
    props: ["associations", "phenotypeMap"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "phenotype",
                    label: "Phenotype",
                    formatter: Formatters.phenotypeFormatter
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    formatter: Formatters.floatFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    },
                    sortable: true
                },
                {
                    key: "continuousEffect",
                    label: "Beta",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "dichotomousEffect",
                    label: "Odds Ratio",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "zScore",
                    label: "Z-Score",
                    formatter: Formatters.floatFormatter
                },
                {
                    key: "n",
                    label: "Sample Size",
                    formatter: Formatters.intFormatter,
                    sortable: true
                }
            ],
            beta: "",
            userText: "",
            selectedPhenotypes: [],
            pValue: "",
            tableData: ""
        };
    },
    mounted() {
        this.tableData = this.pheWASAssociations;
    },

    computed: {
        rows() {
            return this.tableData.length;
        },

        pheWASAssociations() {
            if (!this.associations) {
                return [];
            }

            let phenotypes = this.phenotypeMap;
            let assocs = this.associations.map(a => {
                return { ...a, phenotype: phenotypes[a.phenotype] };
            });

            // filter associations w/ no phenotype data (not in portal!)
            return assocs
                .filter(a => !!a.phenotype)
                .sort((a, b) => a.pValue - b.pValue);
        }
    },

    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        floatFormatter: Formatters.floatFormatter,
        addPhenotype(event) {
            this.selectedPhenotypes.push(event.description);
            this.userText = null;
            this.filterPhenotype();
        },
        removePhenotype(index) {
            this.selectedPhenotypes.splice(index, 1);
            this.filterPhenotype();
        },

        filterBeta() {
            this.tableData = filterBeta(
                this.pheWASAssociations,
                this.beta,
                "beta"
            );
            this.resetOtherFilters();
        },
        filterPValue() {
            this.tableData = filterPValue(this.pheWASAssociations, this.pValue);
        },
        filterPhenotype() {
            this.tableData = filterPhenotype(
                this.pheWASAssociations,
                this.selectedPhenotypes
            );
        },
        resetOtherFilters(option) {
            console.log("data", this.$options.data);
        }
    }
});
</script>
