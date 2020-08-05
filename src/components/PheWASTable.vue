<template>
    <div>
        <b-container fluid class="filtering-ui-wrapper">
            <b-row class="filtering-ui-content">
                <b-col class="filter-col-lg">
                    <div class="label">Phenotype</div>
                    <vue-typeahead-bootstrap
                        v-if="phenotypeMap"
                        v-model="phenotypeText"
                        ref="phenotypeSelect"
                        :data="Object.values(phenotypeMap)"
                        :serializer="s => s.description"
                        @hit="addPhenotype($event)"
                    ></vue-typeahead-bootstrap>
                </b-col>
                <b-col class="divider">
                    <span class="or-text">OR</span>
                </b-col>
                <b-col class="filter-col-sm">
                    <div class="label">p-value (&le;)</div>
                    <b-form-input
                        id="filter-pValue"
                        type="text"
                        @change="filterPValue($event)"
                        v-model="pValueText"
                    ></b-form-input>
                </b-col>
                <b-col class="filter-col-sm">
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
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:cell(phenotype)="r">
                <a
                    :href="`/phenotype.html?phenotype=${r.item.phenotype.name}`"
                >{{phenotypeFormatter(r.item.phenotype)}}</a>
            </template>
            <template v-slot:cell(continuousEffect)="r">
                <div v-if="!r.item.phenotype.dichotomous" class="effect">
                    <span
                        :class="`effect ${r.item.beta < 0 ? 'negative' : 'positive'}`"
                    >{{r.item.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                    <span>{{effectFormatter(r.item.beta)}}</span>
                </div>
            </template>
            <template v-slot:cell(dichotomousEffect)="r">
                <div v-if="!!r.item.phenotype.dichotomous" class="effect">
                    <span
                        :class="`effect ${r.item.beta < 0 ? 'negative' : 'positive'}`"
                    >{{r.item.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                    <span>{{effectFormatter(Math.exp(r.item.beta))}}</span>
                </div>
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
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";

export default Vue.component("phewas-table", {
    props: ["associations", "phenotypeMap"],
    components: {
        Documentation,
        TooltipDocumentation
    },
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
                    formatter: Formatters.pValueFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    }
                },
                {
                    key: "continuousEffect",
                    label: "Beta",
                    formatter: Formatters.effectFormatter
                },
                {
                    key: "dichotomousEffect",
                    label: "Odds Ratio",
                    formatter: Formatters.effectFormatter
                },
                // {
                //     key: "zScore",
                //     label: "Z-Score",
                //     formatter: Formatters.floatFormatter
                // },
                {
                    key: "n",
                    label: "Sample Size",
                    formatter: Formatters.intFormatter
                }
            ],

            phenotypeText: "",
            selectedPhenotypes: [],
            pValue: "",
            pValueText: "",
            beta: "",
            betaText: "",
            beta_options: [
                { value: "p", text: "Positive" },
                { value: "n", text: "Negative" }
            ]
        };
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

            return assocs
                .filter(a => !!a.phenotype)
                .sort((a, b) => a.pValue - b.pValue);
        },

        tableData() {
            let sourceData = this.pheWASAssociations;

            let phenotypeFiltered =
                this.selectedPhenotypes.length > 0
                    ? Filters.filterPhenotype(
                          this.pheWASAssociations,
                          this.selectedPhenotypes
                      )
                    : this.pheWASAssociations;

            let pValueFiltered =
                this.pValue != ""
                    ? Filters.filterPValue(phenotypeFiltered, this.pValue)
                    : phenotypeFiltered;

            let betaFiltered =
                this.beta != "" && this.beta != null
                    ? Filters.filterBeta(pValueFiltered, this.beta, "beta")
                    : pValueFiltered;

            return betaFiltered;
        }
    },

    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        floatFormatter: Formatters.floatFormatter,
        effectFormatter: Formatters.effectFormatter,
        addPhenotype(event) {
            this.selectedPhenotypes.push(event.description);
            this.phenotypeText = "";
            this.resetOtherFilters("selectedPhenotypes");
        },
        removePhenotype(index) {
            this.selectedPhenotypes.splice(index, 1);
        },
        filterPValue(event) {
            this.pValue = event.trim();
            this.resetOtherFilters("pValue");
            this.pValueText = "";
        },
        filterBeta() {
            this.betaText = this.beta == "p" ? "Positive" : "Negative";
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
        },
        unsetBeta() {
            this.beta = "";
        }
    }
});
</script>
