<template>
    <div>
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
            >{{!!r.item.phenotype.dichotomous ? null : betaOddsFormatter(r.item.beta)}}</template>
            <template
                v-slot:cell(dichotomousEffect)="r"
            >{{!!r.item.phenotype.dichotomous ? betaOddsFormatter(Math.exp(r.item.beta)) : null}}</template>
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

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

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
                    formatter: Formatters.pvalueFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    }
                },
                {
                    key: "continuousEffect",
                    label: "Beta",
                    formatter: Formatters.betaOddsFormatter
                },
                {
                    key: "dichotomousEffect",
                    label: "Odds Ratio",
                    formatter: Formatters.betaOddsFormatter
                },
                {
                    key: "zScore",
                    label: "Z-Score",
                    formatter: Formatters.zscoreFormatter
                },
                {
                    key: "n",
                    label: "Sample Size",
                    formatter: Formatters.intFormatter
                }
            ]
        };
    },

    computed: {
        rows() {
            return this.pheWASAssociations.length;
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
        betaOddsFormatter: Formatters.betaOddsFormatter
    }
});
</script>
