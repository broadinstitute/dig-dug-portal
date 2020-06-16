<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <span class="filter-by-label">Filter table by:</span>
                <b-col>
                    <div class="label">Phenotype</div>
                    <vue-typeahead-bootstrap
                        v-if="phenotypeMap"
                        v-model="userText"
                        ref="phenotypeSelect"
                        :data="Object.values(phenotypeMap)"
                        :serializer="s => s.description"
                        @hit="addPhenotype($event)"
                    ></vue-typeahead-bootstrap>
                </b-col>
                <b-col class="divider">&nbsp;</b-col>
                <b-col>
                    <div class="label">pValue (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        @change="filterPValue($event)"
                        v-model="pValueText"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <div class="label">Effect</div>
                    <b-form-select
                        @input="filterBeta()"
                        :options="beta_options"
                        ref="beta"
                        v-model="beta"
                    ></b-form-select>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="selected-filters-ui-wrapper">
            <b-row v-if="selectedPhenotypes.length > 0 || pValue != '' || beta != ''">
                <b-col>
                    <span>Selected Filters:&nbsp;&nbsp;</span>
                    <template v-if="selectedPhenotypes">
                        <b-badge
                            pill
                            variant="info"
                            v-for="(p,i) in selectedPhenotypes"
                            :key="p"
                            @click="removePhenotype(i)"
                            class="btn"
                        >
                            {{p}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="pValue">
                        <b-badge pill variant="success" @click="unsetFilter('pValue')" class="btn">
                            {{pValue}} try
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
            :items="pheWASAssociations"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
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
import Filters from "@/utils/filters";

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

            userText: "",
            selectedPhenotypes: [],
            pValue: "",
            pValueText: "",
            tableData: "",
            beta: "",
            beta_options: [
                { value: null, text: "All" },
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
    },
    mounted() {
        //this.tableData = this.pheWASAssociations;
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

            let phenotypeFiltered =
                this.selectedPhenotypes.length == 0
                    ? assocs
                    : assocs.map(v => {});

            //console.log(assocs);
            /*
            console.log(assocs);
            console.log(this.selectedPhenotypes);

            let pheotypeFiltered =
                this.selectedPhenotypes.length > 0
                    ? assocs.filter(v => {
                          if (!!v.phenotype) {
                              this.selectedPhenotypes.map(sp => {
                                  if (v.phenotype.description == sp) {
                                      return v;
                                  }
                              });
                          }
                      })
                    : assocs;

            console.log("pValue: " + this.pValue + ", beta: " + this.beta);

            let pValueFiltered =
                this.pValue == ""
                    ? pheotypeFiltered
                    : pheotypeFiltered.filter(v => v.pValue <= this.pValue);

            let betaFiltered =
                this.beta == ""
                    ? pValueFiltered
                    : this.beta == "p"
                    ? pValueFiltered
                    : pValueFiltered;*/

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
            this.userText = "";
            //this.filterPhenotype();
        },
        removePhenotype(index) {
            this.selectedPhenotypes.splice(index, 1);
            //this.filterPhenotype();
        },
        filterPhenotype() {
            this.tableData = Filters.filterPhenotype(
                this.pheWASAssociations,
                this.selectedPhenotypes
            );
            //this.resetOtherFilters("selectedPhenotypes");
        },
        filterBeta() {
            this.tableData = Filters.filterBeta(
                this.pheWASAssociations,
                this.beta,
                "beta"
            );
            //this.resetOtherFilters("beta");
        },
        filterPValue(event) {
            this.pValue = event.trim();
            this.tableData = Filters.filterPValue(
                this.pheWASAssociations,
                event
            );
            this.resetOtherFilters("pValue");
            this.pValueText = "";
        },

        resetOtherFilters(option) {
            if (option == "selectedPhenotypes") {
                this.pValue = "";
                this.beta = "";
            } else {
                this.selectedPhenotypes = [];
            }
            /*
            this.selectedPhenotypes =
                this.selectedPhenotypes == this[option] ? this[option] : [];
            this.pValue = this.pValue == this[option] ? this[option] : "";
            this.beta =
                this.beta == this[option]
                    ? this[option] != null
                        ? this[option]
                        : ""
                    : "";*/
        },
        unsetFilter(obj) {
            this[obj] = "";
        }
    }
});
</script>
