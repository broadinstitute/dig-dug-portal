<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
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
            <b-row
                v-if="selectedPhenotypes.length > 0 || pValue != '' || (beta != '' && beta != null)"
            >
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
                        <b-badge pill variant="success" @click="unsetPvalue()" class="btn">
                            {{pValue}}
                            <span class="remove">X</span>
                        </b-badge>
                    </template>
                    <template v-if="beta != '' && beta != null">
                        <b-badge pill variant="info" @click="unsetBeta()" class="btn">
                            {{betaText}}
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
            :items="filteredAssocs"
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
            filteredAssocs: null,
            beta: "",
            betaText: "",
            beta_options: [
                { value: null, text: "All" },
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
    },
    mounted() {
        this.filteredAssocs = this.pheWASAssociations;
    },

    computed: {
        rows() {
            return this.filteredAssocs.length;
        },

        pheWASAssociations() {
            if (!this.associations) {
                return [];
            }

            let phenotypes = this.phenotypeMap;
            let assocs = this.associations.map(a => {
                return { ...a, phenotype: phenotypes[a.phenotype] };
            });

            return assocs
                .filter(a => !!a.phenotype)
                .sort((a, b) => a.pValue - b.pValue);
        },

        filteredAssocs() {
            return this.pheWASAssociations;
        }
    },

    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        floatFormatter: Formatters.floatFormatter,
        addPhenotype(event) {
            this.selectedPhenotypes.push(event.description);
            this.userText = "";
            this.filterPhenotype();
            this.resetOtherFilters("selectedPhenotypes");
        },
        removePhenotype(index) {
            this.selectedPhenotypes.splice(index, 1);
            this.filterPhenotype();
        },
        filterPhenotype() {
            this.filteredAssocs =
                this.selectedPhenotypes.length > 0
                    ? Filters.filterPhenotype(
                          this.pheWASAssociations,
                          this.selectedPhenotypes
                      )
                    : this.pheWASAssociations;
        },
        filterPValue(event) {
            this.pValue = event.trim();
            this.filteredAssocs = Filters.filterPValue(
                this.pheWASAssociations,
                event
            );
            this.resetOtherFilters("pValue");
            this.pValueText = "";
        },
        filterBeta() {
            let sourceData =
                this.pValue == ""
                    ? this.pheWASAssociations
                    : Filters.filterPValue(
                          this.pheWASAssociations,
                          this.pValue
                      );

            this.filteredAssocs = Filters.filterBeta(
                sourceData,
                this.beta,
                "beta"
            );

            this.betaText = this.beta == "p" ? "positive" : "negative";
            this.resetOtherFilters("beta");
        },
        resetOtherFilters(option) {
            if (option == "selectedPhenotypes") {
                this.pValue = "";
                this.beta = "";
            } else {
                this.selectedPhenotypes = [];
            }
        },
        unsetPvalue() {
            this.pValue = "";
            this.filteredAssocs =
                this.beta != "" || this.beta != null
                    ? (this.filteredAssocs = Filters.filterBeta(
                          this.pheWASAssociations,
                          this.beta,
                          "beta"
                      ))
                    : this.pheWASAssociations;
        },
        unsetBeta() {
            this.beta = "";
            this.filteredAssocs =
                this.pValue != ""
                    ? Filters.filterPValue(this.pheWASAssociations, this.pValue)
                    : this.pheWASAssociations;
        },
        unsetFilter(obj) {
            this[obj] = "";
        }
    }
});
</script>
