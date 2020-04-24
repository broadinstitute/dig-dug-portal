<template>
    <div>
        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage"></b-pagination>
        <b-table
            hover
            small
            bordered
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
        </b-table>
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
                    formatter: Formatters.floatFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    }
                },
                {
                    key: "beta",
                    label: "Effect (Beta)",
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
        phenotypeFormatter: Formatters.phenotypeFormatter
    }
});
</script>
